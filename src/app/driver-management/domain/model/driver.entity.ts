import { BaseEntity } from '../../../shared/domain/model/base-entity';

export type DriverAccessStatus = 'ACTIVE' | 'PENDING_VERIFICATION' | 'RESTRICTED';

export class Driver implements BaseEntity {
  id: number = 0;
  accountId: number = 0;
  licenseNumber: string = '';
  soatNumber: string = '';
  isAvailable: boolean = false;
  accessStatus: DriverAccessStatus = 'PENDING_VERIFICATION';

  getId(): number                           { return this.id; }
  setId(v: number): void                   { this.id = v; }
  getAccountId(): number                   { return this.accountId; }
  setAccountId(v: number): void            { this.accountId = v; }
  getLicenseNumber(): string               { return this.licenseNumber; }
  setLicenseNumber(v: string): void        { this.licenseNumber = v; }
  getSoatNumber(): string                  { return this.soatNumber; }
  setSoatNumber(v: string): void           { this.soatNumber = v; }
  getIsAvailable(): boolean                { return this.isAvailable; }
  setIsAvailable(v: boolean): void         { this.isAvailable = v; }
  getAccessStatus(): DriverAccessStatus    { return this.accessStatus; }
  setAccessStatus(v: DriverAccessStatus): void { this.accessStatus = v; }

  approve(): void  { this.accessStatus = 'ACTIVE'; }
  restrict(): void { this.accessStatus = 'RESTRICTED'; }
  toggleAvailability(): void { this.isAvailable = !this.isAvailable; }
}
