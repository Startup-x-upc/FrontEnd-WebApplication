import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthResponse } from './auth-response';
import { ProfileResponse } from './profile-response';
import { Account } from '../domain/model/account.entity';
import { Profile } from '../domain/model/profile.entity';
import { AccountAssembler } from './account-assembler';
import { ProfileAssembler } from './profile-assembler';

@Injectable({ providedIn: 'root' })
/**
 * @summary Infrastructure gateway to the IAM endpoints on json-server.
 * Handles all HTTP communication for authentication, registration,
 * and profile management.
 * @author Jesús Iván Castillo Vidal
 */
export class IamApiService {

  /** HttpClient injected via the inject() function (Angular 21 style). */
  private http = inject(HttpClient);

  /** Base URL for the fake API, resolved from environment configuration. */
  private baseUrl = environment.apiBaseUrl;

  /**
   * Attempts sign-in by querying json-server for a matching user.
   * json-server supports query params for filtering: /users?email=...
   *
   * @param email - The email address provided by the user.
   * @param password - The plain-text password provided by the user (mock only).
   * @returns Observable<Account> on success, or an error observable if credentials do not match.
   */
  signIn(email: string, password: string): Observable<Account> {
    return this.http
      .get<AuthResponse[]>(`${this.baseUrl}/users?email=${encodeURIComponent(email)}`)
      .pipe(
        switchMap((users: AuthResponse[]) => {
          const matched = users.find(u => u.password === password);
          if (!matched) {
            return throwError(() => new Error('INVALID_CREDENTIALS'));
          }
          return of(AccountAssembler.toEntity(matched));
        })
      );
  }

  /**
   * Retrieves the profile linked to a given account ID.
   *
   * @param accountId - The account ID to look up in the profiles collection.
   * @returns Observable<Profile> with the user's profile data.
   */
  getProfileByAccountId(accountId: string): Observable<Profile> {
    return this.http
      .get<ProfileResponse[]>(`${this.baseUrl}/profiles?accountId=${accountId}`)
      .pipe(
        map((profiles: ProfileResponse[]) => {
          if (!profiles.length) {
            throw new Error('PROFILE_NOT_FOUND');
          }
          return ProfileAssembler.toEntity(profiles[0]);
        })
      );
  }

  // ── Registration (Sprint 3) ──────────────────────────────────────────

  /**
   * Checks whether an email is already registered in the system.
   *
   * @param email - The email address to check.
   * @returns Observable<boolean> — true if the email already exists.
   */
  checkEmailExists(email: string): Observable<boolean> {
    return this.http
      .get<AuthResponse[]>(`${this.baseUrl}/users?email=${encodeURIComponent(email)}`)
      .pipe(map((users: AuthResponse[]) => users.length > 0));
  }

  /**
   * Registers a new passenger account.
   * Creates a user entry (role: PASSENGER) and a corresponding profile.
   *
   * @param email - The email address for the new account.
   * @param password - The plain-text password (mock only).
   * @returns Observable<Account> with the newly created account.
   */
  /**
   * Registers a new passenger account.
   * Creates a user entry (role: PASSENGER) and a corresponding profile.
   *
   * @param email - The email address for the new account.
   * @param password - The plain-text password (mock only).
   * @param fullName - The passenger's full name.
   * @returns Observable<Account> with the newly created account.
   */
  registerPassenger(email: string, password: string, fullName: string = ''): Observable<Account> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/users`, {
        email,
        password,
        role: 'PASSENGER',
      })
      .pipe(
        switchMap((user: AuthResponse) => {
          return this.http
            .post<ProfileResponse>(`${this.baseUrl}/profiles`, {
              accountId: user.id,
              fullName,
              email: user.email,
              photoUrl: '',
            })
            .pipe(map(() => AccountAssembler.toEntity(user)));
        })
      );
  }

  /**
   * Registers a new driver account.
   * Creates a user entry (role: DRIVER), a profile, and a driver record
   * with PENDING_VERIFICATION status.
   *
   * @param email - The email address for the new account.
   * @param password - The plain-text password (mock only).
   * @param fullName - The driver's full name.
   * @param vehicleType - The vehicle type (default: 'Mototaxi').
   * @param licenseNumber - The driver's license number (Brevete).
   * @param soatNumber - The driver's SOAT number.
   * @returns Observable<Account> with the newly created account.
   */
  registerDriver(
    email: string,
    password: string,
    fullName: string = '',
    vehicleType: string = 'Mototaxi',
    licenseNumber: string = '',
    soatNumber: string = '',
  ): Observable<Account> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/users`, {
        email,
        password,
        role: 'DRIVER',
      })
      .pipe(
        switchMap((user: AuthResponse) => {
          return this.http
            .post<ProfileResponse>(`${this.baseUrl}/profiles`, {
              accountId: user.id,
              fullName,
              email: user.email,
              photoUrl: '',
            })
            .pipe(
              switchMap(() => {
                return this.http
                  .post(`${this.baseUrl}/drivers`, {
                    accountId: user.id,
                    fullName,
                    vehicleType,
                    verificationStatus: 'ACTIVE',
                    operationalStatus: 'ENABLED',
                    ratingAverage: 0,
                    ratingCount: 0,
                    photoUrl: '',
                    licenseNumber,
                    soatNumber,
                  })
                  .pipe(
                    switchMap((driver: any) => {
                      // Automatically initialize wallet for the new driver
                      return this.http
                        .post(`${this.baseUrl}/wallets`, {
                          driverId: driver.id,
                          balance: 0,
                          status: 'ACTIVE',
                        })
                        .pipe(map(() => AccountAssembler.toEntity(user)));
                    })
                  );
              })
            );
        })
      );
  }

  // ── Profile management (Sprint 3) ────────────────────────────────────

  /**
   * Updates an existing user profile with new data.
   *
   * @param profileId - The profile ID to update.
   * @param data - Partial profile data (fullName, photoUrl).
   * @returns Observable<Profile> with the updated profile.
   */
  updateProfile(
    profileId: string,
    data: { fullName?: string; photoUrl?: string },
  ): Observable<Profile> {
    return this.http
      .patch<ProfileResponse>(`${this.baseUrl}/profiles/${profileId}`, data)
      .pipe(map(ProfileAssembler.toEntity));
  }
}
