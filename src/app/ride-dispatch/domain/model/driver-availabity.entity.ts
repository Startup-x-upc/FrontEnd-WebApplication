import { BaseEntity } from '../../../shared/domain/model/base-entity';

export class DriverAvailability implements BaseEntity {
  id: number = 0;
  driverId: number = 0;
  isAvailable: boolean = false;
  latitude: number = 0;
  longitude: number = 0;

  getId(): number                   { return this.id; }
  setId(v: number): void           { this.id = v; }
  getDriverId(): number            { return this.driverId; }
  setDriverId(v: number): void     { this.driverId = v; }
  getIsAvailable(): boolean        { return this.isAvailable; }
  setIsAvailable(v: boolean): void { this.isAvailable = v; }
  getLatitude(): number            { return this.latitude; }
  setLatitude(v: number): void     { this.latitude = v; }
  getLongitude(): number           { return this.longitude; }
  setLongitude(v: number): void    { this.longitude = v; }

  activate(): void   { this.isAvailable = true; }
  deactivate(): void { this.isAvailable = false; }
}
