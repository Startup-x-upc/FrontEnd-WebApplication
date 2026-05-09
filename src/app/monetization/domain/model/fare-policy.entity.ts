import { BaseEntity } from '../../../shared/domain/model/base-entity';

export class FarePolicy implements BaseEntity {
  id: number = 0;
  baseFare: number = 0;
  pricePerKm: number = 0;
  minimumFare: number = 0;

  getId(): number                  { return this.id; }
  setId(v: number): void          { this.id = v; }
  getBaseFare(): number           { return this.baseFare; }
  setBaseFare(v: number): void    { this.baseFare = v; }
  getPricePerKm(): number         { return this.pricePerKm; }
  setPricePerKm(v: number): void  { this.pricePerKm = v; }
  getMinimumFare(): number        { return this.minimumFare; }
  setMinimumFare(v: number): void { this.minimumFare = v; }

  configure(baseFare: number, pricePerKm: number, minimumFare: number): void {
    this.baseFare = baseFare; this.pricePerKm = pricePerKm; this.minimumFare = minimumFare;
  }
  calculate(distanceKm: number): number {
    return Math.max(this.minimumFare, this.baseFare + (this.pricePerKm * distanceKm));
  }
}
