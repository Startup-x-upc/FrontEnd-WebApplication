import { Driver } from '../domain/model/driver.entity';
import { DriverResponse } from './driver-response';

export class DriverAssembler {
  static toEntity(response: DriverResponse): Driver {
    const entity = new Driver();
    entity.id = response.id;
    entity.accountId = response.accountId;
    entity.licenseNumber = response.id; // placeholder from id
    entity.soatNumber = 'S-000'; // placeholder
    entity.isAvailable = response.operationalStatus === 'ENABLED';
    entity.accessStatus = response.verificationStatus;
    return entity;
  }
}
