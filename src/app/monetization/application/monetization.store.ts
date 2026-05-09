import { computed, inject, Injectable, signal } from '@angular/core';
import { FarePolicy } from '../domain/model/fare-policy.entity';
import { Wallet } from '../domain/model/wallet.entity';
import { MonetizationApiService } from '../infrastructure/monetization-api.service';

/**
 * @summary Application service for the Monetization bounded context.
 * Coordinates fare policy loading, fare estimation (delegated to the entity),
 * and wallet balance state. Uses Angular signals for reactive state management.
 * @author Sebastian Andres Aiquipa Poma
 */
@Injectable({ providedIn: 'root' })
export class MonetizationStore {
  private api = inject(MonetizationApiService);

  private farePolicySignal = signal<FarePolicy | null>(null);
  private estimatedFareSignal = signal<number | null>(null);
  private walletSignal = signal<Wallet | null>(null);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);

  readonly farePolicy = computed(() => this.farePolicySignal());
  readonly estimatedFare = computed(() => this.estimatedFareSignal());
  readonly wallet = computed(() => this.walletSignal());
  readonly isLoading = computed(() => this.loadingSignal());
  readonly error = computed(() => this.errorSignal());

  readonly hasPositiveBalance = computed(() => {
    const w = this.walletSignal();
    return w !== null && w.hasPositiveBalance();
  });

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
        this.errorSignal.set('No se pudo cargar la configuración de tarifas.');
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

  loadWallet(driverId: number): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.getWalletByDriverId(driverId).subscribe({
      next: (w) => {
        this.walletSignal.set(w);
        this.loadingSignal.set(false);
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('No se pudo cargar el wallet del conductor.');
      },
    });
  }

  clearError(): void {
    this.errorSignal.set(null);
  }
}
