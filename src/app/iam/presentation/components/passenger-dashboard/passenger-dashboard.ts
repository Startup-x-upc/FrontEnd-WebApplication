import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { IamStore } from '../../../application/iam.store';
import { RideDispatchStore } from '../../../../ride-dispatch/application/ride-dispatch.store';

@Component({
  selector: 'app-passenger-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, MatCardModule, MatListModule],
  templateUrl: './passenger-dashboard.html',
  styleUrls: ['./passenger-dashboard.css'],
})
export class PassengerDashboard implements OnInit {
  protected iamStore = inject(IamStore);
  protected rideStore = inject(RideDispatchStore);

  recentDestinations = signal([
    { name: 'Mercado Central', distance: 1.2, fare: 4.0 },
    { name: 'Terminal de buses', distance: 3.4, fare: 7.0 },
    { name: 'Plaza de armas', distance: 0.8, fare: 4.0 },
    { name: 'Colegio San José', distance: 2.1, fare: 5.5 },
  ]);

  lastTrip = signal({
    origin: 'Jr. Castilla',
    destination: 'Mercado Central',
    time: 'Hoy 10:35',
    fare: 4.0,
  });

  ngOnInit() {
    // Cargar viajes recientes
  }

  getRatingStars(rating: number): string {
    return '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
  }

  logout() {
    this.iamStore.signOut();
  }
}
