import { Component, EventEmitter, Output, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

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
    <form [formGroup]="form" class="location-form-card" (ngSubmit)="onSubmit()">
      <div class="inputs-container">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Punto de partida</mat-label>
          <mat-icon matPrefix>my_location</mat-icon>
          <input matInput formControlName="origin" placeholder="Ej: Av. La Marina 2000">
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Destino</mat-label>
          <mat-icon matPrefix>location_on</mat-icon>
          <input matInput formControlName="destination" placeholder="Ej: Plaza San Miguel">
        </mat-form-field>
      </div>

      <div class="actions">
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">
          Trazar ruta
        </button>
      </div>
    </form>
  `,
  styles: [`
    .location-form-card {
      background: white;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    .inputs-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .w-full {
      width: 100%;
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 8px;
    }
  `]
})
export class TripLocationFormComponent implements OnChanges {
  @Input() origin: string = '';
  @Input() destination: string = '';
  @Output() locationSelected = new EventEmitter<{origin: string, destination: string, distanceKm: number}>();

  form = new FormGroup({
    origin: new FormControl('', Validators.required),
    destination: new FormControl('', Validators.required)
  });

  ngOnChanges(changes: SimpleChanges) {
    if (changes['origin'] && changes['origin'].currentValue !== undefined) {
      this.form.patchValue({ origin: this.origin }, { emitEvent: false });
    }
    if (changes['destination'] && changes['destination'].currentValue !== undefined) {
      this.form.patchValue({ destination: this.destination }, { emitEvent: false });
    }
  }

  onSubmit() {
    if (this.form.valid) {
      // Mock distance calculation based on some logic or fixed for now
      let mockDistance = Math.floor(Math.random() * 8) + 2; // Random 2-10 km
      
      const originStr = this.form.value.origin!;
      const destStr = this.form.value.destination!;

      // Simple mock distance if coordinates are provided
      const originParts = originStr.split(',');
      const destParts = destStr.split(',');
      if (originParts.length === 2 && destParts.length === 2) {
        const lat1 = parseFloat(originParts[0]);
        const lng1 = parseFloat(originParts[1]);
        const lat2 = parseFloat(destParts[0]);
        const lng2 = parseFloat(destParts[1]);
        if (!isNaN(lat1) && !isNaN(lat2)) {
          mockDistance = Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(lng1 - lng2, 2)) * 111;
          mockDistance = Math.max(1, Math.round(mockDistance));
        }
      }

      this.locationSelected.emit({
        origin: originStr,
        destination: destStr,
        distanceKm: mockDistance
      });
    }
  }
}
