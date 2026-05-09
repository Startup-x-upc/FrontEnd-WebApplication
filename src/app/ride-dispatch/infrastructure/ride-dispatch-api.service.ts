import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { Ride } from '../domain/model/ride.entity';
import { RideRequest } from '../domain/model/ride-request.entity';
import { DriverAvailability } from '../domain/model/driver-availabity.entity';
import { RideStatus } from '../domain/model/ride.status';

/**
 * @summary TEMPORARY STUB. Returns hardcoded data while the real infrastructure
 * (responses, assemblers, HTTP gateway) is being built by the infrastructure team.
 * Replace this file when the real RideDispatchApiService lands.
 * @author Sebastian Andres Aiquipa Poma
 */
@Injectable({ providedIn: 'root' })
export class RideDispatchApiService {
  getOpenRideRequests(): Observable<RideRequest[]> {
    const r = new RideRequest();
    r.id = 1;
    r.passengerId = 1;
    r.origin = 'Jr. Ramón Castilla 432';
    r.destination = 'Mercado Central';
    r.distanceKm = 1.2;
    r.isExpired = false;
    return of([r]).pipe(delay(200));
  }

  getRideById(rideId: number): Observable<Ride> {
    const ride = new Ride();
    ride.id = rideId;
    ride.passengerId = 1;
    ride.driverId = 1;
    ride.origin = 'Origen demo';
    ride.destination = 'Destino demo';
    ride.status = RideStatus.PENDING;
    ride.estimatedFare = 4.0;
    return of(ride).pipe(delay(200));
  }

  createRideRequest(
    passengerId: number,
    origin: string,
    destination: string,
    distanceKm: number,
  ): Observable<RideRequest> {
    const r = new RideRequest();
    r.id = Date.now();
    r.passengerId = passengerId;
    r.origin = origin;
    r.destination = destination;
    r.distanceKm = distanceKm;
    return of(r).pipe(delay(200));
  }

  acceptRide(rideId: number, driverId: number): Observable<Ride> {
    const ride = new Ride();
    ride.id = rideId;
    ride.driverId = driverId;
    ride.status = RideStatus.ACCEPTED;
    return of(ride).pipe(delay(200));
  }

  getDriverAvailability(driverId: number): Observable<DriverAvailability> {
    const a = new DriverAvailability();
    a.id = 1;
    a.driverId = driverId;
    a.isAvailable = false;
    a.latitude = -12.04;
    a.longitude = -77.05;
    return of(a).pipe(delay(200));
  }

  toggleDriverAvailability(driverId: number, isAvailable: boolean): Observable<DriverAvailability> {
    const a = new DriverAvailability();
    a.id = 1;
    a.driverId = driverId;
    a.isAvailable = isAvailable;
    return of(a).pipe(delay(200));
  }
}
