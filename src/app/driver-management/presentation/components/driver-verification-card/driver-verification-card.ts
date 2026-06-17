import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Driver } from '../../../domain/model/driver.entity';

/**
 * @summary Card component for reviewing a pending driver.
 * Shows driver info with approve/reject actions (US-06).
 * @author Sprint 3 — Driver Management Bounded Context
 */
@Component({
  selector: 'app-driver-verification-card',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './driver-verification-card.html',
  styleUrl: './driver-verification-card.css',
})
export class DriverVerificationCard {
  /** The driver pending verification. */
  readonly driver = input.required<Driver>();

  /** Emitted when admin approves this driver. */
  readonly approve = output<string>();

  /** Emitted when admin rejects this driver. */
  readonly reject = output<string>();
}
