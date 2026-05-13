import { BaseEntity } from '../../../shared/domain/model/base-entity';

export class DriverReputation implements BaseEntity {
  id: string = '';
  driverId: string = '';
  averageScore: number = 0;
  totalRatings: number = 0;


  recalculate(newScore: number): void {
    const total = this.averageScore * this.totalRatings + newScore;
    this.totalRatings += 1;
    this.averageScore = total / this.totalRatings;
  }
  hasRatings(): boolean { return this.totalRatings > 0; }
}
