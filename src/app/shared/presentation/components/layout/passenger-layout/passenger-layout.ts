import { Component, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { IamStore } from '../../../../../iam/application/iam.store';
import { TrustReputationStore } from '../../../../../trust-reputation/application/trust-reputation.store';
import { ReputationBadgeComponent } from '../../../../../trust-reputation/presentation/components/reputation-badge/reputation-badge';

@Component({
  selector: 'app-passenger-layout',
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
  templateUrl: './passenger-layout.html',
  styles: [`
    .passenger-layout-container {
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
      background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%);
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
      border: 2px solid #e8f0fe;
    }
    .avatar-fallback {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: #e8f0fe;
      color: #1a73e8;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid #e8f0fe;
    }
    .avatar-fallback mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
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
      background-color: #e8f0fe !important;
      color: #1a73e8 !important;
      border-radius: 8px;
    }
    .active-link mat-icon {
      color: #1a73e8 !important;
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
  `]
})
export class PassengerLayoutComponent {
  private iamStore: IamStore = inject(IamStore);
  protected trustStore = inject(TrustReputationStore);

  profile = this.iamStore.currentProfile;
  avatarError = false;

  constructor() {
    effect(() => {
      const account = this.iamStore.currentAccount();
      if (account?.id && account.role === 'PASSENGER') {
        this.trustStore.loadPassengerReputation(account.id);
      }
    });

    effect(() => {
      // Reset error when profile signal changes
      this.profile();
      this.avatarError = false;
    });
  }

  logout(): void {
    this.iamStore.signOut();
  }
}
