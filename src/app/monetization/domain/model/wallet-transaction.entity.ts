import { BaseEntity } from '../../../shared/domain/model/base-entity';

export type TransactionType = 'TOP_UP' | 'TOP_UP_FAILED' | 'COMMISSION';

export class WalletTransaction implements BaseEntity {
  id: number = 0;
  walletId: number = 0;
  tripId: number = 0;
  type: TransactionType = 'TOP_UP';
  amount: number = 0;
  resultingBalance: number = 0;

  getId(): number                          { return this.id; }
  setId(v: number): void                  { this.id = v; }
  getWalletId(): number                   { return this.walletId; }
  setWalletId(v: number): void            { this.walletId = v; }
  getTripId(): number                     { return this.tripId; }
  setTripId(v: number): void              { this.tripId = v; }
  getType(): TransactionType              { return this.type; }
  setType(v: TransactionType): void       { this.type = v; }
  getAmount(): number                     { return this.amount; }
  setAmount(v: number): void              { this.amount = v; }
  getResultingBalance(): number           { return this.resultingBalance; }
  setResultingBalance(v: number): void    { this.resultingBalance = v; }
}
