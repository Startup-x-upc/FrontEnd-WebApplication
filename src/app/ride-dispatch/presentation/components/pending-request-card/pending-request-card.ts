import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RideRequest } from '../../../domain/model/ride-request.entity';

/**
 * @summary Presentational card for a single pending ride request.
 * Shows origin, destination, estimated fare and distance.
 * Emits an accept event when the driver taps the accept button.
 * @author Jesús Iván Castillo Vidal
 */
@Component({
  selector: 'app-pending-request-card',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="request-card">
      <!-- Route info -->
      <div class="route">
        <div class="route-point">
          <span class="dot dot--origin"></span>
          <div class="point-info">
            <span class="point-label">Origen</span>
            <span class="point-value">{{ request.origin }}</span>
          </div>
        </div>

        <div class="route-line"></div>

        <div class="route-point">
          <span class="dot dot--dest"></span>
          <div class="point-info">
            <span class="point-label">Destino</span>
            <span class="point-value">{{ request.destination }}</span>
          </div>
        </div>
      </div>

      <!-- Trip meta -->
      <div class="trip-meta">
        <div class="meta-chip">
          <mat-icon>payments</mat-icon>
          <span>S/ {{ request.estimatedFare | number:'1.2-2' }}</span>
        </div>
        <div class="meta-chip" *ngIf="request.distanceKm > 0">
          <mat-icon>straighten</mat-icon>
          <span>{{ request.distanceKm | number:'1.1-1' }} km</span>
        </div>
      </div>

      <!-- Action -->
      <button mat-flat-button
              class="accept-btn"
              color="primary"
              [disabled]="loading"
              (click)="accept.emit(request)"
              aria-label="Aceptar solicitud de viaje">
        <mat-icon>check_circle</mat-icon>
        Aceptar solicitud
      </button>
    </div>
  `,
  styles: [`
    .request-card {
      background: white;
      border-radius: 12px;
      padding: 18px 20px;
      border: 1px solid #e5e7eb;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    /* Route */
    .route {
      display: flex;
      flex-direction: column;
      gap: 0;
    }
    .route-point {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
      margin-top: 4px;
    }
    .dot--origin { background: #1a73e8; }
    .dot--dest   { background: #d97706; }
    .route-line {
      width: 2px;
      height: 16px;
      background: #e5e7eb;
      margin-left: 4px;
    }
    .point-info {
      display: flex;
      flex-direction: column;
    }
    .point-label {
      font-size: 10px;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
    }
    .point-value {
      font-size: 13px;
      color: #1f2937;
      font-weight: 500;
      line-height: 1.4;
    }

    /* Meta chips */
    .trip-meta {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .meta-chip {
      display: flex;
      align-items: center;
      gap: 4px;
      background: #f3f4f6;
      padding: 4px 10px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 600;
      color: #374151;
    }
    .meta-chip mat-icon {
      font-size: 14px;
      height: 14px;
      width: 14px;
      color: #6b7280;
    }

    /* Accept button */
    .accept-btn {
      width: 100%;
      height: 44px;
      font-size: 14px;
      font-weight: 600;
      border-radius: 10px;
    }
    .accept-btn mat-icon {
      margin-right: 6px;
      font-size: 18px;
      height: 18px;
      width: 18px;
    }
  `],
})
export class PendingRequestCardComponent {
  @Input({ required: true }) request!: RideRequest;
  @Input() loading: boolean = false;
  @Output() accept = new EventEmitter<RideRequest>();
}
