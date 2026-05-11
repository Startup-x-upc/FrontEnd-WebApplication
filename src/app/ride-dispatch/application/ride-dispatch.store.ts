import { computed, inject, Injectable, signal } from '@angular/core';
import { Ride } from '../domain/model/ride.entity';
import { RideRequest } from '../domain/model/ride-request.entity';
import { DriverAvailability } from '../domain/model/driver-availability.entity';
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

  submitRideRequest(
    passengerId: string,
    origin: string,
    destination: string,
    distanceKm: number,
  ): void {
    if (!origin || !destination || distanceKm <= 0) {
      this.errorSignal.set('Datos incompletos para crear la solicitud.');
      return;
    }
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.createRideRequest(passengerId, origin, destination, distanceKm, 0).subscribe({
      next: (req) => {
        this.openRequestsSignal.update((list) => [...list, req]);
        this.loadingSignal.set(false);
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('No se pudo crear la solicitud.');
      },
    });
  }

  acceptRide(rideId: string, driverId: string): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.acceptRide(rideId, driverId).subscribe({
      next: (ride) => {
        this.currentRideSignal.set(ride);
        this.loadingSignal.set(false);
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('No se pudo aceptar el viaje.');
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

  clearError(): void {
    this.errorSignal.set(null);
  }
}
