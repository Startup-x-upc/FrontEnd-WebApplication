import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { IamStore } from '../../../application/iam.store';

/**
 * @summary Presentation component for passenger registration.
 * Renders a reactive form with email, password and confirmation.
 * Delegates all logic to IamStore.
 * @author Sprint 3 — IAM Bounded Context
 */
@Component({
  selector: 'app-register-passenger-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './register-passenger-form.html',
  styleUrl: './register-passenger-form.css',
})
export class RegisterPassengerForm {
  /** Application store for IAM — injected via inject() (Angular 21 style). */
  protected store = inject(IamStore);

  /** Controls password field visibility toggle. */
  protected passwordVisible = false;

  /** Controls confirm password field visibility toggle. */
  protected confirmPasswordVisible = false;

  /** Reactive form group for passenger registration. */
  protected form = new FormGroup({
    fullName: new FormControl('', [Validators.required, Validators.minLength(3)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(4)]),
    confirmPassword: new FormControl('', [Validators.required]),
  });

  /** Shortcut accessor for the fullName form control. */
  get fullName(): FormControl {
    return this.form.get('fullName') as FormControl;
  }

  /** Shortcut accessor for the email form control. */
  get email(): FormControl {
    return this.form.get('email') as FormControl;
  }

  /** Shortcut accessor for the password form control. */
  get password(): FormControl {
    return this.form.get('password') as FormControl;
  }

  /** Shortcut accessor for the confirm password form control. */
  get confirmPassword(): FormControl {
    return this.form.get('confirmPassword') as FormControl;
  }

  /** True when passwords do not match and both fields have been touched. */
  get passwordsMismatch(): boolean {
    return (
      this.form.get('password')!.touched &&
      this.form.get('confirmPassword')!.touched &&
      this.form.value.password !== this.form.value.confirmPassword
    );
  }

  /** Toggles the password field visibility. */
  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  /** Toggles the confirm password field visibility. */
  toggleConfirmPasswordVisibility(): void {
    this.confirmPasswordVisible = !this.confirmPasswordVisible;
  }

  /**
   * Handles form submission. Validates, checks password match,
   * and delegates registration to the IamStore.
   */
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.form.value.password !== this.form.value.confirmPassword) {
      this.form.get('confirmPassword')?.setErrors({ mismatch: true });
      this.form.get('confirmPassword')?.markAsTouched();
      return;
    }

    const email = this.form.value.email ?? '';
    const password = this.form.value.password ?? '';
    const fullName = this.form.value.fullName ?? '';
    this.store.registerPassenger(email, password, fullName);
  }
}
