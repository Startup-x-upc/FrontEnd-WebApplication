import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment.development';

import { FarePolicy } from '../domain/model/fare-policy.entity';
import { Wallet } from '../domain/model/wallet.entity';
import { WalletTransaction } from '../domain/model/wallet-transaction.entity';

import { FareConfigResponse } from './fare-config-response';
import { WalletResponse } from './wallet-response';
import { FareConfigAssembler } from './fare-config-assembler';
import { WalletAssembler } from './wallet-assembler';

@Injectable({ providedIn: 'root' })
export class MonetizationApiService {
  private readonly basePath = `${environment.apiBaseUrl}`;

  constructor(private readonly http: HttpClient) {}

  getFarePolicy(): Observable<FarePolicy> {
    return this.http.get<FareConfigResponse[]>(`${this.basePath}/fareConfig`)
      .pipe(map(responses => {
        if (responses.length > 0) return FareConfigAssembler.toEntity(responses[0]);
        const fallback = new FarePolicy();
        fallback.baseFare = 2.5;
        fallback.pricePerKm = 1.2;
        fallback.minimumFare = 4.0;
        return fallback;
      }));
  }

  getWalletByDriverId(driverId: string): Observable<Wallet> {
    return this.http.get<WalletResponse[]>(`${this.basePath}/wallets?driverId=${driverId}`)
      .pipe(map(responses => {
        if (responses.length > 0) return WalletAssembler.toEntity(responses[0]);
        const fallback = new Wallet();
        fallback.driverId = driverId;
        return fallback;
      }));
  }

  getWalletTransactions(walletId: string): Observable<WalletTransaction[]> {
    return this.http.get<any[]>(`${this.basePath}/walletTransactions?walletId=${walletId}`)
      .pipe(map(() => [])); // To be implemented when transaction DTOs are needed
  }
}
