import { BaseEntity } from '../../../shared/domain/model/base-entity';

export type WalletStatus = 'ACTIVE' | 'BLOCKED';

export class Wallet implements BaseEntity {
  id: string = '';
  driverId: string = '';
  balance: number = 0;
  status: WalletStatus = 'ACTIVE';


  topUp(amount: number): void         { this.balance = Math.round((this.balance + amount) * 100) / 100; }
  applyCommission(amount: number): void { this.balance = Math.round((this.balance - amount) * 100) / 100; }
  block(): void                       { this.status = 'BLOCKED'; }
  unblock(): void                     { this.status = 'ACTIVE'; }
  hasPositiveBalance(): boolean       { return this.balance > 0; }
}
