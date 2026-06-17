import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RegisterPassengerForm } from '../../components/register-passenger-form/register-passenger-form';
import { RegisterDriverForm } from '../../components/register-driver-form/register-driver-form';

/**
 * @summary Unified registration page for ChapaTuRuta.
 * Renders a role selection view (Passenger vs Driver) and loads
 * the appropriate form reactively on the same page.
 * @author Jesús Iván Castillo Vidal
 */
@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatIconModule,
    MatButtonModule,
    RegisterPassengerForm,
    RegisterDriverForm,
  ],
  templateUrl: './register-page.html',
  styleUrl: './register-page.css',
})
export class RegisterPage implements OnInit {
  /** Injecting route metadata to capture route paths. */
  private route = inject(ActivatedRoute);

  /** Injecting router to handle navigation. */
  private router = inject(Router);

  /** The currently selected user role for registration. */
  protected selectedRole: 'passenger' | 'driver' | null = null;

  ngOnInit(): void {
    // Check current URL path to set the selected role
    const url = this.router.url;
    if (url.includes('passenger')) {
      this.selectedRole = 'passenger';
    } else if (url.includes('driver')) {
      this.selectedRole = 'driver';
    }
  }

  /**
   * Sets the selected role and navigates to the corresponding path.
   *
   * @param role - The selected registration role.
   */
  selectRole(role: 'passenger' | 'driver'): void {
    this.selectedRole = role;
    this.router.navigate([`/register/${role}`]);
  }

  /**
   * Clears the role selection and navigates back to /register.
   */
  clearSelection(): void {
    this.selectedRole = null;
    this.router.navigate(['/register']);
  }
}
