import { Component } from '@angular/core';
import { WalletStat } from '../../components/wallet-stat/wallet-stat';
import { WalletHeader } from '../../components/wallet-header/wallet-header';

/**
 * @summary Standalone demo view for the wallet components.
 * Displays both the compact stat cell (driver dashboard) and the full header
 * (wallet page) so reviewers can see both pieces ready for integration.
 * @author Sebastian Andres Aiquipa Poma
 */
@Component({
  selector: 'app-wallet-demo',
  standalone: true,
  imports: [WalletStat, WalletHeader],
  template: `
    <div class="container">
      <h2>Demo: Saldo del wallet (US-28)</h2>
      <p>Driver de prueba: <code>d-001</code></p>

      <section>
        <h3>Variante: stat (dashboard del conductor)</h3>
        <div class="stat-frame">
          <app-wallet-stat driverId="d-001"></app-wallet-stat>
        </div>
      </section>

      <section>
        <h3>Variante: header (pantalla wallet)</h3>
        <app-wallet-header driverId="d-001"></app-wallet-header>
      </section>
    </div>
  `,
  styles: [
    `
      .container {
        padding: 32px;
        max-width: 900px;
        display: flex;
        flex-direction: column;
        gap: 32px;
      }
      h2,
      h3 {
        margin: 0;
      }
      h3 {
        font-size: 1rem;
        color: rgba(0, 0, 0, 0.6);
        margin-bottom: 12px;
      }
      section {
        display: flex;
        flex-direction: column;
      }
      .stat-frame {
        max-width: 200px;
        border: 1px dashed rgba(0, 0, 0, 0.15);
        border-radius: 8px;
        background: white;
      }
      code {
        background: rgba(0, 0, 0, 0.05);
        padding: 2px 6px;
        border-radius: 4px;
      }
    `,
  ],
})
export class WalletDemo {}
