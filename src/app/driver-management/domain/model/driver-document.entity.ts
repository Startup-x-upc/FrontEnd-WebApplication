import { BaseEntity } from '../../../shared/domain/model/base-entity';

export type DocumentType   = 'LICENSE' | 'SOAT' | 'TECHNICAL_INSPECTION' | 'PROPERTY_CARD';
export type DocumentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export class DriverDocument implements BaseEntity {
  id: number = 0;
  driverId: number = 0;
  documentType: DocumentType = 'LICENSE';
  documentNumber: string = '';
  fileUrl: string = '';
  status: DocumentStatus = 'PENDING';

  getId(): number                          { return this.id; }
  setId(v: number): void                  { this.id = v; }
  getDriverId(): number                   { return this.driverId; }
  setDriverId(v: number): void            { this.driverId = v; }
  getDocumentType(): DocumentType         { return this.documentType; }
  setDocumentType(v: DocumentType): void  { this.documentType = v; }
  getDocumentNumber(): string             { return this.documentNumber; }
  setDocumentNumber(v: string): void      { this.documentNumber = v; }
  getFileUrl(): string                    { return this.fileUrl; }
  setFileUrl(v: string): void             { this.fileUrl = v; }
  getStatus(): DocumentStatus             { return this.status; }
  setStatus(v: DocumentStatus): void      { this.status = v; }

  approve(): void { this.status = 'APPROVED'; }
  reject(): void  { this.status = 'REJECTED'; }
}
