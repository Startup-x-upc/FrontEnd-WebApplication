import { computed, inject, Injectable, signal } from '@angular/core';
import { FarePolicy } from '../domain/model/fare-policy.entity';
import { Wallet } from '../domain/model/wallet.entity';
import { MonetizationApiService } from '../infrastructure/monetization-api.service';

/**
 * @summary Application service that coordinates monetization state
 * for the Monetization bounded context.
 * Handles fare policy loading, fare estimation, and wallet balance state.
 * Uses Angular signals for reactive state management.
 * @author Sebastian Andres Aiquipa Poma
 */
@Injectable({ providedIn: 'root' })
export class MonetizationStore {
  /** Infrastructure gateway for Monetization API calls. */
  private monetizationApi = inject(MonetizationApiService);

  // ─── State signals ────────────────────────────────────────────────────────

  /** Internal signal holding the active fare policy, or null if not yet loaded. */
  private farePolicySignal = signal<FarePolicy | null>(null);

  /** Internal signal holding the latest estimated fare, or null. */
  private estimatedFareSignal = signal<number | null>(null);

  /** Internal signal holding the current driver's wallet, or null. */
  private walletSignal = signal<Wallet | null>(null);

  /** Internal signal indicating whether a request is in progress. */
  private loadingSignal = signal<boolean>(false);

  /** Internal signal holding the current error message. */
  private errorSignal = signal<string | null>(null);

  // ─── Public computed state ────────────────────────────────────────────────

  /** The currently loaded fare policy. Null if not yet loaded. */
  readonly farePolicy = computed(() => this.farePolicySignal());

  /** The latest estimated fare for a calculated route. Null if none calculated yet. */
  readonly estimatedFare = computed(() => this.estimatedFareSignal());

  /** The currently loaded wallet for the active driver. Null if not loaded. */
  readonly wallet = computed(() => this.walletSignal());

  /** True while any monetization request is pending. */
  readonly isLoading = computed(() => this.loadingSignal());

  /** The current error message, or null if there is none. */
  readonly error = computed(() => this.errorSignal());

  /** True if the driver's wallet has positive balance. */
  readonly hasPositiveBalance = computed(() => {
    const wallet = this.walletSignal();
    return wallet !== null && wallet.balance > 0;
  });

  // ─── Actions ──────────────────────────────────────────────────────────────

  /**
   * Loads the active fare policy from the API.
   * Caches the policy in state so subsequent fare estimates can reuse it without refetching.
   */
  loadFareConfig(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.monetizationApi.getFareConfig().subscribe({
      next: (policy: FarePolicy) => {
        this.farePolicySignal.set(policy);
        this.loadingSignal.set(false);
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('No se pudo cargar la configuración de tarifas.');
      },
    });
  }

  /**
   * Calculates the estimated fare for a given distance, applying the active fare policy.
   * Formula: max(minimumFare, baseFare + pricePerKm * distance).
   *
   *
   *
   * @param distanceKm - The distance in kilometers to calculate the fare for.
   */
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

    const calculated = policy.baseFare + policy.pricePerKm * distanceKm;
    const finalFare = Math.max(policy.minimumFare, calculated);
    this.estimatedFareSignal.set(finalFare);
    this.errorSignal.set(null);
  }

  /**
   * Loads the wallet for a given driver ID from the API.
   *
   * @param driverId - The driver ID whose wallet to retrieve.
   */
  loadWallet(driverId: string): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.monetizationApi.getWalletByDriverId(driverId).subscribe({
      next: (wallet: Wallet) => {
        this.walletSignal.set(wallet);
        this.loadingSignal.set(false);
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('No se pudo cargar el wallet del conductor.');
      },
    });
  }

  /**
   * Clears the current error signal.
   */
  clearError(): void {
    this.errorSignal.set(null);
  }
}
