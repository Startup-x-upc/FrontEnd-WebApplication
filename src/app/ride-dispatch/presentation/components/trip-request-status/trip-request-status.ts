import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-trip-request-status',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatIconModule],
  template: `
    <div class="status-card" *ngIf="uiState === 'SEARCHING_DRIVER'">
      <mat-spinner diameter="40"></mat-spinner>
      <div class="info">
        <h3>Buscando conductor...</h3>
        <p>Enviando solicitud a los conductores cercanos</p>
      </div>
    </div>

    <div class="status-card assigned" *ngIf="uiState === 'DRIVER_ASSIGNED'">
      <div class="icon-container success">
        <mat-icon>check_circle</mat-icon>
      </div>
      <div class="info">
        <h3>¡Conductor asignado!</h3>
        <p>Tu conductor está en camino. Prepárate.</p>
      </div>
    </div>
  `,
  styles: [`
    .status-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 24px;
      border-radius: 12px;
      background: white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      border: 1px solid #e5e7eb;
    }
    .status-card.assigned {
      border-left: 4px solid #10b981;
    }
    .icon-container {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
    }
    .icon-container.success {
      color: #10b981;
    }
    .info h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
    }
    .info p {
      margin: 4px 0 0;
      font-size: 13px;
      color: #6b7280;
    }
  `]
})
export class TripRequestStatusComponent {
  @Input() uiState: string = '';
  @Input() request: any = null;
}
