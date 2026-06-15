import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { IamStore } from '../../../application/iam.store';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    RouterLink
  ],
  templateUrl: './login-form.html',
  styleUrl: './login-form.css'
})
/**
 * @summary Presentation component that renders the ChapaTuRuta login page.
 * Delegates all authentication logic to the IamStore (application layer).
 * Does not call HttpClient or manipulate DTOs directly.
 * @author Jesús Iván Castillo Vidal
 */
export class LoginForm {

  /** Application store for IAM — injected via inject() (Angular 21 style). */
  protected store = inject(IamStore);

  /** Controls password field visibility toggle. */
  protected passwordVisible = false;

  /** Reactive form group holding email and password controls. */
  protected loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(4)])
  });

  /** Shortcut accessor for the email form control. */
  get emailControl(): FormControl {
    return this.loginForm.get('email') as FormControl;
  }

  /** Shortcut accessor for the password form control. */
  get passwordControl(): FormControl {
    return this.loginForm.get('password') as FormControl;
  }

  /**
   * Toggles the password field between visible text and masked input.
   */
  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  /**
   * Handles form submission. Delegates sign-in to the IamStore.
   * Marks all controls as touched to trigger validation messages if invalid.
   */
  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const email = this.loginForm.value.email ?? '';
    const password = this.loginForm.value.password ?? '';
    this.store.signIn(email, password);
  }
}
