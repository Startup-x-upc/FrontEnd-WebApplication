import { Component, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { IamStore } from '../../../../iam/application/iam.store';
import { DriverManagementStore } from '../../../../driver-management/application/driver-management.store';
import { RideDispatchStore } from '../../../application/ride-dispatch.store';
import { MonetizationStore } from '../../../../monetization/application/monetization.store';

import { WalletBalanceCardComponent } from '../../../../monetization/presentation/components/wallet-balance-card/wallet-balance-card';
import { PendingRequestCardComponent } from '../pending-request-card/pending-request-card';
import { RideRequest } from '../../../domain/model/ride-request.entity';

/**
 * @summary Possible UI states for the driver dashboard.
 * LOADING               — Initial data load in progress.
 * INSUFFICIENT_BALANCE  — Wallet loaded but balance is zero or negative.
 * DRIVER_OFFLINE        — Balance ok but availability is inactive.
 * NO_PENDING_REQUESTS   — Driver active; no open requests.
 * PENDING_REQUESTS_LOADED — Driver active; list has items.
 * ERROR                 — A recoverable error from any store.
 */
export type DriverUiState =
  | 'LOADING'
  | 'INSUFFICIENT_BALANCE'
  | 'DRIVER_OFFLINE'
  | 'NO_PENDING_REQUESTS'
  | 'PENDING_REQUESTS_LOADED'
  | 'ERROR';

/**
 * @summary Main screen for the DRIVER role. Orchestrates:
 * - Driver status summary (wallet + availability toggle)
 * - Manual refresh of pending ride requests
 * - Accept action on each request
 * @author Jesús Iván Castillo Vidal
 */
@Component({
  selector: 'app-driver-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    WalletBalanceCardComponent,
    PendingRequestCardComponent,
  ],
  templateUrl: './driver-dashboard-page.html',
  styles: [`
    /* ── Page layout ──────────────────────────────────────────── */
    .dashboard {
      display: grid;
      grid-template-columns: 320px 1fr;
      gap: 20px;
      height: 100%;
    }

    /* Page header */
    .page-header {
      margin-bottom: 2px;
    }
    .page-header h1 {
      font-size: 26px;
      font-weight: 700;
      color: #111827;
      margin: 0;
      letter-spacing: -0.3px;
    }
    .page-header p {
      color: #6b7280;
      margin: 4px 0 0;
      font-size: 13px;
    }

    /* ── Left column ──────────────────────────────────────────── */
    .left-column {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    /* Availability card */
    .availability-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      border: 1px solid #e5e7eb;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .avail-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 0;
    }
    .avail-icon {
      font-size: 18px;
      height: 18px;
      width: 18px;
      color: #d97706;
    }
    .avail-label {
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .avail-status {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .status-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
    }
    .status-badge mat-icon {
      font-size: 16px;
      height: 16px;
      width: 16px;
    }
    .badge--available {
      background: #d1fae5;
      color: #065f46;
    }
    .badge--offline {
      background: #f3f4f6;
      color: #6b7280;
    }
    .avail-toggle-btn {
      width: 100%;
      height: 44px;
      font-size: 14px;
      font-weight: 600;
      border-radius: 10px;
    }
    .avail-blocked {
      font-size: 12px;
      color: #92400e;
      background: #fef3c7;
      border-radius: 8px;
      padding: 8px 12px;
      line-height: 1.5;
    }

    /* ── Right column ─────────────────────────────────────────── */
    .right-column {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .requests-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .requests-title {
      font-size: 16px;
      font-weight: 700;
      color: #1f2937;
    }
    .requests-count {
      font-size: 12px;
      color: #6b7280;
    }

    /* Request list */
    .request-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    /* ── State blocks ─────────────────────────────────────────── */
    .loading-state {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 24px;
      background: white;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 13px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      padding: 40px 24px;
      background: white;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
      text-align: center;
    }
    .empty-state mat-icon {
      font-size: 40px;
      height: 40px;
      width: 40px;
      color: #d1d5db;
    }
    .empty-state h3 {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      color: #1f2937;
    }
    .empty-state p {
      margin: 0;
      font-size: 13px;
      color: #9ca3af;
      line-height: 1.5;
    }

    .offline-state {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      padding: 24px;
      background: #f9fafb;
      border-radius: 12px;
      border: 1px dashed #d1d5db;
    }
    .offline-state mat-icon {
      font-size: 28px;
      height: 28px;
      width: 28px;
      color: #9ca3af;
      flex-shrink: 0;
    }
    .offline-state h3 {
      margin: 0 0 4px;
      font-size: 15px;
      font-weight: 600;
      color: #374151;
    }
    .offline-state p {
      margin: 0;
      font-size: 13px;
      color: #9ca3af;
      line-height: 1.5;
    }

    .error-card {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 18px;
      border-radius: 12px;
      background: #fff7f7;
      border: 1px solid #fecaca;
    }
    .error-card mat-icon {
      color: #dc2626;
      flex-shrink: 0;
      font-size: 20px;
      height: 20px;
      width: 20px;
      margin-top: 1px;
    }
    .error-info h4 {
      margin: 0 0 4px;
      font-size: 14px;
      font-weight: 600;
      color: #b91c1c;
    }
    .error-info p {
      margin: 0;
      font-size: 13px;
      color: #6b7280;
      line-height: 1.4;
    }
    .error-info button {
      margin-top: 10px;
      font-size: 12px;
    }
  `],
})
export class DriverDashboardPageComponent {
  protected iamStore = inject(IamStore);
  protected driverMgmtStore = inject(DriverManagementStore);
  protected rideStore = inject(RideDispatchStore);
  protected monetizationStore = inject(MonetizationStore);

  constructor() {
    const account = this.iamStore.currentAccount();
    if (account) {
      this.driverMgmtStore.loadDriverByAccountId(account.id);
    }
    this.rideStore.loadOpenRequests();

    // Load wallet and availability once driver ID is available
    effect(() => {
      const driver = this.driverMgmtStore.driver();
      if (driver?.id) {
        this.monetizationStore.loadWallet(driver.id);
        this.rideStore.loadDriverAvailability(driver.id);
      }
    });
  }

  readonly uiState = computed<DriverUiState>(() => {
    if (this.driverMgmtStore.isLoading() || this.rideStore.isLoading()) return 'LOADING';
    if (this.driverMgmtStore.error() || this.rideStore.error() || this.monetizationStore.error()) return 'ERROR';

    const wallet = this.monetizationStore.wallet();
    if (wallet === null) return 'LOADING';

    if (!this.monetizationStore.hasPositiveBalance()) return 'INSUFFICIENT_BALANCE';

    const availability = this.rideStore.driverAvailability();
    if (!availability?.isAvailable) return 'DRIVER_OFFLINE';

    if (this.rideStore.openRequests().length === 0) return 'NO_PENDING_REQUESTS';

    return 'PENDING_REQUESTS_LOADED';
  });

  onToggleAvailability(): void {
    const driver = this.driverMgmtStore.driver();
    if (!driver?.id) return;
    this.rideStore.toggleAvailability(driver.id, this.monetizationStore.hasPositiveBalance());
  }

  onRefreshRequests(): void {
    this.rideStore.loadOpenRequests();
  }

  onAcceptRequest(request: RideRequest): void {
    const driver = this.driverMgmtStore.driver();
    if (!driver?.id) return;
    this.rideStore.acceptRideRequest(request, driver.id);
  }

  onRetry(): void {
    this.rideStore.clearError();
    this.monetizationStore.clearError();
    this.driverMgmtStore.clearError();
    const account = this.iamStore.currentAccount();
    if (account) {
      this.driverMgmtStore.loadDriverByAccountId(account.id);
    }
    this.rideStore.loadOpenRequests();
  }
}
