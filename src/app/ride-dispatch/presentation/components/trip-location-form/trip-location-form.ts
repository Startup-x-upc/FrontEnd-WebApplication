import { Component, EventEmitter, Output, Input, OnChanges, SimpleChanges, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * @summary Checks whether a string looks like raw lat,lng coordinates.
 */
function isRawCoord(value: string): boolean {
  const parts = value.split(',');
  if (parts.length !== 2) return false;
  return !isNaN(parseFloat(parts[0])) && !isNaN(parseFloat(parts[1]));
}

/**
 * @summary Returns a human-friendly label for a location string.
 * If the value is raw coordinates, returns a descriptive fallback.
 */
function humanizeLocation(value: string, type: 'origin' | 'destination'): string {
  if (!value) return '';
  if (isRawCoord(value)) {
    return type === 'origin' ? 'Ubicación actual detectada' : 'Destino seleccionado en el mapa';
  }
  return value;
}

/**
 * @summary Returns the coordinate string as subtitle when the value is raw coords.
 */
function coordSubtitle(value: string): string | null {
  if (!value) return null;
  if (isRawCoord(value)) return value;
  return null;
}

/**
 * @summary Presentation component for selecting trip origin and destination.
 * Displays human-friendly labels instead of raw coordinates.
 * Location selection is driven by map clicks — no secondary "calculate" CTA.
 * @author Jesús Iván Castillo Vidal
 */
@Component({
  selector: 'app-trip-location-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="location-form-card">

      <!-- Map interaction hint -->
      <p class="step-hint">
        <mat-icon class="step-icon">touch_app</mat-icon>
        Toca el mapa para indicar tu origen y destino
      </p>

      <!-- Origin row -->
      <div class="location-row" [class.location-row--set]="originDisplay()">
        <div class="location-dot origin-dot"></div>
        <div class="location-text">
          <span class="location-label">Punto de partida</span>
          <span class="location-value" *ngIf="originDisplay(); else originEmpty">
            {{ originDisplay() }}
          </span>
          <ng-template #originEmpty>
            <span class="location-placeholder">Toca el mapa para fijar tu origen</span>
          </ng-template>
          <span class="location-coords" *ngIf="originSubtitle()">{{ originSubtitle() }}</span>
        </div>
        <button mat-icon-button type="button" class="clear-btn"
                *ngIf="originDisplay()"
                (click)="clearOrigin()"
                aria-label="Borrar origen">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="connector-line"></div>

      <!-- Destination row -->
      <div class="location-row" [class.location-row--set]="destinationDisplay()">
        <div class="location-dot dest-dot"></div>
        <div class="location-text">
          <span class="location-label">Destino</span>
          <span class="location-value" *ngIf="destinationDisplay(); else destEmpty">
            {{ destinationDisplay() }}
          </span>
          <ng-template #destEmpty>
            <span class="location-placeholder">
              {{ originDisplay() ? 'Ahora toca el destino en el mapa' : 'Primero fija tu origen' }}
            </span>
          </ng-template>
          <span class="location-coords" *ngIf="destinationSubtitle()">{{ destinationSubtitle() }}</span>
        </div>
        <button mat-icon-button type="button" class="clear-btn"
                *ngIf="destinationDisplay()"
                (click)="clearDestination()"
                aria-label="Borrar destino">
          <mat-icon>close</mat-icon>
        </button>
      </div>

    </div>
  `,
  styles: [`
    .location-form-card {
      background: white;
      padding: 18px 20px 14px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.07);
    }

    /* Step hint */
    .step-hint {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #9ca3af;
      margin: 0 0 14px;
      line-height: 1.4;
    }
    .step-icon {
      font-size: 15px;
      height: 15px;
      width: 15px;
      vertical-align: middle;
    }

    /* Location row */
    .location-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-radius: 8px;
      border: 1.5px solid #f3f4f6;
      background: #fafafa;
      transition: border-color 0.2s, background 0.2s;
    }
    .location-row--set {
      background: white;
      border-color: #e5e7eb;
    }

    /* Colored dot */
    .location-dot {
      width: 11px;
      height: 11px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .origin-dot {
      background: #10b981;
      box-shadow: 0 0 0 3px rgba(16,185,129,0.18);
    }
    .dest-dot {
      background: #ef4444;
      box-shadow: 0 0 0 3px rgba(239,68,68,0.18);
    }

    /* Connector line */
    .connector-line {
      width: 1.5px;
      height: 8px;
      background: #e5e7eb;
      margin: 2px 0 2px 21px;
    }

    /* Text block */
    .location-text {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 1px;
      min-width: 0;
    }
    .location-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: #9ca3af;
    }
    .location-value {
      font-size: 13px;
      font-weight: 500;
      color: #1f2937;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .location-placeholder {
      font-size: 12px;
      color: #c4c9d4;
    }
    .location-coords {
      font-size: 10px;
      color: #d1d5db;
      font-family: 'Courier New', monospace;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: 1px;
    }

    /* Clear button */
    .clear-btn {
      width: 26px;
      height: 26px;
      line-height: 26px;
      flex-shrink: 0;
    }
    .clear-btn mat-icon {
      font-size: 15px;
      height: 15px;
      width: 15px;
      color: #9ca3af;
    }
  `]
})
export class TripLocationFormComponent implements OnChanges {
  /** Raw origin string from parent (may be coordinates or address). */
  @Input() origin: string = '';
  /** Raw destination string from parent (may be coordinates or address). */
  @Input() destination: string = '';
  /** Emitted when the user requests clearing the origin. */
  @Output() clearOriginRequested = new EventEmitter<void>();
  /** Emitted when the user requests clearing the destination. */
  @Output() clearDestinationRequested = new EventEmitter<void>();

  /** Kept for structural compatibility (inputs are map-driven). */
  form = new FormGroup({
    origin: new FormControl(''),
    destination: new FormControl('')
  });

  /** Internal reactive signals for humanized display. */
  private originSignal = signal<string>('');
  private destinationSignal = signal<string>('');

  /** Human-friendly display label for origin. */
  originDisplay = computed(() => humanizeLocation(this.originSignal(), 'origin'));
  /** Human-friendly display label for destination. */
  destinationDisplay = computed(() => humanizeLocation(this.destinationSignal(), 'destination'));
  /** Coordinate subtitle for origin (only shown when raw coords). */
  originSubtitle = computed(() => coordSubtitle(this.originSignal()));
  /** Coordinate subtitle for destination (only shown when raw coords). */
  destinationSubtitle = computed(() => coordSubtitle(this.destinationSignal()));

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['origin']) {
      this.originSignal.set(this.origin ?? '');
    }
    if (changes['destination']) {
      this.destinationSignal.set(this.destination ?? '');
    }
  }

  /** Requests the parent to clear the origin location. */
  clearOrigin(): void {
    this.clearOriginRequested.emit();
  }

  /** Requests the parent to clear the destination location. */
  clearDestination(): void {
    this.clearDestinationRequested.emit();
  }
}
