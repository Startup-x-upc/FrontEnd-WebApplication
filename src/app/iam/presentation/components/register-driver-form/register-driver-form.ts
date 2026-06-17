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
 * @summary Presentation component for driver registration.
 * Renders a reactive form with email, password, name, and vehicle type.
 * The driver account is created with PENDING_VERIFICATION status.
 * @author Sprint 3 — IAM Bounded Context
 */
@Component({
  selector: 'app-register-driver-form',
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
  templateUrl: './register-driver-form.html',
  styleUrl: './register-driver-form.css',
})
export class RegisterDriverForm {
  /** Application store for IAM — injected via inject(). */
  protected store = inject(IamStore);

  /** Controls password field visibility toggle. */
  protected passwordVisible = false;

  /** Controls confirm password field visibility toggle. */
  protected confirmPasswordVisible = false;

  /** Reactive form group for driver registration. */
  protected form = new FormGroup({
    fullName: new FormControl('', [Validators.required, Validators.minLength(3)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(4)]),
    confirmPassword: new FormControl('', [Validators.required]),
    vehicleType: new FormControl('Mototaxi', [Validators.required]),
    licenseNumber: new FormControl('', [Validators.required, Validators.minLength(6)]),
    soatNumber: new FormControl('', [Validators.required, Validators.minLength(6)]),
  });

  get fullName(): FormControl { return this.form.get('fullName') as FormControl; }
  get email(): FormControl { return this.form.get('email') as FormControl; }
  get password(): FormControl { return this.form.get('password') as FormControl; }
  get confirmPassword(): FormControl { return this.form.get('confirmPassword') as FormControl; }
  get vehicleType(): FormControl { return this.form.get('vehicleType') as FormControl; }
  get licenseNumber(): FormControl { return this.form.get('licenseNumber') as FormControl; }
  get soatNumber(): FormControl { return this.form.get('soatNumber') as FormControl; }

  /** True when passwords do not match and both fields have been touched. */
  get passwordsMismatch(): boolean {
    return (
      this.form.get('password')!.touched &&
      this.form.get('confirmPassword')!.touched &&
      this.form.value.password !== this.form.value.confirmPassword
    );
  }

  togglePasswordVisibility(): void { this.passwordVisible = !this.passwordVisible; }
  toggleConfirmPasswordVisibility(): void { this.confirmPasswordVisible = !this.confirmPasswordVisible; }

  /**
   * Handles form submission. Validates, checks password match,
   * and delegates driver registration to the IamStore.
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

    this.store.registerDriver(
      this.form.value.email ?? '',
      this.form.value.password ?? '',
      this.form.value.fullName ?? '',
      this.form.value.vehicleType ?? 'Mototaxi',
      this.form.value.licenseNumber ?? '',
      this.form.value.soatNumber ?? '',
    );
  }
}
