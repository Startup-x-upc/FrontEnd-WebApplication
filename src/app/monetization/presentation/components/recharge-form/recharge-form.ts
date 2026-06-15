import { Component, effect, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * @summary Mock recharge form for the driver's wallet.
 * Allows entering a custom amount or selecting from quick-chip presets.
 * @author Sprint 3 — Monetization Bounded Context
 */
@Component({
  selector: 'app-recharge-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule],
  templateUrl: './recharge-form.html',
  styleUrl: './recharge-form.css',
})
export class RechargeForm {
  /** Current wallet balance. */
  readonly currentBalance = input<number | null>(null);

  /** True while the recharge request is in progress. */
  readonly loading = input<boolean>(false);

  /** Emitted when the user confirms a recharge amount. */
  readonly recharged = output<number>();

  /** Quick-select chip amounts. */
  readonly quickAmounts = [5, 10, 20, 50];

  /** Custom amount entered by the user. */
  customAmount: number | null = null;

  /** Currently selected quick amount (null if custom). */
  selectedQuick: number | null = null;

  /** Error message for invalid amounts. */
  errorMessage: string | null = null;

  constructor() {
    effect(() => {
      const balance = this.currentBalance();
      this.customAmount = null;
      this.selectedQuick = null;
      this.errorMessage = null;
    });
  }

  /**
   * Selects a quick amount chip.
   */
  selectQuick(amount: number): void {
    this.selectedQuick = amount;
    this.customAmount = null;
    this.errorMessage = null;
  }

  /**
   * Handles custom amount input.
   */
  onCustomInput(): void {
    this.selectedQuick = null;
    this.errorMessage = null;
  }

  /**
   * Validates and emits the recharge amount.
   */
  onSubmit(): void {
    const amount = this.selectedQuick ?? this.customAmount;
    if (!amount || amount < 5) {
      this.errorMessage = 'El monto mínimo de recarga es S/ 5.00.';
      return;
    }
    if (amount > 500) {
      this.errorMessage = 'El monto máximo es S/ 500.00.';
      return;
    }
    this.errorMessage = null;
    this.recharged.emit(amount);
  }
}
