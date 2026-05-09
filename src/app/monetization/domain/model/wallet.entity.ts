/**
 * @summary Represents the status of a wallet.
 * @author Sebastian Aiquipa Poma
 */

export type WalletStatus = 'ACTIVE' | 'BLOCKED';

/**
 * @summary Represents a wallet for a given driver.
 * @author Sebastian Aiquipa Poma
 */

export class Wallet {
    /**ID of the wallet*/
    id: string;
    /**ID of the driver*/
    driverId: string;
    /**Balance of the wallet*/
    balance: number;
    /**Status of the wallet*/
    status: WalletStatus;
    constructor(props: { id: string; driverId: string; balance: number; status: WalletStatus }) {
      this.id = props.id;
      this.driverId = props.driverId;
      this.balance = props.balance;
      this.status = props.status;
    }
}
