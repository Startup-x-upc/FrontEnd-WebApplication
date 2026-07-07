import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Driver, DriverAccessStatus } from '../domain/model/driver.entity';
import { DriverAvailability } from '../../ride-dispatch/domain/model/driver-availability.entity';
import { DriverManagementService } from '../../shared/infrastructure/api/generated/driver-management/driver-management.service';
import { DriverResponse, DriverAvailabilityResponse, DriverListResponse } from '../../shared/infrastructure/api/generated/model';

/**
 * @summary Infrastructure gateway for the Driver Management bounded context.
 * Delegates all queries and commands to the Orval-generated DriverManagementService.
 * @author Jesús Iván Castillo Vidal
 */
@Injectable({ providedIn: 'root' })
export class DriverManagementApiService {
  private driverMgmt = inject(DriverManagementService);

  // ── Driver queries ────────────────────────────────────────────────────

  /**
   * Retrieves a driver by their linked user/account ID.
   */
  getDriverByAccountId(accountId: string): Observable<Driver> {
    return this.driverMgmt.getDriverByUserId(accountId).pipe(
      map((res: DriverResponse) => this._toEntity(res, accountId))
    );
  }

  /**
   * Retrieves all registered drivers.
   */
  getAllDrivers(): Observable<Driver[]> {
    return this.driverMgmt.getAllDrivers({ perPage: 100 }).pipe(
      map((res: DriverListResponse) => {
        const items = res.data || [];
        return items.map(d => this._toEntity(d));
      })
    );
  }

  /**
   * Retrieves drivers filtered by access status.
   */
  getDriversByStatus(verificationStatus: string): Observable<Driver[]> {
    // Map legacy verificationStatus parameter to accessStatus values
    let accessStatus = verificationStatus;
    if (verificationStatus === 'APPROVED') accessStatus = 'ACTIVE';
    if (verificationStatus === 'REJECTED') accessStatus = 'RESTRICTED';

    return this.driverMgmt.getAllDrivers({ accessStatus, perPage: 100 }).pipe(
      map((res: DriverListResponse) => {
        const items = res.data || [];
        return items.map(d => this._toEntity(d));
      })
    );
  }

  // ── Driver restrictions / approvals (Legacy aliases, US-06 & US-26) ────

  approveDriver(driverId: string): Observable<Driver> {
    return this.driverMgmt.unrestrictDriver(driverId).pipe(
      map((res: DriverResponse) => this._toEntity(res))
    );
  }

  rejectDriver(driverId: string): Observable<Driver> {
    return this.driverMgmt.restrictDriver(driverId, { reason: 'Documentación rechazada por la administración' }).pipe(
      map((res: DriverResponse) => this._toEntity(res))
    );
  }

  setDriverOperationalStatus(driverId: string, status: 'ENABLED' | 'DISABLED'): Observable<Driver> {
    if (status === 'ENABLED') {
      return this.driverMgmt.unrestrictDriver(driverId).pipe(
        map((res: DriverResponse) => this._toEntity(res))
      );
    } else {
      return this.driverMgmt.restrictDriver(driverId, { reason: 'Deshabilitado por la administración' }).pipe(
        map((res: DriverResponse) => this._toEntity(res))
      );
    }
  }

  // ── Availability ──────────────────────────────────────────────────────

  /**
   * Toggles driver availability status.
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
    // Map userId/accountId correctly to support domain properties
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
