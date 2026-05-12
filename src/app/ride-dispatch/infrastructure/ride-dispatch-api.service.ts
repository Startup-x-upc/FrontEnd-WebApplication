import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment.development';

import { Ride } from '../domain/model/ride.entity';
import { RideRequest } from '../domain/model/ride-request.entity';
import { DriverAvailability } from '../domain/model/driver-availability.entity';
import { RideStatus } from '../domain/model/ride.status';

import { RideRequestResponse } from './ride-request-response';
import { DriverAvailabilityResponse } from './driver-availability-response';
import { RideResponse } from './ride-response';

import { RideRequestAssembler } from './ride-request-assembler';
import { DriverAvailabilityAssembler } from './driver-availability-assembler';
import { RideAssembler } from './ride-assembler';

@Injectable({ providedIn: 'root' })
export class RideDispatchApiService {
  private readonly basePath = `${environment.apiBaseUrl}`;

  constructor(private readonly http: HttpClient) {}

  getOpenRideRequests(): Observable<RideRequest[]> {
    return this.http.get<RideRequestResponse[]>(`${this.basePath}/rideRequests?status=PENDING`)
      .pipe(map(responses => responses.map(RideRequestAssembler.toEntity)));
  }

  getRideRequestById(requestId: string): Observable<RideRequest> {
    return this.http.get<RideRequestResponse>(`${this.basePath}/rideRequests/${requestId}`)
      .pipe(map(RideRequestAssembler.toEntity));
  }

  getRideById(rideId: string): Observable<Ride> {
    return this.http.get<RideResponse>(`${this.basePath}/rides/${rideId}`)
      .pipe(map(RideAssembler.toEntity));
  }

  getRideRequestsByPassenger(passengerId: string): Observable<RideRequest[]> {
    return this.http.get<RideRequestResponse[]>(`${this.basePath}/rideRequests?passengerId=${passengerId}`)
      .pipe(map(responses => responses.map(RideRequestAssembler.toEntity)));
  }

  getRidesByPassenger(passengerId: string): Observable<Ride[]> {
    return this.http.get<RideResponse[]>(`${this.basePath}/rides?passengerId=${passengerId}`)
      .pipe(map(responses => responses.map(RideAssembler.toEntity)));
  }

  createRideRequest(
    passengerId: string,
    origin: string,
    destination: string,
    distanceKm: number,
    estimatedFare: number
  ): Observable<RideRequest> {
    const payload = {
      id: `rr-${Date.now()}`,
      passengerId,
      origin,
      destination,
      distanceKm,
      status: RideStatus.PENDING,
      estimatedFare,
      isExpired: false
    };
    return this.http.post<RideRequestResponse>(`${this.basePath}/rideRequests`, payload)
      .pipe(map(RideRequestAssembler.toEntity));
  }

  acceptRideRequest(request: RideRequest, driverId: string): Observable<Ride> {
    return this.http
      .patch<RideRequestResponse>(`${this.basePath}/rideRequests/${request.id}`, {
        status: RideStatus.ACCEPTED,
        driverId,
      })
      .pipe(
        switchMap(() => {
          const payload = {
            id: `r-${Date.now()}`,
            passengerId: request.passengerId,
            driverId,
            origin: request.origin,
            destination: request.destination,
            status: RideStatus.ACCEPTED,
            estimatedFare: request.estimatedFare,
          };
          return this.http.post<RideResponse>(`${this.basePath}/rides`, payload);
        }),
        map(RideAssembler.toEntity),
      );
  }

  getDriverAvailability(driverId: string): Observable<DriverAvailability> {
    return this.http.get<DriverAvailabilityResponse[]>(`${this.basePath}/driverAvailability?driverId=${driverId}`)
      .pipe(map(responses => {
        if (responses.length > 0) return DriverAvailabilityAssembler.toEntity(responses[0]);
        // Fallback for demo if missing
        const fallback = new DriverAvailability();
        fallback.driverId = driverId;
        return fallback;
      }));
  }

  toggleDriverAvailability(driverId: string, isAvailable: boolean): Observable<DriverAvailability> {
    return this.getDriverAvailability(driverId).pipe(
      map(availability => {
        const idToPatch = availability.id ? availability.id : `da-${Date.now()}`;
        if (!availability.id) {
          // If it didn't exist, POST it
          this.http.post(`${this.basePath}/driverAvailability`, {
            id: idToPatch,
            driverId,
            currentLocation: '0,0',
            isAvailable
          }).subscribe();
        } else {
          // If it existed, PATCH it
          this.http.patch(`${this.basePath}/driverAvailability/${availability.id}`, {
            isAvailable
          }).subscribe();
        }
        availability.isAvailable = isAvailable;
        return availability;
      })
    );
  }
}
