import { BaseEntity } from '../../../shared/domain/model/base-entity';

export class RideRequest implements BaseEntity {
  id: number = 0;
  passengerId: number = 0;
  origin: string = '';
  destination: string = '';
  distanceKm: number = 0;
  isExpired: boolean = false;

  getId(): number                     { return this.id; }
  setId(v: number): void             { this.id = v; }
  getPassengerId(): number           { return this.passengerId; }
  setPassengerId(v: number): void    { this.passengerId = v; }
  getOrigin(): string                { return this.origin; }
  setOrigin(v: string): void         { this.origin = v; }
  getDestination(): string           { return this.destination; }
  setDestination(v: string): void    { this.destination = v; }
  getDistanceKm(): number            { return this.distanceKm; }
  setDistanceKm(v: number): void     { this.distanceKm = v; }
  getIsExpired(): boolean            { return this.isExpired; }
  setIsExpired(v: boolean): void     { this.isExpired = v; }

  expire(): void   { this.isExpired = true; }
}
