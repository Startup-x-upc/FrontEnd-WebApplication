import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DriverManagementStore } from '../../../application/driver-management.store';
import { DriversTable } from '../drivers-table/drivers-table';

/**
 * @summary Admin page for driver management (US-26).
 * Shows all registered drivers and allows toggling their
 * operational status (enable/disable). Drivers are ACTIVE
 * by default upon registration — no approval gate.
 * @author Sprint 3 — Driver Management Bounded Context
 */
@Component({
  selector: 'app-drivers-management-page',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    DriversTable,
  ],
  templateUrl: './drivers-management-page.html',
  styleUrl: './drivers-management-page.css',
})
export class DriversManagementPage implements OnInit {
  /** Application store for Driver Management. */
  protected store = inject(DriverManagementStore);

  ngOnInit(): void {
    this.store.loadAllDrivers();
  }

  /** Toggles driver operational status (emitted from drivers table). */
  onToggleStatus(event: { driverId: string; enabled: boolean }): void {
    this.store.toggleDriverOperationalStatus(event.driverId, event.enabled);
  }

  /** Returns the count of enabled (online) drivers. */
  activeCount(): number {
    return this.store.allDrivers().filter(d => d.isAvailable).length;
  }
}
