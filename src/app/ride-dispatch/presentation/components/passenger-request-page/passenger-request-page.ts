import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RideDispatchStore } from '../../../application/ride-dispatch.store';
import { MonetizationStore } from '../../../../monetization/application/monetization.store';
import { IamStore } from '../../../../iam/application/iam.store';
import { RideStatus } from '../../../domain/model/ride.status';
import { RideCandidate } from '../../../domain/model/ride-candidate.entity';

import { TripLocationFormComponent } from '../trip-location-form/trip-location-form';
import { TripMapComponent } from '../trip-map/trip-map';
import { TripAvailabilitySummaryComponent } from '../trip-availability-summary/trip-availability-summary';
import { TripRequestStatusComponent } from '../trip-request-status/trip-request-status';
import { FareSummaryCardComponent } from '../../../../monetization/presentation/components/fare-summary-card/fare-summary-card';
import { RideCandidatesListComponent } from '../ride-candidates-list/ride-candidates-list';
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
    TripAvailabilitySummaryComponent,
    TripRequestStatusComponent,
    FareSummaryCardComponent,
    RideCandidatesListComponent,
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
  `]
})
export class PassengerRequestPageComponent {
  protected rideStore        = inject(RideDispatchStore);
  protected monetizationStore = inject(MonetizationStore);
  private iamStore           = inject(IamStore);

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
    if (ride) {
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
  }

  onRetry(): void {
    this.rideStore.clearError();
    this.monetizationStore.loadFarePolicy();
  }
}
