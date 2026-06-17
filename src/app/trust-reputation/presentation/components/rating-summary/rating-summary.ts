import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DriverReputation } from '../../../domain/model/driver-reputation.entity';
import { PassengerReputation } from '../../../domain/model/passenger-reputation.entity';
import { ReputationBadgeComponent } from '../reputation-badge/reputation-badge';

/**
 * @summary Wraps ReputationBadge with a labeled card for profile pages.
 * Handles loading and empty states.
 * @author Sprint 3 — Trust & Reputation Bounded Context
 */
@Component({
  selector: 'app-rating-summary',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule, ReputationBadgeComponent],
  templateUrl: './rating-summary.html',
  styleUrl: './rating-summary.css',
})
export class RatingSummaryComponent {
  readonly reputation = input<DriverReputation | PassengerReputation | null>(null);
  readonly role = input<'DRIVER' | 'PASSENGER'>('DRIVER');
  readonly loading = input<boolean>(false);

  get averageScore(): number | null {
    const rep = this.reputation();
    if (!rep || !rep.hasRatings()) return null;
    return rep.averageScore;
  }

  get totalRatings(): number { return this.reputation()?.totalRatings ?? 0; }

  get hasRatings(): boolean { return this.reputation() !== null && this.reputation()!.hasRatings(); }
}
