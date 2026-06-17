import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * @summary A 5-star rating form for rating a driver (US-21)
 * or a passenger (US-22). Shows optional comment field for
 * low passenger scores (≤ 2).
 * @author Sprint 3 — Trust & Reputation Bounded Context
 */
@Component({
  selector: 'app-rating-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule],
  templateUrl: './rating-form.html',
  styleUrl: './rating-form.css',
})
export class RatingFormComponent {
  /** Who is being rated — 'DRIVER' or 'PASSENGER'. */
  readonly ratedParty = input.required<'DRIVER' | 'PASSENGER'>();
  /** Display name of the person being rated. */
  readonly ratedPartyName = input<string>('');
  /** Trip/ride ID this rating belongs to. */
  readonly tripId = input.required<string>();
  /** Driver ID. */
  readonly driverId = input.required<string>();
  /** Passenger ID. */
  readonly passengerId = input.required<string>();
  /** True while the request is in progress. */
  readonly submitting = input<boolean>(false);
  /** External error message. */
  readonly errorMessage = input<string | null>(null);

  /** Emitted when user submits their rating. */
  readonly submitted = output<{ score: number; comment?: string }>();
  /** Emitted when user skips rating. */
  readonly skipped = output<void>();

  readonly stars = [1, 2, 3, 4, 5];
  selectedScore = 0;
  hoveredStar = 0;
  comment = '';

  get scoreLabel(): string {
    switch (this.selectedScore) {
      case 1: return 'Muy malo';
      case 2: return 'Malo';
      case 3: return 'Regular';
      case 4: return 'Bueno';
      case 5: return '¡Excelente!';
      default: return '';
    }
  }

  selectScore(score: number): void { this.selectedScore = score; }

  onSubmit(): void {
    if (this.selectedScore === 0 || this.submitting()) return;
    this.submitted.emit({ score: this.selectedScore, comment: this.comment.trim() || undefined });
  }

  onSkip(): void { this.skipped.emit(); }
}
