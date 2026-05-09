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
 * Handles all HTTP communication for authentication and profile retrieval.
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
}
