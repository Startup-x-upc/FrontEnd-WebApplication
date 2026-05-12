import { computed, inject, Injectable, signal } from '@angular/core';
import { of, switchMap } from 'rxjs';
import { Ride } from '../domain/model/ride.entity';
import { RideRequest } from '../domain/model/ride-request.entity';
import { RideCandidate } from '../domain/model/ride-candidate.entity';
import { DriverAvailability } from '../domain/model/driver-availability.entity';
import { RideStatus } from '../domain/model/ride.status';
import { RideDispatchApiService } from '../infrastructure/ride-dispatch-api.service';

/**
 * @summary Application service for the Ride Dispatch bounded context.
 * Implements the inDrive-style flow:
 *   Passenger creates request → Drivers apply as candidates →
 *   Passenger selects one → Ride is created → States progress.
 * All updates are triggered by manual refresh (no polling/realtime).
 * @author Jesús Iván Castillo Vidal
 */
@Injectable({ providedIn: 'root' })
export class RideDispatchStore {
  private api = inject(RideDispatchApiService);

  // ── Shared signals ────────────────────────────────────────────────────
  private loadingSignal         = signal<boolean>(false);
  private errorSignal           = signal<string | null>(null);

  readonly isLoading = computed(() => this.loadingSignal());
  readonly error     = computed(() => this.errorSignal());

  // ── Driver-side signals ───────────────────────────────────────────────
  /** Open requests shown to available, non-busy drivers. */
  private openRequestsSignal    = signal<RideRequest[]>([]);
  /** The driver's current active candidacy (PROPOSED). */
  private activeCandidateSignal = signal<RideCandidate | null>(null);
  /** The driver's active ride (ACCEPTED → COMPLETED). */
  private currentRideSignal     = signal<Ride | null>(null);
  /** Driver availability record. */
  private driverAvailabilitySignal = signal<DriverAvailability | null>(null);

  readonly openRequests       = computed(() => this.openRequestsSignal());
  readonly openRequestCount   = computed(() => this.openRequestsSignal().length);
  readonly activeCandidate    = computed(() => this.activeCandidateSignal());
  readonly currentRide        = computed(() => this.currentRideSignal());
  readonly driverAvailability = computed(() => this.driverAvailabilitySignal());

  // ── Passenger-side signals ────────────────────────────────────────────
  /** Passenger's coordinate inputs for the map. */
  private originSignal      = signal<string>('');
  private destinationSignal = signal<string>('');
  private distanceKmSignal  = signal<number>(0);
  /** The live RideRequest entity created by the passenger. */
  private currentRequestSignal  = signal<RideRequest | null>(null);
  /** Candidates that applied to the passenger's current request. */
  private candidatesSignal  = signal<RideCandidate[]>([]);

  readonly origin         = computed(() => this.originSignal());
  readonly destination    = computed(() => this.destinationSignal());
  readonly distanceKm     = computed(() => this.distanceKmSignal());
  readonly currentRequest = computed(() => this.currentRequestSignal());
  readonly candidates     = computed(() => this.candidatesSignal());

  // ── Passenger map input ───────────────────────────────────────────────

  /** Sets the origin coordinate string. */
  setOrigin(origin: string): void {
    this.originSignal.set(origin);
  }

  /** Sets the destination coordinate string and the estimated distance. */
  setDestination(destination: string, distanceKm: number): void {
    this.destinationSignal.set(destination);
    this.distanceKmSignal.set(distanceKm);
  }

  // ── Passenger flow actions ────────────────────────────────────────────

  /**
   * Creates a new ride request with status OPEN.
   * @param passengerId - The passenger's account ID.
   * @param estimatedFare - Pre-calculated fare from MonetizationStore.
   */
  submitRideRequest(passengerId: string, estimatedFare: number): void {
    const origin      = this.originSignal();
    const destination = this.destinationSignal();
    const distanceKm  = this.distanceKmSignal();

    if (!origin || !destination || distanceKm <= 0) {
      this.errorSignal.set('Datos incompletos para crear la solicitud.');
      return;
    }
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.createRideRequest(passengerId, origin, destination, distanceKm, estimatedFare)
      .subscribe({
        next: req => {
          this.currentRequestSignal.set(req);
          this.loadingSignal.set(false);
        },
        error: () => {
          this.loadingSignal.set(false);
          this.errorSignal.set('No se pudo crear la solicitud.');
        },
      });
  }

  /**
   * Passenger manually refreshes:
   * 1. Reloads the request to check for status changes.
   * 2. Reloads the candidates list for that request.
   */
  refreshPassengerRequest(): void {
    const req = this.currentRequestSignal();
    if (!req?.id) return;
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.api.getRideRequestById(req.id).subscribe({
      next: updatedReq => {
        this.currentRequestSignal.set(updatedReq);
        // Also refresh candidates
        this.api.getCandidatesForRequest(req.id).subscribe({
          next: candidates => {
            this.candidatesSignal.set(candidates);
            this.loadingSignal.set(false);
          },
          error: () => {
            this.loadingSignal.set(false);
            this.errorSignal.set('No se pudieron cargar los candidatos.');
          },
        });
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('No se pudo verificar el estado de la solicitud.');
      },
    });
  }

  /**
   * Passenger selects a candidate. Triggers:
   * PATCH rideRequest → CONFIRMED + selectedDriverId
   * PATCH selected candidate → ACCEPTED
   * PATCH others → REJECTED
   * POST new ride
   */
  selectCandidate(candidate: RideCandidate): void {
    const req        = this.currentRequestSignal();
    const allCandidates = this.candidatesSignal();
    if (!req) return;
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.confirmCandidate(req, candidate, allCandidates).subscribe({
      next: ride => {
        this.currentRideSignal.set(ride);
        this.currentRequestSignal.update(r =>
          r ? Object.assign(new (r.constructor as any)(), r, {
            status: RideStatus.CONFIRMED,
            selectedDriverId: candidate.driverId,
          }) : r
        );
        this.loadingSignal.set(false);
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('No se pudo confirmar el conductor.');
      },
    });
  }

  /**
   * Checks if a ride has been created for the passenger's CONFIRMED request.
   * Used to transition to RIDE_IN_PROGRESS states.
   */
  refreshPassengerRide(): void {
    const ride = this.currentRideSignal();
    if (!ride?.id) return;
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.getRideById(ride.id).subscribe({
      next: updated => {
        this.currentRideSignal.set(updated);
        this.loadingSignal.set(false);
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('No se pudo actualizar el estado del viaje.');
      },
    });
  }

  /** Clears the current request and candidates, allowing a new trip to begin. */
  clearCurrentRequest(): void {
    this.currentRequestSignal.set(null);
    this.candidatesSignal.set([]);
    this.currentRideSignal.set(null);
  }

  // ── Driver flow actions ───────────────────────────────────────────────

  /**
   * Loads all OPEN ride requests for a non-busy, available driver.
   */
  loadOpenRequests(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.getOpenRideRequests().subscribe({
      next: requests => {
        this.openRequestsSignal.set(requests);
        this.loadingSignal.set(false);
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('No se pudieron cargar las solicitudes.');
      },
    });
  }

  /**
   * Driver applies to a specific open request.
   * @param requestId - The ID of the open request.
   * @param driverId - The driver's entity ID.
   * @param driverInfo - Denormalized display fields for the candidate card.
   */
  applyAsCandidate(
    requestId: string,
    driverId: string,
    driverInfo: { name: string; vehicleType: string; rating: number; photoUrl: string },
  ): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.applyAsCandidate(
      requestId, driverId,
      driverInfo.name, driverInfo.vehicleType, driverInfo.rating, driverInfo.photoUrl,
    ).subscribe({
      next: candidate => {
        this.activeCandidateSignal.set(candidate);
        this.loadingSignal.set(false);
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('No se pudo postular a la solicitud.');
      },
    });
  }

  /**
   * Driver manually refreshes to check if their candidacy was ACCEPTED.
   * If accepted, loads the resulting ride.
   * @param driverId - The driver's entity ID.
   */
  loadDriverActiveCandidate(driverId: string): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.getDriverActiveCandidate(driverId).pipe(
      switchMap(candidate => {
        this.activeCandidateSignal.set(candidate);
        // If no active PROPOSED candidate, check for any active ride in progress
        if (!candidate) {
          return this.api.getActiveRideForDriver(driverId);
        }
        return of(null);
      })
    ).subscribe({
      next: ride => {
        if (ride) {
          this.currentRideSignal.set(ride);
        }
        this.loadingSignal.set(false);
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('No se pudo verificar el estado de tu postulación.');
      },
    });
  }

  /**
   * Driver advances the ride to the next state.
   * Also updates driverAvailability when ride is completed.
   * @param nextStatus - The new RideStatus to set.
   */
  advanceRideStatus(nextStatus: RideStatus): void {
    const ride  = this.currentRideSignal();
    const avail = this.driverAvailabilitySignal();
    if (!ride?.id) return;
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.updateRideStatus(ride.id, nextStatus).pipe(
      switchMap(updated => {
        this.currentRideSignal.set(updated);
        // Mark driver free when ride is completed
        if (nextStatus === RideStatus.COMPLETED && avail?.id) {
          return this.api.markDriverFree(avail.id);
        }
        return of(null);
      })
    ).subscribe({
      next: updatedAvail => {
        if (updatedAvail) {
          this.driverAvailabilitySignal.set(updatedAvail);
        }
        this.loadingSignal.set(false);
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('No se pudo actualizar el estado del viaje.');
      },
    });
  }

  /** Dismisses a request from the driver's view without affecting the DB. */
  skipRequest(requestId: string): void {
    this.openRequestsSignal.update(list => list.filter(r => r.id !== requestId));
  }

  // ── Driver availability ───────────────────────────────────────────────

  /** Loads the driver's availability record. */
  loadDriverAvailability(driverId: string): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.getDriverAvailability(driverId).pipe(
      switchMap(a => {
        this.driverAvailabilitySignal.set(a);
        // Use direct activeRideId or fallback to a deep lookup in DB
        if (a.activeRideId) {
          return this.api.getRideById(a.activeRideId);
        } else {
          return this.api.getActiveRideForDriver(driverId);
        }
      })
    ).subscribe({
      next: ride => {
        if (ride) {
          this.currentRideSignal.set(ride);
        }
        this.loadingSignal.set(false);
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('No se pudo cargar la disponibilidad.');
      },
    });
  }

  /** Toggles driver online/offline state. */
  toggleAvailability(driverId: string, hasPositiveBalance: boolean): void {
    const current = this.driverAvailabilitySignal();
    if (!current) {
      this.errorSignal.set('La disponibilidad no ha sido cargada.');
      return;
    }
    const newValue = !current.isAvailable;
    if (newValue && !hasPositiveBalance) {
      this.errorSignal.set('Saldo insuficiente. Recarga tu wallet para activarte.');
      return;
    }
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.toggleDriverAvailability(driverId, newValue).subscribe({
      next: a => {
        this.driverAvailabilitySignal.set(a);
        this.loadingSignal.set(false);
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('No se pudo cambiar la disponibilidad.');
      },
    });
  }

  // ── Shared utilities ──────────────────────────────────────────────────

  clearError(): void { this.errorSignal.set(null); }
}
