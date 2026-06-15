import { BaseEntity } from '../../../shared/domain/model/base-entity';
import { RideStatus } from './ride.status';

export class Ride implements BaseEntity {
  id: string = '';
  passengerId: string = '';
  driverId: string = '';
  origin: string = '';
  destination: string = '';
  status: RideStatus = RideStatus.PENDING;
  estimatedFare: number = 0;
  createdAt: string = '';
  completedAt: string = '';
  /** Enriched at query time — the driver's full name (for passenger history). */
  driverName: string = '';
  /** Enriched at query time — the passenger's full name (for driver history). */
  passengerName: string = '';


  start(): void    { this.status = RideStatus.STARTED; }
  complete(): void { this.status = RideStatus.COMPLETED; }
  cancel(): void   { this.status = RideStatus.CANCELLED; }
  accept(): void   { this.status = RideStatus.ACCEPTED; }
}
