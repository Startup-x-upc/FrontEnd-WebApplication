import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { IamStore } from '../../../application/iam.store';
import { ProfileEditForm } from '../profile-edit-form/profile-edit-form';
import { DriverManagementStore } from '../../../../driver-management/application/driver-management.store';
import { TrustReputationStore } from '../../../../trust-reputation/application/trust-reputation.store';
import { RatingSummaryComponent } from '../../../../trust-reputation/presentation/components/rating-summary/rating-summary';

/**
 * @summary Profile page for both passenger and driver roles.
 * Displays the current user's profile and allows editing via ProfileEditForm.
 * When toggled to edit mode, renders the edit form inline.
 * @author Sprint 3 — IAM Bounded Context
 */
@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ProfileEditForm,
    RatingSummaryComponent,
  ],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.css',
})
export class ProfilePage {
  /** Application store for IAM. */
  protected store = inject(IamStore);

  /** When true, shows the edit form instead of the view. */
  protected editMode = signal<boolean>(false);

  /** The current profile from the store. */
  protected readonly profile = this.store.currentProfile;

  /** The current account from the store. */
  protected readonly account = this.store.currentAccount;

  /** True while the store is processing a request. */
  protected readonly isLoading = this.store.isLoading;

  /** Success/info message from the store. */
  protected readonly message = this.store.message;

  /** Error message from the store. */
  protected readonly error = this.store.error;

  private driverMgmtStore = inject(DriverManagementStore);
  protected trustStore = inject(TrustReputationStore);
  protected readonly driver = this.driverMgmtStore.driver;

  constructor() {
    effect(() => {
      const account = this.account();
      if (!account?.id) return;
      if (account.role === 'DRIVER') {
        this.driverMgmtStore.loadDriverByAccountId(account.id);
        // Load driver reputation once the driver entity is available
        const driver = this.driver();
        if (driver?.id) {
          this.trustStore.loadDriverReputation(driver.id);
        }
      } else if (account.role === 'PASSENGER') {
        this.trustStore.loadPassengerReputation(account.id);
      }
    });
  }

  /** Returns the role label in Spanish. */
  get roleLabel(): string {
    const role = this.account()?.role;
    switch (role) {
      case 'PASSENGER': return 'Pasajero';
      case 'DRIVER': return 'Conductor';
      case 'ADMIN': return 'Administrador';
      default: return role ?? '';
    }
  }

  /** Enables edit mode. */
  enableEdit(): void {
    this.editMode.set(true);
    this.store.clearMessage();
  }

  /** Disables edit mode and returns to view. */
  cancelEdit(): void {
    this.editMode.set(false);
  }

  /**
   * Called when the edit form successfully saves.
   * Exits edit mode.
   */
  onProfileSaved(): void {
    this.editMode.set(false);
  }

  /** Dismisses the current info message. */
  dismissMessage(): void {
    this.store.clearMessage();
  }
}
