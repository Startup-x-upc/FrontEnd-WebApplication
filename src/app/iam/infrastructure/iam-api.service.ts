import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Account } from '../domain/model/account.entity';
import { Profile } from '../domain/model/profile.entity';
import { AccountAssembler } from './account-assembler';
import { ProfileAssembler } from './profile-assembler';

// Import generated Orval services
import { AuthService } from '../../shared/infrastructure/api/generated/auth/auth.service';
import { ProfilesService } from '../../shared/infrastructure/api/generated/profiles/profiles.service';
import { AuthResponseResource } from '../../shared/infrastructure/api/generated/model';

@Injectable({ providedIn: 'root' })
/**
 * @summary Infrastructure gateway that delegates to the Orval generated API clients.
 * Mapped to the real Spring Boot backend endpoints.
 * @author Jesús Iván Castillo Vidal
 */
export class IamApiService {

  private authService = inject(AuthService);
  private profilesService = inject(ProfilesService);

  /**
   * Authenticates the user and stores JWT access and refresh tokens.
   */
  signIn(email: string, password: string): Observable<Account> {
    return this.authService.login({ email, password }).pipe(
      map((res: AuthResponseResource) => {
        if (res.accessToken && res.refreshToken) {
          localStorage.setItem('chapatuRuta_access_token', res.accessToken);
          localStorage.setItem('chapatuRuta_refresh_token', res.refreshToken);
        }
        return AccountAssembler.toEntity(res.user!);
      })
    );
  }

  /**
   * Retrieves the profile linked to the currently logged in user.
   */
  getProfileByAccountId(accountId: string): Observable<Profile> {
    // The real backend retrieves the profile from the JWT context
    return this.profilesService.getMyProfile().pipe(
      map((profileRes) => ProfileAssembler.toEntity(profileRes))
    );
  }

  /**
   * Stub for duplicate email check in the real backend (handled at registration time).
   */
  checkEmailExists(email: string): Observable<boolean> {
    return of(false);
  }

  /**
   * Registers a new passenger on the real backend and stores authentication tokens.
   */
  registerPassenger(email: string, password: string, fullName: string = ''): Observable<Account> {
    return this.authService.registerPassenger({ email, password, fullName }).pipe(
      map((res: AuthResponseResource) => {
        if (res.accessToken && res.refreshToken) {
          localStorage.setItem('chapatuRuta_access_token', res.accessToken);
          localStorage.setItem('chapatuRuta_refresh_token', res.refreshToken);
        }
        return AccountAssembler.toEntity(res.user!);
      })
    );
  }

  /**
   * Registers a new driver on the real backend.
   */
  registerDriver(
    email: string,
    password: string,
    fullName: string = '',
    vehicleType: string = 'Mototaxi',
    licenseNumber: string = '',
    soatNumber: string = '',
  ): Observable<Account> {
    return this.authService.registerDriver({
      email,
      password,
      fullName,
      vehicleType,
      licenseNumber,
      soatNumber
    }).pipe(
      map((res: AuthResponseResource) => {
        if (res.accessToken && res.refreshToken) {
          localStorage.setItem('chapatuRuta_access_token', res.accessToken);
          localStorage.setItem('chapatuRuta_refresh_token', res.refreshToken);
        }
        return AccountAssembler.toEntity(res.user!);
      })
    );
  }

  /**
   * Updates the profile using the PUT /profiles/{profileId} endpoint.
   */
  updateProfile(
    profileId: string,
    data: { fullName?: string; photoUrl?: string },
  ): Observable<Profile> {
    return this.profilesService.updateProfile(profileId, {
      fullName: data.fullName || '',
      photoUrl: data.photoUrl || ''
    }).pipe(
      map((profileRes) => ProfileAssembler.toEntity(profileRes))
    );
  }
}
