import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Wallet } from '../../../domain/model/wallet.entity';

/**
 * @summary Displays the driver's wallet balance with a visual status indicator.
 * Shows a warning when the balance is zero or negative.
 * @author Jesús Iván Castillo Vidal
 */
@Component({
  selector: 'app-wallet-balance-card',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="wallet-card" [class.wallet-card--warning]="!hasBalance">
      <div class="wallet-header">
        <mat-icon class="wallet-icon">account_balance_wallet</mat-icon>
        <span class="wallet-label">Saldo disponible</span>
      </div>

      <div class="wallet-amount">
        <span class="currency">S/</span>
        <span class="value">{{ wallet?.balance | number:'1.2-2' }}</span>
      </div>

      <div class="wallet-status" [class.status--ok]="hasBalance" [class.status--warn]="!hasBalance">
        <mat-icon>{{ hasBalance ? 'check_circle' : 'warning' }}</mat-icon>
        <span>{{ hasBalance ? 'Wallet activo' : 'Saldo insuficiente' }}</span>
      </div>

      <p class="wallet-warning" *ngIf="!hasBalance">
        Recarga tu wallet para poder activar tu disponibilidad.
      </p>
    </div>
  `,
  styles: [`
    .wallet-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      border: 1px solid #e5e7eb;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    .wallet-card--warning {
      border-color: #fcd34d;
      background: #fffbeb;
    }

    .wallet-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }
    .wallet-icon {
      font-size: 18px;
      height: 18px;
      width: 18px;
      color: #d97706;
    }
    .wallet-label {
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .wallet-amount {
      display: flex;
      align-items: baseline;
      gap: 4px;
      margin-bottom: 12px;
    }
    .currency {
      font-size: 20px;
      font-weight: 600;
      color: #374151;
    }
    .value {
      font-size: 36px;
      font-weight: 700;
      letter-spacing: -1px;
      color: #111827;
    }

    .wallet-status {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 500;
      border-radius: 20px;
      padding: 4px 10px;
      width: fit-content;
    }
    .wallet-status mat-icon {
      font-size: 14px;
      height: 14px;
      width: 14px;
    }
    .status--ok {
      background: #d1fae5;
      color: #065f46;
    }
    .status--warn {
      background: #fef3c7;
      color: #92400e;
    }

    .wallet-warning {
      margin: 12px 0 0;
      font-size: 12px;
      color: #92400e;
      line-height: 1.5;
    }
  `],
})
export class WalletBalanceCardComponent {
  @Input() wallet: Wallet | null = null;

  get hasBalance(): boolean {
    return this.wallet !== null && this.wallet.hasPositiveBalance();
  }
}
