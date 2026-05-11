import { Driver, DriverAccessStatus } from '../domain/model/driver.entity';
import { DriverResponse } from './driver-response';

export class DriverAssembler {
  static toEntity(response: DriverResponse): Driver {
    const entity = new Driver();
    entity.id = response.id;
    entity.accountId = response.accountId;
    entity.isAvailable = response.operationalStatus === 'ENABLED';
    entity.accessStatus = response.verificationStatus as DriverAccessStatus;
    return entity;
  }
}
