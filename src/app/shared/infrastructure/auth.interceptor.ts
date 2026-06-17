import { HttpInterceptorFn } from '@angular/common/http';

/**
 * @summary HTTP interceptor that attaches the JWT access token
 * to every outgoing request. Currently a passthrough — will be
 * activated when the backend migration adds JWT authentication.
 *
 * TODO: Read token from IamStore or a dedicated AuthService.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Placeholder: attach Authorization header once JWT is available
  // const token = inject(AuthService).accessToken();
  // if (token) {
  //   req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  // }
  return next(req);
};
