import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FareSummary } from '../../components/fare-summary/fare-summary';

/**
 * @summary Standalone demo view for the fare-summary component.
 * Lets the user adjust the distance and see the calculated fare update live.
 * Used for testing US-19 in isolation while ride-dispatch is being built.
 * @author Sebastian Andres Aiquipa Poma
 */
@Component({
  selector: 'app-fare-demo',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, FareSummary],
  template: `
    <div class="container">
      <h2>Demo: Cálculo de tarifa (US-19)</h2>

      <mat-form-field appearance="outline">
        <mat-label>Distancia (km)</mat-label>
        <input matInput type="number" [(ngModel)]="distance" min="0" step="0.1" />
      </mat-form-field>

      <app-fare-summary [distanceKm]="distance"></app-fare-summary>
    </div>
  `,
  styles: [
    `
      .container {
        padding: 32px;
        max-width: 480px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      h2 {
        margin: 0;
      }
    `,
  ],
})
export class FareDemo {
  protected distance = 1.2;
}
