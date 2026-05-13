import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RideRequest } from '../../../domain/model/ride-request.entity';

/**
 * @summary Humanized summary card for a single pending ride request.
 * Shows passenger identity (photo, name), status, and monetary resumen.
 * Excludes raw coordinates to maintain neat aesthetic hierarchy.
 * @author Jesús Iván Castillo Vidal
 */
@Component({
  selector: 'app-pending-request-card',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="request-card">
      <div class="card-body">
        <!-- Passenger Identity Context -->
        <div class="identity-wrapper">
          <img *ngIf="request.passengerPhotoUrl" 
               [src]="request.passengerPhotoUrl" 
               alt="Foto Pasajero" 
               class="passenger-avatar" />
          
          <div *ngIf="!request.passengerPhotoUrl" class="passenger-avatar-fallback">
            <mat-icon>person</mat-icon>
          </div>

          <div class="passenger-meta">
            <span class="passenger-name">{{ request.passengerName || 'Pasajero Registrado' }}</span>
            <div class="badge-status">
              <span class="dot-pulse"></span>
              Solicitud abierta
            </div>
          </div>
        </div>

        <!-- Fast Scan Econ/Dist Meta Info -->
        <div class="economics-row">
          <div class="econ-item">
            <mat-icon>payments</mat-icon>
            <span class="fare-value">S/ {{ request.estimatedFare | number:'1.2-2' }}</span>
          </div>
          <div class="separator"></div>
          <div class="econ-item" *ngIf="request.distanceKm > 0">
            <mat-icon>straighten</mat-icon>
            <span class="dist-value">{{ request.distanceKm | number:'1.1-1' }} km</span>
          </div>
        </div>
      </div>

      <!-- Main CTA -->
      <button mat-flat-button
              color="accent"
              class="details-cta"
              (click)="viewDetails.emit(request)"
              aria-label="Ver detalles de la solicitud">
        <mat-icon>arrow_forward</mat-icon>
        Ver detalles
      </button>
    </div>
  `,
  styles: [`
    .request-card {
      background: white;
      border-radius: 14px;
      padding: 16px 20px;
      border: 1px solid #e5e7eb;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .request-card:hover {
      border-color: #d1d5db;
      box-shadow: 0 4px 12px rgba(0,0,0,0.06);
    }

    .card-body {
      display: flex;
      flex-direction: column;
      gap: 14px;
      flex: 1;
      min-width: 0;
    }

    /* Identity Profile Section */
    .identity-wrapper {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .passenger-avatar {
      width: 46px;
      height: 46px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #f3f4f6;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .passenger-avatar-fallback {
      width: 46px;
      height: 46px;
      border-radius: 50%;
      background: #f3f4f6;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #9ca3af;
    }
    .passenger-meta {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .passenger-name {
      font-size: 15px;
      font-weight: 700;
      color: #111827;
      letter-spacing: -0.2px;
    }

    /* Dynamic Live Status Badge */
    .badge-status {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 700;
      color: #2563eb;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .dot-pulse {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #3b82f6;
      box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
      }
      70% {
        transform: scale(1);
        box-shadow: 0 0 0 6px rgba(59, 130, 246, 0);
      }
      100% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
      }
    }

    /* Economics row */
    .economics-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .econ-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .econ-item mat-icon {
      font-size: 16px;
      height: 16px;
      width: 16px;
      color: #9ca3af;
    }
    .fare-value {
      font-size: 14px;
      font-weight: 700;
      color: #16a34a; /* Safe positive emerald color */
    }
    .dist-value {
      font-size: 13px;
      font-weight: 600;
      color: #6b7280;
    }
    .separator {
      width: 1px;
      height: 12px;
      background: #e5e7eb;
    }

    /* Details CTA Button */
    .details-cta {
      flex-shrink: 0;
      height: 44px;
      font-size: 14px;
      font-weight: 700;
      border-radius: 10px;
      padding: 0 18px;
    }
    .details-cta mat-icon {
      font-size: 18px;
      height: 18px;
      width: 18px;
      margin-right: 6px;
    }
  `],
})
export class PendingRequestCardComponent {
  @Input({ required: true }) request!: RideRequest;
  @Output() viewDetails = new EventEmitter<RideRequest>();
}
