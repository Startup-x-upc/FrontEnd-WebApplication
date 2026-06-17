import { BaseEntity } from '../../../shared/domain/model/base-entity';

export type DriverAccessStatus = 'ACTIVE' | 'PENDING_VERIFICATION' | 'RESTRICTED' | 'APPROVED' | 'REJECTED';

export class Driver implements BaseEntity {
  id: string = '';
  accountId: string = '';
  fullName: string = '';
  vehicleType: string = '';
  ratingAverage: number = 0;
  ratingCount: number = 0;
  photoUrl: string = '';
  isAvailable: boolean = false;
  accessStatus: DriverAccessStatus = 'ACTIVE';
  licenseNumber: string = '';
  soatNumber: string = '';
  createdAt: string = '';
  updatedAt: string = '';


  approve(): void  { this.accessStatus = 'ACTIVE'; }
  restrict(): void { this.accessStatus = 'RESTRICTED'; }
  toggleAvailability(): void { this.isAvailable = !this.isAvailable; }
}
