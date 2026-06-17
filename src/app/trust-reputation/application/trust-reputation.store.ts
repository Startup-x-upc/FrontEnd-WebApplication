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

  loadDriverReputation(driverId: string): void {
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

  loadPassengerReputation(passengerId: string): void {
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

  loadTripRating(tripId: string): void {
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

  submitDriverRating(tripId: string, driverId: string, passengerId: string, score: number): void {
    if (score < 1 || score > 5) {
      this.errorSignal.set('La calificación debe estar entre 1 y 5.');
      return;
    }
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.rateDriver(tripId, driverId, passengerId, score).subscribe({
      next: (rating) => {
        this.currentRatingSignal.set(rating);
        this.loadingSignal.set(false);
        // Refresh driver reputation after rating
        this.loadDriverReputation(driverId);
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('No se pudo enviar la calificación.');
      },
    });
  }

  submitPassengerRating(tripId: string, driverId: string, passengerId: string, score: number, comment: string = ''): void {
    if (score < 1 || score > 5) {
      this.errorSignal.set('La calificación debe estar entre 1 y 5.');
      return;
    }
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.ratePassenger(tripId, driverId, passengerId, score, comment).subscribe({
      next: (rating) => {
        this.currentRatingSignal.set(rating);
        this.loadingSignal.set(false);
        // Refresh passenger reputation after rating
        this.loadPassengerReputation(passengerId);
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('No se pudo enviar la calificación.');
      },
    });
  }

  /** Skip rating a driver (sets status to SKIPPED). */
  skipDriverRating(tripId: string, driverId: string, passengerId: string): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.skipDriverRating(tripId, driverId, passengerId).subscribe({
      next: (rating) => {
        this.currentRatingSignal.set(rating);
        this.loadingSignal.set(false);
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('No se pudo omitir la calificación.');
      },
    });
  }

  /** Skip rating a passenger (sets status to SKIPPED). */
  skipPassengerRating(tripId: string, driverId: string, passengerId: string): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.skipPassengerRating(tripId, driverId, passengerId).subscribe({
      next: (rating) => {
        this.currentRatingSignal.set(rating);
        this.loadingSignal.set(false);
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('No se pudo omitir la calificación.');
      },
    });
  }

  clearError(): void {
    this.errorSignal.set(null);
  }
}
