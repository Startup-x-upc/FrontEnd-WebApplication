import { Injectable } from '@angular/core';
import { delay, Observable, of } from 'rxjs';
import { DriverReputation } from '../domain/model/driver-reputation.entity';
import { PassengerReputation } from '../domain/model/passanger-reputation.entity';
import { TripRating } from '../domain/model/trip-rating.entity';

/**
 * @summary TEMPORARY STUB. Returns hardcoded data while the real infrastructure
 * (responses, assemblers, HTTP gateway) is being built by the infrastructure team.
 * Replace this file when the real TrustReputationApiService lands.
 * @author Sebastian Andres Aiquipa Poma
 */
@Injectable({ providedIn: 'root' })
export class TrustReputationApiService {
  getDriverReputation(driverId: number): Observable<DriverReputation> {
    const r = new DriverReputation();
    r.id = 1;
    r.driverId = driverId;
    r.averageScore = 4.8;
    r.totalRatings = 42;
    return of(r).pipe(delay(200));
  }

  getPassengerReputation(passengerId: number): Observable<PassengerReputation> {
    const r = new PassengerReputation();
    r.id = 1;
    r.passengerId = passengerId;
    r.averageScore = 4.5;
    r.totalRatings = 18;
    return of(r).pipe(delay(200));
  }

  getTripRating(tripId: number): Observable<TripRating> {
    const t = new TripRating();
    t.id = 1;
    t.tripId = tripId;
    t.driverId = 1;
    t.passengerId = 1;
    t.openForRating();
    return of(t).pipe(delay(200));
  }

  rateDriver(tripId: number, score: number): Observable<TripRating> {
    const t = new TripRating();
    t.id = 1;
    t.tripId = tripId;
    t.rateDriver(score);
    return of(t).pipe(delay(200));
  }

  ratePassenger(tripId: number, score: number, comment: string): Observable<TripRating> {
    const t = new TripRating();
    t.id = 1;
    t.tripId = tripId;
    t.ratePassenger(score);
    if (comment) t.recordPassengerLowRatingComment(comment);
    return of(t).pipe(delay(200));
  }
}
