import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-fare-summary-card',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="fare-card">
      <div class="fare-header">
        <h3>Resumen del viaje</h3>
        <span class="distance">{{ distanceKm | number:'1.1-1' }} km</span>
      </div>
      
      <div class="fare-amount">
        <span class="currency">S/</span>
        <span class="value">{{ estimatedFare | number:'1.2-2' }}</span>
      </div>
      <p class="fare-note">Precio estimado. Puede variar ligeramente por tráfico o desvíos.</p>

      <button mat-flat-button color="primary" class="w-full" (click)="confirm.emit()">
        Confirmar solicitud
      </button>
    </div>
  `,
  styles: [`
    .fare-card {
      background: white;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      border: 1px solid #e5e7eb;
    }
    .fare-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .fare-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #374151;
    }
    .distance {
      background: #f3f4f6;
      padding: 4px 8px;
      border-radius: 16px;
      font-size: 12px;
      color: #4b5563;
      font-weight: 500;
    }
    .fare-amount {
      display: flex;
      align-items: baseline;
      gap: 4px;
      color: #1a73e8;
    }
    .currency {
      font-size: 20px;
      font-weight: 600;
    }
    .value {
      font-size: 36px;
      font-weight: 700;
      letter-spacing: -1px;
    }
    .fare-note {
      font-size: 12px;
      color: #6b7280;
      margin: 8px 0 20px;
      line-height: 1.4;
    }
    .w-full {
      width: 100%;
      height: 48px;
      font-size: 16px;
      border-radius: 8px;
    }
  `]
})
export class FareSummaryCardComponent {
  @Input() estimatedFare: number | null = null;
  @Input() distanceKm: number = 0;
  @Output() confirm = new EventEmitter<void>();
}
