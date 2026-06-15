import { Component, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { IamStore } from '../../../../../iam/application/iam.store';
import { DriverManagementStore } from '../../../../../driver-management/application/driver-management.store';
import { TrustReputationStore } from '../../../../../trust-reputation/application/trust-reputation.store';
import { ReputationBadgeComponent } from '../../../../../trust-reputation/presentation/components/reputation-badge/reputation-badge';

/**
 * @summary Shell layout for the DRIVER role. Provides sidebar navigation,
 * user context block and a content area with RouterOutlet.
 * @author Jesús Iván Castillo Vidal
 */
@Component({
  selector: 'app-driver-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    ReputationBadgeComponent,
  ],
  templateUrl: './driver-layout.html',
  styles: [`
    .driver-layout-container {
      height: 100vh;
      background-color: #f5f7fa;
    }
    .sidebar {
      width: 240px;
      background-color: #ffffff;
      border-right: 1px solid #ebebeb;
      display: flex;
      flex-direction: column;
    }
    .sidebar-header {
      padding: 18px 20px;
      border-bottom: 1px solid #f0f0f0;
      background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
    }
    .sidebar-header h2 {
      margin: 0;
      color: #ffffff;
      font-weight: 700;
      font-size: 18px;
      letter-spacing: 0.2px;
    }
    .user-block {
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      border-bottom: 1px solid #f5f5f5;
    }
    .user-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #fef3c7;
    }
    .user-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .user-name {
      font-weight: 600;
      color: #1f2937;
      font-size: 13px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .user-role {
      font-size: 11px;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    mat-nav-list {
      flex: 1;
      padding-top: 8px;
    }
    .active-link {
      background-color: #fef3c7 !important;
      color: #d97706 !important;
      border-radius: 8px;
    }
    .active-link mat-icon {
      color: #d97706 !important;
    }
    .sidebar-footer {
      padding: 12px 16px;
      border-top: 1px solid #f0f0f0;
    }
    .main-content {
      padding: 24px 28px;
      height: 100%;
      box-sizing: border-box;
      overflow-y: auto;
    }
  `],
})
export class DriverLayoutComponent {
  private iamStore: IamStore = inject(IamStore);
  private driverMgmtStore = inject(DriverManagementStore);
  protected trustStore = inject(TrustReputationStore);

  profile = this.iamStore.currentProfile;

  constructor() {
    // Load driver profile once on init (not reactive)
    const account = this.iamStore.currentAccount();
    if (account?.role === 'DRIVER') {
      this.driverMgmtStore.loadDriverByAccountId(account.id);
    }

    // Reactively load reputation once driver entity is available
    effect(() => {
      const driver = this.driverMgmtStore.driver();
      if (driver?.id) {
        this.trustStore.loadDriverReputation(driver.id);
      }
    });
  }

  logout(): void {
    this.iamStore.signOut();
  }
}
