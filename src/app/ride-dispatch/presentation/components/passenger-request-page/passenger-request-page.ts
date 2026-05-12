import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RideDispatchStore } from '../../../application/ride-dispatch.store';
import { MonetizationStore } from '../../../../monetization/application/monetization.store';
import { IamStore } from '../../../../iam/application/iam.store';

import { TripLocationFormComponent } from '../trip-location-form/trip-location-form';
import { TripMapComponent } from '../trip-map/trip-map';
import { TripAvailabilitySummaryComponent } from '../trip-availability-summary/trip-availability-summary';
import { TripRequestStatusComponent } from '../trip-request-status/trip-request-status';
import { FareSummaryCardComponent } from '../../../../monetization/presentation/components/fare-summary-card/fare-summary-card';
import { calculateEstimatedDistance } from '../../../../shared/utils/geo.utils';

/**
 * @summary Union type for all possible UI states of the passenger request flow.
 * PREPARING        — Waiting for origin/destination.
 * FARE_READY       — Both points set, fare calculated. Ready to confirm.
 * SEARCHING_DRIVER — Request submitted, awaiting assignment (manual refresh).
 * DRIVER_ASSIGNED  — A driver has accepted the request.
 * ERROR            — A recoverable error occurred.
 */
export type RequestUiState =
  | 'PREPARING'
  | 'FARE_READY'
  | 'SEARCHING_DRIVER'
  | 'DRIVER_ASSIGNED'
  | 'ERROR';

/**
 * @summary Main passenger screen. Unifies the ride request flow:
 * Selecting origin & destination → viewing fare → confirming the request.
 * Orchestrates TripMap, TripLocationForm, TripAvailabilitySummary,
 * FareSummaryCard and TripRequestStatus through a single derived UI state.
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
    FareSummaryCardComponent
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

    /* ── State cards ─────────────────────────────────────────────── */

    /* Error state */
    .error-card {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 18px 18px;
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

    /* Flow progress indicator */
    .flow-progress {
      display: flex;
      gap: 6px;
      align-items: center;
      padding: 10px 14px;
      background: white;
      border-radius: 10px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }
    .flow-step {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      font-weight: 500;
      color: #9ca3af;
    }
    .flow-step.active {
      color: #1a73e8;
    }
    .flow-step.done {
      color: #10b981;
    }
    .flow-step mat-icon {
      font-size: 14px;
      height: 14px;
      width: 14px;
    }
    .flow-divider {
      flex: 1;
      height: 1px;
      background: #e5e7eb;
    }
  `]
})
export class PassengerRequestPageComponent {
  /** @internal Ride dispatch store. */
  protected rideStore: RideDispatchStore = inject(RideDispatchStore);
  /** @internal Monetization store for fare calculation. */
  protected monetizationStore: MonetizationStore = inject(MonetizationStore);
  /** @internal IAM store for current user context. */
  private iamStore: IamStore = inject(IamStore);

  /** Indicates which form field is currently active for map input. */
  activeField: 'origin' | 'destination' = 'origin';

  /**
   * Derives the current UI state from the stores.
   * Only one state is active at a time — no contradictions.
   */
  uiState = computed<RequestUiState>(() => {
    // Error takes precedence
    if (this.rideStore.error() || this.monetizationStore.error()) return 'ERROR';

    // Check post-submission states
    const request = this.rideStore.currentRequest();
    if (request) {
      if (request.status === 'ACCEPTED') return 'DRIVER_ASSIGNED';
      return 'SEARCHING_DRIVER';
    }

    // Fare calculated
    const dist = this.rideStore.distanceKm();
    if (dist > 0) return 'FARE_READY';

    return 'PREPARING';
  });

  constructor() {
    this.monetizationStore.loadFarePolicy();
    this.rideStore.loadNearbyDrivers();
  }

  /**
   * Handles map click, setting the coordinates to the active field.
   * Automatically calculates distance and fare when both are set.
   *
   * @param coord - Clicked lat/lng coordinate.
   */
  onMapClicked(coord: { lat: number; lng: number }): void {
    // Don't allow new points after request is submitted
    if (this.uiState() === 'SEARCHING_DRIVER' || this.uiState() === 'DRIVER_ASSIGNED') return;

    const coordStr = `${coord.lat.toFixed(5)},${coord.lng.toFixed(5)}`;

    if (this.activeField === 'origin') {
      this.rideStore.setOrigin(coordStr);
      // Auto-switch to destination if it's empty
      if (!this.rideStore.destination()) {
        this.activeField = 'destination';
      } else {
        this.recalculateDistance();
      }
    } else {
      this.rideStore.setDestination(coordStr, 0); // Temp dist 0
      this.recalculateDistance();
    }
  }

  private recalculateDistance(): void {
    const origin = this.rideStore.origin();
    const destination = this.rideStore.destination();
    
    if (origin && destination) {
      const oParts = origin.split(',').map(Number);
      const dParts = destination.split(',').map(Number);
      if (oParts.length === 2 && dParts.length === 2) {
        const dist = calculateEstimatedDistance([oParts[0], oParts[1]], [dParts[0], dParts[1]]);
        this.rideStore.setDestination(destination, dist);
        this.monetizationStore.calculateEstimatedFare(dist);
      }
    }
  }

  /** Updates the active field from the form. */
  onActiveFieldChanged(field: 'origin' | 'destination'): void {
    this.activeField = field;
  }

  /** Clears the origin and resets the flow to PREPARING. */
  onClearOrigin(): void {
    this.rideStore.setOrigin('');
    this.rideStore.setDestination('', 0);
    this.activeField = 'origin';
  }

  /** Clears only the destination so the user can re-select. */
  onClearDestination(): void {
    this.rideStore.setDestination('', 0);
    this.activeField = 'destination';
  }

  /** Submits the confirmed ride request. */
  onConfirmRequest(): void {
    const passengerId = this.iamStore.currentAccount()?.id;
    const fare = this.monetizationStore.estimatedFare();
    if (passengerId && fare !== null) {
      this.rideStore.submitRideRequest(passengerId, fare);
    }
  }

  /** Handles manual refresh to check if the specific request was accepted. */
  onRefreshRequestStatus(): void {
    this.rideStore.checkRequestStatus();
  }

  /** Retries loading after an error. */
  onRetry(): void {
    this.rideStore.clearError();
    this.monetizationStore.loadFarePolicy();
    this.rideStore.loadNearbyDrivers();
  }
}
