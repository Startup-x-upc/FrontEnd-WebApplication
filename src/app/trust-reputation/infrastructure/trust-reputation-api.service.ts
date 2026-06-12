import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';

import { DriverReputation } from '../domain/model/driver-reputation.entity';
import { PassengerReputation } from '../domain/model/passenger-reputation.entity';
import { TripRating } from '../domain/model/trip-rating.entity';

import { RatingResponse } from './rating-response';
import { RatingAssembler } from './rating-assembler';

/**
 * @summary Infrastructure gateway to the Trust & Reputation endpoints on json-server.
 * Handles all HTTP communication for ratings and reputation queries.
 * @author Sprint 3 — Trust & Reputation Bounded Context
 */
@Injectable({ providedIn: 'root' })
export class TrustReputationApiService {
  private readonly basePath = `${environment.apiBaseUrl}`;
  private readonly http = inject(HttpClient);

  // ── Reputation queries ─────────────────────────────────────────────────

  /**
   * Retrieves the aggregated reputation for a driver.
   * Queries all ratings where this driver was rated and computes the average.
   *
   * @param driverId - The driver's ID.
   * @returns Observable<DriverReputation> with computed average and count.
   */
  getDriverReputation(driverId: string): Observable<DriverReputation> {
    return this.http
      .get<RatingResponse[]>(`${this.basePath}/ratings?driverId=${driverId}`)
      .pipe(
        map((ratings: RatingResponse[]) => {
          const reputation = new DriverReputation();
          reputation.id = `drep-${driverId}`;
          reputation.driverId = driverId;

          const rated = ratings.filter(r => r.driverRatingStatus === 'RATED');
          if (rated.length > 0) {
            reputation.totalRatings = rated.length;
            const sum = rated.reduce((acc, r) => acc + r.driverScore, 0);
            reputation.averageScore = sum / rated.length;
          }
          return reputation;
        })
      );
  }

  /**
   * Retrieves the aggregated reputation for a passenger.
   * Queries all ratings where this passenger was rated and computes the average.
   *
   * @param passengerId - The passenger's ID.
   * @returns Observable<PassengerReputation> with computed average and count.
   */
  getPassengerReputation(passengerId: string): Observable<PassengerReputation> {
    return this.http
      .get<RatingResponse[]>(`${this.basePath}/ratings?passengerId=${passengerId}`)
      .pipe(
        map((ratings: RatingResponse[]) => {
          const reputation = new PassengerReputation();
          reputation.id = `prep-${passengerId}`;
          reputation.passengerId = passengerId;

          const rated = ratings.filter(r => r.passengerRatingStatus === 'RATED');
          if (rated.length > 0) {
            reputation.totalRatings = rated.length;
            const sum = rated.reduce((acc, r) => acc + r.passengerScore, 0);
            reputation.averageScore = sum / rated.length;
          }
          return reputation;
        })
      );
  }

  // ── Trip rating lookup ─────────────────────────────────────────────────

  /**
   * Retrieves or creates a rating record for a specific trip.
   * If none exists, returns a fresh TripRating with both statuses PENDING.
   *
   * @param tripId - The ride/trip ID to look up.
   * @returns Observable<TripRating>
   */
  getTripRating(tripId: string): Observable<TripRating> {
    return this.http
      .get<RatingResponse[]>(`${this.basePath}/ratings?rideId=${tripId}`)
      .pipe(
        map((responses: RatingResponse[]) => {
          if (responses.length > 0) {
            return RatingAssembler.toEntity(responses[0]);
          }
          // No rating record yet — return a fresh one
          const fallback = new TripRating();
          fallback.tripId = tripId;
          fallback.openForRating();
          return fallback;
        })
      );
  }

  // ── Rating submissions ─────────────────────────────────────────────────

  /**
   * Submits or updates a driver rating for a given trip.
   * If a rating record already exists for this trip, PATCHes it.
   * Otherwise, POSTs a new record.
   *
   * @param tripId - The ride/trip ID.
   * @param driverId - The driver being rated.
   * @param passengerId - The passenger who is rating.
   * @param score - Rating score (1-5).
   * @returns Observable<TripRating> with updated entity.
   */
  rateDriver(
    tripId: string,
    driverId: string,
    passengerId: string,
    score: number
  ): Observable<TripRating> {
    return this.findOrCreateRating(tripId, driverId, passengerId).pipe(
      switchMap((existing: TripRating) => {
        existing.rateDriver(score);
        const body = RatingAssembler.toResponse(existing);

        if (existing.id) {
          // Update existing record
          return this.http
            .patch<RatingResponse>(`${this.basePath}/ratings/${existing.id}`, body)
            .pipe(map(RatingAssembler.toEntity));
        }
        // Create new record
        return this.http
          .post<RatingResponse>(`${this.basePath}/ratings`, body)
          .pipe(map(RatingAssembler.toEntity));
      })
    );
  }

  /**
   * Submits or updates a passenger rating for a given trip.
   * If a rating record already exists for this trip, PATCHes it.
   * Otherwise, POSTs a new record.
   *
   * @param tripId - The ride/trip ID.
   * @param driverId - The driver who is rating.
   * @param passengerId - The passenger being rated.
   * @param score - Rating score (1-5).
   * @param comment - Optional comment (enabled for scores ≤ 2).
   * @returns Observable<TripRating> with updated entity.
   */
  ratePassenger(
    tripId: string,
    driverId: string,
    passengerId: string,
    score: number,
    comment: string = ''
  ): Observable<TripRating> {
    return this.findOrCreateRating(tripId, driverId, passengerId).pipe(
      switchMap((existing: TripRating) => {
        existing.ratePassenger(score);
        if (comment) {
          existing.recordPassengerLowRatingComment(comment);
        }
        const body = RatingAssembler.toResponse(existing);

        if (existing.id) {
          return this.http
            .patch<RatingResponse>(`${this.basePath}/ratings/${existing.id}`, body)
            .pipe(map(RatingAssembler.toEntity));
        }
        return this.http
          .post<RatingResponse>(`${this.basePath}/ratings`, body)
          .pipe(map(RatingAssembler.toEntity));
      })
    );
  }

  /**
   * Skips rating a driver for a trip (sets status to SKIPPED).
   */
  skipDriverRating(
    tripId: string,
    driverId: string,
    passengerId: string
  ): Observable<TripRating> {
    return this.findOrCreateRating(tripId, driverId, passengerId).pipe(
      switchMap((existing: TripRating) => {
        existing.skipDriverRating();
        const body = RatingAssembler.toResponse(existing);

        if (existing.id) {
          return this.http
            .patch<RatingResponse>(`${this.basePath}/ratings/${existing.id}`, body)
            .pipe(map(RatingAssembler.toEntity));
        }
        return this.http
          .post<RatingResponse>(`${this.basePath}/ratings`, body)
          .pipe(map(RatingAssembler.toEntity));
      })
    );
  }

  /**
   * Skips rating a passenger for a trip (sets status to SKIPPED).
   */
  skipPassengerRating(
    tripId: string,
    driverId: string,
    passengerId: string
  ): Observable<TripRating> {
    return this.findOrCreateRating(tripId, driverId, passengerId).pipe(
      switchMap((existing: TripRating) => {
        existing.skipPassengerRating();
        const body = RatingAssembler.toResponse(existing);

        if (existing.id) {
          return this.http
            .patch<RatingResponse>(`${this.basePath}/ratings/${existing.id}`, body)
            .pipe(map(RatingAssembler.toEntity));
        }
        return this.http
          .post<RatingResponse>(`${this.basePath}/ratings`, body)
          .pipe(map(RatingAssembler.toEntity));
      })
    );
  }

  // ── Private helpers ─────────────────────────────────────────────────────

  /**
   * Finds an existing rating record for a trip, or returns a fresh TripRating
   * pre-populated with driverId, passengerId, and a 24h rateable window.
   */
  private findOrCreateRating(
    tripId: string,
    driverId: string,
    passengerId: string
  ): Observable<TripRating> {
    return this.http
      .get<RatingResponse[]>(`${this.basePath}/ratings?rideId=${tripId}`)
      .pipe(
        map((responses: RatingResponse[]) => {
          if (responses.length > 0) {
            return RatingAssembler.toEntity(responses[0]);
          }
          // Create a fresh rating record for this trip
          const fresh = new TripRating();
          fresh.tripId = tripId;
          fresh.driverId = driverId;
          fresh.passengerId = passengerId;
          fresh.openForRating();
          // Set rateable window: 24 hours from now
          const expiry = new Date();
          expiry.setHours(expiry.getHours() + 24);
          fresh.rateableUntil = expiry.toISOString();
          return fresh;
        })
      );
  }
}
