import { RideRequest } from '../domain/model/ride-request.entity';
import { RideRequestResponse } from './ride-request-response';

export class RideRequestAssembler {
  static toEntity(response: RideRequestResponse): RideRequest {
    const entity = new RideRequest();
    entity.id = response.id;
    entity.passengerId = response.passengerId;
    entity.driverId = response.driverId ?? '';
    entity.origin = response.origin;
    entity.destination = response.destination;
    entity.distanceKm = response.distanceKm;
    entity.status = response.status;
    entity.estimatedFare = response.estimatedFare;
    entity.isExpired = response.isExpired;
    return entity;
  }
}
