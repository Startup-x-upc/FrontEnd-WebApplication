/**
 * @summary Raw response contract for the /walletTransactions endpoint from json-server.
 * Reflects exactly the JSON structure stored in db.json.
 * @author Sprint 3 — Monetization Bounded Context
 */
export interface WalletTransactionResponse {
  /** Unique identifier of the transaction. */
  id: string;
  /** The wallet this transaction belongs to. */
  walletId: string;
  /** The trip/ride associated with this transaction (null for TOP_UP). */
  tripId: string | null;
  /** Transaction type: 'TOP_UP', 'TOP_UP_FAILED', or 'COMMISSION'. */
  type: string;
  /** Amount in soles. Positive for TOP_UP, negative for COMMISSION. */
  amount: number;
  /** Wallet balance after this transaction was applied. */
  resultingBalance: number;
  /** ISO date string of when the transaction occurred. */
  timestamp: string;
}
