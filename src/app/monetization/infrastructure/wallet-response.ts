/**
 * @summary Raw response contract for the /wallets endpoint from json-server.
 * @author Sebastian Andres Aiquipa Poma
 * */

export interface WalletResponse {
  /**ID of the wallet*/
  id: string;
  /**ID of the driver*/
  driverId: string;
  /**Balance of the wallet*/
  balance: number;
  /**Status of the wallet*/
  status: 'ACTIVE' | 'BLOCKED';
}
