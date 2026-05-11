import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RideDispatchStore } from '../../../application/ride-dispatch.store';
import { MonetizationStore } from '../../../../monetization/application/monetization.store';
import { IamStore } from '../../../../iam/application/iam.store';

import { TripLocationFormComponent } from '../trip-location-form/trip-location-form';
import { TripMapComponent } from '../trip-map/trip-map';
import { TripAvailabilitySummaryComponent } from '../trip-availability-summary/trip-availability-summary';
import { TripRequestStatusComponent } from '../trip-request-status/trip-request-status';
import { FareSummaryCardComponent } from '../../../../monetization/presentation/components/fare-summary-card/fare-summary-card';

export type RequestUiState = 'PREPARING' | 'FARE_READY' | 'SEARCHING_DRIVER' | 'DRIVER_ASSIGNED' | 'NO_DRIVERS' | 'ERROR';

@Component({
  selector: 'app-passenger-request-page',
  standalone: true,
  imports: [
    CommonModule,
    TripLocationFormComponent,
    TripMapComponent,
    TripAvailabilitySummaryComponent,
    TripRequestStatusComponent,
    FareSummaryCardComponent
  ],
  templateUrl: './passenger-request-page.html',
  styles: [`
    .request-page-container {
      display: grid;
      grid-template-columns: 1fr 350px;
      gap: 24px;
      height: 100%;
    }
    .left-panel {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .map-container {
      flex: 1;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      min-height: 400px;
    }
    .right-panel {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .page-header {
      margin-bottom: 8px;
    }
    .page-header h1 {
      font-size: 28px;
      font-weight: 700;
      color: #1f2937;
      margin: 0;
    }
    .page-header p {
      color: #6b7280;
      margin: 4px 0 0;
    }
  `]
})
export class PassengerRequestPageComponent {
  protected rideStore: RideDispatchStore = inject(RideDispatchStore);
  protected monetizationStore: MonetizationStore = inject(MonetizationStore);
  protected iamStore: IamStore = inject(IamStore);

  // Deriving UI State based on stores
  uiState = computed<RequestUiState>(() => {
    if (this.rideStore.error() || this.monetizationStore.error()) return 'ERROR';
    
    const request = this.rideStore.currentRequest();
    if (request) {
      if (request.status === 'ACCEPTED') return 'DRIVER_ASSIGNED'; // For demo, assuming ACCEPTED goes here or we use rides
      return 'SEARCHING_DRIVER';
    }

    const dist = this.rideStore.distanceKm();
    if (dist > 0) return 'FARE_READY';

    return 'PREPARING';
  });

  constructor() {
    // Load config on init
    this.monetizationStore.loadFarePolicy();
    this.rideStore.loadNearbyDrivers();
  }

  onLocationSelected(event: { origin: string, destination: string, distanceKm: number }) {
    this.rideStore.setOrigin(event.origin);
    this.rideStore.setDestination(event.destination, event.distanceKm);
    this.monetizationStore.calculateEstimatedFare(event.distanceKm);
  }

  onMapClicked(coord: {lat: number, lng: number}) {
    const coordStr = `${coord.lat.toFixed(5)},${coord.lng.toFixed(5)}`;
    
    if (!this.rideStore.origin() || (this.rideStore.origin() && this.rideStore.destination())) {
      // Set origin and clear destination
      this.rideStore.setOrigin(coordStr);
      this.rideStore.setDestination('', 0);
    } else {
      // Origin is set, set destination
      const destStr = coordStr;
      
      // Calculate mock distance between two points
      const originParts = this.rideStore.origin().split(',');
      let mockDistance = 5; // Default mock
      if (originParts.length === 2) {
        const lat1 = parseFloat(originParts[0]);
        const lng1 = parseFloat(originParts[1]);
        const lat2 = coord.lat;
        const lng2 = coord.lng;
        // Simple haversine mock (euclidean * ~111)
        mockDistance = Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(lng1 - lng2, 2)) * 111;
        mockDistance = Math.max(1, Math.round(mockDistance));
      }

      this.rideStore.setDestination(destStr, mockDistance);
      this.monetizationStore.calculateEstimatedFare(mockDistance);
    }
  }

  onConfirmRequest() {
    const passengerId = this.iamStore.currentAccount()?.id;
    const fare = this.monetizationStore.estimatedFare();
    if (passengerId && fare !== null) {
      this.rideStore.submitRideRequest(passengerId, fare);
    }
  }
}
