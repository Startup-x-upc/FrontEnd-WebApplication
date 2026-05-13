import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { IamStore } from '../../../application/iam.store';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTableModule,
    MatChipsModule,
  ],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css'],
})
export class AdminDashboard implements OnInit {
  protected iamStore = inject(IamStore);

  totalDrivers = signal(0);
  pendingVerifications = signal(0);
  activeDrivers = signal(0);
  totalRidesToday = signal(0);
  totalEarningsToday = signal(0);

  displayedColumns: string[] = [
    'name',
    'email',
    'phone',
    'licenseNumber',
    'submittedAt',
    'actions',
  ];

  pendingDrivers = signal([
    {
      id: 1,
      name: 'Carlos Mendoza',
      email: 'carlos@correo.com',
      phone: '948123456',
      licenseNumber: 'Q12345678',
      submittedAt: '2024-05-10',
    },
    {
      id: 2,
      name: 'Luis Flores',
      email: 'luis@correo.com',
      phone: '987654321',
      licenseNumber: 'Q87654321',
      submittedAt: '2024-05-09',
    },
    {
      id: 3,
      name: 'Jorge Mena',
      email: 'jorge@correo.com',
      phone: '912345678',
      licenseNumber: 'Q11223344',
      submittedAt: '2024-05-08',
    },
  ]);

  recentActivities = signal([
    { icon: 'person_add', title: 'Nuevo conductor registrado', time: 'Hace 5 minutos' },
    { icon: 'check_circle', title: 'Verificación aprobada - Carlos Mendoza', time: 'Hace 2 horas' },
    { icon: 'attach_money', title: 'Recarga de wallet - S/50.00', time: 'Hace 3 horas' },
    { icon: 'rate_review', title: 'Nueva calificación recibida', time: 'Hace 4 horas' },
  ]);

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.totalDrivers.set(45);
    this.pendingVerifications.set(3);
    this.activeDrivers.set(38);
    this.totalRidesToday.set(127);
    this.totalEarningsToday.set(508.5);
  }

  approveDriver(driverId: number) {
    this.pendingDrivers.update((drivers) => drivers.filter((d) => d.id !== driverId));
    this.pendingVerifications.update((count) => count - 1);
    this.activeDrivers.update((count) => count + 1);
  }

  rejectDriver(driverId: number) {
    this.pendingDrivers.update((drivers) => drivers.filter((d) => d.id !== driverId));
    this.pendingVerifications.update((count) => count - 1);
  }

  viewDriverDetails(driverId: number) {
    console.log('Ver conductor:', driverId);
  }

  logout() {
    this.iamStore.signOut();
  }
}
