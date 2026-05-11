import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import { environment } from '../../../environments/environment.development';

import { DriverReputation } from '../domain/model/driver-reputation.entity';
import { PassengerReputation } from '../domain/model/passenger-reputation.entity';
import { TripRating } from '../domain/model/trip-rating.entity';

import { RatingResponse } from './rating-response';
import { RatingAssembler } from './rating-assembler';

@Injectable({ providedIn: 'root' })
export class TrustReputationApiService {
  private readonly basePath = `${environment.apiBaseUrl}`;

  constructor(private readonly http: HttpClient) {}

  getDriverReputation(driverId: string): Observable<DriverReputation> {
    const r = new DriverReputation();
    r.id = driverId;
    r.driverId = driverId;
    r.averageScore = 4.8;
    r.totalRatings = 42;
    return of(r);
  }

  getPassengerReputation(passengerId: string): Observable<PassengerReputation> {
    const r = new PassengerReputation();
    r.id = passengerId;
    r.passengerId = passengerId;
    r.averageScore = 4.5;
    r.totalRatings = 18;
    return of(r);
  }

  getTripRating(tripId: string): Observable<TripRating> {
    return this.http.get<RatingResponse[]>(`${this.basePath}/ratings?rideId=${tripId}`)
      .pipe(map(responses => {
        if (responses.length > 0) return RatingAssembler.toEntity(responses[0]);
        const fallback = new TripRating();
        fallback.tripId = tripId;
        fallback.openForRating();
        return fallback;
      }));
  }

  rateDriver(tripId: string, score: number): Observable<TripRating> {
    return this.http.post<RatingResponse>(`${this.basePath}/ratings`, {
      id: `rt-${Date.now()}`,
      rideId: tripId,
      rating: score,
      comment: ''
    }).pipe(map(RatingAssembler.toEntity));
  }

  ratePassenger(tripId: string, score: number, comment: string): Observable<TripRating> {
    return this.http.post<RatingResponse>(`${this.basePath}/ratings`, {
      id: `rt-${Date.now()}`,
      rideId: tripId,
      rating: score,
      comment: comment
    }).pipe(map(RatingAssembler.toEntity));
  }
}
