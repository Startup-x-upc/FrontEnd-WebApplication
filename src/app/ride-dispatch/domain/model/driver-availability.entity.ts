import { BaseEntity } from '../../../shared/domain/model/base-entity';

export class DriverAvailability implements BaseEntity {
  id: string = '';
  driverId: string = '';
  isAvailable: boolean = false;
  latitude: number = 0;
  longitude: number = 0;


  activate(): void   { this.isAvailable = true; }
  deactivate(): void { this.isAvailable = false; }
}
