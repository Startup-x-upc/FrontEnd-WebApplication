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
import { TripMapComponent } from '../trip-map/trip-map';
import { RideRequest } from '../../../domain/model/ride-request.entity';
import { RideStatus } from '../../../domain/model/ride.status';
import { buildGoogleMapsDirectionsUrl } from '../../../../shared/utils/maps.utils';

function isRawCoord(v: string): boolean {
  const p = v.split(',');
  return p.length === 2 && !isNaN(parseFloat(p[0])) && !isNaN(parseFloat(p[1]));
}

export function humanizeCoord(v: string | undefined, type: 'origin' | 'destination'): string {
  if (!v) return '—';
  if (isRawCoord(v)) return type === 'origin' ? 'Origen detectado' : 'Destino seleccionado';
  return v;
}

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
 * wait for passenger decision → active ride progression with integrated Leaflet previews & external Google Maps links.
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
    TripMapComponent,
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
    .detail-top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .detail-back   { font-size: 13px; font-weight: 600; }
    .detail-back mat-icon { font-size: 16px; height: 16px; width: 16px; margin-right: 4px; }

    .detail-card {
      background: white; border-radius: 16px; border: 1px solid #e5e7eb;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden;
    }
    
    /* Humanized Contextual Header */
    .detail-header {
      display: flex; align-items: center; gap: 14px; padding: 18px 22px;
      border-bottom: 1px solid #e5e7eb; background: #fafafa;
    }
    .detail-avatar {
      width: 52px; height: 52px; border-radius: 50%; object-fit: cover;
      border: 2px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.12);
    }
    .detail-avatar-fallback {
      width: 52px; height: 52px; border-radius: 50%; background: #e5e7eb;
      display: flex; align-items: center; justify-content: center; color: #6b7280;
    }
    .detail-header-info { display: flex; flex-direction: column; gap: 2px; }
    .detail-passenger-label { font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; }
    .detail-passenger-name { font-size: 16px; font-weight: 800; color: #111827; letter-spacing: -0.2px; }
    .detail-passenger-rating { display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 700; color: #d97706; }
    .detail-passenger-rating mat-icon { font-size: 14px; height: 14px; width: 14px; }
    
    .detail-banner {
      background: #fef3c7; padding: 10px 20px; display: flex;
      align-items: center; gap: 8px; border-bottom: 1px solid #fde68a;
    }
    .detail-banner mat-icon { color: #d97706; font-size: 18px; height: 18px; width: 18px; }
    .detail-banner span     { font-size: 12px; font-weight: 600; color: #92400e; }
    
    .detail-map-wrapper {
      height: 250px; width: 100%; border-bottom: 1px solid #e5e7eb; position: relative; overflow: hidden;
    }

    .detail-body            { padding: 22px; display: flex; flex-direction: column; gap: 16px; }
    
    /* Modular Box Composition Layout */
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .info-block {
      background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px;
      padding: 14px 16px; display: flex; flex-direction: column; gap: 4px; transition: background 0.2s;
    }
    .info-block:hover { background: #f3f4f6; }
    .info-block--full { grid-column: 1 / -1; }
    
    .block-label {
      font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase;
      letter-spacing: 0.06em; display: flex; align-items: center; gap: 6px;
    }
    .block-label mat-icon { font-size: 14px; height: 14px; width: 14px; }
    .block-label--origin { color: #10b981; }
    .block-label--dest   { color: #ef4444; }
    
    .block-value { font-size: 14px; font-weight: 700; color: #1f2937; line-height: 1.3; }
    .block-sub   { font-size: 11px; color: #6b7280; font-family: monospace; margin-top: 2px; }
    
    /* Economics Summary inside details */
    .econ-summary { display: flex; justify-content: space-between; align-items: center; width: 100%; }
    .econ-large   { font-size: 20px; font-weight: 800; color: #16a34a; }
    .dist-badge   { font-size: 12px; font-weight: 700; background: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 20px; }

    .detail-actions         { display: flex; gap: 12px; margin-top: 4px; }
    .apply-btn              { flex: 1; height: 48px; font-size: 15px; font-weight: 800; border-radius: 12px; box-shadow: 0 2px 6px rgba(37, 99, 235, 0.2); }
    .apply-btn mat-icon     { margin-right: 6px; font-size: 20px; height: 20px; width: 20px; }
    .skip-btn               { height: 48px; font-size: 14px; font-weight: 700; border-radius: 12px; padding: 0 20px; }

    /* Discreet Google Maps Placement */
    .detail-gmaps-btn { font-size: 12px; color: #4b5563 !important; }
    .detail-gmaps-btn mat-icon { font-size: 16px; height: 16px; width: 16px; margin-right: 4px; }


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
    
    .active-map-wrapper {
      height: 280px; width: 100%; border-bottom: 1px solid #e5e7eb; position: relative; overflow: hidden;
    }
    
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

    /* ── Route details and section labels in active ride ── */
    .detail-section-label {
      font-size: 11px;
      font-weight: 700;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
      margin-top: 12px;
      display: block;
    }
    .detail-route {
      position: relative;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 16px;
    }
    .detail-route-row {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      position: relative;
      z-index: 1;
    }
    .detail-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      margin-top: 6px;
      flex-shrink: 0;
    }
    .detail-dot--origin {
      background: #10b981;
      box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2);
    }
    .detail-dot--dest {
      background: #ef4444;
      box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.2);
    }
    .detail-route-line {
      position: absolute;
      left: 20px;
      top: 28px;
      bottom: 28px;
      width: 2px;
      background: #e5e7eb;
      z-index: 0;
    }
    .detail-route-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .detail-route-label {
      font-size: 10px;
      font-weight: 700;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .detail-route-value {
      font-size: 14px;
      font-weight: 600;
      color: #1f2937;
    }
    .detail-chips {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
    }
    .detail-chip {
      background: #f3f4f6;
      border-radius: 12px;
      padding: 10px 14px;
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
    }
    .detail-chip mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #10b981;
    }
    .chip-value {
      font-size: 16px;
      font-weight: 700;
      color: #111827;
    }
    .chip-label {
      font-size: 11px;
      color: #6b7280;
    }

    /* ── Vertical Stepper Timeline ── */
    .vertical-stepper {
      display: flex;
      flex-direction: column;
      gap: 0;
      position: relative;
      padding: 8px 4px;
      margin-bottom: 20px;
    }
    .step-item {
      display: flex;
      gap: 16px;
      align-items: center;
      position: relative;
      padding-bottom: 24px;
    }
    .step-item:last-child {
      padding-bottom: 0;
    }
    .step-item::after {
      content: '';
      position: absolute;
      left: 17px;
      top: 36px;
      bottom: 0;
      width: 2px;
      background: #e5e7eb;
      z-index: 1;
    }
    .step-item:last-child::after {
      display: none;
    }
    .step-item.step--completed::after {
      background: #10b981;
    }
    .step-icon-wrap {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #f3f4f6;
      color: #9ca3af;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      z-index: 2;
      box-shadow: 0 0 0 4px #fff;
      transition: background 0.3s, color 0.3s;
    }
    .step-icon-wrap mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    .step--completed .step-icon-wrap {
      background: #d1fae5;
      color: #065f46;
    }
    .step--active .step-icon-wrap {
      background: #dbeafe;
      color: #1a73e8;
      box-shadow: 0 0 0 4px #fff, 0 0 0 6px rgba(26, 115, 232, 0.15);
      animation: stepperPulse 2s infinite;
    }
    @keyframes stepperPulse {
      0% { box-shadow: 0 0 0 4px #fff, 0 0 0 0px rgba(26, 115, 232, 0.3); }
      70% { box-shadow: 0 0 0 4px #fff, 0 0 0 8px rgba(26, 115, 232, 0); }
      100% { box-shadow: 0 0 0 4px #fff, 0 0 0 0px rgba(26, 115, 232, 0); }
    }
    .step-label {
      font-size: 14px;
      font-weight: 500;
      color: #6b7280;
      transition: color 0.3s, font-weight 0.3s;
    }
    .step--completed .step-label {
      color: #374151;
      font-weight: 600;
    }
    .step--active .step-label {
      color: #1a73e8;
      font-weight: 700;
    }

    /* ── Driver Completed Screen ── */
    .driver-completed-view {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 16px;
      padding: 24px 0;
    }
    .driver-completed-view .success-icon-wrap {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: #d1fae5;
      color: #10b981;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 0 8px rgba(16, 185, 129, 0.1);
      margin-bottom: 8px;
    }
    .driver-completed-view .success-icon-wrap mat-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
    }
    .driver-completed-view h3 {
      margin: 0;
      font-size: 20px;
      font-weight: 800;
      color: #111827;
    }
    .driver-completed-view p {
      margin: 0;
      font-size: 13px;
      color: #6b7280;
      line-height: 1.5;
      max-width: 280px;
    }
    .completed-summary {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 12px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      margin: 8px 0;
    }
    .completed-label {
      font-size: 13px;
      font-weight: 600;
      color: #4b5563;
    }
    .completed-value {
      font-size: 18px;
      font-weight: 800;
      color: #10b981;
    }
    .return-home-btn {
      width: 100%;
      height: 48px;
      font-size: 15px;
      font-weight: 700;
      border-radius: 10px;
    }

    /* ── Animated Radar/Hourglass Visual ── */
    .stepper-searching-animation {
      position: relative;
      width: 80px;
      height: 80px;
      margin: 24px auto;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .radar-pulse {
      position: absolute;
      width: 100%;
      height: 100%;
      background: rgba(37, 99, 235, 0.15);
      border-radius: 50%;
      animation: radarPulseScale 2s infinite ease-out;
    }
    .radar-pulse.double {
      animation-delay: 1s;
    }
    .radar-icon-center {
      position: relative;
      z-index: 5;
      width: 48px;
      height: 48px;
      background: #eff6ff;
      border: 2px solid #3b82f6;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #2563eb;
    }
    .pulse-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
      animation: rotateHourglass 2s infinite ease-in-out;
    }
    @keyframes radarPulseScale {
      0% { transform: scale(0.6); opacity: 1; }
      100% { transform: scale(1.6); opacity: 0; }
    }
    @keyframes rotateHourglass {
      0%, 100% { transform: rotate(0deg); }
      50% { transform: rotate(180deg); }
    }
  `],
})
export class DriverDashboardPageComponent {
  protected iamStore         = inject(IamStore);
  protected driverMgmtStore  = inject(DriverManagementStore);
  protected rideStore        = inject(RideDispatchStore);
  protected monetizationStore = inject(MonetizationStore);

  readonly activeRideSteps = [
    { label: 'Viaje aceptado', icon: 'check_circle_outline' },
    { label: 'En camino al recojo', icon: 'two_wheeler' },
    { label: 'Llegada al origen', icon: 'location_on' },
    { label: 'Viaje en curso', icon: 'navigation' },
    { label: 'Completado', icon: 'flag' }
  ];

  readonly currentStepIndex = computed(() => {
    const state = this.uiState();
    if (state === 'RIDE_ASSIGNED') return 0;
    if (state === 'DRIVER_ON_THE_WAY') return 1;
    if (state === 'DRIVER_ARRIVED') return 2;
    if (state === 'RIDE_STARTED') return 3;
    if (state === 'RIDE_COMPLETED') return 4;
    return -1;
  });

  onClearActiveRide(): void {
    this.rideStore.clearCurrentRide();
    this.rideStore.loadOpenRequests();
  }

  readonly selectedRequest = signal<RideRequest | null>(null);
  readonly isRawCoord = isRawCoord;
  readonly humanizeCoord = humanizeCoord;

  getMockPassengerRating(id: string | undefined): string {
    if (!id) return '4.9';
    const sum = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const val = 4.5 + (sum % 6) / 10;
    return val.toFixed(1);
  }

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

  openRequestMapsToOrigin(request: RideRequest): void {
    window.open(buildGoogleMapsDirectionsUrl(request.origin), '_blank');
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
    this.rideStore.loadDriverAvailability(driver.id);
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

  // ── Unified Active Ride Controller Helper Methods ───────────────────

  getActiveRideIcon(): string {
    const state = this.uiState();
    if (state === 'RIDE_COMPLETED') return 'check_circle';
    if (state === 'RIDE_STARTED') return 'two_wheeler';
    if (state === 'DRIVER_ARRIVED') return 'location_on';
    if (state === 'DRIVER_ON_THE_WAY') return 'two_wheeler';
    return 'directions';
  }

  getActiveRideTitle(): string {
    const state = this.uiState();
    switch (state) {
      case 'RIDE_ASSIGNED': return 'Viaje asignado';
      case 'DRIVER_ON_THE_WAY': return 'En camino al pasajero';
      case 'DRIVER_ARRIVED': return 'Conductor en el origen';
      case 'RIDE_STARTED': return 'Viaje en curso';
      case 'RIDE_COMPLETED': return '¡Viaje completado!';
      default: return 'Viaje activo';
    }
  }

  getActiveRideSubtitle(): string {
    const state = this.uiState();
    switch (state) {
      case 'RIDE_ASSIGNED': return 'Dirígete al punto de recojo del pasajero';
      case 'DRIVER_ON_THE_WAY': return 'Pulsa "Llegué" cuando estés en el punto de recojo';
      case 'DRIVER_ARRIVED': return 'Cuando el pasajero suba, inicia el viaje';
      case 'RIDE_STARTED': return 'Lleva al pasajero al destino y finaliza el viaje';
      case 'RIDE_COMPLETED': return 'Buen trabajo. Ya puedes recibir nuevas solicitudes.';
      default: return '';
    }
  }
}
