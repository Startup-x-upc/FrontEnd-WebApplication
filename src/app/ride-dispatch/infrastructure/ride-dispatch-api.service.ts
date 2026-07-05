import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { Ride } from '../domain/model/ride.entity';
import { RideRequest } from '../domain/model/ride-request.entity';
import { RideCandidate } from '../domain/model/ride-candidate.entity';
import { DriverAvailability } from '../domain/model/driver-availability.entity';
import { RideStatus } from '../domain/model/ride.status';

import { RideDispatchService } from '../../shared/infrastructure/api/generated/ride-dispatch/ride-dispatch.service';
// ponytail: toggle lives in DriverManagement context — delegated via its api service
import { DriverManagementApiService } from '../../driver-management/infrastructure/driver-management-api.service';
import { RideCandidateListResponse, SelectCandidateResponse, RideRequestResponse, RideRequestListResponse, RideCandidateResponse, DriverAvailabilityResponse, RideResponse, TripHistoryListResponse } from '../../shared/infrastructure/api/generated/model';

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
  // ponytail: driver-management context — toggle is owned by DriverManagementApiService
  private driverManagementApiService = inject(DriverManagementApiService);

  // ── Ride Requests ────────────────────────────────────────────────────

  /** Returns all OPEN requests visible to available drivers. */
  getOpenRideRequests(): Observable<RideRequest[]> {
    return this.rideDispatchService.getOpenRideRequests({ status: 'OPEN' }).pipe(
      map((res: RideRequestListResponse) => (res.data || []).map(RideRequestAssembler.toEntity))
    );
  }

  /** Returns a single ride request by its ID. */
  getRideRequestById(requestId: string): Observable<RideRequest> {
    return this.rideDispatchService.getRideRequestById(requestId).pipe(
      map((res: RideRequestResponse) => RideRequestAssembler.toEntity(res))
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
    return this.rideDispatchService.getDriverActiveCandidate(driverId).pipe(
      map((res: RideCandidateResponse) => res && res.id ? RideCandidateAssembler.toEntity(res) : null)
    );
  }

  /**
   * Driver applies to a ride request.
   * The backend enriches the candidate with driver info from the auth context — we map the real response.
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
      map((res: RideCandidateResponse) => RideCandidateAssembler.toEntity(res))
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
    return this.rideDispatchService.getActiveRideForDriver(driverId).pipe(
      map((res: RideResponse) => res && res.id ? RideAssembler.toEntity(res) : null)
    );
  }

  // ── Rides ────────────────────────────────────────────────────────────

  /** Returns a single ride by ID. */
  getRideById(rideId: string): Observable<Ride> {
    return this.rideDispatchService.getRideById(rideId).pipe(
      map((res: RideResponse) => RideAssembler.toEntity(res))
    );
  }

  /**
   * Updates the status of an active ride.
   */
  updateRideStatus(rideId: string, status: RideStatus): Observable<Ride> {
    return this.rideDispatchService.advanceRideStatus(rideId, { status }).pipe(
      map((res: RideResponse) => RideAssembler.toEntity(res))
    );
  }

  /**
   * Cancels a ride via the real backend cancelRide endpoint.
   */
  cancelRide(rideId: string): Observable<Ride> {
    return this.rideDispatchService.cancelRide(rideId).pipe(
      map((res: RideResponse) => RideAssembler.toEntity(res))
    );
  }

  // ── Driver Availability ──────────────────────────────────────────────

  /** Loads driver availability record. */
  getDriverAvailability(driverId: string): Observable<DriverAvailability> {
    return this.rideDispatchService.getDriverAvailability(driverId).pipe(
      map((res: DriverAvailabilityResponse) => {
        const domain = new DriverAvailability();
        domain.id = res.id || '';
        domain.driverId = res.driverId || driverId;
        domain.isAvailable = res.isAvailable || false;
        domain.isBusy = res.isBusy || false;
        domain.activeRideId = res.activeRideId ?? null;
        return domain;
      }),
      catchError(() => {
        // ponytail: If 404 (Not Found), it means the availability record hasn't been created yet.
        // We return a default offline availability record so the dashboard doesn't crash.
        const fallback = new DriverAvailability();
        fallback.driverId = driverId;
        fallback.isAvailable = false;
        fallback.isBusy = false;
        fallback.activeRideId = null;
        return of(fallback);
      })
    );
  }

  /** Toggles the isAvailable flag. Delegates to DriverManagementApiService (correct bounded context). */
  toggleDriverAvailability(driverId: string, isAvailable: boolean): Observable<DriverAvailability> {
    return this.driverManagementApiService.toggleAvailability(driverId);
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
    return this.rideDispatchService.getPassengerTripHistory(passengerId).pipe(
      map((res: TripHistoryListResponse) => {
        const data = res.data || [];
        return data.map(RideAssembler.toEntity);
      })
    );
  }

  /**
   * Retrieves completed trips for a driver.
   */
  getDriverTrips(driverId: string): Observable<Ride[]> {
    return this.rideDispatchService.getDriverTripHistory(driverId).pipe(
      map((res: TripHistoryListResponse) => {
        const data = res.data || [];
        return data.map(RideAssembler.toEntity);
      })
    );
  }
}
