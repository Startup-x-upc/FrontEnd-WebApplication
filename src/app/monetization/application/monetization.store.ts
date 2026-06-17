import { computed, inject, Injectable, signal } from '@angular/core';
import { FarePolicy } from '../domain/model/fare-policy.entity';
import { Wallet } from '../domain/model/wallet.entity';
import { WalletTransaction } from '../domain/model/wallet-transaction.entity';
import { MonetizationApiService } from '../infrastructure/monetization-api.service';

/**
 * @summary Application service for the Monetization bounded context.
 * Coordinates fare policy, fare estimation, wallet balance,
 * transaction history (US-30), recharge (US-27), and commission (US-29).
 * Uses Angular signals for reactive state management.
 * @author Sprint 3 — Monetization Bounded Context
 */
@Injectable({ providedIn: 'root' })
export class MonetizationStore {
  private api = inject(MonetizationApiService);

  // ── State signals ────────────────────────────────────────────────────

  private farePolicySignal = signal<FarePolicy | null>(null);
  private estimatedFareSignal = signal<number | null>(null);
  private walletSignal = signal<Wallet | null>(null);
  private transactionsSignal = signal<WalletTransaction[]>([]);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);
  private messageSignal = signal<string | null>(null);
  private activeFilterSignal = signal<'ALL' | 'TOP_UP' | 'COMMISSION'>('ALL');

  // ── Public computed state ────────────────────────────────────────────

  readonly farePolicy = computed(() => this.farePolicySignal());
  readonly estimatedFare = computed(() => this.estimatedFareSignal());
  readonly wallet = computed(() => this.walletSignal());
  readonly transactions = computed(() => this.transactionsSignal());
  readonly isLoading = computed(() => this.loadingSignal());
  readonly error = computed(() => this.errorSignal());
  readonly message = computed(() => this.messageSignal());
  readonly activeFilter = computed(() => this.activeFilterSignal());

  readonly hasPositiveBalance = computed(() => {
    const w = this.walletSignal();
    return w !== null && w.hasPositiveBalance();
  });

  /** Transactions filtered by the active type filter. */
  readonly filteredTransactions = computed(() => {
    const filter = this.activeFilterSignal();
    const txns = this.transactionsSignal();
    if (filter === 'ALL') return txns;
    return txns.filter((t) => t.type === filter);
  });

  /** Total count of transactions (unfiltered). */
  readonly transactionCount = computed(() => this.transactionsSignal().length);

  // ── Fare policy ──────────────────────────────────────────────────────

  loadFarePolicy(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.getFarePolicy().subscribe({
      next: (p) => {
        this.farePolicySignal.set(p);
        this.loadingSignal.set(false);
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('No se pudo cargar la configuración de tarifas. Verifica tu conexión a internet.');
      },
    });
  }

  /** Saves an updated fare policy and refreshes the local state. */
  saveFarePolicy(baseFare: number, pricePerKm: number, minimumFare: number): void {
    const current = this.farePolicySignal();
    if (!current) {
      this.errorSignal.set('La configuración de tarifas no ha sido cargada.');
      return;
    }
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    current.configure(baseFare, pricePerKm, minimumFare);
    this.api.updateFarePolicy(current).subscribe({
      next: (p) => {
        this.farePolicySignal.set(p);
        this.loadingSignal.set(false);
        this.messageSignal.set('Tarifas actualizadas correctamente.');
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('No se pudieron guardar las tarifas.');
      },
    });
  }

  calculateEstimatedFare(distanceKm: number): void {
    const policy = this.farePolicySignal();
    if (!policy) {
      this.errorSignal.set('La configuración de tarifas no ha sido cargada.');
      return;
    }
    if (distanceKm < 0) {
      this.errorSignal.set('La distancia no puede ser negativa.');
      return;
    }
    this.estimatedFareSignal.set(policy.calculate(distanceKm));
    this.errorSignal.set(null);
  }

  // ── Wallet ───────────────────────────────────────────────────────────

  loadWallet(driverId: string): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.getWalletByDriverId(driverId).subscribe({
      next: (w) => {
        this.walletSignal.set(w);
        this.loadTransactionHistory();
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('No se pudo cargar el wallet del conductor.');
      },
    });
  }

  // ── Transactions (US-30) ─────────────────────────────────────────────

  /**
   * Loads all transactions for the current wallet.
   * Requires the wallet to be loaded first.
   */
  loadTransactionHistory(): void {
    const wallet = this.walletSignal();
    if (!wallet?.id) {
      this.errorSignal.set('El wallet no ha sido cargado.');
      return;
    }
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.getWalletTransactions(wallet.id).subscribe({
      next: (txns) => {
        this.transactionsSignal.set(txns);
        this.loadingSignal.set(false);
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('No se pudo cargar el historial de transacciones.');
      },
    });
  }

  /** Sets the active transaction type filter. */
  setTransactionFilter(filter: 'ALL' | 'TOP_UP' | 'COMMISSION'): void {
    this.activeFilterSignal.set(filter);
  }

  // ── Recharge (US-27, mock) ───────────────────────────────────────────

  /**
   * Mocks a wallet recharge. Creates a TOP_UP transaction,
   * updates the wallet balance, and refreshes the transaction list.
   *
   * @param driverId - The driver whose wallet to recharge.
   * @param amount - The amount in soles to add.
   */
  recharge(driverId: string, amount: number): void {
    if (amount < 5) {
      this.errorSignal.set('El monto mínimo de recarga es S/ 5.00.');
      return;
    }
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.rechargeWallet(driverId, amount).subscribe({
      next: (wallet) => {
        this.walletSignal.set(wallet);
        this.messageSignal.set(
          `Recarga exitosa. Se acreditó S/ ${amount.toFixed(2)}.`
        );
        // Reload transactions after recharge
        this.loadTransactionHistory();
        this.loadingSignal.set(false);
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('No se pudo procesar la recarga.');
      },
    });
  }

  // ── Commission (US-29, mock) ─────────────────────────────────────────

  /**
   * Applies the 5% platform commission when a ride is completed.
   * Idempotent — safe to call multiple times for the same trip.
   *
   * @param driverId - The driver whose wallet to deduct from.
   * @param tripId - The completed ride ID.
   * @param rideFare - The fare charged for the ride.
   */
  applyCommission(driverId: string, tripId: string, rideFare: number): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.applyCommission(driverId, tripId, rideFare).subscribe({
      next: (wallet) => {
        const commission = rideFare * FarePolicy.PLATFORM_COMMISSION_RATE;
        this.walletSignal.set(wallet);
        this.messageSignal.set(
          `Viaje completado. Comisión de S/ ${commission.toFixed(2)} descontada.`
        );
        this.loadTransactionHistory();
        this.loadingSignal.set(false);
      },
      error: () => {
        this.loadingSignal.set(false);
        this.messageSignal.set('Viaje completado, pero no se pudo procesar la comisión. Contacta al administrador.');
      },
    });
  }

  // ── Clear ────────────────────────────────────────────────────────────

  clearError(): void {
    this.errorSignal.set(null);
  }

  clearMessage(): void {
    this.messageSignal.set(null);
  }
}
