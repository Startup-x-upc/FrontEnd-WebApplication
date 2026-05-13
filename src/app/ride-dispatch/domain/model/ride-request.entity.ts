import { BaseEntity } from '../../../shared/domain/model/base-entity';
import { RideStatus } from './ride.status';

/**
 * @summary Represents a ride request created by a passenger.
 * Once created, drivers may apply as candidates (rideCandidates).
 * The passenger then selects one, which sets selectedDriverId and CONFIRMED status.
 * @author Jesús Iván Castillo Vidal
 */
export class RideRequest implements BaseEntity {
  id: string = '';
  passengerId: string = '';
  /** Set only after passenger selects a candidate. */
  selectedDriverId: string | null = null;
  origin: string = '';
  destination: string = '';
  distanceKm: number = 0;
  status: string = RideStatus.OPEN;
  estimatedFare: number = 0;
  isExpired: boolean = false;

  // CQRS Read Projections
  passengerName?: string;
  passengerPhotoUrl?: string;

  expire(): void { this.isExpired = true; }
}
