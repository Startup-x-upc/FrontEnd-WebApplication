import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RideRequest } from '../../../domain/model/ride-request.entity';

/**
 * @summary Compact summary card for a single pending ride request.
 * Shows a minimal route preview with fare and a "Ver detalles" CTA.
 * The accept action is delegated to the detail view.
 * @author Jesús Iván Castillo Vidal
 */
@Component({
  selector: 'app-pending-request-card',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="request-card">
      <div class="card-body">
        <!-- Route preview -->
        <div class="route">
          <div class="route-row">
            <span class="dot dot--origin"></span>
            <span class="route-text origin-text">{{ request.origin }}</span>
          </div>
          <div class="route-line"></div>
          <div class="route-row">
            <span class="dot dot--dest"></span>
            <span class="route-text">{{ request.destination }}</span>
          </div>
        </div>

        <!-- Fare + distance -->
        <div class="meta">
          <span class="fare">S/ {{ request.estimatedFare | number:'1.2-2' }}</span>
          <span class="separator">·</span>
          <span class="distance" *ngIf="request.distanceKm > 0">
            {{ request.distanceKm | number:'1.1-1' }} km
          </span>
        </div>
      </div>

      <button mat-stroked-button
              color="primary"
              class="details-btn"
              (click)="viewDetails.emit(request)"
              aria-label="Ver detalles de la solicitud">
        <mat-icon>visibility</mat-icon>
        Ver detalles
      </button>
    </div>
  `,
  styles: [`
    .request-card {
      background: white;
      border-radius: 12px;
      padding: 16px 18px;
      border: 1px solid #e5e7eb;
      box-shadow: 0 1px 6px rgba(0,0,0,0.05);
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .card-body {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    /* Route */
    .route {
      display: flex;
      flex-direction: column;
      gap: 0;
    }
    .route-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .dot--origin { background: #1a73e8; }
    .dot--dest   { background: #d97706; }
    .route-line {
      width: 2px;
      height: 10px;
      background: #e5e7eb;
      margin-left: 3px;
    }
    .route-text {
      font-size: 12px;
      color: #374151;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .origin-text { color: #1f2937; font-weight: 600; }

    /* Meta */
    .meta {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
    }
    .fare {
      font-weight: 700;
      color: #1a73e8;
    }
    .separator { color: #d1d5db; }
    .distance {
      color: #6b7280;
      font-weight: 500;
    }

    /* CTA */
    .details-btn {
      flex-shrink: 0;
      font-size: 13px;
      font-weight: 600;
      white-space: nowrap;
    }
    .details-btn mat-icon {
      font-size: 16px;
      height: 16px;
      width: 16px;
      margin-right: 4px;
    }
  `],
})
export class PendingRequestCardComponent {
  @Input({ required: true }) request!: RideRequest;
  @Output() viewDetails = new EventEmitter<RideRequest>();
}
