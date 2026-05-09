import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { IamStore } from '../../../application/iam.store';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [MatButtonModule],
  template: `
    <div style="padding:2rem;text-align:center;">
      <h2>Panel de Administrador</h2>
      <p>Bienvenido, {{ store.currentProfile()?.fullName || store.currentAccount()?.email }}</p>
      <button mat-flat-button color="warn" (click)="store.signOut()" aria-label="Cerrar sesión">
        Cerrar sesión
      </button>
    </div>
  `
})
/**
 * @summary Stub dashboard for ADMIN role. To be expanded in a future sprint.
 * @author Jesús Iván Castillo Vidal
 */
export class AdminDashboard {
  protected store = inject(IamStore);
}
