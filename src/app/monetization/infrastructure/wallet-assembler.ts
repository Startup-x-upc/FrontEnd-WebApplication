import { WalletResponse } from './wallet-response';
import { Wallet } from '../domain/model/wallet.entity';

/**
 * @summary Maps WalletResponse DTOs from the API into Wallet domain entities.
 * Uses static methods — no @Injectable, no side effects.
 * @author Sebastian Andres Aiquipa Poma
 */
export class WalletAssembler {
  /**
   * Converts a raw WalletResponse DTO into a Wallet domain entity.
   *
   * @param response - The raw wallet object returned by json-server.
   * @returns A fully populated Wallet entity.
   */
  static toEntity(response: WalletResponse): Wallet {
    return new Wallet({
      id: response.id,
      driverId: response.driverId,
      balance: response.balance,
      status: response.status,
    });
  }
}
