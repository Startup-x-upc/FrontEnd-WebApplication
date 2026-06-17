import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Account } from '../domain/model/account.entity';
import { Profile } from '../domain/model/profile.entity';
import { IamApiService } from '../infrastructure/iam-api.service';

/** Key used to persist session data in localStorage. */
const SESSION_KEY = 'chapatuRuta_session';

/**
 * @summary Application service that coordinates authentication state
 * for the IAM bounded context.
 * Uses Angular signals for reactive state management.
 * @author Jesús Iván Castillo Vidal
 */
@Injectable({ providedIn: 'root' })
export class IamStore {

  /** Infrastructure gateway for IAM API calls. */
  private iamApi = inject(IamApiService);

  /** Angular router for role-based redirection. */
  private router = inject(Router);

  // ─── State signals ────────────────────────────────────────────────────────

  /** Internal signal holding the authenticated account, or null if not logged in. */
  private currentAccountSignal = signal<Account | null>(null);

  /** Internal signal holding the authenticated user's profile, or null if not loaded. */
  private currentProfileSignal = signal<Profile | null>(null);

  /** Internal signal indicating whether a login request is in progress. */
  private loadingSignal = signal<boolean>(false);

  /** Internal signal holding the current authentication error message. */
  private errorSignal = signal<string | null>(null);

  // ─── Public computed state ────────────────────────────────────────────────

  /** The currently authenticated account. Null if unauthenticated. */
  readonly currentAccount = computed(() => this.currentAccountSignal());

  /** The currently loaded user profile. Null if not yet loaded. */
  readonly currentProfile = computed(() => this.currentProfileSignal());

  /** True while the sign-in request is pending. */
  readonly isLoading = computed(() => this.loadingSignal());

  /** True if there is an authenticated account in the state. */
  readonly isAuthenticated = computed(() => this.currentAccountSignal() !== null);

  /** The role of the current authenticated user, or null. */
  readonly role = computed(() => this.currentAccountSignal()?.role ?? null);

  /** The current error message, or null if there is none. */
  readonly error = computed(() => this.errorSignal());

  /** Internal signal holding a success/info message (e.g., registration confirmation). */
  private messageSignal = signal<string | null>(null);

  /** The current info/success message, or null if there is none. */
  readonly message = computed(() => this.messageSignal());

  constructor() {
    // Rehydrate session from localStorage on startup
    this.rehydrateSession();
  }

  // ─── Actions ──────────────────────────────────────────────────────────────

  /**
   * Attempts to authenticate the user with the given credentials.
   * On success, loads the profile, persists the session, and redirects by role.
   * On failure, sets an error message.
   *
   * @param email - The email address entered by the user.
   * @param password - The password entered by the user.
   */
  signIn(email: string, password: string): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.iamApi.signIn(email, password).subscribe({
      next: (account: Account) => {
        this.currentAccountSignal.set(account);
        this.loadProfile(account.id);
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('Error de autenticación. Verifica tu correo, contraseña y conexión a internet.');
      }
    });
  }

  /**
   * Loads the profile for the given account ID from the API.
   * After loading, persists the session and redirects by role.
   *
   * @param accountId - The account ID whose profile to retrieve.
   */
  private loadProfile(accountId: string): void {
    this.iamApi.getProfileByAccountId(accountId).subscribe({
      next: (profile: Profile) => {
        this.currentProfileSignal.set(profile);
        this.loadingSignal.set(false);
        this.persistSession();
        this.redirectByRole();
      },
      error: () => {
        // Profile not found is not a blocker — proceed anyway
        this.loadingSignal.set(false);
        this.persistSession();
        this.redirectByRole();
      }
    });
  }

  /**
   * Clears authentication state and session, then navigates to login.
   */
  signOut(): void {
    this.currentAccountSignal.set(null);
    this.currentProfileSignal.set(null);
    this.errorSignal.set(null);
    localStorage.removeItem(SESSION_KEY);
    this.router.navigate(['/login']);
  }

  /**
   * Clears the current error signal.
   */
  clearError(): void {
    this.errorSignal.set(null);
  }

  /** Clears the current info message. */
  clearMessage(): void {
    this.messageSignal.set(null);
  }

  // ─── Registration actions (Sprint 3) ────────────────────────────────────

  /**
   * Registers a new passenger account and automatically signs in.
   * On success, persists the session and redirects to the passenger dashboard.
   *
   * @param email - The email address for the new account.
   * @param password - The plain-text password.
   * @param fullName - The passenger's full name.
   */
  registerPassenger(email: string, password: string, fullName: string = ''): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.messageSignal.set(null);

    this.iamApi.registerPassenger(email, password, fullName).subscribe({
      next: (account: Account) => {
        this.currentAccountSignal.set(account);
        this.loadProfile(account.id);
        this.messageSignal.set('Registro exitoso. ¡Bienvenido a ChapaTuRuta!');
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('No se pudo completar el registro. Verifica tu conexión o intenta con otro correo.');
      },
    });
  }

  /**
   * Registers a new driver account with PENDING_VERIFICATION status.
   * On success, shows a confirmation message and redirects to login
   * (driver must wait for admin verification).
   *
   * @param email - The email address for the new account.
   * @param password - The plain-text password.
   * @param fullName - The driver's full name.
   * @param vehicleType - The vehicle type (default: 'Mototaxi').
   * @param licenseNumber - The driver's license number (Brevete).
   * @param soatNumber - The driver's SOAT number.
   */
  registerDriver(
    email: string,
    password: string,
    fullName: string = '',
    vehicleType: string = 'Mototaxi',
    licenseNumber: string = '',
    soatNumber: string = '',
  ): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.messageSignal.set(null);

    this.iamApi.registerDriver(email, password, fullName, vehicleType, licenseNumber, soatNumber).subscribe({
      next: () => {
        this.loadingSignal.set(false);
        this.messageSignal.set(
          'Registro enviado. Tu cuenta está pendiente de verificación por el administrador.',
        );
        this.router.navigate(['/login'], {
          queryParams: { registered: 'driver_pending' },
        });
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('No se pudo completar el registro. Verifica tu conexión o intenta con otro correo.');
      },
    });
  }

  /**
   * Checks if an email is already registered.
   * Updates the error signal if the email exists.
   *
   * @param email - The email address to check.
   */
  checkEmail(email: string): void {
    this.iamApi.checkEmailExists(email).subscribe({
      next: (exists: boolean) => {
        if (exists) {
          this.errorSignal.set('El correo ya está registrado.');
        }
      },
    });
  }

  // ─── Profile actions (Sprint 3) ─────────────────────────────────────────

  /**
   * Updates the current user's profile with the given data.
   * On success, updates the profile signal and persists the session.
   *
   * @param data - Partial profile data (fullName, photoUrl).
   */
  updateProfile(data: { fullName?: string; photoUrl?: string }): void {
    const profile = this.currentProfileSignal();
    if (!profile?.id) {
      this.errorSignal.set('No hay un perfil cargado para actualizar.');
      return;
    }
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.messageSignal.set(null);

    this.iamApi.updateProfile(profile.id, data).subscribe({
      next: (updated: Profile) => {
        this.currentProfileSignal.set(updated);
        this.loadingSignal.set(false);
        this.messageSignal.set('Perfil actualizado correctamente.');
        this.persistSession();
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('No se pudo actualizar el perfil.');
      },
    });
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  /**
   * Persists the current account and profile to localStorage for session continuity.
   */
  private persistSession(): void {
    const account = this.currentAccountSignal();
    const profile = this.currentProfileSignal();
    if (account) {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ account, profile }));
    }
  }

  /**
   * Reads the session from localStorage and restores state signals if present.
   */
  private rehydrateSession(): void {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      try {
        const { account, profile } = JSON.parse(raw);
        if (account?.id) {
          this.currentAccountSignal.set(account);
        }
        if (profile?.id) {
          this.currentProfileSignal.set(profile);
        }
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }
  }

  /**
   * Navigates the user to their role-specific dashboard after login.
   */
  private redirectByRole(): void {
    const role = this.currentAccountSignal()?.role;
    switch (role) {
      case 'PASSENGER':
        this.router.navigate(['/dashboard/passenger']);
        break;
      case 'DRIVER':
        this.router.navigate(['/dashboard/driver']);
        break;
      case 'ADMIN':
        this.router.navigate(['/dashboard/admin']);
        break;
      default:
        this.router.navigate(['/login']);
    }
  }
}
