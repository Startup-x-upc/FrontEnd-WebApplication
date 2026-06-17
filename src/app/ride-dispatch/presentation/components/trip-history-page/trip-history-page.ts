import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RideDispatchStore } from '../../../application/ride-dispatch.store';
import { IamStore } from '../../../../iam/application/iam.store';
import { DriverManagementStore } from '../../../../driver-management/application/driver-management.store';
import { Ride } from '../../../domain/model/ride.entity';
import { buildGoogleMapsRouteUrl } from '../../../../shared/utils/maps.utils';
import { FarePolicy } from '../../../../monetization/domain/model/fare-policy.entity';

/**
 * @summary Trip history page shared between passenger (US-24)
 * and driver (US-25) roles. Shows completed trips with the
 * person involved, fare, commission, and a shortcut to view
 * the full route in Google Maps.
 * @author Sprint 3 — Ride Dispatch Bounded Context
 */
@Component({
  selector: 'app-trip-history-page',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './trip-history-page.html',
  styleUrl: './trip-history-page.css',
})
export class TripHistoryPage implements OnInit {
  protected rideStore = inject(RideDispatchStore);
  private iamStore = inject(IamStore);
  private driverMgmtStore = inject(DriverManagementStore);

  /** The current user's role. */
  get role(): 'PASSENGER' | 'DRIVER' | null {
    return this.iamStore.role() as 'PASSENGER' | 'DRIVER' | null;
  }

  /** Trips to display, based on role. */
  get trips(): Ride[] {
    return this.role === 'DRIVER'
      ? this.rideStore.driverTrips()
      : this.rideStore.passengerTrips();
  }

  /** True while loading. */
  get isLoading(): boolean { return this.rideStore.isLoading(); }
  /** Error message from the store. */
  get error(): string | null { return this.rideStore.error(); }

  ngOnInit(): void {
    const account = this.iamStore.currentAccount();
    if (!account?.id) return;

    if (account.role === 'DRIVER') {
      const driver = this.driverMgmtStore.driver();
      if (driver?.id) {
        this.rideStore.loadDriverTrips(driver.id);
      } else {
        this.driverMgmtStore.loadDriverByAccountId(account.id);
        const check = setInterval(() => {
          const d = this.driverMgmtStore.driver();
          if (d?.id) {
            this.rideStore.loadDriverTrips(d.id);
            clearInterval(check);
          }
        }, 300);
        setTimeout(() => clearInterval(check), 5000);
      }
    } else {
      this.rideStore.loadPassengerTrips(account.id);
    }
  }

  /** Retry loading trips. */
  onRetry(): void {
    this.rideStore.clearError();
    const account = this.iamStore.currentAccount();
    if (!account?.id) return;

    if (account.role === 'DRIVER') {
      const d = this.driverMgmtStore.driver();
      if (d?.id) this.rideStore.loadDriverTrips(d.id);
    } else {
      this.rideStore.loadPassengerTrips(account.id);
    }
  }

  /** Returns the platform commission for a ride. */
  commission(fare: number): number { return fare * FarePolicy.PLATFORM_COMMISSION_RATE; }

  /** Opens Google Maps with the full route (origin → destination) in a new tab. */
  openRouteInMaps(trip: Ride): void {
    if (trip.origin && trip.destination) {
      window.open(buildGoogleMapsRouteUrl(trip.origin, trip.destination), '_blank');
    }
  }
}
