import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DriverManagementStore } from '../../../application/driver-management.store';
import { DriversTable } from '../drivers-table/drivers-table';
import { DriverVerificationCard } from '../driver-verification-card/driver-verification-card';

/**
 * @summary Admin page for driver management.
 * Tab 1: Pending verifications (US-06).
 * Tab 2: All drivers (US-26).
 * @author Sprint 3 — Driver Management Bounded Context
 */
@Component({
  selector: 'app-drivers-management-page',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    DriversTable,
    DriverVerificationCard,
  ],
  templateUrl: './drivers-management-page.html',
  styleUrl: './drivers-management-page.css',
})
export class DriversManagementPage implements OnInit {
  /** Application store for Driver Management. */
  protected store = inject(DriverManagementStore);

  ngOnInit(): void {
    this.store.loadAllDrivers();
    this.store.loadPendingDrivers();
  }

  /** Approves a driver (emitted from verification card). */
  onApprove(driverId: string): void {
    this.store.approveDriver(driverId);
  }

  /** Rejects a driver (emitted from verification card). */
  onReject(driverId: string): void {
    this.store.rejectDriver(driverId);
  }

  /** Toggles driver operational status (emitted from drivers table). */
  onToggleStatus(event: { driverId: string; enabled: boolean }): void {
    this.store.toggleDriverOperationalStatus(event.driverId, event.enabled);
  }

  /** Returns the count of enabled drivers. */
  activeCount(): number {
    return this.store.allDrivers().filter(d => d.isAvailable).length;
  }
}
