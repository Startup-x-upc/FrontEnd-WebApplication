import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { IamStore } from '../../../application/iam.store';
import { RideDispatchStore } from '../../../../ride-dispatch/application/ride-dispatch.store';
import { MonetizationStore } from '../../../../monetization/application/monetization.store';
import { MatChip, MatChipSet } from '@angular/material/chips';

@Component({
  selector: 'app-driver-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTableModule,
    MatChipSet,
    MatChip,
  ],
  templateUrl: './driver-dashboard.html',
  styleUrls: ['./driver-dashboard.css'],
})
export class DriverDashboard implements OnInit {
  protected iamStore = inject(IamStore);
  protected rideStore = inject(RideDispatchStore);
  protected monetizationStore = inject(MonetizationStore);

  todayEarnings = signal(42.5);
  todayRides = signal(8);
  walletBalance = signal(12.5);
  rating = signal(4.8);

  recentRequests = signal([
    {
      passenger: 'Martín García',
      origin: 'Jr. Castilla 432',
      destination: 'Mercado Central',
      distance: 1.2,
      fare: 4.0,
    },
    {
      passenger: 'Luis Flores',
      origin: 'Av. Grau 210',
      destination: 'Plaza de armas',
      distance: 2.1,
      fare: 6.0,
    },
  ]);

  ngOnInit() {
    // Cargar datos del conductor
  }

  toggleAvailability() {
    // TODO: Conectar con RideDispatchStore
  }

  acceptRide(ride: any) {
    // TODO: Conectar con RideDispatchStore
  }

  rejectRide(ride: any) {
    // TODO: Conectar con RideDispatchStore
  }

  logout() {
    this.iamStore.signOut();
  }
}
