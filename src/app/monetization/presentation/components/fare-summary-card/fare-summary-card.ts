import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * @summary Returns an estimated trip duration string based on distance.
 * Uses a simple average speed of 20 km/h for mototaxis in urban areas.
 *
 * @param distanceKm - Distance in kilometers.
 */
function estimatedMinutes(distanceKm: number): string {
  if (!distanceKm || distanceKm <= 0) return '';
  const minutes = Math.round((distanceKm / 20) * 60);
  if (minutes < 2) return '~1 min';
  return `~${minutes} min`;
}

/**
 * @summary Presentation component that displays the fare summary before confirming the ride.
 * Shows price (primary), distance, estimated time and a prominent confirm CTA.
 * This component is only rendered in FARE_READY state.
 * @author Jesús Iván Castillo Vidal
 */
@Component({
  selector: 'app-fare-summary-card',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="fare-card">
      <!-- Header -->
      <div class="fare-header">
        <div class="fare-label">
          <mat-icon class="label-icon">receipt_long</mat-icon>
          <span>Tu viaje</span>
        </div>
      </div>

      <!-- Price (primary) -->
      <div class="fare-amount">
        <span class="currency">S/</span>
        <span class="value">{{ estimatedFare | number:'1.2-2' }}</span>
      </div>

      <!-- Trip details row -->
      <div class="trip-details">
        <div class="detail-item" *ngIf="distanceKm > 0">
          <mat-icon class="detail-icon">straighten</mat-icon>
          <span>{{ distanceKm | number:'1.1-1' }} km</span>
        </div>
        <div class="detail-separator" *ngIf="distanceKm > 0 && estimatedTime"></div>
        <div class="detail-item" *ngIf="estimatedTime">
          <mat-icon class="detail-icon">schedule</mat-icon>
          <span>{{ estimatedTime }}</span>
        </div>
      </div>

      <p class="fare-note">
        <mat-icon class="note-icon">info_outline</mat-icon>
        Precio estimado. Puede variar por tráfico o desvíos.
      </p>

      <!-- Primary CTA -->
      <button mat-flat-button
              id="btn-confirm-ride"
              class="confirm-btn"
              color="primary"
              (click)="confirm.emit()"
              aria-label="Confirmar solicitud de viaje">
        <mat-icon>directions_car</mat-icon>
        Confirmar solicitud
      </button>
    </div>
  `,
  styles: [`
    .fare-card {
      background: white;
      padding: 22px 22px 20px;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.08);
      border: 1px solid #e5e7eb;
    }

    /* Header */
    .fare-header {
      margin-bottom: 12px;
    }
    .fare-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .label-icon {
      font-size: 16px;
      height: 16px;
      width: 16px;
      color: #9ca3af;
    }

    /* Price */
    .fare-amount {
      display: flex;
      align-items: baseline;
      gap: 4px;
      color: #111827;
      margin-bottom: 12px;
    }
    .currency {
      font-size: 22px;
      font-weight: 600;
      color: #374151;
      line-height: 1;
    }
    .value {
      font-size: 42px;
      font-weight: 700;
      letter-spacing: -1.5px;
      line-height: 1;
      color: #1a73e8;
    }

    /* Details row */
    .trip-details {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 14px;
      flex-wrap: wrap;
    }
    .detail-item {
      display: flex;
      align-items: center;
      gap: 4px;
      background: #f3f4f6;
      padding: 4px 10px;
      border-radius: 16px;
      font-size: 12px;
      color: #374151;
      font-weight: 500;
    }
    .detail-icon {
      font-size: 13px;
      height: 13px;
      width: 13px;
      color: #6b7280;
    }
    .detail-separator {
      width: 3px;
      height: 3px;
      border-radius: 50%;
      background: #d1d5db;
    }

    /* Note */
    .fare-note {
      display: flex;
      align-items: flex-start;
      gap: 5px;
      font-size: 11px;
      color: #9ca3af;
      margin: 0 0 18px;
      line-height: 1.5;
    }
    .note-icon {
      font-size: 13px;
      height: 13px;
      width: 13px;
      flex-shrink: 0;
      margin-top: 1px;
    }

    /* CTA */
    .confirm-btn {
      width: 100%;
      height: 50px;
      font-size: 15px;
      font-weight: 600;
      border-radius: 10px;
      letter-spacing: 0.02em;
    }
    .confirm-btn mat-icon {
      margin-right: 6px;
      font-size: 18px;
      height: 18px;
      width: 18px;
    }
  `]
})
export class FareSummaryCardComponent {
  /** Estimated fare in soles (PEN). */
  @Input() estimatedFare: number | null = null;
  /** Distance in kilometers for this trip. */
  @Input() distanceKm: number = 0;
  /** Emitted when the user confirms the ride request. */
  @Output() confirm = new EventEmitter<void>();

  /** Returns a human-friendly estimated travel time string. */
  get estimatedTime(): string {
    return estimatedMinutes(this.distanceKm);
  }
}
