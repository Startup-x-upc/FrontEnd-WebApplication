import { RideRequest } from '../domain/model/ride-request.entity';
import { RideRequestResponse } from '../../shared/infrastructure/api/generated/model';

export class RideRequestAssembler {
  static toEntity(response: RideRequestResponse): RideRequest {
    const entity = new RideRequest();
    entity.id             = response.id || '';
    entity.passengerId    = response.passengerId || '';
    entity.selectedDriverId = null;
    entity.origin         = response.origin || '';
    entity.destination = response.destination || '';
    entity.distanceKm = response.distanceKm || 0;
    entity.status = response.status || '';
    entity.estimatedFare = response.estimatedFare || 0;
    entity.isExpired = response.isExpired || false;
    entity.createdAt = response.createdAt ?? '';
    entity.passengerName = response.passengerName || '';
    entity.passengerPhotoUrl = response.passengerPhotoUrl || '';
    return entity;
  }
}
