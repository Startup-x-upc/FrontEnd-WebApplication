import { BaseEntity } from '../../../shared/domain/model/base-entity';

export class Profile implements BaseEntity {
  id: number = 0;
  accountId: number = 0;
  fullName: string = '';
  photoUrl: string = '';

  getId(): number                    { return this.id; }
  setId(v: number): void            { this.id = v; }
  getAccountId(): number            { return this.accountId; }
  setAccountId(v: number): void     { this.accountId = v; }
  getFullName(): string             { return this.fullName; }
  setFullName(v: string): void      { this.fullName = v; }
  getPhotoUrl(): string             { return this.photoUrl; }
  setPhotoUrl(v: string): void      { this.photoUrl = v; }

  updateProfile(fullName: string, photoUrl: string): void {
    this.fullName = fullName;
    this.photoUrl = photoUrl;
  }
}
