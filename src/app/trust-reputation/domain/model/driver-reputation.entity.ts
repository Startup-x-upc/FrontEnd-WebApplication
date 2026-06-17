import { BaseEntity } from '../../../shared/domain/model/base-entity';

export class DriverReputation implements BaseEntity {
  id: string = '';
  driverId: string = '';
  averageScore: number = 0;
  totalRatings: number = 0;


  hasRatings(): boolean { return this.totalRatings > 0; }
}
