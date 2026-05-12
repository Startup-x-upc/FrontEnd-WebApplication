import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

/**
 * @summary Presentation component that renders the post-confirmation ride request status.
 * Handles SEARCHING_DRIVER and DRIVER_ASSIGNED states exclusively.
 * Does NOT render anything for other states (handled by the parent).
 * @author Jesús Iván Castillo Vidal
 */
@Component({
  selector: 'app-trip-request-status',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatIconModule, MatButtonModule],
  template: `
    <!-- SEARCHING_DRIVER -->
    <div class="status-card searching" *ngIf="uiState === 'SEARCHING_DRIVER'">
      <div class="spinner-wrap">
        <mat-spinner diameter="36" color="accent"></mat-spinner>
      </div>
      <div class="info">
        <h3>Solicitud enviada</h3>
        <p>Los conductores revisarán tu solicitud. Actualiza para ver si fue aceptada.</p>
        <button mat-stroked-button color="primary" class="refresh-btn" (click)="onRefresh()">
          <mat-icon>refresh</mat-icon> Actualizar estado
        </button>
      </div>
    </div>

    <!-- DRIVER_ASSIGNED -->
    <div class="status-card assigned" *ngIf="uiState === 'DRIVER_ASSIGNED'">
      <div class="icon-container success">
        <mat-icon>check_circle</mat-icon>
      </div>
      <div class="info">
        <h3>¡Conductor asignado!</h3>
        <p *ngIf="request?.origin">De: {{ request.origin }}</p>
        <p>Tu viaje ha sido aceptado por un conductor.</p>
      </div>
    </div>
  `,
  styles: [`
    .status-card {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 20px 20px;
      border-radius: 12px;
      background: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      border-left: 4px solid transparent;
    }

    /* Searching state */
    .searching {
      border-left-color: #1a73e8;
    }
    .spinner-wrap {
      flex-shrink: 0;
      padding-top: 2px;
    }

    /* Assigned state */
    .assigned {
      border-left-color: #10b981;
    }
    .icon-container {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .icon-container.success {
      background: #d1fae5;
      color: #059669;
    }
    .icon-container.success mat-icon {
      font-size: 22px;
      height: 22px;
      width: 22px;
    }

    /* Typography */
    .info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .info h3 {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      color: #1f2937;
    }
    .info p {
      margin: 0;
      font-size: 12px;
      color: #6b7280;
      line-height: 1.4;
    }
    .refresh-btn {
      margin-top: 8px;
      align-self: flex-start;
    }
    .refresh-btn mat-icon {
      margin-right: 4px;
    }
  `]
})
export class TripRequestStatusComponent {
  /** Current UI state — this component only renders for SEARCHING_DRIVER and DRIVER_ASSIGNED. */
  @Input() uiState: string = '';
  /** Current ride request object (optional, used for display context). */
  @Input() request: any = null;
  /** Emitted when the user explicitly requests to refresh the status. */
  @Output() refreshRequested = new import('@angular/core').EventEmitter<void>();

  onRefresh() {
    this.refreshRequested.emit();
  }
}
