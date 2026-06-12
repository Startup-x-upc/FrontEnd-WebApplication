import { Component, inject, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { IamStore } from '../../../application/iam.store';

/**
 * @summary Edit form for the user's profile (fullName and photoUrl).
 * Pre-populates fields from the current profile in IamStore.
 * Emits `saved` when the update succeeds or `cancelled` to abort.
 * @author Sprint 3 — IAM Bounded Context
 */
@Component({
  selector: 'app-profile-edit-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './profile-edit-form.html',
  styleUrl: './profile-edit-form.css',
})
export class ProfileEditForm {
  /** Application store for IAM. */
  private store = inject(IamStore);

  /** Emitted when the profile is successfully saved. */
  saved = output<void>();

  /** Emitted when the user cancels editing. */
  cancelled = output<void>();

  /** Reactive form pre-populated from the current profile. */
  protected form = new FormGroup({
    fullName: new FormControl(this.store.currentProfile()?.fullName ?? '', [
      Validators.required,
      Validators.minLength(3),
    ]),
    photoUrl: new FormControl(this.store.currentProfile()?.photoUrl ?? ''),
  });

  get fullName(): FormControl { return this.form.get('fullName') as FormControl; }
  get photoUrl(): FormControl { return this.form.get('photoUrl') as FormControl; }

  /** True while the store is saving. */
  protected get saving(): boolean {
    return this.store.isLoading();
  }

  /** Preview URL for the photo (binds to the input value). */
  get photoPreview(): string {
    return this.form.value.photoUrl || '';
  }

  /**
   * Submits the form. If valid, calls IamStore.updateProfile()
   * and emits `saved` on success, or shows the error.
   */
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.store.updateProfile({
      fullName: this.form.value.fullName ?? '',
      photoUrl: this.form.value.photoUrl ?? '',
    });

    // The store's isLoading will flip to false after the API call.
    // We watch for the message signal to confirm success.
    // Since the store is signal-based, we use a simple setTimeout
    // to check if the operation completed without error.
    const checkInterval = setInterval(() => {
      if (!this.store.isLoading()) {
        clearInterval(checkInterval);
        if (this.store.message() && !this.store.error()) {
          this.saved.emit();
        }
      }
    }, 200);
  }

  /** Emits cancelled to return to view mode. */
  onCancel(): void {
    this.cancelled.emit();
  }
}
