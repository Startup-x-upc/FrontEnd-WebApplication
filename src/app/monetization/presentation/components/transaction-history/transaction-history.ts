import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { WalletTransaction } from '../../../domain/model/wallet-transaction.entity';

/**
 * @summary Displays the wallet transaction history with filter tabs.
 * Shows TOP_UP (green), COMMISSION (orange), and TOP_UP_FAILED (red)
 * with amount, resulting balance, and timestamp.
 * @author Sprint 3 — Monetization Bounded Context
 */
@Component({
  selector: 'app-transaction-history',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './transaction-history.html',
  styleUrl: './transaction-history.css',
})
export class TransactionHistory {
  /** The list of transactions to display. */
  readonly transactions = input.required<WalletTransaction[]>();

  /** The currently active filter. */
  readonly activeFilter = input<'ALL' | 'TOP_UP' | 'COMMISSION'>('ALL');

  /** Emitted when the user changes the filter. */
  readonly filterChange = output<'ALL' | 'TOP_UP' | 'COMMISSION'>();

  /** Returns the icon name for a transaction type. */
  typeIcon(type: string): string {
    switch (type) {
      case 'TOP_UP': return 'add_circle';
      case 'COMMISSION': return 'remove_circle';
      case 'TOP_UP_FAILED': return 'error';
      default: return 'help';
    }
  }

  /** Returns a CSS class for the transaction type. */
  typeClass(type: string): string {
    switch (type) {
      case 'TOP_UP': return 'txn--topup';
      case 'COMMISSION': return 'txn--commission';
      case 'TOP_UP_FAILED': return 'txn--failed';
      default: return '';
    }
  }

  /** Formats a transaction amount with sign. */
  formatAmount(amount: number): string {
    return amount >= 0 ? `+ S/ ${amount.toFixed(2)}` : `- S/ ${Math.abs(amount).toFixed(2)}`;
  }
}
