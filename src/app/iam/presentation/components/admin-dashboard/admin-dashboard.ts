import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { IamStore } from '../../../application/iam.store';

/**
 * @summary Admin dashboard shell with sidebar navigation and router outlet.
 * Children: /admin/drivers (US-06, US-26), /admin/fare-config (US-20).
 * @author Sprint 3 — Admin Shell (IAM Bounded Context)
 */
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatIconModule,
    MatListModule,
  ],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard {
  protected store = inject(IamStore);
}
