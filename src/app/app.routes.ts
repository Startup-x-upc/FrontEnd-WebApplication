import { Routes } from '@angular/router';

/**
 * @summary Application routes. IAM is the default entry point.
 * @author Jesús Iván Castillo Vidal
 */
export const routes: Routes = [
  // ── Registration (Sprint 3) ────────────────────────────────────────
  {
    path: 'register/passenger',
    loadComponent: () =>
      import('./iam/presentation/components/register-passenger-form/register-passenger-form').then(
        (m) => m.RegisterPassengerForm,
      ),
  },
  {
    path: 'register/driver',
    loadComponent: () =>
      import('./iam/presentation/components/register-driver-form/register-driver-form').then(
        (m) => m.RegisterDriverForm,
      ),
  },
  // ── Login ──────────────────────────────────────────────────────────
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
      import('./shared/presentation/components/layout/passenger-layout/passenger-layout').then(
        (m) => m.PassengerLayoutComponent,
      ),
    children: [
      {
        path: 'request-ride',
        loadComponent: () =>
          import('./ride-dispatch/presentation/components/passenger-request-page/passenger-request-page').then(
            (m) => m.PassengerRequestPageComponent,
          ),
      },
      {
        path: 'trips',
        loadComponent: () =>
          import('./ride-dispatch/presentation/components/trip-history-page/trip-history-page').then(
            (m) => m.TripHistoryPage,
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./iam/presentation/components/profile-page/profile-page').then(
            (m) => m.ProfilePage,
          ),
      },
      { path: '', redirectTo: 'request-ride', pathMatch: 'full' }
    ]
  },
  {
    path: 'dashboard/driver',
    redirectTo: 'driver/home',
    pathMatch: 'full',
  },
  {
    path: 'driver',
    loadComponent: () =>
      import('./shared/presentation/components/layout/driver-layout/driver-layout').then(
        (m) => m.DriverLayoutComponent,
      ),
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('./ride-dispatch/presentation/components/driver-dashboard-page/driver-dashboard-page').then(
            (m) => m.DriverDashboardPageComponent,
          ),
      },
      {
        path: 'wallet',
        loadComponent: () =>
          import('./monetization/presentation/components/monetization-page/monetization-page').then(
            (m) => m.MonetizationPageComponent,
          ),
      },
      {
        path: 'trips',
        loadComponent: () =>
          import('./ride-dispatch/presentation/components/trip-history-page/trip-history-page').then(
            (m) => m.TripHistoryPage,
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./iam/presentation/components/profile-page/profile-page').then(
            (m) => m.ProfilePage,
          ),
      },
      { path: '', redirectTo: 'home', pathMatch: 'full' },
    ],
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./iam/presentation/components/admin-dashboard/admin-dashboard').then(
        (m) => m.AdminDashboard,
      ),
    children: [
      {
        path: 'drivers',
        loadComponent: () =>
          import('./driver-management/presentation/components/drivers-management-page/drivers-management-page').then(
            (m) => m.DriversManagementPage,
          ),
      },
      { path: '', redirectTo: 'drivers', pathMatch: 'full' },
    ],
  },
  {
    path: 'dashboard/admin',
    redirectTo: 'admin',
    pathMatch: 'full',
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
