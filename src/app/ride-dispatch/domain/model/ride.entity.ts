import { BaseEntity } from '../../../shared/domain/model/base-entity';
import { RideStatus } from './ride.status';

export class Ride implements BaseEntity {
  id: number = 0;
  passengerId: number = 0;
  driverId: number = 0;
  origin: string = '';
  destination: string = '';
  status: RideStatus = RideStatus.PENDING;
  estimatedFare: number = 0;

  getId(): number                   { return this.id; }
  setId(v: number): void           { this.id = v; }
  getPassengerId(): number         { return this.passengerId; }
  setPassengerId(v: number): void  { this.passengerId = v; }
  getDriverId(): number            { return this.driverId; }
  setDriverId(v: number): void     { this.driverId = v; }
  getOrigin(): string              { return this.origin; }
  setOrigin(v: string): void       { this.origin = v; }
  getDestination(): string         { return this.destination; }
  setDestination(v: string): void  { this.destination = v; }
  getStatus(): RideStatus          { return this.status; }
  setStatus(v: RideStatus): void   { this.status = v; }
  getEstimatedFare(): number       { return this.estimatedFare; }
  setEstimatedFare(v: number): void { this.estimatedFare = v; }

  start(): void    { this.status = RideStatus.STARTED; }
  complete(): void { this.status = RideStatus.COMPLETED; }
  cancel(): void   { this.status = RideStatus.CANCELLED; }
  accept(): void   { this.status = RideStatus.ACCEPTED; }
}
