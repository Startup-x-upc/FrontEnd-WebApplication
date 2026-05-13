import { DriverAvailability } from '../domain/model/driver-availability.entity';
import { DriverAvailabilityResponse } from './driver-availability-response';

export class DriverAvailabilityAssembler {
  static toEntity(response: DriverAvailabilityResponse): DriverAvailability {
    const entity = new DriverAvailability();
    entity.id = response.id;
    entity.driverId = response.driverId;
    
    if (response.currentLocation) {
      const parts = response.currentLocation.split(',');
      if (parts.length === 2) {
        entity.latitude = parseFloat(parts[0].trim());
        entity.longitude = parseFloat(parts[1].trim());
      }
    }

    entity.isAvailable  = response.isAvailable;
    entity.isBusy       = response.isBusy ?? false;
    entity.activeRideId = response.activeRideId ?? null;
    return entity;
  }
}
