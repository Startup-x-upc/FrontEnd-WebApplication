import { Wallet } from '../domain/model/wallet.entity';
import { WalletResponse } from './wallet-response';

export class WalletAssembler {
  static toEntity(response: WalletResponse): Wallet {
    const entity = new Wallet();
    entity.id = response.id;
    entity.driverId = response.driverId;
    entity.balance = response.balance;
    entity.status = response.status;
    return entity;
  }
}
