import { BaseEntity } from '../../../shared/domain/model/base-entity';

export type DriverAccessStatus = 'ACTIVE' | 'PENDING_VERIFICATION' | 'RESTRICTED';

export class Driver implements BaseEntity {
  id: string = '';
  accountId: string = '';
  fullName: string = '';
  vehicleType: string = '';
  ratingAverage: number = 0;
  photoUrl: string = '';
  isAvailable: boolean = false;
  accessStatus: DriverAccessStatus = 'PENDING_VERIFICATION';


  approve(): void  { this.accessStatus = 'ACTIVE'; }
  restrict(): void { this.accessStatus = 'RESTRICTED'; }
  toggleAvailability(): void { this.isAvailable = !this.isAvailable; }
}
