import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { FarePolicy } from '../domain/model/fare-policy.entity';
import { Wallet } from '../domain/model/wallet.entity';
import { WalletTransaction } from '../domain/model/wallet-transaction.entity';

import { MonetizationService } from '../../shared/infrastructure/api/generated/monetization/monetization.service';
import {
  WalletResponse,
  WalletRechargeResponse,
  WalletTransactionResponse,
  FarePolicyResponse,
} from '../../shared/infrastructure/api/generated/model';
import { WalletAssembler } from './wallet-assembler';
import { WalletTransactionAssembler } from './wallet-transaction-assembler';

/**
 * @summary Infrastructure gateway for the Monetization bounded context.
 * Delegates to the Orval-generated MonetizationService (real backend).
 * @author Jesús Iván Castillo Vidal
 */
@Injectable({ providedIn: 'root' })
export class MonetizationApiService {
  private monetization = inject(MonetizationService);

  // ── Fare policy ──────────────────────────────────────────────────────

  getFarePolicy(): Observable<FarePolicy> {
    return this.monetization.getCurrentFarePolicy().pipe(
      map((res: FarePolicyResponse) => {
        const policy = new FarePolicy();
        policy.id = res.id || '';
        policy.baseFare = res.baseFare ?? 2.5;
        policy.pricePerKm = res.pricePerKm ?? 1.2;
        policy.minimumFare = res.minimumFare ?? 4.0;
        return policy;
      })
    );
  }

  updateFarePolicy(policy: FarePolicy): Observable<FarePolicy> {
    return this.monetization.configureFarePolicy({
      baseFare: policy.baseFare,
      pricePerKm: policy.pricePerKm,
      minimumFare: policy.minimumFare,
      commissionRate: FarePolicy.PLATFORM_COMMISSION_RATE,
    }).pipe(
      map((res: FarePolicyResponse) => {
        const updated = new FarePolicy();
        updated.id = res.id || '';
        updated.baseFare = res.baseFare ?? policy.baseFare;
        updated.pricePerKm = res.pricePerKm ?? policy.pricePerKm;
        updated.minimumFare = res.minimumFare ?? policy.minimumFare;
        return updated;
      })
    );
  }

  // ── Wallet ───────────────────────────────────────────────────────────

  getWalletByDriverId(driverId: string): Observable<Wallet> {
    return this.monetization.getWalletByDriverId(driverId).pipe(
      map((res: WalletResponse) => WalletAssembler.toEntity(res))
    );
  }

  // ── Transactions ─────────────────────────────────────────────────────

  getWalletTransactions(walletId: string): Observable<WalletTransaction[]> {
    return this.monetization.getTransactionHistory(walletId).pipe(
      map((res: any) => {
        const items: WalletTransactionResponse[] = Array.isArray(res) ? res : (res?.data ?? []);
        return WalletTransactionAssembler.toEntities(items);
      })
    );
  }

  // ponytail: getWalletTransactionsByType delegates to same endpoint + client filter
  getWalletTransactionsByType(walletId: string, type: string): Observable<WalletTransaction[]> {
    return this.getWalletTransactions(walletId).pipe(
      map(txns => txns.filter(t => t.type === type))
    );
  }

  // ── Recharge ─────────────────────────────────────────────────────────

  /**
   * Recharges the wallet. walletId comes from the already-loaded wallet in the store.
   * Single REST call: POST /monetization/wallets/{walletId}/recharge
   */
  rechargeWallet(walletId: string, amount: number): Observable<Wallet> {
    return this.monetization.rechargeWallet(walletId, { amount }).pipe(
      map((res: WalletRechargeResponse) => WalletAssembler.toEntity(res.wallet!))
    );
  }

  // ponytail: applyCommission removed — backend applies commission automatically
  // via RideCompletedEventListener when ride status advances to COMPLETED.
  // Frontend calling POST /monetization/wallets/{id}/apply-commission would 403 (ADMIN only).
}
