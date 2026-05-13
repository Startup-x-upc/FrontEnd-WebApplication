import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.css'],
})
export class ForgotPassword {
  private fb = inject(FormBuilder);

  sending = signal(false);
  emailSent = signal(false);
  errorMessage = signal<string | null>(null);

  forgotForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  get emailControl() {
    return this.forgotForm.get('email');
  }

  onSubmit() {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.sending.set(true);
    this.errorMessage.set(null);

    // TODO: Conectar con IamStore para enviar enlace de recuperación
    const email = this.forgotForm.value.email;

    // Simular llamada a API
    setTimeout(() => {
      this.sending.set(false);
      this.emailSent.set(true);
    }, 1500);
  }

  resetForm() {
    this.emailSent.set(false);
    this.forgotForm.reset();
    this.errorMessage.set(null);
  }
}
