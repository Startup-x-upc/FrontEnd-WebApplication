import { Component, EventEmitter, Output } from '@angular/core';
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
export class TripLocationFormComponent {
  @Output() locationSelected = new EventEmitter<{origin: string, destination: string, distanceKm: number}>();

  form = new FormGroup({
    origin: new FormControl('', Validators.required),
    destination: new FormControl('', Validators.required)
  });

  onSubmit() {
    if (this.form.valid) {
      // Mock distance calculation based on some logic or fixed for now
      const mockDistance = Math.floor(Math.random() * 8) + 2; // Random 2-10 km
      this.locationSelected.emit({
        origin: this.form.value.origin!,
        destination: this.form.value.destination!,
        distanceKm: mockDistance
      });
    }
  }
}
