import { Component, computed, inject, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MonetizationStore } from '../../../application/monetization.store';

/**
 * @summary Reusable card that displays the estimated fare for a given distance.
 * Loads the active fare policy on init, then recalculates the fare whenever the
 * distanceKm input changes. Shows a breakdown of how the fare was computed.
 * @author Sebastian Andres Aiquipa Poma
 */
@Component({
  selector: 'app-fare-summary',
  standalone: true,
  imports: [MatCardModule, MatProgressSpinnerModule, MatIconModule],
  templateUrl: './fare-summary.html',
  styleUrl: './fare-summary.css',
})
export class FareSummary implements OnInit, OnChanges {
  /** Distance in kilometers between origin and destination. */
  @Input({ required: true }) distanceKm!: number;

  /** Application store for monetization state. */
  protected store = inject(MonetizationStore);

  /** Formatted fare with 2 decimals. */
  protected formattedFare = computed(() => {
    const fare = this.store.estimatedFare();
    return fare !== null ? fare.toFixed(2) : '--';
  });

  /** Formatted distance with 1 decimal. */
  protected formattedDistance = computed(() => this.distanceKm.toFixed(1));

  /** Whether the minimum fare was applied (calculated < minimum). */
  protected minimumApplied = computed(() => {
    const policy = this.store.farePolicy();
    const fare = this.store.estimatedFare();
    if (!policy || fare === null) return false;
    const calculated = policy.baseFare + policy.pricePerKm * this.distanceKm;
    return calculated < policy.minimumFare;
  });

  /** Subtotal before the minimum-fare rule is applied (for breakdown display). */
  protected subtotal = computed(() => {
    const policy = this.store.farePolicy();
    if (!policy) return '0.00';
    return (policy.baseFare + policy.pricePerKm * this.distanceKm).toFixed(2);
  });

  ngOnInit(): void {
    this.store.loadFareConfig();
    this.recalculateWhenReady();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['distanceKm'] && this.store.farePolicy()) {
      this.store.calculateEstimatedFare(this.distanceKm);
    }
  }

  /**
   * Polls the store until the fare policy is available, then triggers calculation.
   * Avoids race condition where calculate is called before the policy is loaded.
   */
  private recalculateWhenReady(): void {
    if (this.store.farePolicy()) {
      this.store.calculateEstimatedFare(this.distanceKm);
      return;
    }
    setTimeout(() => this.recalculateWhenReady(), 50);
  }
}
