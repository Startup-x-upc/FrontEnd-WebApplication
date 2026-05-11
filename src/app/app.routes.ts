import { Routes } from '@angular/router';

/**
 * @summary Application routes. IAM is the default entry point.
 * @author Jesús Iván Castillo Vidal
 */
export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./iam/presentation/components/login-form/login-form').then((m) => m.LoginForm),
  },
  {
    path: 'dashboard/passenger',
    redirectTo: 'passenger/request-ride',
    pathMatch: 'full'
  },
  {
    path: 'passenger',
    loadComponent: () =>
      import('./shared/presentation/components/layout/passenger-layout/passenger-layout.component').then(
        (m) => m.PassengerLayoutComponent,
      ),
    children: [
      {
        path: 'request-ride',
        loadComponent: () =>
          import('./ride-dispatch/presentation/components/passenger-request-page/passenger-request-page.component').then(
            (m) => m.PassengerRequestPageComponent,
          ),
      },
      { path: '', redirectTo: 'request-ride', pathMatch: 'full' }
    ]
  },
  {
    path: 'dashboard/driver',
    loadComponent: () =>
      import('./iam/presentation/components/driver-dashboard/driver-dashboard').then(
        (m) => m.DriverDashboard,
      ),
  },
  {
    path: 'dashboard/admin',
    loadComponent: () =>
      import('./iam/presentation/components/admin-dashboard/admin-dashboard').then(
        (m) => m.AdminDashboard,
      ),
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
