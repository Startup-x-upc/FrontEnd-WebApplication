import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Driver } from '../../../domain/model/driver.entity';

/**
 * @summary Table component listing all drivers with status badges and
 * enable/disable toggle for admin management (US-26).
 * @author Sprint 3 — Driver Management Bounded Context
 */
@Component({
  selector: 'app-drivers-table',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './drivers-table.html',
  styleUrl: './drivers-table.css',
})
export class DriversTable {
  /** The list of drivers to display. */
  readonly drivers = input.required<Driver[]>();

  /** True while an API operation is in progress. */
  readonly loading = input<boolean>(false);

  /** Emitted when the admin toggles a driver's status. */
  readonly toggleStatus = output<{ driverId: string; enabled: boolean }>();

  /** Returns a CSS class for the verification status badge. */
  statusClass(driver: Driver): string {
    switch (driver.accessStatus) {
      case 'ACTIVE': return 'badge--active';
      case 'PENDING_VERIFICATION': return 'badge--pending';
      case 'RESTRICTED': return 'badge--restricted';
      default: return '';
    }
  }

  /** Returns a human-readable label for the access status. */
  statusLabel(driver: Driver): string {
    switch (driver.accessStatus) {
      case 'ACTIVE': return 'Activo';
      case 'PENDING_VERIFICATION': return 'Pendiente';
      case 'RESTRICTED': return 'Restringido';
      default: return driver.accessStatus;
    }
  }

  /** Emits the toggle event for a driver. */
  onToggle(driver: Driver): void {
    this.toggleStatus.emit({
      driverId: driver.id,
      enabled: !driver.isAvailable,
    });
  }
}
