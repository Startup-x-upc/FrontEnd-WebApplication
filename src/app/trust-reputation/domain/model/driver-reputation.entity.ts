import { BaseEntity } from '../../../shared/domain/model/base-entity';

export class DriverReputation implements BaseEntity {
  id: number = 0;
  driverId: number = 0;
  averageScore: number = 0;
  totalRatings: number = 0;

  getId(): number                    { return this.id; }
  setId(v: number): void            { this.id = v; }
  getDriverId(): number             { return this.driverId; }
  setDriverId(v: number): void      { this.driverId = v; }
  getAverageScore(): number         { return this.averageScore; }
  setAverageScore(v: number): void  { this.averageScore = v; }
  getTotalRatings(): number         { return this.totalRatings; }
  setTotalRatings(v: number): void  { this.totalRatings = v; }

  recalculate(newScore: number): void {
    const total = this.averageScore * this.totalRatings + newScore;
    this.totalRatings += 1;
    this.averageScore = total / this.totalRatings;
  }
  hasRatings(): boolean { return this.totalRatings > 0; }
}
