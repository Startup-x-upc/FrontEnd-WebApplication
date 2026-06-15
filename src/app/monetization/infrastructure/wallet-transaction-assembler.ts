import { WalletTransaction, TransactionType } from '../domain/model/wallet-transaction.entity';
import { WalletTransactionResponse } from './wallet-transaction-response';

/**
 * @summary Maps WalletTransactionResponse DTOs from json-server into
 * WalletTransaction domain entities.
 * Uses static methods — no @Injectable, no side effects.
 * @author Sprint 3 — Monetization Bounded Context
 */
export class WalletTransactionAssembler {

  /**
   * Converts a raw WalletTransactionResponse DTO into a WalletTransaction entity.
   *
   * @param response - The raw transaction object returned by json-server.
   * @returns A fully populated WalletTransaction entity.
   */
  static toEntity(response: WalletTransactionResponse): WalletTransaction {
    const entity = new WalletTransaction();
    entity.id = response.id;
    entity.walletId = response.walletId;
    entity.tripId = response.tripId ? String(response.tripId) : '';
    entity.type = response.type as TransactionType;
    entity.amount = response.amount;
    entity.resultingBalance = response.resultingBalance;
    entity.timestamp = response.timestamp;
    return entity;
  }

  /**
   * Converts a list of raw responses into WalletTransaction entities.
   *
   * @param responses - Array of raw transaction objects.
   * @returns Array of WalletTransaction entities, sorted newest first.
   */
  static toEntities(responses: WalletTransactionResponse[]): WalletTransaction[] {
    return responses
      .map(r => WalletTransactionAssembler.toEntity(r))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Converts a WalletTransaction entity into a plain object for POST requests.
   *
   * @param entity - The WalletTransaction domain entity to serialize.
   * @returns A plain object matching the db.json walletTransactions schema.
   */
  static toResponse(entity: WalletTransaction): WalletTransactionResponse {
    return {
      id: entity.id,
      walletId: entity.walletId,
      tripId: entity.tripId || null,
      type: entity.type,
      amount: entity.amount,
      resultingBalance: entity.resultingBalance,
      timestamp: entity.timestamp,
    };
  }
}
