import { BaseEntity } from '../../../shared/domain/model/base-entity';

export type UserRole     = 'PASSENGER' | 'DRIVER' | 'ADMIN';
export type AccessStatus = 'ACTIVE' | 'PENDING_VERIFICATION' | 'RESTRICTED';

export class Account implements BaseEntity {
  id: number = 0;
  email: string = '';
  role: UserRole = 'PASSENGER';
  accessStatus: AccessStatus = 'ACTIVE';

  getId(): number                          { return this.id; }
  setId(v: number): void                  { this.id = v; }
  getEmail(): string                      { return this.email; }
  setEmail(v: string): void               { this.email = v; }
  getRole(): UserRole                     { return this.role; }
  setRole(v: UserRole): void              { this.role = v; }
  getAccessStatus(): AccessStatus         { return this.accessStatus; }
  setAccessStatus(v: AccessStatus): void  { this.accessStatus = v; }

  activate(): void                  { this.accessStatus = 'ACTIVE'; }
  markPendingVerification(): void   { this.accessStatus = 'PENDING_VERIFICATION'; }
  restrictAccess(): void            { this.accessStatus = 'RESTRICTED'; }
  enableDriverAccess(): void        { this.accessStatus = 'ACTIVE'; }
}
