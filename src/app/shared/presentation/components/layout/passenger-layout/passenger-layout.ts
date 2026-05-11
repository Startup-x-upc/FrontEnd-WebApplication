import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { IamStore } from '../../../../../iam/application/iam.store';

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
    MatButtonModule
  ],
  templateUrl: './passenger-layout.html',
  styles: [`
    .passenger-layout-container {
      height: 100vh;
      background-color: #f5f7fa;
    }
    .sidebar {
      width: 280px;
      background-color: #ffffff;
      border-right: 1px solid #e0e0e0;
      display: flex;
      flex-direction: column;
    }
    .sidebar-header {
      padding: 24px;
      text-align: center;
      border-bottom: 1px solid #f0f0f0;
    }
    .sidebar-header h2 {
      margin: 0;
      color: #1a73e8;
      font-weight: 700;
      font-size: 24px;
    }
    .user-block {
      padding: 24px;
      display: flex;
      align-items: center;
      gap: 16px;
      border-bottom: 1px solid #f0f0f0;
    }
    .avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      object-fit: cover;
    }
    .user-info {
      display: flex;
      flex-direction: column;
    }
    .user-name {
      font-weight: 600;
      color: #333;
    }
    .user-role {
      font-size: 12px;
      color: #666;
    }
    mat-nav-list {
      flex: 1;
      padding-top: 16px;
    }
    .active-link {
      background-color: #e8f0fe !important;
      color: #1a73e8 !important;
    }
    .active-link mat-icon {
      color: #1a73e8 !important;
    }
    .sidebar-footer {
      padding: 16px;
      border-top: 1px solid #f0f0f0;
    }
    .main-content {
      padding: 32px;
      height: 100%;
      box-sizing: border-box;
      overflow-y: auto;
    }
  `]
})
export class PassengerLayoutComponent {
  private iamStore: IamStore = inject(IamStore);

  profile = this.iamStore.currentProfile;

  logout(): void {
    this.iamStore.signOut();
  }
}
