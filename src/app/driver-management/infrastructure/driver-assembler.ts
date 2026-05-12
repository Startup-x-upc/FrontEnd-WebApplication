import { Driver, DriverAccessStatus } from '../domain/model/driver.entity';
import { DriverResponse } from './driver-response';

export class DriverAssembler {
  static toEntity(response: DriverResponse): Driver {
    const entity = new Driver();
    entity.id = response.id;
    entity.accountId = response.accountId;
    entity.fullName = response.fullName;
    entity.vehicleType = response.vehicleType;
    entity.ratingAverage = response.ratingAverage ?? 0;
    entity.photoUrl = response.photoUrl ?? '';
    entity.isAvailable = response.operationalStatus === 'ENABLED';
    entity.accessStatus = response.verificationStatus as DriverAccessStatus;
    return entity;
  }
}
