import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

import { Driver, DriverAccessStatus } from '../domain/model/driver.entity';
import { DriverAvailability } from '../../ride-dispatch/domain/model/driver-availability.entity';
import { DriverManagementService } from '../../shared/infrastructure/api/generated/driver-management/driver-management.service';
import { DriverResponse, DriverAvailabilityResponse } from '../../shared/infrastructure/api/generated/model';

// ponytail: DriverAssembler kept for admin-panel methods that still use json-server DTOs
import { DriverAssembler } from './driver-assembler';

// Local DTO still used by admin-panel methods not yet migrated
import { DriverResponse as LocalDriverResponse } from './driver-response';

/**
 * @summary Infrastructure gateway for the Driver Management bounded context.
 * Core driver queries delegate to the Orval-generated DriverManagementService (real backend).
 * Admin-panel methods (approve/reject/setOperationalStatus) still use json-server pending their migration.
 * @author Sprint 3 — Driver Management Bounded Context
 */
@Injectable({ providedIn: 'root' })
export class DriverManagementApiService {
  private http = inject(HttpClient);
  private driverMgmt = inject(DriverManagementService);

  /** Base URL for the json-server (still used by admin-panel methods). */
  private baseUrl = environment.apiBaseUrl;

  // ── Driver queries ────────────────────────────────────────────────────

  /**
   * Retrieves a driver by their linked user/account ID.
   * Delegates to GET /api/v1/users/{userId}/driver on the real backend.
   */
  getDriverByAccountId(accountId: string): Observable<Driver> {
    return this.driverMgmt.getDriverByUserId(accountId).pipe(
      map((res: DriverResponse) => this._toEntity(res, accountId))
    );
  }

  /**
   * Retrieves all registered drivers.
   * ponytail: still uses json-server — admin panel not yet migrated
   */
  getAllDrivers(): Observable<Driver[]> {
    return this.http
      .get<LocalDriverResponse[]>(`${this.baseUrl}/drivers`)
      .pipe(map(responses => responses.map(DriverAssembler.toEntity)));
  }

  /**
   * Retrieves drivers filtered by verification status.
   * ponytail: still uses json-server — admin panel not yet migrated
   */
  getDriversByStatus(verificationStatus: string): Observable<Driver[]> {
    return this.http
      .get<LocalDriverResponse[]>(`${this.baseUrl}/drivers?verificationStatus=${verificationStatus}`)
      .pipe(map(responses => responses.map(DriverAssembler.toEntity)));
  }

  // ── Driver verification (US-06) — still json-server ───────────────────

  approveDriver(driverId: string): Observable<Driver> {
    return this.http
      .patch<LocalDriverResponse>(`${this.baseUrl}/drivers/${driverId}`, { verificationStatus: 'APPROVED' })
      .pipe(map(DriverAssembler.toEntity));
  }

  rejectDriver(driverId: string): Observable<Driver> {
    return this.http
      .patch<LocalDriverResponse>(`${this.baseUrl}/drivers/${driverId}`, { verificationStatus: 'REJECTED' })
      .pipe(map(DriverAssembler.toEntity));
  }

  setDriverOperationalStatus(driverId: string, status: 'ENABLED' | 'DISABLED'): Observable<Driver> {
    return this.http
      .patch<LocalDriverResponse>(`${this.baseUrl}/drivers/${driverId}`, { operationalStatus: status })
      .pipe(map(DriverAssembler.toEntity));
  }

  // ── Availability (real backend) ───────────────────────────────────────

  /**
   * Toggles driver availability. Lives here (driver-management context) because
   * toggle-availability is a Driver Management endpoint — keeping bounded contexts clean.
   * The RideDispatch store calls this via DriverManagementStore, not directly.
   */
  toggleAvailability(driverId: string): Observable<DriverAvailability> {
    return this.driverMgmt.toggleAvailability(driverId).pipe(
      map((res: DriverAvailabilityResponse) => {
        const domain = new DriverAvailability();
        domain.id = res.id || '';
        domain.driverId = res.driverId || driverId;
        domain.isAvailable = res.isAvailable || false;
        domain.isBusy = res.isBusy || false;
        return domain;
      })
    );
  }

  // ── Private helpers ──────────────────────────────────────────────────

  private _toEntity(res: DriverResponse, fallbackAccountId?: string): Driver {
    const entity = new Driver();
    entity.id = res.id || '';
    // ponytail: backend returns userId not accountId — map it here
    entity.accountId = (res as any).userId || fallbackAccountId || '';
    entity.fullName = res.fullName || '';
    entity.vehicleType = res.vehicleType || '';
    entity.ratingAverage = res.ratingAverage ?? 0;
    entity.ratingCount = res.ratingCount ?? 0;
    entity.photoUrl = res.photoUrl ?? '';
    entity.isAvailable = (res as any).isAvailable || false;
    entity.accessStatus = ((res as any).accessStatus || 'PENDING_VERIFICATION') as DriverAccessStatus;
    entity.licenseNumber = res.licenseNumber ?? '';
    entity.soatNumber = res.soatNumber ?? '';
    return entity;
  }
}
