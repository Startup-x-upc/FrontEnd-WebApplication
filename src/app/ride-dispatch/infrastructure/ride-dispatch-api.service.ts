import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment.development';

import { Ride } from '../domain/model/ride.entity';
import { RideRequest } from '../domain/model/ride-request.entity';
import { RideCandidate } from '../domain/model/ride-candidate.entity';
import { DriverAvailability } from '../domain/model/driver-availability.entity';
import { RideStatus } from '../domain/model/ride.status';

import { RideRequestResponse } from './ride-request-response';
import { RideCandidateResponse } from './ride-candidate-response';
import { DriverAvailabilityResponse } from './driver-availability-response';
import { RideResponse } from './ride-response';

import { RideRequestAssembler } from './ride-request-assembler';
import { RideCandidateAssembler } from './ride-candidate-assembler';
import { DriverAvailabilityAssembler } from './driver-availability-assembler';
import { RideAssembler } from './ride-assembler';

/**
 * @summary Infrastructure gateway for the Ride Dispatch bounded context.
 * All HTTP communication with json-server lives here.
 * @author Jesús Iván Castillo Vidal
 */
@Injectable({ providedIn: 'root' })
export class RideDispatchApiService {
  private readonly base = `${environment.apiBaseUrl}`;

  constructor(private readonly http: HttpClient) {}

  // ── Ride Requests ────────────────────────────────────────────────────

  /** Returns all OPEN requests visible to available drivers, enriched with passenger profiles. */
  getOpenRideRequests(): Observable<RideRequest[]> {
    return forkJoin({
      requests: this.http.get<RideRequestResponse[]>(`${this.base}/rideRequests?status=OPEN`),
      profiles: this.http.get<any[]>(`${this.base}/profiles`),
    }).pipe(
      map(({ requests, profiles }) => {
        return requests.map(req => {
          const domain = RideRequestAssembler.toEntity(req);
          const profile = profiles.find(p => p.accountId === req.passengerId);
          if (profile) {
            domain.passengerName = profile.fullName;
            domain.passengerPhotoUrl = profile.photoUrl;
          }
          return domain;
        });
      })
    );
  }

  /** Returns a single ride request by its ID, enriched with passenger profile. */
  getRideRequestById(requestId: string): Observable<RideRequest> {
    return this.http.get<RideRequestResponse>(`${this.base}/rideRequests/${requestId}`).pipe(
      switchMap(req => {
        const domain = RideRequestAssembler.toEntity(req);
        return this.http.get<any[]>(`${this.base}/profiles?accountId=${req.passengerId}`).pipe(
          map(profiles => {
            if (profiles && profiles.length > 0) {
              domain.passengerName = profiles[0].fullName;
              domain.passengerPhotoUrl = profiles[0].photoUrl;
            }
            return domain;
          })
        );
      })
    );
  }

  /** Returns all requests submitted by a given passenger. */
  getRideRequestsByPassenger(passengerId: string): Observable<RideRequest[]> {
    return this.http.get<RideRequestResponse[]>(`${this.base}/rideRequests?passengerId=${passengerId}`)
      .pipe(map(rs => rs.map(RideRequestAssembler.toEntity)));
  }

  /** Creates a new ride request (status = OPEN). */
  createRideRequest(
    passengerId: string,
    origin: string,
    destination: string,
    distanceKm: number,
    estimatedFare: number,
  ): Observable<RideRequest> {
    const payload = {
      id: `rr-${Date.now()}`,
      passengerId,
      origin,
      destination,
      distanceKm,
      status: RideStatus.OPEN,
      estimatedFare,
      selectedDriverId: null,
      isExpired: false,
    };
    return this.http.post<RideRequestResponse>(`${this.base}/rideRequests`, payload)
      .pipe(map(RideRequestAssembler.toEntity));
  }

  // ── Ride Candidates ──────────────────────────────────────────────────

  /** Returns all candidates for a given ride request. */
  getCandidatesForRequest(requestId: string): Observable<RideCandidate[]> {
    return this.http.get<RideCandidateResponse[]>(`${this.base}/rideCandidates?requestId=${requestId}`)
      .pipe(map(cs => cs.map(RideCandidateAssembler.toEntity)));
  }

  /** Returns the active PROPOSED candidate for a given driver (if any). */
  getDriverActiveCandidate(driverId: string): Observable<RideCandidate | null> {
    return this.http.get<RideCandidateResponse[]>(`${this.base}/rideCandidates?driverId=${driverId}&status=PROPOSED`)
      .pipe(map(cs => cs.length > 0 ? RideCandidateAssembler.toEntity(cs[0]) : null));
  }

  /**
   * Driver applies to a ride request.
   * Denormalized driver info is stored directly in the candidate record.
   */
  applyAsCandidate(
    requestId: string,
    driverId: string,
    driverName: string,
    vehicleType: string,
    ratingAverage: number,
    photoUrl: string,
  ): Observable<RideCandidate> {
    const payload: RideCandidateResponse = {
      id: `rc-${Date.now()}`,
      requestId,
      driverId,
      driverName,
      vehicleType,
      ratingAverage,
      photoUrl,
      status: 'PROPOSED',
      appliedAt: new Date().toISOString(),
    };
    return this.http.post<RideCandidateResponse>(`${this.base}/rideCandidates`, payload)
      .pipe(map(RideCandidateAssembler.toEntity));
  }

  /**
   * Passenger selects a candidate. Executes in order:
   * 1. PATCH rideRequest  → CONFIRMED + selectedDriverId
   * 2. PATCH selected candidate → ACCEPTED
   * 3. PATCH other candidates  → REJECTED
   * 4. POST new ride
   * 5. PATCH driverAvailability → isBusy: true, activeRideId
   */
  confirmCandidate(
    request: RideRequest,
    selectedCandidate: RideCandidate,
    allCandidates: RideCandidate[],
  ): Observable<Ride> {
    const patchRequest$ = this.http.patch<RideRequestResponse>(
      `${this.base}/rideRequests/${request.id}`,
      { status: RideStatus.CONFIRMED, selectedDriverId: selectedCandidate.driverId },
    );
    const patchSelected$ = this.http.patch<RideCandidateResponse>(
      `${this.base}/rideCandidates/${selectedCandidate.id}`,
      { status: 'ACCEPTED' },
    );
    const otherIds = allCandidates
      .filter(c => c.id !== selectedCandidate.id)
      .map(c => c.id);

    const patchRejected$ = otherIds.length > 0
      ? forkJoin(otherIds.map(id =>
          this.http.patch(`${this.base}/rideCandidates/${id}`, { status: 'REJECTED' })
        ))
      : null;

    const createRideAndMarkBusy = (): Observable<Ride> => {
      const ridePayload = {
        id: `r-${Date.now()}`,
        requestId: request.id,
        passengerId: request.passengerId,
        driverId: selectedCandidate.driverId,
        origin: request.origin,
        destination: request.destination,
        estimatedFare: request.estimatedFare,
        status: RideStatus.ACCEPTED,
      };
      return this.http.post<RideResponse>(`${this.base}/rides`, ridePayload).pipe(
        map(RideAssembler.toEntity),
        switchMap(ride =>
          this.getDriverAvailability(selectedCandidate.driverId).pipe(
            switchMap(avail => {
              if (avail.id) {
                return this.markDriverBusy(avail.id, ride.id).pipe(map(() => ride));
              }
              return of(ride);
            }),
          )
        ),
      );
    };

    if (patchRejected$) {
      return forkJoin([patchRequest$, patchSelected$, patchRejected$])
        .pipe(switchMap(createRideAndMarkBusy));
    }
    return forkJoin([patchRequest$, patchSelected$])
      .pipe(switchMap(createRideAndMarkBusy));
  }

  /** Returns the first active (non-completed, non-cancelled) ride for a driver, or null. */
  getActiveRideForDriver(driverId: string): Observable<Ride | null> {
    return this.http.get<RideResponse[]>(`${this.base}/rides?driverId=${driverId}`)
      .pipe(map(rides => {
        const active = rides.find(
          r => r.status !== RideStatus.COMPLETED && r.status !== RideStatus.CANCELLED
        );
        return active ? RideAssembler.toEntity(active) : null;
      }));
  }

  // ── Rides ────────────────────────────────────────────────────────────

  /** Returns a single ride by ID. */
  getRideById(rideId: string): Observable<Ride> {
    return this.http.get<RideResponse>(`${this.base}/rides/${rideId}`)
      .pipe(map(RideAssembler.toEntity));
  }

  /** Returns all rides for a given passenger. */
  getRidesByPassenger(passengerId: string): Observable<Ride[]> {
    return this.http.get<RideResponse[]>(`${this.base}/rides?passengerId=${passengerId}`)
      .pipe(map(rs => rs.map(RideAssembler.toEntity)));
  }

  /**
   * Updates the status of an active ride.
   * Also patches driverAvailability isBusy/activeRideId if provided.
   */
  updateRideStatus(rideId: string, status: RideStatus): Observable<Ride> {
    return this.http.patch<RideResponse>(`${this.base}/rides/${rideId}`, { status })
      .pipe(map(RideAssembler.toEntity));
  }

  // ── Driver Availability ──────────────────────────────────────────────

  /** Loads driver availability record. Returns a fallback entity if not found. */
  getDriverAvailability(driverId: string): Observable<DriverAvailability> {
    return this.http.get<DriverAvailabilityResponse[]>(`${this.base}/driverAvailability?driverId=${driverId}`)
      .pipe(map(responses => {
        if (responses.length > 0) return DriverAvailabilityAssembler.toEntity(responses[0]);
        const fallback = new DriverAvailability();
        fallback.driverId = driverId;
        return fallback;
      }));
  }

  /** Toggles the isAvailable flag. Creates the record if missing. */
  toggleDriverAvailability(driverId: string, isAvailable: boolean): Observable<DriverAvailability> {
    return this.getDriverAvailability(driverId).pipe(
      switchMap(availability => {
        if (!availability.id) {
          return this.http
            .post<DriverAvailabilityResponse>(`${this.base}/driverAvailability`, {
              id: `da-${Date.now()}`,
              driverId,
              currentLocation: '0,0',
              isAvailable,
              isBusy: false,
              activeRideId: null,
            })
            .pipe(map(DriverAvailabilityAssembler.toEntity));
        }
        return this.http
          .patch<DriverAvailabilityResponse>(
            `${this.base}/driverAvailability/${availability.id}`,
            { isAvailable },
          )
          .pipe(map(DriverAvailabilityAssembler.toEntity));
      }),
    );
  }

  /** Marks the driver as busy with a specific ride. */
  markDriverBusy(availabilityId: string, rideId: string): Observable<DriverAvailability> {
    return this.http.patch<DriverAvailabilityResponse>(
      `${this.base}/driverAvailability/${availabilityId}`,
      { isBusy: true, activeRideId: rideId },
    ).pipe(map(DriverAvailabilityAssembler.toEntity));
  }

  /** Marks the driver as free after completing or cancelling a ride. */
  markDriverFree(availabilityId: string): Observable<DriverAvailability> {
    return this.http.patch<DriverAvailabilityResponse>(
      `${this.base}/driverAvailability/${availabilityId}`,
      { isBusy: false, activeRideId: null },
    ).pipe(map(DriverAvailabilityAssembler.toEntity));
  }
}
