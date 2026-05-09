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
    loadComponent: () =>
      import('./iam/presentation/components/passenger-dashboard/passenger-dashboard').then(
        (m) => m.PassengerDashboard,
      ),
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
  {
    path: 'monetization/fare-demo',
    loadComponent: () =>
      import('./monetization/presentation/views/fare-demo/fare-demo').then((m) => m.FareDemo),
  },
  {
    path: 'monetization/wallet-demo',
    loadComponent: () =>
      import('./monetization/presentation/views/wallet-demo/wallet-demo').then((m) => m.WalletDemo),
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
