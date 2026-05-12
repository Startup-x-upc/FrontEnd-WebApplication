import { computed, inject, Injectable, signal } from '@angular/core';
import { Ride } from '../domain/model/ride.entity';
import { RideRequest } from '../domain/model/ride-request.entity';
import { DriverAvailability } from '../domain/model/driver-availability.entity';
import { RideStatus } from '../domain/model/ride.status';
import { RideDispatchApiService } from '../infrastructure/ride-dispatch-api.service';

/**
 * @summary Application service for the Ride Dispatch bounded context.
 * Coordinates ride request creation, ride acceptance and driver availability.
 * @author Sebastian Andres Aiquipa Poma
 */
@Injectable({ providedIn: 'root' })
export class RideDispatchStore {
  private api = inject(RideDispatchApiService);

  private openRequestsSignal = signal<RideRequest[]>([]);
  private currentRideSignal = signal<Ride | null>(null);
  private driverAvailabilitySignal = signal<DriverAvailability | null>(null);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);

  readonly openRequests = computed(() => this.openRequestsSignal());
  readonly openRequestCount = computed(() => this.openRequestsSignal().length);
  readonly currentRide = computed(() => this.currentRideSignal());
  readonly driverAvailability = computed(() => this.driverAvailabilitySignal());
  readonly isLoading = computed(() => this.loadingSignal());
  readonly error = computed(() => this.errorSignal());

  loadOpenRequests(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.getOpenRideRequests().subscribe({
      next: (requests) => {
        this.openRequestsSignal.set(requests);
        this.loadingSignal.set(false);
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('No se pudieron cargar las solicitudes.');
      },
    });
  }

  loadRide(rideId: string): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.getRideById(rideId).subscribe({
      next: (ride) => {
        this.currentRideSignal.set(ride);
        this.loadingSignal.set(false);
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('No se pudo cargar el viaje.');
      },
    });
  }

  // Passenger request flow state
  private originSignal = signal<string>('');
  private destinationSignal = signal<string>('');
  private distanceKmSignal = signal<number>(0);
  private currentRequestSignal = signal<RideRequest | null>(null);
  // Nearby drivers (composed data)
  private nearbyDriversSignal = signal<any[]>([]); // simplified

  readonly origin = computed(() => this.originSignal());
  readonly destination = computed(() => this.destinationSignal());
  readonly distanceKm = computed(() => this.distanceKmSignal());
  readonly currentRequest = computed(() => this.currentRequestSignal());
  readonly nearbyDrivers = computed(() => this.nearbyDriversSignal());

  setOrigin(origin: string): void {
    this.originSignal.set(origin);
  }

  setDestination(destination: string, distanceKm: number): void {
    this.destinationSignal.set(destination);
    this.distanceKmSignal.set(distanceKm);
  }

  submitRideRequest(passengerId: string, estimatedFare: number): void {
    const origin = this.originSignal();
    const destination = this.destinationSignal();
    const distanceKm = this.distanceKmSignal();

    if (!origin || !destination || distanceKm <= 0) {
      this.errorSignal.set('Datos incompletos para crear la solicitud.');
      return;
    }
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api
      .createRideRequest(passengerId, origin, destination, distanceKm, estimatedFare)
      .subscribe({
        next: (req) => {
          this.currentRequestSignal.set(req);
          this.loadingSignal.set(false);
        },
        error: () => {
          this.loadingSignal.set(false);
          this.errorSignal.set('No se pudo crear la solicitud.');
        },
      });
  }

  // Placeholder for nearby drivers (mock)
  loadNearbyDrivers(): void {
    // In a real app, this calls an API. Here we just mock it for the UI.
    setTimeout(() => {
      this.nearbyDriversSignal.set([
        { id: 'd-001', lat: -9.471, lng: -78.299, name: 'Carlos Mendoza', rating: 4.8 },
      ]);
    }, 500);
  }

  acceptRideRequest(request: RideRequest, driverId: string): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.acceptRideRequest(request, driverId).subscribe({
      next: (ride) => {
        this.currentRideSignal.set(ride);
        this.openRequestsSignal.update((list) => list.filter((r) => r.id !== request.id));
        this.loadingSignal.set(false);
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('No se pudo aceptar la solicitud.');
      },
    });
  }

  loadDriverAvailability(driverId: string): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.getDriverAvailability(driverId).subscribe({
      next: (a) => {
        this.driverAvailabilitySignal.set(a);
        this.loadingSignal.set(false);
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('No se pudo cargar la disponibilidad.');
      },
    });
  }

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
      next: (a) => {
        this.driverAvailabilitySignal.set(a);
        this.loadingSignal.set(false);
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('No se pudo cambiar la disponibilidad.');
      },
    });
  }

  checkRequestStatus(): void {
    const current = this.currentRequestSignal();
    if (!current?.id) return;
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.getRideRequestById(current.id).subscribe({
      next: (updatedRequest) => {
        this.currentRequestSignal.set(updatedRequest);
        this.loadingSignal.set(false);
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('No se pudo verificar el estado de la solicitud.');
      },
    });
  }

  skipRequest(requestId: string): void {
    this.openRequestsSignal.update((list) => list.filter((r) => r.id !== requestId));
  }

  clearCurrentRequest(): void {
    this.currentRequestSignal.set(null);
  }

  clearError(): void {
    this.errorSignal.set(null);
  }
}
