import { HttpInterceptorFn, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { IamStore } from '../../iam/application/iam.store';
import { environment } from '../../../environments/environment';

// Shared state for refresh token request in functional interceptor
let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

/**
 * @summary Centralized HTTP error handler. Catches 401 and performs automatic
 * JWT token refresh using refresh token rotating. If refresh fails, signs out.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const iamStore = inject(IamStore);
  const http = inject(HttpClient);

  return next(req).pipe(
    catchError((error) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        const isAuthRequest = req.url.includes('/auth/login') ||
                              req.url.includes('/auth/register/passenger') ||
                              req.url.includes('/auth/register/driver') ||
                              req.url.includes('/auth/refresh');

        // Do not attempt to refresh if we are already in an auth flow request
        if (isAuthRequest) {
          iamStore.signOut();
          return throwError(() => error);
        }

        const refreshToken = localStorage.getItem('chapatuRuta_refresh_token');
        if (!refreshToken) {
          iamStore.signOut();
          return throwError(() => error);
        }

        if (!isRefreshing) {
          isRefreshing = true;
          refreshTokenSubject.next(null);

          return http.post<{ accessToken: string; refreshToken: string }>(
            `${environment.realApiBaseUrl}/api/v1/auth/refresh`,
            { refreshToken }
          ).pipe(
            switchMap((tokens) => {
              isRefreshing = false;
              localStorage.setItem('chapatuRuta_access_token', tokens.accessToken);
              localStorage.setItem('chapatuRuta_refresh_token', tokens.refreshToken);
              refreshTokenSubject.next(tokens.accessToken);

              // Retry the original request with the new access token
              const retryReq = req.clone({
                setHeaders: { Authorization: `Bearer ${tokens.accessToken}` }
              });
              return next(retryReq);
            }),
            catchError((refreshError) => {
              isRefreshing = false;
              iamStore.signOut();
              return throwError(() => refreshError);
            })
          );
        } else {
          // Wait until current refresh is complete, then retry
          return refreshTokenSubject.pipe(
            filter((token): token is string => token !== null),
            take(1),
            switchMap((token) => {
              const retryReq = req.clone({
                setHeaders: { Authorization: `Bearer ${token}` }
              });
              return next(retryReq);
            })
          );
        }
      } else if (error instanceof HttpErrorResponse && error.status === 403) {
        console.warn('[HTTP] 403 Forbidden');
        if (error.error && error.error.code === 'DRIVER_RESTRICTED') {
          console.warn('[errorInterceptor] Driver restricted response received. Logging out...');
          iamStore.signOut();
          iamStore.setError('Tu cuenta de conductor ha sido inhabilitada por la administración.');
        }
      } else if (error instanceof HttpErrorResponse && error.status >= 500) {
        console.error(`[HTTP] ${error.status} Server Error`, error.url);
      }
      return throwError(() => error);
    })
  );
};
