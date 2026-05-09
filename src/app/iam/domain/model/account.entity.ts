/**
 * @summary Represents the user role within the IAM bounded context.
 * @author Jesús Iván Castillo Vidal
 */
export type UserRole = 'PASSENGER' | 'DRIVER' | 'ADMIN';

/**
 * @summary Represents a user account in the IAM bounded context.
 * Domain entity — no Angular decorators, no HTTP, no UI concerns.
 * @author Jesús Iván Castillo Vidal
 */
export class Account {
  /** Unique identifier for the account. */
  id: string;

  /** Email address used for authentication. */
  email: string;

  /** Role that determines the user's access level and dashboard. */
  role: UserRole;

  constructor() {
    this.id = '';
    this.email = '';
    this.role = 'PASSENGER';
  }
}
