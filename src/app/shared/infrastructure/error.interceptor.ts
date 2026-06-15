import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

/**
 * @summary Centralized HTTP error handler. Catches 401 (unauthorized →
 * force logout), 403 (forbidden), and 5xx (server error) responses.
 * Currently logs and re-throws — will integrate with IamStore.signOut()
 * when backend migration adds proper auth.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((err) => {
      if (err.status === 401) {
        // TODO: inject(IamStore).signOut() or redirect to /login
        console.warn('[HTTP] 401 Unauthorized — sesión expirada o token inválido');
      } else if (err.status === 403) {
        console.warn('[HTTP] 403 Forbidden');
      } else if (err.status >= 500) {
        console.error(`[HTTP] ${err.status} Server Error`, err.url);
      }
      return throwError(() => err);
    })
  );
};
