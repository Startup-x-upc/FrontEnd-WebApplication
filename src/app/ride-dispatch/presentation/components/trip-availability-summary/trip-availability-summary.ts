import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

/**
 * @summary Presentation component that displays driver availability status
 * for the passenger. Shows count of nearby drivers with correct singular/plural
 * microcopy, and a clear empty state when no drivers are available.
 * @author Jesús Iván Castillo Vidal
 */
@Component({
  selector: 'app-trip-availability-summary',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <!-- Drivers available -->
    <div class="availability-card has-drivers" *ngIf="nearbyDrivers.length > 0">
      <div class="icon-container">
        <mat-icon>radar</mat-icon>
      </div>
      <div class="info">
        <h3>{{ nearbyDrivers.length }} {{ nearbyDrivers.length === 1 ? 'conductor' : 'conductores' }} cerca</h3>
        <p>Asignación estimada en 2–5 min</p>
      </div>
      <div class="badge">
        <span class="pulse-dot"></span>
      </div>
    </div>

    <!-- No drivers available -->
    <div class="availability-card no-drivers" *ngIf="nearbyDrivers.length === 0">
      <div class="icon-container">
        <mat-icon>location_off</mat-icon>
      </div>
      <div class="info">
        <h3>Sin conductores disponibles</h3>
        <p>Intenta nuevamente en unos minutos</p>
      </div>
    </div>
  `,
  styles: [`
    .availability-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 16px;
      border-radius: 12px;
      background: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      border-left: 4px solid transparent;
      position: relative;
      overflow: hidden;
    }
    .has-drivers {
      border-left-color: #10b981;
    }
    .no-drivers {
      border-left-color: #f59e0b;
    }

    /* Icon circle */
    .icon-container {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .has-drivers .icon-container {
      background: #d1fae5;
      color: #059669;
    }
    .no-drivers .icon-container {
      background: #fef3c7;
      color: #d97706;
    }

    /* Text */
    .info {
      flex: 1;
    }
    .info h3 {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      color: #1f2937;
    }
    .info p {
      margin: 3px 0 0;
      font-size: 12px;
      color: #6b7280;
    }

    /* Pulse indicator for active availability */
    .badge {
      display: flex;
      align-items: center;
      padding-right: 4px;
    }
    .pulse-dot {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5);
      animation: pulse 1.8s infinite;
    }
    @keyframes pulse {
      0%   { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5); }
      70%  { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
      100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }
  `]
})
export class TripAvailabilitySummaryComponent {
  /** Array of nearby driver objects returned from the store. */
  @Input() nearbyDrivers: any[] = [];
}
