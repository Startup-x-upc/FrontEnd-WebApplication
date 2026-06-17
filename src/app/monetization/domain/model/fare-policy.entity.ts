import { BaseEntity } from '../../../shared/domain/model/base-entity';

export class FarePolicy implements BaseEntity {
  id: string = '';
  baseFare: number = 0;
  pricePerKm: number = 0;
  minimumFare: number = 0;

  /** Platform commission rate (5%). Single source of truth. */
  static readonly PLATFORM_COMMISSION_RATE = 0.05;


  configure(baseFare: number, pricePerKm: number, minimumFare: number): void {
    this.baseFare = baseFare; this.pricePerKm = pricePerKm; this.minimumFare = minimumFare;
  }
  calculate(distanceKm: number): number {
    return Math.max(this.minimumFare, this.baseFare + (this.pricePerKm * distanceKm));
  }
}
