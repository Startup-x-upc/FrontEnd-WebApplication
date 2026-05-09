import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { FarePolicy } from '../domain/model/fare-policy.entity';
import { Wallet } from '../domain/model/wallet.entity';
import { WalletTransaction } from '../domain/model/wallet-transaction.entity';

/**
 * @summary TEMPORARY STUB. Returns hardcoded data while the real infrastructure
 * (responses, assemblers, HTTP gateway) is being built by the infrastructure team.
 * Replace this file when the real MonetizationApiService lands.
 * @author Sebastian Andres Aiquipa Poma
 */
@Injectable({ providedIn: 'root' })
export class MonetizationApiService {
  getFarePolicy(): Observable<FarePolicy> {
    const p = new FarePolicy();
    p.id = 1;
    p.baseFare = 2.5;
    p.pricePerKm = 1.2;
    p.minimumFare = 4.0;
    return of(p).pipe(delay(200));
  }

  getWalletByDriverId(driverId: number): Observable<Wallet> {
    const w = new Wallet();
    w.id = 1;
    w.driverId = driverId;
    w.balance = 25.5;
    w.status = 'ACTIVE';
    return of(w).pipe(delay(200));
  }

  getWalletTransactions(walletId: number): Observable<WalletTransaction[]> {
    return of([]).pipe(delay(200));
  }
}
