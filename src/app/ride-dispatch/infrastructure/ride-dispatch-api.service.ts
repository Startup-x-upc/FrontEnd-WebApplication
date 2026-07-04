import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { Ride } from '../domain/model/ride.entity';
import { RideRequest } from '../domain/model/ride-request.entity';
import { RideCandidate } from '../domain/model/ride-candidate.entity';
import { DriverAvailability } from '../domain/model/driver-availability.entity';
import { RideStatus } from '../domain/model/ride.status';

// Import generated services and models
import { RideDispatchService } from '../../shared/infrastructure/api/generated/ride-dispatch/ride-dispatch.service';
import { DriverManagementService } from '../../shared/infrastructure/api/generated/driver-management/driver-management.service';
import { RideCandidateListResponse, SelectCandidateResponse, RideRequestResponse } from '../../shared/infrastructure/api/generated/model';

import { RideRequestAssembler } from './ride-request-assembler';
import { RideCandidateAssembler } from './ride-candidate-assembler';
import { RideAssembler } from './ride-assembler';

@Injectable({ providedIn: 'root' })
/**
 * @summary Infrastructure gateway for the Ride Dispatch bounded context.
 * Mapped to the real Spring Boot backend endpoints.
 * @author Jesús Iván Castillo Vidal
 */
export class RideDispatchApiService {

  private rideDispatchService = inject(RideDispatchService);
  private driverManagementService = inject(DriverManagementService);

  // ── Ride Requests ────────────────────────────────────────────────────

  /** Returns all OPEN requests visible to available drivers. */
  getOpenRideRequests(): Observable<RideRequest[]> {
    return this.rideDispatchService.getOpenRideRequests<any>({ status: 'OPEN' }).pipe(
      map((res: any) => {
        const data = res.data || [];
        return data.map(RideRequestAssembler.toEntity);
      })
    );
  }

  /** Returns a single ride request by its ID. */
  getRideRequestById(requestId: string): Observable<RideRequest> {
    return this.rideDispatchService.getRideRequestById<any>(requestId).pipe(
      map(RideRequestAssembler.toEntity)
    );
  }

  /** Marks a ride request as expired (US-11). */
  patchRideRequestExpiry(requestId: string): Observable<RideRequest> {
    // In real backend request expiry isn't manually patched from frontend this way,
    // but we can return an empty model or fetch the request to comply with the interface.
    return this.getRideRequestById(requestId);
  }

  /** Creates a new ride request (status = OPEN). */
  createRideRequest(
    passengerId: string, // Ignored: Spring Boot extracts it from the auth token
    origin: string,
    destination: string,
    distanceKm: number,
    estimatedFare: number,
  ): Observable<RideRequest> {
    return (this.rideDispatchService.createRideRequest({
      origin,
      destination,
      distanceKm,
      estimatedFare
    }) as Observable<RideRequestResponse>).pipe(
      map(RideRequestAssembler.toEntity)
    );
  }

  // ── Ride Candidates ──────────────────────────────────────────────────

  /** Returns all candidates for a given ride request. */
  getCandidatesForRequest(requestId: string): Observable<RideCandidate[]> {
    return this.rideDispatchService.getCandidatesForRequest(requestId).pipe(
      map((res: RideCandidateListResponse) => {
        const data = res.data || [];
        return data.map(RideCandidateAssembler.toEntity);
      })
    );
  }

  /** Returns the active PROPOSED candidate for a given driver (if any). */
  getDriverActiveCandidate(driverId: string): Observable<RideCandidate | null> {
    return this.rideDispatchService.getDriverActiveCandidate<any>(driverId).pipe(
      map(res => res && res.id ? RideCandidateAssembler.toEntity(res) : null)
    );
  }

  /**
   * Driver applies to a ride request.
   */
  applyAsCandidate(
    requestId: string,
    driverId: string,
    driverName: string,
    vehicleType: string,
    ratingAverage: number,
    photoUrl: string,
  ): Observable<RideCandidate> {
    return this.rideDispatchService.applyAsCandidate(requestId, {}).pipe(
      map((res: any) => {
        const candidate = new RideCandidate();
        candidate.requestId = requestId;
        candidate.driverId = driverId;
        candidate.driverName = driverName;
        candidate.vehicleType = vehicleType;
        candidate.ratingAverage = ratingAverage;
        candidate.photoUrl = photoUrl;
        candidate.status = 'PROPOSED';
        return candidate;
      })
    );
  }

  /**
   * Passenger selects a candidate. Calls the atomic Spring Boot select endpoint.
   */
  confirmCandidate(
    request: RideRequest,
    selectedCandidate: RideCandidate,
    allCandidates: RideCandidate[],
  ): Observable<Ride> {
    return (this.rideDispatchService.selectCandidate(request.id, {
      candidateId: selectedCandidate.id
    }) as Observable<SelectCandidateResponse>).pipe(
      map((res: SelectCandidateResponse) => {
        return RideAssembler.toEntity(res.ride!);
      })
    );
  }

  /** Returns the first active (non-completed, non-cancelled) ride for a driver, or null. */
  getActiveRideForDriver(driverId: string): Observable<Ride | null> {
    return this.rideDispatchService.getActiveRideForDriver<any>(driverId).pipe(
      map(res => res && res.id ? RideAssembler.toEntity(res) : null)
    );
  }

  // ── Rides ────────────────────────────────────────────────────────────

  /** Returns a single ride by ID. */
  getRideById(rideId: string): Observable<Ride> {
    return this.rideDispatchService.getRideById<any>(rideId).pipe(
      map(RideAssembler.toEntity)
    );
  }

  /**
   * Updates the status of an active ride.
   */
  updateRideStatus(rideId: string, status: RideStatus): Observable<Ride> {
    return this.rideDispatchService.advanceRideStatus(rideId, { status }).pipe(
      map((res: any) => RideAssembler.toEntity(res))
    );
  }

  // ── Driver Availability ──────────────────────────────────────────────

  /** Loads driver availability record. */
  getDriverAvailability(driverId: string): Observable<DriverAvailability> {
    return this.rideDispatchService.getDriverAvailability<any>(driverId).pipe(
      map(res => {
        const domain = new DriverAvailability();
        domain.id = res.id || '';
        domain.driverId = res.driverId || driverId;
        domain.isAvailable = res.isAvailable || false;
        domain.isBusy = res.isBusy || false;
        return domain;
      })
    );
  }

  /** Toggles the isAvailable flag. */
  toggleDriverAvailability(driverId: string, isAvailable: boolean): Observable<DriverAvailability> {
    return this.driverManagementService.toggleAvailability(driverId).pipe(
      map((res: any) => {
        const domain = new DriverAvailability();
        domain.driverId = driverId;
        domain.isAvailable = res.isAvailable;
        return domain;
      })
    );
  }

  /** Marks the driver as busy with a specific ride. (Handled automatically by backend). */
  markDriverBusy(availabilityId: string, rideId: string): Observable<DriverAvailability> {
    return of(new DriverAvailability());
  }

  /** Marks the driver as free after completing or cancelling a ride. (Handled automatically by backend). */
  markDriverFree(availabilityId: string): Observable<DriverAvailability> {
    return of(new DriverAvailability());
  }

  // ── Trip History (US-24, US-25) ──────────────────────────────────────

  /**
   * Retrieves completed trips for a passenger.
   */
  getPassengerTrips(passengerId: string): Observable<Ride[]> {
    return this.rideDispatchService.getPassengerTripHistory<any>(passengerId).pipe(
      map((res: any) => {
        const data = res.data || [];
        return data.map(RideAssembler.toEntity);
      })
    );
  }

  /**
   * Retrieves completed trips for a driver.
   */
  getDriverTrips(driverId: string): Observable<Ride[]> {
    return this.rideDispatchService.getDriverTripHistory<any>(driverId).pipe(
      map((res: any) => {
        const data = res.data || [];
        return data.map(RideAssembler.toEntity);
      })
    );
  }
}
