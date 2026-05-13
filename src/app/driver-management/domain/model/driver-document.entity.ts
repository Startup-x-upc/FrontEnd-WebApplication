import { BaseEntity } from '../../../shared/domain/model/base-entity';

export type DocumentType   = 'LICENSE' | 'SOAT' | 'TECHNICAL_INSPECTION' | 'PROPERTY_CARD';
export type DocumentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export class DriverDocument implements BaseEntity {
  id: string = '';
  driverId: string = '';
  documentType: DocumentType = 'LICENSE';
  documentNumber: string = '';
  fileUrl: string = '';
  status: DocumentStatus = 'PENDING';


  approve(): void { this.status = 'APPROVED'; }
  reject(): void  { this.status = 'REJECTED'; }
}
