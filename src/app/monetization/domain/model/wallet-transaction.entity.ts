import { BaseEntity } from '../../../shared/domain/model/base-entity';

export type TransactionType = 'TOP_UP' | 'TOP_UP_FAILED' | 'COMMISSION';

export class WalletTransaction implements BaseEntity {
  id: string = '';
  walletId: number = 0;
  tripId: number = 0;
  type: TransactionType = 'TOP_UP';
  amount: number = 0;
  resultingBalance: number = 0;

}
