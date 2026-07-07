import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { map, of, switchMap } from 'rxjs';
import { Ride } from '../domain/model/ride.entity';
import { RideRequest } from '../domain/model/ride-request.entity';
import { RideCandidate } from '../domain/model/ride-candidate.entity';
import { DriverAvailability } from '../domain/model/driver-availability.entity';
import { RideStatus } from '../domain/model/ride.status';
import { RideDispatchApiService } from '../infrastructure/ride-dispatch-api.service';
import { MonetizationStore } from '../../monetization/application/monetization.store';
import { RealtimeService } from '../../shared/infrastructure/realtime.service';
import { TrustReputationStore } from '../../trust-reputation/application/trust-reputation.store';
import { IamStore } from '../../iam/application/iam.store';

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
  private monetizationStore = inject(MonetizationStore);
  private realtime = inject(RealtimeService);
  private trustStore = inject(TrustReputationStore);
  private iamStore = inject(IamStore);

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

  // ── Trip history signals (US-24, US-25) ────────────────────────────
  private passengerTripsSignal = signal<Ride[]>([]);
  private driverTripsSignal = signal<Ride[]>([]);

  readonly openRequests       = computed(() => this.openRequestsSignal());
  readonly openRequestCount   = computed(() => this.openRequestsSignal().length);
  readonly activeCandidate    = computed(() => this.activeCandidateSignal());
  readonly currentRide        = computed(() => this.currentRideSignal());
  /** Completed trips for the passenger (US-24). */
  readonly passengerTrips     = computed(() => this.passengerTripsSignal());
  /** Completed trips for the driver (US-25). */
  readonly driverTrips        = computed(() => this.driverTripsSignal());
  /** Count of passenger trips. */
  readonly passengerTripCount = computed(() => this.passengerTripsSignal().length);
  /** Count of driver trips. */
  readonly driverTripCount    = computed(() => this.driverTripsSignal().length);
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

  constructor() {
    effect(() => {
      const wallet = this.monetizationStore.wallet();
      const avail = this.driverAvailabilitySignal();
      if (wallet && wallet.balance <= 0 && avail && avail.isAvailable) {
        this.deactivateAvailability(wallet.driverId);
      }
    }, { allowSignalWrites: true });

    effect(() => {
      const account = this.iamStore.currentAccount();
      if (account?.id && account.role === 'PASSENGER') {
        this.subscribeToPassengerEvents(account.id);
      }
    });

    // Re-sync states when connection is restored
    this.realtime.reconnect$.subscribe(() => {
      console.log('[RideDispatchStore] Reconnect event detected. Re-syncing active states.');
      const req = this.currentRequestSignal();
      if (req?.id) {
        this.refreshPassengerRequest();
      }
      const ride = this.currentRideSignal();
      if (ride?.id) {
        this.refreshPassengerRide();
      }
      const avail = this.driverAvailabilitySignal();
      if (avail?.driverId) {
        this.loadDriverAvailability(avail.driverId);
      }
    });
  }

  deactivateAvailability(driverId: string): void {
    const current = this.driverAvailabilitySignal();
    if (!current || !current.isAvailable) return;
    this.loadingSignal.set(true);
    this.api.toggleDriverAvailability(driverId, false).subscribe({
      next: a => {
        this.driverAvailabilitySignal.set(a);
        this.loadingSignal.set(false);
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('No se pudo actualizar la disponibilidad.');
      }
    });
  }

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
          localStorage.setItem('chapatuRuta_activeRequestId', req.id);
          this.currentRequestSignal.set(req);
          this.loadingSignal.set(false);
          this.subscribeToRequestEvents(req.id);
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
          r ? Object.assign(new RideRequest(), r, {
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
    localStorage.removeItem('chapatuRuta_activeRequestId');
    localStorage.removeItem('chapatuRuta_activeRideId');
    const req = this.currentRequestSignal();
    if (req?.id) {
      this.unsubscribeFromRequestEvents(req.id);
    }
    const ride = this.currentRideSignal();
    if (ride?.id) {
      this.unsubscribeFromRideEvents(ride.id);
    }
    this.currentRequestSignal.set(null);
    this.candidatesSignal.set([]);
    this.currentRideSignal.set(null);
  }

  /** Clears the driver's active ride context. */
  clearCurrentRide(): void {
    this.currentRideSignal.set(null);
    this.updateOpenRequestsSubscription();
  }

  /** Clears the list of open requests in the store. */
  clearOpenRequests(): void {
    this.openRequestsSignal.set([]);
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
        this.updateOpenRequestsSubscription();
        this.subscribeToRequestEventsForDriver(candidate.requestId);
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
    this.api.updateRideStatus(ride.id, nextStatus).subscribe({
      next: updated => {
        this.currentRideSignal.set(updated);
        if (nextStatus === RideStatus.COMPLETED) {
          if (avail) {
            avail.isBusy = false;
            avail.activeRideId = null;
            this.driverAvailabilitySignal.set(avail);
          }
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

  /** Loads the driver's availability record. Auto-cleans CANCELLED rides. */
  loadDriverAvailability(driverId: string): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.getDriverAvailability(driverId).pipe(
      switchMap(a => {
        this.driverAvailabilitySignal.set(a);
        
        // Subscribe to driver channel immediately upon load
        this.subscribeToDriverEvents(driverId);
        
        // Use direct activeRideId or fallback to a deep lookup in DB
        if (a.activeRideId) {
          return this.api.getRideById(a.activeRideId).pipe(
            switchMap(ride => {
              // Auto-clean: if the ride was cancelled externally, free the driver
              if (ride.status === RideStatus.CANCELLED) {
                // ponytail: backend handles cancellation state, we just sync locally
                a.isBusy = false;
                a.activeRideId = null;
                this.driverAvailabilitySignal.set(a);
                return of(null);
              }
              this.subscribeToRideEventsForDriver(ride.id);
              return of(ride);
            })
          );
        }
        return this.api.getActiveRideForDriver(driverId).pipe(
          switchMap(ride => {
            if (ride) {
              this.subscribeToRideEventsForDriver(ride.id);
              return of(ride);
            }
            // Check for active candidate candidacy
            return this.api.getDriverActiveCandidate(driverId).pipe(
              map(cand => {
                if (cand) {
                  this.activeCandidateSignal.set(cand);
                  this.subscribeToRequestEventsForDriver(cand.requestId);
                }
                return null;
              })
            );
          })
        );
      })
    ).subscribe({
      next: ride => {
        if (ride) {
          this.currentRideSignal.set(ride);
        }
        this.loadingSignal.set(false);
        this.updateOpenRequestsSubscription();
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
        this.updateOpenRequestsSubscription();
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('No se pudo cambiar la disponibilidad.');
      },
    });
  }

  // ── Trip history (US-24, US-25) ──────────────────────────────────────

  /** Loads completed trips for a passenger. */
  loadPassengerTrips(passengerId: string): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.getPassengerTrips(passengerId).subscribe({
      next: (trips) => {
        this.passengerTripsSignal.set(trips);
        this.loadingSignal.set(false);
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('No se pudo cargar el historial de viajes.');
      },
    });
  }

  /** Loads completed trips for a driver. */
  loadDriverTrips(driverId: string): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.getDriverTrips(driverId).subscribe({
      next: (trips) => {
        this.driverTripsSignal.set(trips);
        this.loadingSignal.set(false);
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('No se pudo cargar el historial de viajes.');
      },
    });
  }

  // ── Cancel request & candidate withdrawal ─────────────────────────────

  /** Cancels a ride request (passenger-side) */
  cancelRideRequest(requestId: string): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.cancelRideRequest(requestId).subscribe({
      next: () => {
        localStorage.removeItem('chapatuRuta_activeRequestId');
        this.unsubscribeFromRequestEvents(requestId);
        this.currentRequestSignal.set(null);
        this.candidatesSignal.set([]);
        this.originSignal.set('');
        this.destinationSignal.set('');
        this.distanceKmSignal.set(0);
        this.loadingSignal.set(false);
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('No se pudo cancelar la solicitud.');
      }
    });
  }

  /** Withdraws driver candidacy from a request (driver-side) */
  withdrawCandidacy(requestId: string): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.withdrawCandidacy(requestId).subscribe({
      next: () => {
        this.unsubscribeFromRequestEventsForDriver(requestId);
        this.activeCandidateSignal.set(null);
        this.loadingSignal.set(false);
        this.updateOpenRequestsSubscription();
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('No se pudo retirar la postulación.');
      }
    });
  }

  // ── Cancel ride (US-18) ───────────────────────────────────────────────

  /**
   * Cancels a ride before it starts (ACCEPTED / DRIVER_ON_THE_WAY / DRIVER_ARRIVED).
   * Marks ride as CANCELLED and frees the driver's availability.
   */
  cancelRide(): void {
    const ride = this.currentRideSignal();
    if (!ride?.id) return;
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.cancelRide(ride.id).subscribe({
      next: () => {
        localStorage.removeItem('chapatuRuta_activeRideId');
        localStorage.removeItem('chapatuRuta_activeRequestId');
        this.unsubscribeFromRideEvents(ride.id);

        this.currentRideSignal.set(null);
        this.currentRequestSignal.set(null);
        this.candidatesSignal.set([]);
        this.activeCandidateSignal.set(null);
        this.originSignal.set('');
        this.destinationSignal.set('');
        this.distanceKmSignal.set(0);
        this.loadingSignal.set(false);
        // Refresh availability if available locally
        const avail = this.driverAvailabilitySignal();
        if (avail) {
          avail.isBusy = false;
          avail.activeRideId = null;
          this.driverAvailabilitySignal.set(avail);
        }
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('No se pudo cancelar el viaje.');
      },
    });
  }

  // ── Ably Realtime Integration & Rehydration ───────────────────────────

  rehydratePassengerSession(): void {
    const activeRideId = localStorage.getItem('chapatuRuta_activeRideId');
    const activeRequestId = localStorage.getItem('chapatuRuta_activeRequestId');

    if (activeRideId) {
      console.log('[RideDispatchStore] Rehydrating active ride:', activeRideId);
      this.loadingSignal.set(true);
      this.api.getRideById(activeRideId).subscribe({
        next: ride => {
          this.currentRideSignal.set(ride);
          this.loadingSignal.set(false);
          this.subscribeToRideEvents(ride.id);
        },
        error: () => {
          console.warn('[RideDispatchStore] Failed to rehydrate ride. Clearing storage.');
          localStorage.removeItem('chapatuRuta_activeRideId');
          this.loadingSignal.set(false);
        }
      });
    } else if (activeRequestId) {
      console.log('[RideDispatchStore] Rehydrating active request:', activeRequestId);
      this.loadingSignal.set(true);
      this.api.getRideRequestById(activeRequestId).subscribe({
        next: req => {
          if (req.isExpired || req.status === RideStatus.CANCELLED) {
            console.log('[RideDispatchStore] Rehydrated request is stale/cancelled. Clearing.');
            localStorage.removeItem('chapatuRuta_activeRequestId');
            this.loadingSignal.set(false);
            return;
          }
          this.currentRequestSignal.set(req);
          this.subscribeToRequestEvents(req.id);
          this.api.getCandidatesForRequest(req.id).subscribe({
            next: candidates => {
              this.candidatesSignal.set(candidates);
              this.loadingSignal.set(false);
            },
            error: () => {
              this.loadingSignal.set(false);
            }
          });
        },
        error: () => {
          console.warn('[RideDispatchStore] Failed to rehydrate request. Clearing storage.');
          localStorage.removeItem('chapatuRuta_activeRequestId');
          this.loadingSignal.set(false);
        }
      });
    }
  }

  subscribeToRequestEvents(requestId: string): void {
    const requestChannel = `ride-request:${requestId}`;
    
    this.realtime.subscribe(requestChannel, 'candidate.applied', () => {
      this.api.getCandidatesForRequest(requestId).subscribe(candidates => {
        this.candidatesSignal.set(candidates);
      });
    });

    this.realtime.subscribe(requestChannel, 'candidate.withdrew', () => {
      this.api.getCandidatesForRequest(requestId).subscribe(candidates => {
        this.candidatesSignal.set(candidates);
      });
    });

    this.realtime.subscribe(requestChannel, 'ride.assigned', (msg) => {
      const rideId = msg.data.rideId;
      if (rideId) {
        localStorage.removeItem('chapatuRuta_activeRequestId');
        localStorage.setItem('chapatuRuta_activeRideId', rideId);
        
        this.api.getRideById(rideId).subscribe(ride => {
          this.currentRideSignal.set(ride);
          this.unsubscribeFromRequestEvents(requestId);
          this.subscribeToRideEvents(rideId);
        });
      }
    });
  }

  unsubscribeFromRequestEvents(requestId: string): void {
    const requestChannel = `ride-request:${requestId}`;
    this.realtime.unsubscribeChannel(requestChannel);
  }

  subscribeToRideEvents(rideId: string): void {
    const rideChannel = `ride:${rideId}`;

    this.realtime.subscribe(rideChannel, 'ride.status-updated', (msg) => {
      const newStatus = msg.data.status;
      this.currentRideSignal.update(r => r ? Object.assign(new Ride(), r, { status: newStatus }) : null);
    });

    this.realtime.subscribe(rideChannel, 'ride.completed', () => {
      this.currentRideSignal.update(r => r ? Object.assign(new Ride(), r, { status: RideStatus.COMPLETED }) : null);
      localStorage.removeItem('chapatuRuta_activeRideId');
      this.unsubscribeFromRideEvents(rideId);
    });

    this.realtime.subscribe(rideChannel, 'ride.cancelled', () => {
      localStorage.removeItem('chapatuRuta_activeRideId');
      this.unsubscribeFromRideEvents(rideId);
      
      this.currentRideSignal.set(null);
      this.currentRequestSignal.set(null);
      this.candidatesSignal.set([]);
      this.originSignal.set('');
      this.destinationSignal.set('');
      this.distanceKmSignal.set(0);
    });
  }

  unsubscribeFromRideEvents(rideId: string): void {
    const rideChannel = `ride:${rideId}`;
    this.realtime.unsubscribeChannel(rideChannel);
  }

  subscribeToDriverEvents(driverId: string): void {
    const driverChannel = `driver:${driverId}`;
    
    this.realtime.subscribe(driverChannel, 'ride.assigned', (msg) => {
      const rideId = msg.data.rideId;
      if (rideId) {
        this.api.getRideById(rideId).subscribe(ride => {
          const activeCand = this.activeCandidateSignal();
          if (activeCand) {
            this.unsubscribeFromRequestEventsForDriver(activeCand.requestId);
          }
          this.currentRideSignal.set(ride);
          this.activeCandidateSignal.set(null);
          this.unsubscribeFromOpenRequestsChannel();
          this.subscribeToRideEventsForDriver(rideId);
        });
      }
    });

    this.realtime.subscribe(driverChannel, 'wallet.empty', () => {
      this.deactivateAvailability(driverId);
      this.errorSignal.set('Tu billetera tiene saldo 0. Tu disponibilidad ha sido desactivada.');
    });

    this.realtime.subscribe(driverChannel, 'reputation.updated', () => {
      console.log(`[RideDispatchStore] Driver reputation update detected. Reloading reputation.`);
      this.trustStore.loadDriverReputation(driverId);
    });
  }

  subscribeToPassengerEvents(passengerId: string): void {
    const passengerChannel = `passenger:${passengerId}`;
    this.realtime.subscribe(passengerChannel, 'reputation.updated', () => {
      console.log(`[RideDispatchStore] Passenger reputation update detected. Reloading reputation.`);
      this.trustStore.loadPassengerReputation(passengerId);
    });
  }

  subscribeToRequestEventsForDriver(requestId: string): void {
    const requestChannel = `ride-request:${requestId}`;
    
    const handleCancellationOrExpiration = () => {
      console.log(`[RideDispatchStore] Driver notified of request cancellation/expiration for: ${requestId}`);
      this.unsubscribeFromRequestEventsForDriver(requestId);
      this.activeCandidateSignal.set(null);
      this.updateOpenRequestsSubscription();
      this.loadOpenRequests();
    };

    this.realtime.subscribe(requestChannel, 'request.cancelled', handleCancellationOrExpiration);
    this.realtime.subscribe(requestChannel, 'request.expired', handleCancellationOrExpiration);
  }

  unsubscribeFromRequestEventsForDriver(requestId: string): void {
    const requestChannel = `ride-request:${requestId}`;
    this.realtime.unsubscribeChannel(requestChannel);
  }

  subscribeToRideEventsForDriver(rideId: string): void {
    const rideChannel = `ride:${rideId}`;
    
    this.realtime.subscribe(rideChannel, 'ride.cancelled', () => {
      this.unsubscribeFromRideEvents(rideId);
      this.currentRideSignal.set(null);
      this.activeCandidateSignal.set(null);
      
      const avail = this.driverAvailabilitySignal();
      if (avail) {
        avail.isBusy = false;
        avail.activeRideId = null;
        this.driverAvailabilitySignal.set(avail);
      }
      this.updateOpenRequestsSubscription();
    });
  }

  updateOpenRequestsSubscription(): void {
    const avail = this.driverAvailabilitySignal();
    const activeCand = this.activeCandidateSignal();
    const activeRide = this.currentRideSignal();

    const shouldSubscribe = avail && avail.isAvailable && !activeRide && !activeCand;

    if (shouldSubscribe) {
      this.subscribeToOpenRequestsChannel();
    } else {
      this.unsubscribeFromOpenRequestsChannel();
    }
  }

  subscribeToOpenRequestsChannel(): void {
    this.realtime.subscribe('ride-request:open', 'request.created', () => {
      this.loadOpenRequests();
    });

    this.realtime.subscribe('ride-request:open', 'request.cancelled', (msg) => {
      const requestId = msg.data.requestId;
      if (requestId) {
        this.openRequestsSignal.update(list => list.filter(r => r.id !== requestId));
      }
    });

    this.realtime.subscribe('ride-request:open', 'request.expired', (msg) => {
      const requestId = msg.data.requestId;
      if (requestId) {
        this.openRequestsSignal.update(list => list.filter(r => r.id !== requestId));
      }
    });

    this.realtime.subscribe('ride-request:open', 'request.assigned', (msg) => {
      const requestId = msg.data.requestId;
      if (requestId) {
        this.openRequestsSignal.update(list => list.filter(r => r.id !== requestId));
      }
    });
  }

  unsubscribeFromOpenRequestsChannel(): void {
    this.realtime.unsubscribeChannel('ride-request:open');
  }

  // ── Shared utilities ──────────────────────────────────────────────────

  clearError(): void { this.errorSignal.set(null); }
}
