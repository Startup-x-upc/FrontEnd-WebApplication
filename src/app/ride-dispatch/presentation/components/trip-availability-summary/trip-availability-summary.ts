import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-trip-availability-summary',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="availability-card" [ngClass]="{'has-drivers': nearbyDrivers.length > 0, 'no-drivers': nearbyDrivers.length === 0}">
      <div class="icon-container">
        <mat-icon *ngIf="nearbyDrivers.length > 0">radar</mat-icon>
        <mat-icon *ngIf="nearbyDrivers.length === 0">location_off</mat-icon>
      </div>
      <div class="info">
        <h3 *ngIf="nearbyDrivers.length > 0">{{ nearbyDrivers.length }} conductores cerca</h3>
        <p *ngIf="nearbyDrivers.length > 0">Tiempo estimado de asignación: 2-5 min</p>

        <h3 *ngIf="nearbyDrivers.length === 0">No hay conductores disponibles</h3>
        <p *ngIf="nearbyDrivers.length === 0">Por favor, intenta de nuevo en unos minutos.</p>
      </div>
    </div>
  `,
  styles: [`
    .availability-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      border-radius: 12px;
      background: white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      border-left: 4px solid transparent;
    }
    .has-drivers {
      border-left-color: #10b981;
    }
    .no-drivers {
      border-left-color: #ef4444;
    }
    .icon-container {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #f3f4f6;
      color: #4b5563;
    }
    .has-drivers .icon-container {
      background: #d1fae5;
      color: #059669;
    }
    .no-drivers .icon-container {
      background: #fee2e2;
      color: #dc2626;
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
export class TripAvailabilitySummaryComponent {
  @Input() nearbyDrivers: any[] = [];
}
