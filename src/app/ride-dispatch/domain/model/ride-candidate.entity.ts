import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * @summary Candidate status values for a ride application.
 * PROPOSED  — Driver applied but passenger hasn't decided yet.
 * ACCEPTED  — Passenger selected this driver.
 * REJECTED  — Passenger selected a different driver.
 */
export type CandidateStatus = 'PROPOSED' | 'ACCEPTED' | 'REJECTED';

/**
 * @summary Represents a driver's application to a specific ride request.
 * Created when a driver taps "Postularme" on an open request.
 * @author Jesús Iván Castillo Vidal
 */
export class RideCandidate implements BaseEntity {
  id: string = '';
  requestId: string = '';
  driverId: string = '';
  /** Denormalized display fields so the passenger sees them without extra calls. */
  driverName: string = '';
  vehicleType: string = '';
  ratingAverage: number = 0;
  photoUrl: string = '';
  status: CandidateStatus = 'PROPOSED';
  appliedAt: string = '';
}
