import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MonetizationStore } from '../../../application/monetization.store';

/**
 * @summary Admin page for configuring fare policy (base fare,
 * price per km, and minimum fare). Writes through MonetizationStore
 * to persist changes via json-server.
 * @author Sprint 3 — Monetization Bounded Context
 */
@Component({
  selector: 'app-admin-fare-config-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './admin-fare-config-page.html',
  styleUrl: './admin-fare-config-page.css',
})
export class AdminFareConfigPageComponent implements OnInit {
  protected store = inject(MonetizationStore);

  /** Local form model values, bound via ngModel. */
  baseFare = 0;
  pricePerKm = 0;
  minimumFare = 0;

  ngOnInit(): void {
    this.store.loadFarePolicy();
    // When the fare policy loads from the API, seed the form
    const check = setInterval(() => {
      const policy = this.store.farePolicy();
      if (policy) {
        this.baseFare = policy.baseFare;
        this.pricePerKm = policy.pricePerKm;
        this.minimumFare = policy.minimumFare;
        clearInterval(check);
      }
    }, 200);
    setTimeout(() => clearInterval(check), 5000);
  }

  onSave(): void {
    if (this.baseFare < 0 || this.pricePerKm < 0 || this.minimumFare < 0) {
      return;
    }
    this.store.clearMessage();
    this.store.saveFarePolicy(this.baseFare, this.pricePerKm, this.minimumFare);
  }

  hasChanges(): boolean {
    const p = this.store.farePolicy();
    if (!p) return false;
    return (
      this.baseFare !== p.baseFare ||
      this.pricePerKm !== p.pricePerKm ||
      this.minimumFare !== p.minimumFare
    );
  }
}
