import { computed, inject, Injectable, signal } from '@angular/core';
import { DriverReputation } from '../domain/model/driver-reputation.entity';
import { PassengerReputation } from '../domain/model/passenger-reputation.entity';
import { TripRating } from '../domain/model/trip-rating.entity';
import { TrustReputationApiService } from '../infrastructure/trust-reputation-api.service';

/**
 * @summary Application service for the Trust & Reputation bounded context.
 * Coordinates the loading and submission of driver and passenger ratings,
 * and exposes computed reputation state.
 * @author Sebastian Andres Aiquipa Poma
 */
@Injectable({ providedIn: 'root' })
export class TrustReputationStore {
  private api = inject(TrustReputationApiService);

  private driverReputationSignal = signal<DriverReputation | null>(null);
  private passengerReputationSignal = signal<PassengerReputation | null>(null);
  private currentRatingSignal = signal<TripRating | null>(null);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);

  readonly driverReputation = computed(() => this.driverReputationSignal());
  readonly passengerReputation = computed(() => this.passengerReputationSignal());
  readonly currentRating = computed(() => this.currentRatingSignal());
  readonly isLoading = computed(() => this.loadingSignal());
  readonly error = computed(() => this.errorSignal());

  readonly driverHasRatings = computed(() => {
    const r = this.driverReputationSignal();
    return r !== null && r.hasRatings();
  });

  loadDriverReputation(driverId: number): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.getDriverReputation(driverId).subscribe({
      next: (r) => {
        this.driverReputationSignal.set(r);
        this.loadingSignal.set(false);
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('No se pudo cargar la reputación del conductor.');
      },
    });
  }

  loadPassengerReputation(passengerId: number): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.getPassengerReputation(passengerId).subscribe({
      next: (r) => {
        this.passengerReputationSignal.set(r);
        this.loadingSignal.set(false);
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('No se pudo cargar la reputación del pasajero.');
      },
    });
  }

  loadTripRating(tripId: number): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.getTripRating(tripId).subscribe({
      next: (t) => {
        this.currentRatingSignal.set(t);
        this.loadingSignal.set(false);
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('No se pudo cargar la calificación.');
      },
    });
  }

  submitDriverRating(tripId: number, score: number): void {
    if (score < 1 || score > 5) {
      this.errorSignal.set('La calificación debe estar entre 1 y 5.');
      return;
    }
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.rateDriver(tripId, score).subscribe({
      next: (t) => {
        this.currentRatingSignal.set(t);
        this.loadingSignal.set(false);
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('No se pudo enviar la calificación.');
      },
    });
  }

  submitPassengerRating(tripId: number, score: number, comment: string = ''): void {
    if (score < 1 || score > 5) {
      this.errorSignal.set('La calificación debe estar entre 1 y 5.');
      return;
    }
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.ratePassenger(tripId, score, comment).subscribe({
      next: (t) => {
        this.currentRatingSignal.set(t);
        this.loadingSignal.set(false);
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('No se pudo enviar la calificación.');
      },
    });
  }

  clearError(): void {
    this.errorSignal.set(null);
  }
}
