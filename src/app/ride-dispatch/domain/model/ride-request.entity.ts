import { BaseEntity } from '../../../shared/domain/model/base-entity';
import { RideStatus } from './ride.status';

export class RideRequest implements BaseEntity {
  id: string = '';
  passengerId: string = '';
  driverId: string = '';
  origin: string = '';
  destination: string = '';
  distanceKm: number = 0;
  status: string = RideStatus.PENDING;
  estimatedFare: number = 0;
  isExpired: boolean = false;


  expire(): void   { this.isExpired = true; }
}
