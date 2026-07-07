import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RideCandidate } from '../../../domain/model/ride-candidate.entity';

/**
 * @summary Presents the list of drivers who applied to the passenger's request.
 * Each card shows the driver's name, vehicle type and rating.
 * The passenger selects one via the "Elegir" button.
 * @author Jesús Iván Castillo Vidal
 */
@Component({
  selector: 'app-ride-candidates-list',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="candidates-wrapper">
      <div class="candidates-header">
        <mat-icon class="header-icon">people_alt</mat-icon>
        <div>
          <h3>{{ candidates.length }} {{ candidates.length === 1 ? 'conductor disponible' : 'conductores disponibles' }}</h3>
          <p>Elige al conductor de tu preferencia</p>
        </div>
      </div>

      <div class="candidate-list">
        @for (c of candidates; track c.id) {
          <div class="candidate-card">
            <img
              class="driver-photo"
              [src]="c.photoUrl || 'https://i.pravatar.cc/150?img=3'"
              [alt]="c.driverName"
            />
            <div class="driver-info">
              <span class="driver-name">{{ c.driverName }}</span>
              <span class="vehicle-type">{{ c.vehicleType }}</span>
              <span class="rating">
                <mat-icon class="star-icon">star</mat-icon>
                {{ c.ratingAverage | number:'1.1-1' }}
              </span>
            </div>
            <button
              mat-flat-button
              color="primary"
              class="select-btn"
              (click)="onSelect(c)"
              [attr.aria-label]="'Elegir a ' + c.driverName">
              Elegir
            </button>
          </div>
        }
      </div>


    </div>
  `,
  styles: [`
    .candidates-wrapper {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .candidates-header {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #eff6ff;
      border-radius: 12px;
      padding: 14px 16px;
      border-left: 4px solid #1a73e8;
    }
    .header-icon {
      color: #1a73e8;
      font-size: 24px;
      height: 24px;
      width: 24px;
      flex-shrink: 0;
    }
    .candidates-header h3 {
      margin: 0;
      font-size: 14px;
      font-weight: 700;
      color: #1e40af;
    }
    .candidates-header p {
      margin: 2px 0 0;
      font-size: 12px;
      color: #6b7280;
    }

    .candidate-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .candidate-card {
      display: flex;
      align-items: center;
      gap: 12px;
      background: white;
      border-radius: 12px;
      padding: 12px 14px;
      border: 1px solid #e5e7eb;
      box-shadow: 0 1px 4px rgba(0,0,0,0.05);
    }
    .driver-photo {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
      border: 2px solid #e5e7eb;
    }
    .driver-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .driver-name {
      font-size: 14px;
      font-weight: 700;
      color: #111827;
    }
    .vehicle-type {
      font-size: 12px;
      color: #6b7280;
    }
    .rating {
      display: flex;
      align-items: center;
      gap: 2px;
      font-size: 12px;
      font-weight: 600;
      color: #f59e0b;
    }
    .star-icon {
      font-size: 14px;
      height: 14px;
      width: 14px;
    }
    .select-btn {
      font-size: 13px;
      font-weight: 700;
      border-radius: 8px;
      flex-shrink: 0;
    }

    .refresh-btn {
      width: 100%;
      font-size: 13px;
      border-radius: 8px;
    }
    .refresh-btn mat-icon {
      margin-right: 4px;
      font-size: 16px;
      height: 16px;
      width: 16px;
    }
  `]
})
export class RideCandidatesListComponent {
  /** List of candidates to display. */
  @Input() candidates: RideCandidate[] = [];
  /** Emitted when the passenger selects a candidate. */
  @Output() candidateSelected = new EventEmitter<RideCandidate>();
  onSelect(candidate: RideCandidate): void {
    this.candidateSelected.emit(candidate);
  }
}
