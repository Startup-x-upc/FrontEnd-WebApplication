import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';

import { FarePolicy } from '../domain/model/fare-policy.entity';
import { Wallet } from '../domain/model/wallet.entity';
import { WalletTransaction } from '../domain/model/wallet-transaction.entity';

import { FareConfigResponse } from './fare-config-response';
import { WalletResponse } from './wallet-response';
import { WalletTransactionResponse } from './wallet-transaction-response';
import { FareConfigAssembler } from './fare-config-assembler';
import { WalletAssembler } from './wallet-assembler';
import { WalletTransactionAssembler } from './wallet-transaction-assembler';

/**
 * @summary Infrastructure gateway to Monetization endpoints on json-server.
 * Handles fare policies, wallets, transactions, recharges, and commissions.
 * @author Sprint 3 — Monetization Bounded Context
 */
@Injectable({ providedIn: 'root' })
export class MonetizationApiService {
  /** HttpClient injected via inject() (Angular 21 style). */
  private http = inject(HttpClient);

  /** Base URL for the fake API. */
  private baseUrl = environment.apiBaseUrl;

  // ── Fare policy ──────────────────────────────────────────────────────

  /** Retrieves the current fare policy configuration. */
  getFarePolicy(): Observable<FarePolicy> {
    return this.http
      .get<FareConfigResponse[]>(`${this.baseUrl}/fareConfig`)
      .pipe(
        map((responses) => {
          if (responses.length > 0) return FareConfigAssembler.toEntity(responses[0]);
          const fallback = new FarePolicy();
          fallback.baseFare = 2.5;
          fallback.pricePerKm = 1.2;
          fallback.minimumFare = 4.0;
          return fallback;
        })
      );
  }

  /** Persists an updated fare policy configuration. */
  updateFarePolicy(policy: FarePolicy): Observable<FarePolicy> {
    const body: FareConfigResponse = {
      id: Number(policy.id),
      baseFare: policy.baseFare,
      pricePerKm: policy.pricePerKm,
      minimumFare: policy.minimumFare,
    };
    return this.http
      .put<FareConfigResponse>(`${this.baseUrl}/fareConfig/${policy.id}`, body)
      .pipe(map(FareConfigAssembler.toEntity));
  }

  // ── Wallet ───────────────────────────────────────────────────────────

  /** Retrieves a wallet by driver ID. */
  getWalletByDriverId(driverId: string): Observable<Wallet> {
    return this.http
      .get<WalletResponse[]>(`${this.baseUrl}/wallets?driverId=${driverId}`)
      .pipe(
        map((responses) => {
          if (responses.length > 0) return WalletAssembler.toEntity(responses[0]);
          const fallback = new Wallet();
          fallback.driverId = driverId;
          return fallback;
        })
      );
  }

  // ── Transactions (US-30) ─────────────────────────────────────────────

  /**
   * Retrieves all transactions for a given wallet.
   * Sorted newest first.
   *
   * @param walletId - The wallet ID to query.
   * @returns Observable<WalletTransaction[]> with all transactions.
   */
  getWalletTransactions(walletId: string): Observable<WalletTransaction[]> {
    return this.http
      .get<WalletTransactionResponse[]>(
        `${this.baseUrl}/walletTransactions?walletId=${walletId}`
      )
      .pipe(map(WalletTransactionAssembler.toEntities));
  }

  /**
   * Retrieves transactions filtered by type.
   *
   * @param walletId - The wallet ID to query.
   * @param type - 'TOP_UP' or 'COMMISSION'.
   * @returns Observable<WalletTransaction[]> with filtered transactions.
   */
  getWalletTransactionsByType(
    walletId: string,
    type: string
  ): Observable<WalletTransaction[]> {
    return this.http
      .get<WalletTransactionResponse[]>(
        `${this.baseUrl}/walletTransactions?walletId=${walletId}&type=${type}`
      )
      .pipe(map(WalletTransactionAssembler.toEntities));
  }

  // ── Recharge (US-27, mock) ───────────────────────────────────────────

  /**
   * Mocks a wallet recharge. Creates a TOP_UP transaction and updates
   * the wallet balance.
   *
   * @param driverId - The driver whose wallet to recharge.
   * @param amount - The amount in soles to add.
   * @returns Observable<Wallet> with the updated wallet.
   */
  rechargeWallet(driverId: string, amount: number): Observable<Wallet> {
    // Step 1: Get current wallet
    return this.getWalletByDriverId(driverId).pipe(
      switchMap((wallet: Wallet) => {
        const newBalance = Math.round((wallet.balance + amount) * 100) / 100;
        // Step 2: Create TOP_UP transaction
        return this.http
          .post<WalletTransactionResponse>(`${this.baseUrl}/walletTransactions`, {
            walletId: wallet.id,
            tripId: null,
            type: 'TOP_UP',
            amount,
            resultingBalance: newBalance,
            timestamp: new Date().toISOString(),
          })
          .pipe(
            switchMap(() => {
              // Step 3: Update wallet balance
              return this.http
                .patch<WalletResponse>(`${this.baseUrl}/wallets/${wallet.id}`, {
                  balance: newBalance,
                })
                .pipe(map(WalletAssembler.toEntity));
            })
          );
      })
    );
  }

  // ── Commission (US-29, mock) ─────────────────────────────────────────

  /**
   * Applies the 5% platform commission when a ride is completed.
   * Creates a COMMISSION transaction and deducts from the wallet.
   * Idempotent: skips if a transaction already exists for this tripId.
   *
   * @param driverId - The driver whose wallet to deduct from.
   * @param tripId - The completed ride/trip ID.
   * @param rideFare - The fare charged for the ride.
   * @returns Observable<Wallet> with the updated wallet, or null if already processed.
   */
  applyCommission(
    driverId: string,
    tripId: string,
    rideFare: number
  ): Observable<Wallet> {
    // Check if commission already applied for this trip
    return this.http
      .get<WalletTransactionResponse[]>(
        `${this.baseUrl}/walletTransactions?tripId=${tripId}&type=COMMISSION`
      )
      .pipe(
        switchMap((existing) => {
          if (existing.length > 0) {
            // Already processed — return current wallet without changes
            return this.getWalletByDriverId(driverId);
          }

          return this.getWalletByDriverId(driverId).pipe(
            switchMap((wallet: Wallet) => {
              const commission = Math.round(rideFare * FarePolicy.PLATFORM_COMMISSION_RATE * 100) / 100;
              const newBalance = Math.round(Math.max(0, wallet.balance - commission) * 100) / 100;

              return this.http
                .post<WalletTransactionResponse>(
                  `${this.baseUrl}/walletTransactions`,
                  {
                    walletId: wallet.id,
                    tripId,
                    type: 'COMMISSION',
                    amount: -commission,
                    resultingBalance: newBalance,
                    timestamp: new Date().toISOString(),
                  }
                )
                .pipe(
                  switchMap(() => {
                    return this.http
                      .patch<WalletResponse>(
                        `${this.baseUrl}/wallets/${wallet.id}`,
                        { balance: newBalance }
                      )
                      .pipe(map(WalletAssembler.toEntity));
                  })
                );
            })
          );
        })
      );
  }
}
