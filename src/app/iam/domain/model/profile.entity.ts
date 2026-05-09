/**
 * @summary Represents a user's public profile in the IAM bounded context.
 * Domain entity — no Angular decorators, no HTTP, no UI concerns.
 * @author Jesús Iván Castillo Vidal
 */
export class Profile {
  /** Unique identifier for the profile. */
  id: string;

  /** Foreign key linking this profile to an Account. */
  accountId: string;

  /** Full display name of the user. */
  fullName: string;

  /** Email address (denormalized for display). */
  email: string;

  /** URL to the user's avatar photo. */
  photoUrl: string;

  constructor() {
    this.id = '';
    this.accountId = '';
    this.fullName = '';
    this.email = '';
    this.photoUrl = '';
  }
}
