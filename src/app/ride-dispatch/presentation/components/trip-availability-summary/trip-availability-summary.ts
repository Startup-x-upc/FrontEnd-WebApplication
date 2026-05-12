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
        <h3>Conductores disponibles en la zona</h3>
        <p>Disponibilidad referencial • Actualización manual</p>
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


  `]
})
export class TripAvailabilitySummaryComponent {
  /** Array of nearby driver objects returned from the store. */
  @Input() nearbyDrivers: any[] = [];
}
