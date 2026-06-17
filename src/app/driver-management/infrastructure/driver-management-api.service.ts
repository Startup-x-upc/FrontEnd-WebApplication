import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

import { Driver } from '../domain/model/driver.entity';
import { DriverResponse } from './driver-response';
import { DriverAssembler } from './driver-assembler';

/**
 * @summary Infrastructure gateway to the Driver Management endpoints on json-server.
 * Handles all HTTP communication for driver profiles, document verification,
 * and operational status management.
 * @author Sprint 3 — Driver Management Bounded Context
 */
@Injectable({ providedIn: 'root' })
export class DriverManagementApiService {
  /** HttpClient injected via inject() (Angular 21 style). */
  private http = inject(HttpClient);

  /** Base URL for the fake API, resolved from environment configuration. */
  private baseUrl = environment.apiBaseUrl;

  // ── Driver queries ────────────────────────────────────────────────────

  /**
   * Retrieves a driver by their linked account ID.
   *
   * @param accountId - The account ID linked to the driver profile.
   * @returns Observable<Driver> or a fallback if not found.
   */
  getDriverByAccountId(accountId: string): Observable<Driver> {
    return this.http
      .get<DriverResponse[]>(`${this.baseUrl}/drivers?accountId=${accountId}`)
      .pipe(
        map((responses: DriverResponse[]) => {
          if (responses.length > 0) return DriverAssembler.toEntity(responses[0]);
          const fallback = new Driver();
          fallback.accountId = accountId;
          fallback.isAvailable = false;
          return fallback;
        })
      );
  }

  /**
   * Retrieves all registered drivers.
   * Used by the admin panel (US-26).
   *
   * @returns Observable<Driver[]> with all drivers.
   */
  getAllDrivers(): Observable<Driver[]> {
    return this.http
      .get<DriverResponse[]>(`${this.baseUrl}/drivers`)
      .pipe(
        map((responses: DriverResponse[]) =>
          responses.map(DriverAssembler.toEntity)
        )
      );
  }

  /**
   * Retrieves drivers filtered by verification status.
   * Used by the admin verification panel (US-06).
   *
   * @param verificationStatus - e.g. 'PENDING_VERIFICATION', 'APPROVED', 'REJECTED'.
   * @returns Observable<Driver[]> with matching drivers.
   */
  getDriversByStatus(verificationStatus: string): Observable<Driver[]> {
    return this.http
      .get<DriverResponse[]>(
        `${this.baseUrl}/drivers?verificationStatus=${verificationStatus}`
      )
      .pipe(
        map((responses: DriverResponse[]) =>
          responses.map(DriverAssembler.toEntity)
        )
      );
  }

  // ── Driver verification (US-06) ───────────────────────────────────────

  /**
   * Approves a driver's documents. Updates verificationStatus to 'APPROVED'.
   *
   * @param driverId - The driver ID to approve.
   * @returns Observable<Driver> with the updated driver entity.
   */
  approveDriver(driverId: string): Observable<Driver> {
    return this.http
      .patch<DriverResponse>(`${this.baseUrl}/drivers/${driverId}`, {
        verificationStatus: 'APPROVED',
      })
      .pipe(map(DriverAssembler.toEntity));
  }

  /**
   * Rejects a driver's documents. Updates verificationStatus to 'REJECTED'.
   *
   * @param driverId - The driver ID to reject.
   * @returns Observable<Driver> with the updated driver entity.
   */
  rejectDriver(driverId: string): Observable<Driver> {
    return this.http
      .patch<DriverResponse>(`${this.baseUrl}/drivers/${driverId}`, {
        verificationStatus: 'REJECTED',
      })
      .pipe(map(DriverAssembler.toEntity));
  }

  // ── Operational status (US-26) ────────────────────────────────────────

  /**
   * Enables or disables a driver's operational status.
   *
   * @param driverId - The driver ID to update.
   * @param status - 'ENABLED' or 'DISABLED'.
   * @returns Observable<Driver> with the updated driver entity.
   */
  setDriverOperationalStatus(
    driverId: string,
    status: 'ENABLED' | 'DISABLED'
  ): Observable<Driver> {
    return this.http
      .patch<DriverResponse>(`${this.baseUrl}/drivers/${driverId}`, {
        operationalStatus: status,
      })
      .pipe(map(DriverAssembler.toEntity));
  }
}
