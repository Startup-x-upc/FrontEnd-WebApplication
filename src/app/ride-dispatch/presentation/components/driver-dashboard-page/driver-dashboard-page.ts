import { Component, computed, effect, inject, signal } from '@angular/core';
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
import { RideStatus } from '../../../domain/model/ride.status';
import { buildGoogleMapsDirectionsUrl } from '../../../../shared/utils/maps.utils';

/**
 * @summary Possible UI states for the driver dashboard.
 *
 * LOADING                  — Initial data load in progress.
 * INSUFFICIENT_BALANCE     — Wallet loaded but balance is zero or negative.
 * DRIVER_OFFLINE           — Balance ok but availability is inactive.
 * NO_PENDING_REQUESTS      — Driver active, no open requests found.
 * PENDING_REQUESTS_LOADED  — Driver active, request list has items.
 * CANDIDATE_SUBMITTED      — Driver applied to a request; awaiting passenger decision.
 * RIDE_ASSIGNED            — Driver was selected; ride is active (ACCEPTED).
 * DRIVER_ON_THE_WAY        — Driver marked "on the way" to pickup.
 * DRIVER_ARRIVED           — Driver marked "arrived" at pickup.
 * RIDE_STARTED             — Ride is in progress.
 * RIDE_COMPLETED           — Ride finished.
 * ERROR                    — A recoverable error from any store.
 */
export type DriverUiState =
  | 'LOADING'
  | 'INSUFFICIENT_BALANCE'
  | 'DRIVER_OFFLINE'
  | 'NO_PENDING_REQUESTS'
  | 'PENDING_REQUESTS_LOADED'
  | 'CANDIDATE_SUBMITTED'
  | 'RIDE_ASSIGNED'
  | 'DRIVER_ON_THE_WAY'
  | 'DRIVER_ARRIVED'
  | 'RIDE_STARTED'
  | 'RIDE_COMPLETED'
  | 'ERROR';

/**
 * @summary Main screen for the DRIVER role.
 * Implements the inDrive-style flow: browse open requests → apply →
 * wait for passenger decision → active ride progression with external Google Maps links.
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

    .page-header { margin-bottom: 2px; }
    .page-header h1 { font-size: 26px; font-weight: 700; color: #111827; margin: 0; letter-spacing: -0.3px; }
    .page-header p  { color: #6b7280; margin: 4px 0 0; font-size: 13px; }

    /* ── Left column ──────────────────────────────────────────── */
    .left-column { display: flex; flex-direction: column; gap: 14px; }

    .availability-card {
      background: white; border-radius: 12px; padding: 20px;
      border: 1px solid #e5e7eb; box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      display: flex; flex-direction: column; gap: 14px;
    }
    .avail-header     { display: flex; align-items: center; gap: 8px; }
    .avail-icon       { font-size: 18px; height: 18px; width: 18px; color: #d97706; }
    .avail-label      { font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.06em; }
    .status-badge     { display: flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; width: fit-content; }
    .status-badge mat-icon { font-size: 16px; height: 16px; width: 16px; }
    .badge--available { background: #d1fae5; color: #065f46; }
    .badge--offline   { background: #f3f4f6; color: #6b7280; }
    .avail-toggle-btn { width: 100%; height: 44px; font-size: 14px; font-weight: 600; border-radius: 10px; }
    .avail-blocked    { font-size: 12px; color: #92400e; background: #fef3c7; border-radius: 8px; padding: 8px 12px; line-height: 1.5; }

    /* ── Right column ─────────────────────────────────────────── */
    .right-column   { display: flex; flex-direction: column; gap: 14px; }
    .requests-header { display: flex; align-items: center; justify-content: space-between; }
    .requests-title { font-size: 16px; font-weight: 700; color: #1f2937; }
    .request-list   { display: flex; flex-direction: column; gap: 10px; }

    /* ── Detail view ──────────────────────────────────────────── */
    .detail-view   { display: flex; flex-direction: column; gap: 0; }
    .detail-back   { align-self: flex-start; margin-bottom: 12px; font-size: 13px; }
    .detail-back mat-icon { font-size: 16px; height: 16px; width: 16px; }

    .detail-card {
      background: white; border-radius: 14px; border: 1px solid #e5e7eb;
      box-shadow: 0 2px 12px rgba(0,0,0,0.07); overflow: hidden;
    }
    .detail-banner {
      background: #fef3c7; padding: 12px 20px; display: flex;
      align-items: center; gap: 10px; border-bottom: 1px solid #fde68a;
    }
    .detail-banner mat-icon { color: #d97706; font-size: 20px; height: 20px; width: 20px; }
    .detail-banner span     { font-size: 13px; font-weight: 600; color: #92400e; }
    .detail-body            { padding: 22px; }
    .detail-section-label   { font-size: 11px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 12px; }
    .detail-route           { display: flex; flex-direction: column; gap: 0; margin-bottom: 20px; }
    .detail-route-row       { display: flex; align-items: flex-start; gap: 14px; }
    .detail-dot             { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; margin-top: 3px; }
    .detail-dot--origin     { background: #1a73e8; }
    .detail-dot--dest       { background: #d97706; }
    .detail-route-line      { width: 2px; height: 20px; background: #e5e7eb; margin-left: 5px; }
    .detail-route-info      { display: flex; flex-direction: column; }
    .detail-route-label     { font-size: 10px; color: #9ca3af; text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em; }
    .detail-route-value     { font-size: 14px; color: #1f2937; font-weight: 600; line-height: 1.4; }
    .detail-chips           { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 24px; }
    .detail-chip            { display: flex; align-items: center; gap: 6px; background: #f3f4f6; padding: 8px 14px; border-radius: 20px; }
    .detail-chip mat-icon   { font-size: 16px; height: 16px; width: 16px; color: #6b7280; }
    .chip-value             { font-size: 14px; font-weight: 700; color: #1f2937; }
    .chip-label             { font-size: 11px; color: #9ca3af; font-weight: 500; }
    .detail-actions         { display: flex; gap: 10px; }
    .apply-btn              { flex: 1; height: 48px; font-size: 15px; font-weight: 700; border-radius: 10px; }
    .apply-btn mat-icon     { margin-right: 6px; font-size: 20px; height: 20px; width: 20px; }
    .skip-btn               { height: 48px; font-size: 14px; font-weight: 600; border-radius: 10px; padding: 0 20px; }

    /* ── Shared state blocks ──────────────────────────────────── */
    .loading-state { display: flex; align-items: center; gap: 14px; padding: 24px; background: white; border-radius: 12px; border: 1px solid #e5e7eb; color: #6b7280; font-size: 13px; }
    .empty-state   { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 40px 24px; background: white; border-radius: 12px; border: 1px solid #e5e7eb; text-align: center; }
    .empty-state mat-icon { font-size: 40px; height: 40px; width: 40px; color: #d1d5db; }
    .empty-state h3 { margin: 0; font-size: 15px; font-weight: 600; color: #1f2937; }
    .empty-state p  { margin: 0; font-size: 13px; color: #9ca3af; line-height: 1.5; }
    .offline-state { display: flex; align-items: flex-start; gap: 14px; padding: 24px; background: #f9fafb; border-radius: 12px; border: 1px dashed #d1d5db; }
    .offline-state mat-icon { font-size: 28px; height: 28px; width: 28px; color: #9ca3af; flex-shrink: 0; }
    .offline-state h3 { margin: 0 0 4px; font-size: 15px; font-weight: 600; color: #374151; }
    .offline-state p  { margin: 0; font-size: 13px; color: #9ca3af; line-height: 1.5; }
    .error-card { display: flex; align-items: flex-start; gap: 12px; padding: 18px; border-radius: 12px; background: #fff7f7; border: 1px solid #fecaca; }
    .error-card mat-icon { color: #dc2626; flex-shrink: 0; font-size: 20px; height: 20px; width: 20px; margin-top: 1px; }
    .error-info h4 { margin: 0 0 4px; font-size: 14px; font-weight: 600; color: #b91c1c; }
    .error-info p  { margin: 0; font-size: 13px; color: #6b7280; line-height: 1.4; }
    .error-info button { margin-top: 10px; font-size: 12px; }

    /* ── Candidate pending / Active ride ──────────────────────── */
    .candidate-waiting-card {
      background: white; border-radius: 14px; border: 1px solid #e5e7eb;
      box-shadow: 0 2px 12px rgba(0,0,0,0.07); overflow: hidden;
    }
    .waiting-banner {
      background: #eff6ff; padding: 12px 20px; display: flex;
      align-items: center; gap: 10px; border-bottom: 1px solid #bfdbfe;
    }
    .waiting-banner mat-icon { color: #1a73e8; font-size: 20px; height: 20px; width: 20px; }
    .waiting-banner span     { font-size: 13px; font-weight: 600; color: #1e40af; }

    .active-ride-card {
      background: white; border-radius: 14px; border: 1px solid #e5e7eb;
      box-shadow: 0 2px 12px rgba(0,0,0,0.07); overflow: hidden;
    }
    .ride-banner { padding: 12px 20px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid; }
    .ride-banner mat-icon { font-size: 20px; height: 20px; width: 20px; }
    .ride-banner-text        { display: flex; flex-direction: column; }
    .ride-banner-title       { font-size: 13px; font-weight: 700; }
    .ride-banner-sub         { font-size: 11px; font-weight: 500; margin-top: 1px; }
    .ride-banner--assigned   { background: #fef3c7; border-color: #fde68a; }
    .ride-banner--assigned mat-icon,
    .ride-banner--assigned .ride-banner-title { color: #92400e; }
    .ride-banner--assigned .ride-banner-sub   { color: #b45309; }
    .ride-banner--started    { background: #d1fae5; border-color: #6ee7b7; }
    .ride-banner--started mat-icon,
    .ride-banner--started .ride-banner-title { color: #065f46; }
    .ride-banner--started .ride-banner-sub   { color: #059669; }
    .ride-body { padding: 22px; }
    .maps-actions { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
    .maps-btn { width: 100%; height: 44px; font-size: 14px; font-weight: 600; border-radius: 10px; }
    .maps-btn mat-icon { margin-right: 6px; font-size: 18px; height: 18px; width: 18px; }
    .ride-action-btn { width: 100%; height: 52px; font-size: 15px; font-weight: 700; border-radius: 10px; margin-top: 8px; }
    .ride-action-btn mat-icon { margin-right: 6px; font-size: 20px; height: 20px; width: 20px; }
    .completed-banner { background: #d1fae5; border-color: #6ee7b7; }
    .completed-banner mat-icon,
    .completed-banner .ride-banner-title { color: #065f46; }
    .completed-banner .ride-banner-sub   { color: #059669; }
  `],
})
export class DriverDashboardPageComponent {
  protected iamStore         = inject(IamStore);
  protected driverMgmtStore  = inject(DriverManagementStore);
  protected rideStore        = inject(RideDispatchStore);
  protected monetizationStore = inject(MonetizationStore);

  readonly selectedRequest = signal<RideRequest | null>(null);

  constructor() {
    const account = this.iamStore.currentAccount();
    if (account) {
      this.driverMgmtStore.loadDriverByAccountId(account.id);
    }
    this.rideStore.loadOpenRequests();

    effect(() => {
      const driver = this.driverMgmtStore.driver();
      if (driver?.id) {
        this.monetizationStore.loadWallet(driver.id);
        this.rideStore.loadDriverAvailability(driver.id);
      }
    });
  }

  readonly uiState = computed<DriverUiState>(() => {
    if (this.driverMgmtStore.isLoading()) return 'LOADING';
    if (this.driverMgmtStore.error() || this.rideStore.error() || this.monetizationStore.error()) return 'ERROR';

    const wallet = this.monetizationStore.wallet();
    if (wallet === null) return 'LOADING';

    // Active ride takes highest priority
    const ride = this.rideStore.currentRide();
    if (ride) {
      if (ride.status === RideStatus.COMPLETED)         return 'RIDE_COMPLETED';
      if (ride.status === RideStatus.STARTED)           return 'RIDE_STARTED';
      if (ride.status === RideStatus.DRIVER_ARRIVED)    return 'DRIVER_ARRIVED';
      if (ride.status === RideStatus.DRIVER_ON_THE_WAY) return 'DRIVER_ON_THE_WAY';
      if (ride.status === RideStatus.ACCEPTED)          return 'RIDE_ASSIGNED';
    }

    // Candidate submitted — waiting for passenger
    const candidate = this.rideStore.activeCandidate();
    if (candidate?.status === 'PROPOSED')               return 'CANDIDATE_SUBMITTED';

    // Driver prerequisites
    if (!this.monetizationStore.hasPositiveBalance())   return 'INSUFFICIENT_BALANCE';
    const availability = this.rideStore.driverAvailability();
    if (!availability?.isAvailable)                     return 'DRIVER_OFFLINE';
    if (availability.isBusy)                            return 'RIDE_ASSIGNED';

    if (this.rideStore.openRequests().length === 0)     return 'NO_PENDING_REQUESTS';
    return 'PENDING_REQUESTS_LOADED';
  });

  /** Whether the driver is in any active ride state. */
  readonly isInActiveRide = computed(() => {
    const s = this.uiState();
    return s === 'RIDE_ASSIGNED' || s === 'DRIVER_ON_THE_WAY' ||
           s === 'DRIVER_ARRIVED' || s === 'RIDE_STARTED' || s === 'RIDE_COMPLETED';
  });

  // ── Google Maps helpers ─────────────────────────────────────────────

  openMapsToOrigin(): void {
    const origin = this.rideStore.currentRide()?.origin;
    if (origin) window.open(buildGoogleMapsDirectionsUrl(origin), '_blank');
  }

  openMapsToDestination(): void {
    const dest = this.rideStore.currentRide()?.destination;
    if (dest) window.open(buildGoogleMapsDirectionsUrl(dest), '_blank');
  }

  // ── Driver actions ──────────────────────────────────────────────────

  onToggleAvailability(): void {
    const driver = this.driverMgmtStore.driver();
    if (!driver?.id) return;
    this.rideStore.toggleAvailability(driver.id, this.monetizationStore.hasPositiveBalance());
  }

  onRefreshRequests(): void {
    this.rideStore.loadOpenRequests();
  }

  onRefreshCandidacy(): void {
    const driver = this.driverMgmtStore.driver();
    if (!driver?.id) return;
    this.rideStore.loadDriverActiveCandidate(driver.id);
  }

  onViewDetails(request: RideRequest): void {
    this.selectedRequest.set(request);
  }

  onBackToList(): void {
    this.selectedRequest.set(null);
  }

  /** Driver applies to a specific open request. */
  onApplyToRequest(request: RideRequest): void {
    const driver = this.driverMgmtStore.driver();
    if (!driver?.id) return;
    this.rideStore.applyAsCandidate(request.id, driver.id, {
      name: driver.fullName,
      vehicleType: driver.vehicleType,
      rating: driver.ratingAverage,
      photoUrl: driver.photoUrl ?? '',
    });
    this.selectedRequest.set(null);
  }

  onSkipRequest(request: RideRequest): void {
    this.rideStore.skipRequest(request.id);
    this.selectedRequest.set(null);
  }

  // ── Ride progression ────────────────────────────────────────────────

  onMarkOnTheWay(): void {
    this.rideStore.advanceRideStatus(RideStatus.DRIVER_ON_THE_WAY);
  }

  onMarkArrived(): void {
    this.rideStore.advanceRideStatus(RideStatus.DRIVER_ARRIVED);
  }

  onStartRide(): void {
    this.rideStore.advanceRideStatus(RideStatus.STARTED);
  }

  onCompleteRide(): void {
    this.rideStore.advanceRideStatus(RideStatus.COMPLETED);
  }

  onRetry(): void {
    this.rideStore.clearError();
    this.monetizationStore.clearError();
    this.driverMgmtStore.clearError();
    const account = this.iamStore.currentAccount();
    if (account) this.driverMgmtStore.loadDriverByAccountId(account.id);
    this.rideStore.loadOpenRequests();
  }
}
