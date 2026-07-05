import { Wallet, WalletStatus } from '../domain/model/wallet.entity';
import { WalletResponse } from '../../shared/infrastructure/api/generated/model';

export class WalletAssembler {
  static toEntity(response: WalletResponse): Wallet {
    const entity = new Wallet();
    entity.id = response.id || '';
    entity.driverId = response.driverId || '';
    entity.balance = response.balance ?? 0;
    entity.status = (response.status || 'ACTIVE') as WalletStatus;
    return entity;
  }
}
