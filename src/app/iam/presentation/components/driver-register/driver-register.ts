import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-driver-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatStepperModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './driver-register.html',
  styleUrls: ['./driver-register.css'],
})
export class DriverRegister {
  private fb = inject(FormBuilder);
  private router = inject(Router);

  hidePassword = true;
  hideConfirmPassword = true;
  isLoading = signal(false);
  isSubmitted = signal(false);
  errorMessage = signal<string | null>(null);

  licensePhotoPreview = signal<string | null>(null);
  soatPhotoPreview = signal<string | null>(null);
  vehiclePhotoPreview = signal<string | null>(null);

  licenseFile = signal<File | null>(null);
  soatFile = signal<File | null>(null);
  vehicleFile = signal<File | null>(null);

  personalForm = this.fb.group(
    {
      fullName: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]],
      email: ['', [Validators.required, Validators.email]],
      city: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: this.passwordMatchValidator },
  );

  documentsForm = this.fb.group({
    plateNumber: ['', [Validators.required, Validators.pattern('^[A-Z]{3}-[0-9]{3}$')]],
    brand: ['', Validators.required],
    model: ['', Validators.required],
    licenseNumber: ['', [Validators.required, Validators.pattern('^[A-Z0-9]{8,10}$')]],
    licenseExpiry: ['', Validators.required],
    soatNumber: ['', Validators.required],
    soatExpiry: ['', Validators.required],
  });

  passwordMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return password === confirm ? null : { passwordMismatch: true };
  }

  get cities() {
    return ['Talara, Piura', 'Piura, Piura', 'Sullana, Piura', 'Chiclayo, Lambayeque'];
  }

  onFileSelected(event: Event, field: string): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const preview = reader.result as string;
        if (field === 'licensePhoto') {
          this.licensePhotoPreview.set(preview);
          this.licenseFile.set(file);
        } else if (field === 'soatPhoto') {
          this.soatPhotoPreview.set(preview);
          this.soatFile.set(file);
        } else if (field === 'vehiclePhoto') {
          this.vehiclePhotoPreview.set(preview);
          this.vehicleFile.set(file);
        }
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit() {
    if (this.personalForm.valid && this.documentsForm.valid) {
      this.isLoading.set(true);
      // TODO: Conectar con DriverManagementStore para registrar conductor
      setTimeout(() => {
        this.isLoading.set(false);
        this.isSubmitted.set(true);
      }, 2000);
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
