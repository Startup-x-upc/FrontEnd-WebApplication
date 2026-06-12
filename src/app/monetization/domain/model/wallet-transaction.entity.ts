import { BaseEntity } from '../../../shared/domain/model/base-entity';

export type TransactionType = 'TOP_UP' | 'TOP_UP_FAILED' | 'COMMISSION';

export class WalletTransaction implements BaseEntity {
  /** Unique identifier for the transaction. */
  id: string = '';
  /** Foreign key to the wallet. */
  walletId: number = 0;
  /** Foreign key to the trip (empty string if TOP_UP). */
  tripId: string = '';
  /** Transaction type. */
  type: TransactionType = 'TOP_UP';
  /** Amount in soles. Positive for TOP_UP, negative for COMMISSION. */
  amount: number = 0;
  /** Wallet balance after this transaction was applied. */
  resultingBalance: number = 0;
  /** ISO date string of when the transaction occurred. */
  timestamp: string = '';
}
