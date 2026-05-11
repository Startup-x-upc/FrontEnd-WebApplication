import { DriverAvailability } from '../domain/model/driver-availability.entity';
import { DriverAvailabilityResponse } from './driver-availability-response';

export class DriverAvailabilityAssembler {
  static toEntity(response: DriverAvailabilityResponse): DriverAvailability {
    const entity = new DriverAvailability();
    entity.id = response.id;
    entity.driverId = response.driverId;
    entity.currentLocation = response.currentLocation;
    entity.isAvailable = response.isAvailable;
    return entity;
  }
}
