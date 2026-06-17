import { computed, inject, Injectable, signal } from '@angular/core';
import { Driver } from '../domain/model/driver.entity';
import { DriverManagementApiService } from '../infrastructure/driver-management-api.service';

/**
 * @summary Application service for the Driver Management bounded context.
 * Coordinates driver profiles, admin verification (US-06),
 * and operational status management (US-26).
 * Uses Angular signals for reactive state management.
 * @author Sprint 3 — Driver Management Bounded Context
 */
@Injectable({ providedIn: 'root' })
export class DriverManagementStore {
  /** Infrastructure gateway for Driver Management API calls. */
  private api = inject(DriverManagementApiService);

  // ── State signals ────────────────────────────────────────────────────

  /** Internal signal holding the current driver's profile. */
  private driverSignal = signal<Driver | null>(null);

  /** Internal signal holding all drivers (admin view, US-26). */
  private allDriversSignal = signal<Driver[]>([]);

  /** Internal signal holding drivers pending verification (admin view, US-06). */
  private pendingDriversSignal = signal<Driver[]>([]);

  /** Internal signal indicating an API call is in progress. */
  private loadingSignal = signal<boolean>(false);

  /** Internal signal holding the current error message. */
  private errorSignal = signal<string | null>(null);

  /** Internal signal holding a success/info message. */
  private messageSignal = signal<string | null>(null);

  // ── Public computed state ────────────────────────────────────────────

  /** The current driver profile. Null if not yet loaded. */
  readonly driver = computed(() => this.driverSignal());

  /** All registered drivers (admin panel). */
  readonly allDrivers = computed(() => this.allDriversSignal());

  /** Drivers pending document verification (admin panel). */
  readonly pendingDrivers = computed(() => this.pendingDriversSignal());

  /** Count of drivers pending verification. */
  readonly pendingVerificationCount = computed(() => this.pendingDriversSignal().length);

  /** True while an API request is in progress. */
  readonly isLoading = computed(() => this.loadingSignal());

  /** The current error message, or null. */
  readonly error = computed(() => this.errorSignal());

  /** The current success/info message, or null. */
  readonly message = computed(() => this.messageSignal());

  // ── Driver profile (existing) ────────────────────────────────────────

  /**
   * Loads a driver profile by their linked account ID.
   *
   * @param accountId - The account ID linked to the driver.
   */
  loadDriverByAccountId(accountId: string): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.getDriverByAccountId(accountId).subscribe({
      next: (d) => {
        this.driverSignal.set(d);
        this.loadingSignal.set(false);
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('No se pudo cargar el conductor.');
      },
    });
  }

  // ── Admin: All drivers (US-26) ───────────────────────────────────────

  /**
   * Loads all registered drivers for the admin management panel.
   */
  loadAllDrivers(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.getAllDrivers().subscribe({
      next: (drivers) => {
        this.allDriversSignal.set(drivers);
        this.loadingSignal.set(false);
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('No se pudieron cargar los conductores.');
      },
    });
  }

  // ── Admin: Pending verifications (US-06) ─────────────────────────────

  /**
   * Loads drivers with PENDING_VERIFICATION status for the admin verification tab.
   */
  loadPendingDrivers(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.getDriversByStatus('PENDING_VERIFICATION').subscribe({
      next: (drivers) => {
        this.pendingDriversSignal.set(drivers);
        this.loadingSignal.set(false);
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('No se pudieron cargar las verificaciones pendientes.');
      },
    });
  }

  /**
   * Approves a driver's documents (US-06).
   * Removes from pending list and updates the all-drivers list.
   *
   * @param driverId - The driver ID to approve.
   */
  approveDriver(driverId: string): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.approveDriver(driverId).subscribe({
      next: () => {
        this.pendingDriversSignal.update((list) =>
          list.filter((d) => d.id !== driverId)
        );
        this.allDriversSignal.update((list) =>
          list.map((d) =>
            d.id === driverId
              ? Object.assign(new Driver(), d, { accessStatus: 'ACTIVE' as const })
              : d
          )
        );
        this.loadingSignal.set(false);
        this.messageSignal.set('Conductor aprobado correctamente.');
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('No se pudo aprobar al conductor.');
      },
    });
  }

  /**
   * Rejects a driver's documents (US-06).
   * Removes from pending list and marks as restricted in all-drivers.
   *
   * @param driverId - The driver ID to reject.
   */
  rejectDriver(driverId: string): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.rejectDriver(driverId).subscribe({
      next: () => {
        this.pendingDriversSignal.update((list) =>
          list.filter((d) => d.id !== driverId)
        );
        this.allDriversSignal.update((list) =>
          list.map((d) =>
            d.id === driverId
              ? Object.assign(new Driver(), d, { accessStatus: 'RESTRICTED' as const })
              : d
          )
        );
        this.loadingSignal.set(false);
        this.messageSignal.set('Conductor rechazado.');
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('No se pudo rechazar al conductor.');
      },
    });
  }

  // ── Admin: Operational status (US-26) ────────────────────────────────

  /**
   * Toggles a driver's operational status between enabled and disabled.
   *
   * @param driverId - The driver ID to update.
   * @param enabled - True to enable the driver, false to disable.
   */
  toggleDriverOperationalStatus(driverId: string, enabled: boolean): void {
    const status = enabled ? 'ENABLED' : 'DISABLED';
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.setDriverOperationalStatus(driverId, status).subscribe({
      next: () => {
        this.allDriversSignal.update((list) =>
          list.map((d) =>
            d.id === driverId
              ? Object.assign(new Driver(), d, { isAvailable: enabled })
              : d
          )
        );
        this.loadingSignal.set(false);
        this.messageSignal.set(
          enabled ? 'Conductor habilitado.' : 'Conductor deshabilitado.'
        );
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('No se pudo actualizar el estado del conductor.');
      },
    });
  }

  // ── Clear ────────────────────────────────────────────────────────────

  /** Clears the current error signal. */
  clearError(): void {
    this.errorSignal.set(null);
  }

  /** Clears the current info message. */
  clearMessage(): void {
    this.messageSignal.set(null);
  }
}
