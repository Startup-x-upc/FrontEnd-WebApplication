import { Component, computed, inject, Input, OnInit } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MonetizationStore } from '../../../application/monetization.store';

/**
 * @summary Compact stat cell that displays a driver's wallet balance.
 * Designed to be embedded inside a stat grid (e.g., the driver dashboard top row).
 * Renders without a card border so it visually aligns with sibling stats.
 * @author Sebastian Andres Aiquipa Poma
 */
@Component({
  selector: 'app-wallet-stat',
  standalone: true,
  imports: [MatProgressSpinnerModule, MatIconModule],
  templateUrl: './wallet-stat.html',
  styleUrl: './wallet-stat.css',
})
export class WalletStat implements OnInit {
  /** Driver ID whose wallet should be loaded and displayed. */
  @Input({ required: true }) driverId!: string;

  /** Application store for monetization state. */
  protected store = inject(MonetizationStore);

  /** Convenience computed for the balance, formatted to 2 decimals. */
  protected formattedBalance = computed(() => {
    const wallet = this.store.wallet();
    return wallet ? wallet.balance.toFixed(2) : '0.00';
  });

  ngOnInit(): void {
    this.store.loadWallet(this.driverId);
  }
}
