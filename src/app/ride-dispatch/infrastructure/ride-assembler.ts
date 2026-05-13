import { Ride } from '../domain/model/ride.entity';
import { RideResponse } from './ride-response';
import { RideStatus } from '../domain/model/ride.status';

export class RideAssembler {
  static toEntity(response: RideResponse): Ride {
    const entity = new Ride();
    entity.id = response.id;
    entity.passengerId = response.passengerId;
    entity.driverId = response.driverId;
    entity.origin = response.origin;
    entity.destination = response.destination;
    // Map string status to enum safely
    entity.status = Object.values(RideStatus).includes(response.status as RideStatus) 
      ? response.status as RideStatus 
      : RideStatus.PENDING;
    entity.estimatedFare = response.estimatedFare;
    return entity;
  }
}
