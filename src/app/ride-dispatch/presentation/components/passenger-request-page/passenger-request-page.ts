import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RideDispatchStore } from '../../../application/ride-dispatch.store';
import { MonetizationStore } from '../../../../monetization/application/monetization.store';
import { IamStore } from '../../../../iam/application/iam.store';
import { TrustReputationStore } from '../../../../trust-reputation/application/trust-reputation.store';
import { RideStatus } from '../../../domain/model/ride.status';
import { RideCandidate } from '../../../domain/model/ride-candidate.entity';

import { TripLocationFormComponent } from '../trip-location-form/trip-location-form';
import { TripMapComponent } from '../trip-map/trip-map';
import { TripRequestStatusComponent } from '../trip-request-status/trip-request-status';
import { FareSummaryCardComponent } from '../../../../monetization/presentation/components/fare-summary-card/fare-summary-card';
import { RideCandidatesListComponent } from '../ride-candidates-list/ride-candidates-list';
import { RatingFormComponent } from '../../../../trust-reputation/presentation/components/rating-form/rating-form';
import { calculateEstimatedDistance } from '../../../../shared/utils/geo.utils';

/**
 * @summary Possible UI states of the passenger request flow.
 *
 * PREPARING           — Waiting for origin/destination to be set on the map.
 * FARE_READY          — Both points set, fare calculated. Ready to confirm.
 * WAITING_CANDIDATES  — Request submitted (OPEN). No candidates yet.
 * CANDIDATES_AVAILABLE— At least one driver applied. Passenger can choose.
 * DRIVER_SELECTED     — Passenger confirmed a driver. Ride created.
 * RIDE_IN_PROGRESS    — Driver is on the way / arrived / trip started.
 * RIDE_COMPLETED      — Trip finished.
 * REQUEST_EXPIRED     — Request timed out without a selection.
 * ERROR               — A recoverable error occurred.
 */
export type RequestUiState =
  | 'PREPARING'
  | 'FARE_READY'
  | 'WAITING_CANDIDATES'
  | 'CANDIDATES_AVAILABLE'
  | 'DRIVER_SELECTED'
  | 'RIDE_IN_PROGRESS'
  | 'RIDE_COMPLETED'
  | 'REQUEST_EXPIRED'
  | 'ERROR';

/**
 * @summary Main passenger screen. Orchestrates the inDrive-style ride request flow:
 * Set location → View fare → Confirm → Wait for candidates →
 * Select driver → Track ride (manual refresh).
 * @author Jesús Iván Castillo Vidal
 */
@Component({
  selector: 'app-passenger-request-page',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    TripLocationFormComponent,
    TripMapComponent,
    TripRequestStatusComponent,
    FareSummaryCardComponent,
    RideCandidatesListComponent,
    RatingFormComponent,
  ],
  templateUrl: './passenger-request-page.html',
  styles: [`
    /* ── Layout ──────────────────────────────────────────────────── */
    .request-page-container {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 20px;
      height: 100%;
    }

    /* Left panel */
    .left-panel {
      display: flex;
      flex-direction: column;
      gap: 14px;
      min-height: 0;
    }
    .page-header { margin-bottom: 2px; }
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
    .map-container {
      flex: 1;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0,0,0,0.07);
      min-height: 380px;
    }

    /* Right panel */
    .right-panel {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    /* ── Error / expired state cards ──────────────────────────────── */
    .error-card {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 18px;
      border-radius: 12px;
      background: #fff7f7;
      border: 1px solid #fecaca;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    .error-card mat-icon {
      color: #dc2626;
      flex-shrink: 0;
      font-size: 20px;
      height: 20px;
      width: 20px;
      margin-top: 1px;
    }
    .error-info h4 { margin: 0 0 4px; font-size: 14px; font-weight: 600; color: #b91c1c; }
    .error-info p  { margin: 0; font-size: 13px; color: #6b7280; line-height: 1.4; }
    .error-info button { margin-top: 10px; font-size: 12px; }

    /* ── Ride status card (DRIVER_SELECTED / RIDE_IN_PROGRESS) ────── */
    .ride-status-card {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      padding: 18px;
      border-radius: 12px;
      background: white;
      border: 1px solid #e5e7eb;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      border-left: 4px solid #10b981;
    }
    .ride-status-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: #d1fae5;
      color: #059669;
      flex-shrink: 0;
    }
    .ride-status-icon mat-icon { font-size: 22px; height: 22px; width: 22px; }
    .ride-status-info { flex: 1; }
    .ride-status-info h3 { margin: 0 0 4px; font-size: 15px; font-weight: 700; color: #1f2937; }
    .ride-status-info p  { margin: 0; font-size: 12px; color: #6b7280; line-height: 1.5; }
    .ride-status-badge {
      display: inline-block;
      background: #dcfce7;
      color: #166534;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 20px;
      margin-top: 6px;
      letter-spacing: 0.04em;
    }
    .refresh-mini {
      margin-top: 10px;
      font-size: 12px;
    }
    .refresh-mini mat-icon {
      font-size: 14px;
      height: 14px;
      width: 14px;
      margin-right: 3px;
    }

    /* Completed card */
    .completed-card {
      border-left-color: #1a73e8;
    }
    .completed-card .ride-status-icon {
      background: #dbeafe;
      color: #1a73e8;
    }

    /* ── Subtle refresh icon ── */
    .tracking-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      border-bottom: 1px solid #f3f4f6;
      padding-bottom: 10px;
    }
    .tracking-card-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 700;
      color: #1f2937;
    }
    .subtle-refresh-btn {
      width: 32px !important;
      height: 32px !important;
      min-width: 32px !important;
      line-height: 32px !important;
      padding: 0 !important;
      border-radius: 50%;
      color: #9ca3af;
      transition: opacity 0.2s, transform 0.2s;
    }
    .subtle-refresh-btn:hover {
      color: #1a73e8;
      background: #f3f4f6;
    }
    .subtle-refresh-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
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

    /* ── Premium Completed Receipt Layout ── */
    .ride-completed-card {
      background: white;
      border-radius: 16px;
      border: 1px solid #e5e7eb;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .celebration-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 12px;
    }
    .success-icon-wrap {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: #d1fae5;
      color: #10b981;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 0 8px rgba(16, 185, 129, 0.1);
      animation: checkPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    @keyframes checkPop {
      0% { transform: scale(0.6); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }
    .success-icon-wrap mat-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
    }
    .celebration-header h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 800;
      color: #111827;
      letter-spacing: -0.5px;
    }
    .celebration-header p {
      margin: 0;
      font-size: 13px;
      color: #6b7280;
    }
    .receipt-details {
      background: #f9fafb;
      border-radius: 12px;
      padding: 16px;
      border: 1px solid #e5e7eb;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .receipt-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 14px;
      color: #4b5563;
    }
    .receipt-fare {
      font-size: 18px;
      color: #10b981;
      font-weight: 800;
    }
    .receipt-divider {
      height: 1px;
      background: #e5e7eb;
    }
    .receipt-driver-info {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .mini-driver-profile {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .mini-driver-profile mat-icon {
      color: #4b5563;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    .mini-driver-title {
      font-size: 11px;
      font-weight: 700;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: block;
    }
    .mini-driver-name {
      font-size: 14px;
      font-weight: 700;
      color: #1f2937;
    }
    .new-trip-btn {
      height: 48px;
      font-size: 15px;
      font-weight: 700;
      border-radius: 10px;
    }

    /* ── Cancel Button ── */
    .cancel-ride-btn {
      height: 40px;
      font-size: 13px;
      font-weight: 600;
      border-radius: 10px;
      color: #dc2626 !important;
      border-color: #fecaca !important;
      margin-top: 8px;
    }
    .cancel-ride-btn mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin-right: 4px;
    }

    /* ── Rating Done Message ── */
    .rating-done-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      padding: 20px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 14px;
      text-align: center;
    }
    .rating-done-message mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #16a34a;
    }
    .rating-done-message span {
      font-size: 14px;
      font-weight: 600;
      color: #166534;
    }
  `],
})
export class PassengerRequestPageComponent {
  protected rideStore        = inject(RideDispatchStore);
  protected monetizationStore = inject(MonetizationStore);
  protected trustStore       = inject(TrustReputationStore);
  private iamStore           = inject(IamStore);

  /** Tracks whether the user has already submitted or skipped the rating. */
  readonly ratingSubmitted = signal(false);

  readonly steps = [
    { label: 'Buscando conductores', icon: 'search' },
    { label: 'Conductor confirmado', icon: 'person_outline' },
    { label: 'En camino al recojo', icon: 'two_wheeler' },
    { label: 'Llegada al origen', icon: 'location_on' },
    { label: 'Viaje en curso', icon: 'navigation' },
    { label: 'Completado', icon: 'flag' }
  ];

  readonly currentStepIndex = computed(() => {
    const state = this.uiState();
    if (state === 'WAITING_CANDIDATES' || state === 'CANDIDATES_AVAILABLE') return 0;
    if (state === 'DRIVER_SELECTED') return 1;
    if (state === 'RIDE_IN_PROGRESS') {
      const ride = this.rideStore.currentRide();
      if (!ride) return 1;
      if (ride.status === RideStatus.DRIVER_ON_THE_WAY) return 2;
      if (ride.status === RideStatus.DRIVER_ARRIVED) return 3;
      if (ride.status === RideStatus.STARTED) return 4;
    }
    if (state === 'RIDE_COMPLETED') return 5;
    return -1;
  });

  /** Controls which map field (origin / destination) receives the next tap. */
  activeField: 'origin' | 'destination' = 'origin';

  /**
   * Derives the current UI state from signal values.
   * Priority: ERROR > RIDE_COMPLETED > RIDE_IN_PROGRESS > DRIVER_SELECTED >
   * CANDIDATES_AVAILABLE > WAITING_CANDIDATES > REQUEST_EXPIRED >
   * FARE_READY > PREPARING.
   */
  uiState = computed<RequestUiState>(() => {
    if (this.rideStore.error() || this.monetizationStore.error()) return 'ERROR';

    const ride = this.rideStore.currentRide();
    // CANCELLED rides are not active — skip to request/map checks
    if (ride && ride.status !== RideStatus.CANCELLED) {
      if (ride.status === RideStatus.COMPLETED)       return 'RIDE_COMPLETED';
      if (
        ride.status === RideStatus.DRIVER_ON_THE_WAY ||
        ride.status === RideStatus.DRIVER_ARRIVED    ||
        ride.status === RideStatus.STARTED
      ) return 'RIDE_IN_PROGRESS';
      if (ride.status === RideStatus.ACCEPTED)        return 'DRIVER_SELECTED';
    }

    const req = this.rideStore.currentRequest();
    if (req) {
      if (req.isExpired)                              return 'REQUEST_EXPIRED';
      if (req.status === RideStatus.CONFIRMED)        return 'DRIVER_SELECTED';
      // Show candidates if any have applied
      if (this.rideStore.candidates().length > 0)    return 'CANDIDATES_AVAILABLE';
      return 'WAITING_CANDIDATES';
    }

    const dist = this.rideStore.distanceKm();
    if (dist > 0) return 'FARE_READY';

    return 'PREPARING';
  });

  /** Human-readable label for the current ride status. */
  rideStatusLabel = computed<string>(() => {
    const ride = this.rideStore.currentRide();
    if (!ride) return '';
    switch (ride.status) {
      case RideStatus.ACCEPTED:          return 'Conductor confirmado';
      case RideStatus.DRIVER_ON_THE_WAY: return 'Conductor en camino';
      case RideStatus.DRIVER_ARRIVED:    return 'Conductor llegó';
      case RideStatus.STARTED:           return 'Viaje en curso';
      case RideStatus.COMPLETED:         return 'Viaje completado';
      default: return ride.status;
    }
  });

  /** Real driver name from the enriched ride entity (US-10). */
  readonly currentDriverName = computed(() => {
    const ride = this.rideStore.currentRide();
    return ride?.driverName || 'Conductor asignado';
  });

  constructor() {
    this.monetizationStore.loadFarePolicy();
  }

  // ── Map interaction ─────────────────────────────────────────────────

  onMapClicked(coord: { lat: number; lng: number }): void {
    const state = this.uiState();
    if (state === 'WAITING_CANDIDATES' || state === 'CANDIDATES_AVAILABLE' ||
        state === 'DRIVER_SELECTED'    || state === 'RIDE_IN_PROGRESS') return;

    const coordStr = `${coord.lat.toFixed(5)},${coord.lng.toFixed(5)}`;
    if (this.activeField === 'origin') {
      this.rideStore.setOrigin(coordStr);
      if (!this.rideStore.destination()) {
        this.activeField = 'destination';
      } else {
        this.recalculateDistance();
      }
    } else {
      this.rideStore.setDestination(coordStr, 0);
      this.recalculateDistance();
    }
  }

  private recalculateDistance(): void {
    const origin      = this.rideStore.origin();
    const destination = this.rideStore.destination();
    if (origin && destination) {
      const o = origin.split(',').map(Number);
      const d = destination.split(',').map(Number);
      if (o.length === 2 && d.length === 2) {
        const dist = calculateEstimatedDistance([o[0], o[1]], [d[0], d[1]]);
        this.rideStore.setDestination(destination, dist);
        this.monetizationStore.calculateEstimatedFare(dist);
      }
    }
  }

  onActiveFieldChanged(field: 'origin' | 'destination'): void {
    this.activeField = field;
  }

  onCurrentLocationDetected(coordStr: string): void {
    this.rideStore.setOrigin(coordStr);
    this.activeField = 'destination';
    this.recalculateDistance();
  }

  onClearOrigin(): void {
    this.rideStore.setOrigin('');
    this.rideStore.setDestination('', 0);
    this.activeField = 'origin';
  }

  onClearDestination(): void {
    this.rideStore.setDestination('', 0);
    this.activeField = 'destination';
  }

  // ── Request flow ────────────────────────────────────────────────────

  onConfirmRequest(): void {
    const passengerId = this.iamStore.currentAccount()?.id;
    const fare        = this.monetizationStore.estimatedFare();
    if (passengerId && fare !== null) {
      this.rideStore.submitRideRequest(passengerId, fare);
    }
  }

  /** Manual refresh: reloads request status + candidates. */
  onRefreshCandidates(): void {
    this.rideStore.refreshPassengerRequest();
  }

  /** Passenger selects a specific candidate. */
  onCandidateSelected(candidate: RideCandidate): void {
    this.rideStore.selectCandidate(candidate);
  }

  /** Manual refresh: reloads ride status after driver selection. */
  onRefreshRide(): void {
    this.rideStore.refreshPassengerRide();
  }

  /** Clears expired request to start over. */
  onStartNewRequest(): void {
    this.rideStore.clearCurrentRequest();
    this.rideStore.setOrigin('');
    this.rideStore.setDestination('', 0);
    this.activeField = 'origin';
    this.ratingSubmitted.set(false);
  }

  onRetry(): void {
    this.rideStore.clearError();
    this.monetizationStore.loadFarePolicy();
  }

  // ── Cancel request & ride ───────────────────────────────────────────

  /** Cancel the request before a driver is selected */
  onCancelRequest(): void {
    const req = this.rideStore.currentRequest();
    if (req?.id) {
      this.rideStore.cancelRideRequest(req.id);
    }
  }

  /** Cancel ride before it starts. */
  onCancelRide(): void {
    this.rideStore.cancelRide();
  }

  /** Whether the current ride can be cancelled (not yet started). */
  readonly canCancelRide = computed(() => {
    const ride = this.rideStore.currentRide();
    if (!ride) return false;
    return ride.status === RideStatus.ACCEPTED ||
           ride.status === RideStatus.DRIVER_ON_THE_WAY ||
           ride.status === RideStatus.DRIVER_ARRIVED;
  });

  // ── Rating (US-21) ──────────────────────────────────────────────────

  /** Submit a rating for the driver after trip completes. */
  onRatingSubmitted(event: { score: number; comment?: string }): void {
    const ride = this.rideStore.currentRide();
    const passengerId = this.iamStore.currentAccount()?.id;
    if (!ride || !passengerId) return;
    this.trustStore.submitDriverRating(ride.id, ride.driverId, passengerId, event.score);
    this.ratingSubmitted.set(true);
  }

  /** Skip the driver rating. */
  onRatingSkipped(): void {
    const ride = this.rideStore.currentRide();
    const passengerId = this.iamStore.currentAccount()?.id;
    if (!ride || !passengerId) return;
    this.trustStore.skipDriverRating(ride.id, ride.driverId, passengerId);
    this.ratingSubmitted.set(true);
  }
}
