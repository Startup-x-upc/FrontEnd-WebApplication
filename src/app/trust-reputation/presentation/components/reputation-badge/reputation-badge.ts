import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

/**
 * @summary Displays a star-based reputation score with average and count.
 * Handles three sizes and empty state (no ratings).
 * @author Sprint 3 — Trust & Reputation Bounded Context
 */
@Component({
  selector: 'app-reputation-badge',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './reputation-badge.html',
  styleUrl: './reputation-badge.css',
})
export class ReputationBadgeComponent {
  readonly averageScore = input<number | null>(null);
  readonly totalRatings = input<number>(0);
  readonly size = input<'small' | 'medium' | 'large'>('medium');
  readonly showCount = input<boolean>(true);
  readonly showLabel = input<boolean>(false);

  readonly fullStars = [1, 2, 3, 4, 5];

  readonly hasRatings = computed(() => this.averageScore() !== null && this.totalRatings() > 0);

  readonly fillPercentage = computed(() => {
    if (!this.hasRatings() || this.averageScore() === null) return 0;
    return (this.averageScore()! / 5) * 100;
  });
}
