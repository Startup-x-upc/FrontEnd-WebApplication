import { BaseEntity } from '../../../shared/domain/model/base-entity';

export type WalletStatus = 'ACTIVE' | 'BLOCKED';

export class Wallet implements BaseEntity {
  id: number = 0;
  driverId: number = 0;
  balance: number = 0;
  status: WalletStatus = 'ACTIVE';

  getId(): number                  { return this.id; }
  setId(v: number): void          { this.id = v; }
  getDriverId(): number           { return this.driverId; }
  setDriverId(v: number): void    { this.driverId = v; }
  getBalance(): number            { return this.balance; }
  setBalance(v: number): void     { this.balance = v; }
  getStatus(): WalletStatus       { return this.status; }
  setStatus(v: WalletStatus): void { this.status = v; }

  topUp(amount: number): void         { this.balance += amount; }
  applyCommission(amount: number): void { this.balance -= amount; }
  block(): void                       { this.status = 'BLOCKED'; }
  unblock(): void                     { this.status = 'ACTIVE'; }
  hasPositiveBalance(): boolean       { return this.balance > 0; }
}
