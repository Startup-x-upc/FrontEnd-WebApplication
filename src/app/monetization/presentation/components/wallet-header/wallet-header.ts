import { Component, computed, inject, Input, OnInit } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MonetizationStore } from '../../../application/monetization.store';

/**
 * @summary Full-width header for the driver wallet page.
 * Displays the available balance, status badge, and a low-balance warning when applicable.
 * Designed to sit at the top of the /conductor/wallet page.
 * @author Sebastian Andres Aiquipa Poma
 */
@Component({
  selector: 'app-wallet-header',
  standalone: true,
  imports: [MatProgressSpinnerModule, MatIconModule],
  templateUrl: './wallet-header.html',
  styleUrl: './wallet-header.css',
})
export class WalletHeader implements OnInit {
  /** Driver ID whose wallet should be loaded and displayed. */
  @Input({ required: true }) driverId!: string;

  /** Threshold below which a "low balance" warning is shown. */
  @Input() lowBalanceThreshold: number = 15;

  /** Application store for monetization state. */
  protected store = inject(MonetizationStore);

  /** Formatted balance with 2 decimals. */
  protected formattedBalance = computed(() => {
    const wallet = this.store.wallet();
    return wallet ? wallet.balance.toFixed(2) : '0.00';
  });

  /** True when the wallet status is ACTIVE. */
  protected isActive = computed(() => this.store.wallet()?.status === 'ACTIVE');

  /** True when the balance is below the low-balance threshold. */
  protected isLowBalance = computed(() => {
    const wallet = this.store.wallet();
    return wallet !== null && wallet.balance < this.lowBalanceThreshold;
  });

  ngOnInit(): void {
    this.store.loadWallet(this.driverId);
  }
}
