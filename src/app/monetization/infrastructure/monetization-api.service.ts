import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FarePolicyResponse } from './fare-policy-response';
import { WalletResponse } from './wallet-response';
import { FarePolicy } from '../domain/model/fare-policy.entity';
import { Wallet } from '../domain/model/wallet.entity';
import { FarePolicyAssembler } from './fare-policy-assembler';
import { WalletAssembler } from './wallet-assembler';

@Injectable({ providedIn: 'root' })
/**
 * @summary Infrastructure gateway to the Monetization endpoints on json-server.
 * Handles HTTP communication for fare configuration and wallet retrieval.
 * @author Sebastian Andres Aiquipa Poma
 */
export class MonetizationApiService {
  /** HttpClient injected via the inject() function (Angular 21 style). */
  private http = inject(HttpClient);

  /** Base URL for the fake API, resolved from environment configuration. */
  private baseUrl = environment.apiBaseUrl;

  /**
   * Retrieves the current fare policy from json-server.
   * The /fareConfig endpoint returns an array; we take the first entry as the active policy.
   *
   * @returns Observable<FarePolicy> with the active fare policy.
   */
  getFareConfig(): Observable<FarePolicy> {
    return this.http.get<FarePolicyResponse[]>(`${this.baseUrl}/fareConfig`).pipe(
      switchMap((policies: FarePolicyResponse[]) => {
        if (!policies.length) {
          return throwError(() => new Error('FARE_CONFIG_NOT_FOUND'));
        }
        return of(FarePolicyAssembler.toEntity(policies[0]));
      }),
    );
  }

  /**
   * Retrieves the wallet linked to a given driver ID.
   *
   * @param driverId - The driver ID to look up in the wallets collection.
   * @returns Observable<Wallet> with the driver's wallet data.
   */
  getWalletByDriverId(driverId: string): Observable<Wallet> {
    return this.http.get<WalletResponse[]>(`${this.baseUrl}/wallets?driverId=${driverId}`).pipe(
      map((wallets: WalletResponse[]) => {
        if (!wallets.length) {
          throw new Error('WALLET_NOT_FOUND');
        }
        return WalletAssembler.toEntity(wallets[0]);
      }),
    );
  }
}
