import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RideRequest } from '../../../domain/model/ride-request.entity';
import { humanizeCoord } from '../../../../shared/utils/maps.utils';

/**
 * @summary Renders the post-confirmation ride request status for the passenger.
 * Handles SEARCHING_DRIVER and DRIVER_ASSIGNED states exclusively.
 * @author Jesús Iván Castillo Vidal
 */
@Component({
  selector: 'app-trip-request-status',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatIconModule, MatButtonModule],
  template: `
    <!-- SEARCHING_DRIVER — awaiting driver acceptance -->
    <div class="status-card searching" *ngIf="uiState === 'SEARCHING_DRIVER'">
      <div class="spinner-wrap">
        <mat-spinner diameter="36" color="accent"></mat-spinner>
      </div>
      <div class="info">
        <h3>Solicitud enviada</h3>
        <p>Los conductores disponibles revisarán tu solicitud. Actualiza para saber si fue aceptada.</p>

        <div class="request-summary" *ngIf="request">
          <div class="summary-row">
            <span class="dot dot--origin"></span>
            <span class="summary-text">{{ humanizeCoord(request.origin, 'origin') }}</span>
          </div>
          <div class="route-line"></div>
          <div class="summary-row">
            <span class="dot dot--dest"></span>
            <span class="summary-text">{{ humanizeCoord(request.destination, 'destination') }}</span>
          </div>
          <div class="fare-row">
            <mat-icon class="fare-icon">payments</mat-icon>
            <span>S/ {{ request.estimatedFare | number:'1.2-2' }}</span>
            <span class="separator">·</span>
            <span *ngIf="request.distanceKm > 0">{{ request.distanceKm | number:'1.1-1' }} km</span>
          </div>
        </div>

        <button mat-stroked-button color="primary" class="refresh-btn"
                [disabled]="isLoading"
                (click)="onRefresh()">
          <mat-icon>refresh</mat-icon>
          {{ isLoading ? 'Verificando...' : 'Actualizar estado' }}
        </button>
      </div>
    </div>

    <!-- DRIVER_ASSIGNED — driver accepted the request -->
    <div class="status-card assigned" *ngIf="uiState === 'DRIVER_ASSIGNED'">
      <div class="assigned-header">
        <div class="icon-container success">
          <mat-icon>check_circle</mat-icon>
        </div>
        <div class="header-text">
          <h3>¡Conductor asignado!</h3>
          <p class="sub">Tu solicitud fue aceptada</p>
        </div>
      </div>

      <div class="divider"></div>

      <div class="trip-detail" *ngIf="request">
        <div class="detail-row">
          <span class="detail-label">Origen</span>
          <span class="detail-value">{{ humanizeCoord(request.origin, 'origin') }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Destino</span>
          <span class="detail-value">{{ humanizeCoord(request.destination, 'destination') }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Tarifa</span>
          <span class="detail-value fare">S/ {{ request.estimatedFare | number:'1.2-2' }}</span>
        </div>
      </div>

      <div class="driver-notice">
        <mat-icon>two_wheeler</mat-icon>
        <span>El motorizado está en camino hacia tu ubicación</span>
      </div>
    </div>
  `,
  styles: [`
    .status-card {
      display: flex;
      flex-direction: column;
      gap: 14px;
      padding: 20px;
      border-radius: 12px;
      background: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      border-left: 4px solid transparent;
    }

    /* ── SEARCHING state ─────────────────────────────────────── */
    .searching {
      border-left-color: #1a73e8;
    }
    .spinner-wrap {
      align-self: flex-start;
    }
    .info h3 {
      margin: 0 0 4px;
      font-size: 15px;
      font-weight: 600;
      color: #1f2937;
    }
    .info > p {
      margin: 0 0 12px;
      font-size: 12px;
      color: #6b7280;
      line-height: 1.5;
    }

    /* Request summary block */
    .request-summary {
      background: #f9fafb;
      border-radius: 10px;
      padding: 12px 14px;
      margin-bottom: 12px;
      display: flex;
      flex-direction: column;
      gap: 0;
    }
    .summary-row {
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
      height: 12px;
      background: #d1d5db;
      margin-left: 3px;
    }
    .summary-text {
      font-size: 12px;
      color: #374151;
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .fare-row {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      font-weight: 600;
      color: #374151;
    }
    .fare-icon {
      font-size: 14px;
      height: 14px;
      width: 14px;
      color: #6b7280;
    }
    .separator {
      color: #d1d5db;
    }

    .refresh-btn {
      align-self: flex-start;
      font-size: 12px;
    }
    .refresh-btn mat-icon {
      margin-right: 4px;
      font-size: 16px;
      height: 16px;
      width: 16px;
    }

    /* ── ASSIGNED state ──────────────────────────────────────── */
    .assigned {
      border-left-color: #10b981;
    }
    .assigned-header {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .icon-container {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .icon-container.success {
      background: #d1fae5;
      color: #059669;
    }
    .icon-container.success mat-icon {
      font-size: 24px;
      height: 24px;
      width: 24px;
    }
    .header-text h3 {
      margin: 0;
      font-size: 15px;
      font-weight: 700;
      color: #065f46;
    }
    .sub {
      margin: 2px 0 0;
      font-size: 12px;
      color: #6b7280;
    }

    .divider {
      height: 1px;
      background: #f0f0f0;
    }

    /* Trip detail rows */
    .trip-detail {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 8px;
    }
    .detail-label {
      font-size: 11px;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
      white-space: nowrap;
    }
    .detail-value {
      font-size: 13px;
      color: #1f2937;
      font-weight: 500;
      text-align: right;
    }
    .detail-value.fare {
      color: #1a73e8;
      font-weight: 700;
    }

    /* Driver notice */
    .driver-notice {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      background: #f0fdf4;
      border-radius: 8px;
      font-size: 12px;
      color: #166534;
      font-weight: 500;
    }
    .driver-notice mat-icon {
      font-size: 18px;
      height: 18px;
      width: 18px;
      color: #16a34a;
    }
  `],
})
export class TripRequestStatusComponent {
  @Input() uiState: string = '';
  @Input() request: RideRequest | null = null;
  @Input() isLoading: boolean = false;
  @Output() refreshRequested = new EventEmitter<void>();

  readonly humanizeCoord = humanizeCoord;

  onRefresh(): void {
    this.refreshRequested.emit();
  }
}
