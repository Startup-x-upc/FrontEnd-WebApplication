import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

/**
 * @summary HTTP interceptor that attaches the JWT access token
 * to every outgoing request to the real backend and routes relative URLs.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  let url = req.url;

  // Rewrite relative /api/v1/ requests to the real backend host
  if (url.startsWith('/api/v1/')) {
    url = `${environment.realApiBaseUrl}${url}`;
  }

  // If target URL is on the real backend, clone request and add authorization
  if (url.startsWith(environment.realApiBaseUrl)) {
    const isPublic = url.includes('/auth/login') ||
                     url.includes('/auth/register/passenger') ||
                     url.includes('/auth/register/driver') ||
                     url.includes('/auth/refresh');

    const token = localStorage.getItem('chapatuRuta_access_token');

    let clonedHeaders = req.headers;
    if (token && !isPublic) {
      clonedHeaders = clonedHeaders.set('Authorization', `Bearer ${token}`);
    }

    req = req.clone({
      url,
      headers: clonedHeaders
    });
  }

  return next(req);
};
