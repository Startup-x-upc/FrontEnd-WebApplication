import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { IamStore } from '../../iam/application/iam.store';

/**
 * @summary Route guard that permits navigation only if the user is authenticated.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const iamStore = inject(IamStore);
  const router = inject(Router);

  if (iamStore.isAuthenticated()) {
    // Check role constraints defined in route data if specified
    const expectedRole = route.data['role'];
    if (expectedRole && iamStore.role() !== expectedRole) {
      console.warn(`[AuthGuard] Access denied. Expected role: ${expectedRole}, got: ${iamStore.role()}`);

      // Redirect authorized user to their correct dashboard
      if (iamStore.role() === 'PASSENGER') {
        router.navigate(['/passenger']);
      } else if (iamStore.role() === 'DRIVER') {
        router.navigate(['/driver']);
      } else {
        router.navigate(['/login']);
      }
      return false;
    }
    return true;
  }

  console.warn('[AuthGuard] Unauthenticated access blocked. Redirecting to /login');
  router.navigate(['/login']);
  return false;
};
