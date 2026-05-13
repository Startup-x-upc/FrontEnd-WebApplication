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
        this.errorSignal.set('Credenciales incorrectas. Verifica tu correo y contraseña.');
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
