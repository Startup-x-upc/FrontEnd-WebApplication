import { Component, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MonetizationStore } from '../../../application/monetization.store';
import { WalletBalanceCardComponent } from '../wallet-balance-card/wallet-balance-card';
import { TransactionHistory } from '../transaction-history/transaction-history';
import { RechargeForm } from '../recharge-form/recharge-form';
import { IamStore } from '../../../../iam/application/iam.store';
import { DriverManagementStore } from '../../../../driver-management/application/driver-management.store';

/**
 * @summary Dedicated monetization page for the DRIVER role.
 * Displays wallet balance (US-28), transaction history (US-30),
 * and recharge form (US-27).
 * @author Sprint 3 — Monetization Bounded Context
 */
@Component({
  selector: 'app-monetization-page',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    WalletBalanceCardComponent,
    TransactionHistory,
    RechargeForm,
  ],
  templateUrl: './monetization-page.html',
  styleUrl: './monetization-page.css',
})
export class MonetizationPageComponent {
  protected store = inject(MonetizationStore);
  private iamStore = inject(IamStore);
  private driverMgmtStore = inject(DriverManagementStore);

  readonly isLoading = this.store.isLoading;
  readonly error = this.store.error;
  readonly message = this.store.message;

  /** The current driver ID, loaded reactively. */
  private currentDriverId: string | null = null;

  constructor() {
    this.store.loadFarePolicy();

    const account = this.iamStore.currentAccount();
    if (account?.id) {
      this.driverMgmtStore.loadDriverByAccountId(account.id);
    }

    effect(() => {
      const driver = this.driverMgmtStore.driver();
      if (driver?.id) {
        this.currentDriverId = driver.id;
        this.store.loadWallet(driver.id);
      }
    });
  }

  /** Handles recharge form submission. */
  onRecharge(amount: number): void {
    if (this.currentDriverId) {
      this.store.recharge(this.currentDriverId, amount);
    }
  }

  /** Handles transaction filter change. */
  onFilterChange(filter: 'ALL' | 'TOP_UP' | 'COMMISSION'): void {
    this.store.setTransactionFilter(filter);
  }

  onRetry(): void {
    this.store.clearError();
    if (this.currentDriverId) {
      this.store.loadWallet(this.currentDriverId);
    }
    this.store.loadFarePolicy();
  }
}
