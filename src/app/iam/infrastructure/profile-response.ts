/**
 * @summary Raw response contract for the /profiles endpoint from json-server.
 * Reflects exactly the JSON structure stored in db.json.
 * @author Jesús Iván Castillo Vidal
 */
export interface ProfileResponse {
  /** Unique identifier of the profile. */
  id: string;

  /** Foreign key linking this profile to an account. */
  accountId: string;

  /** Full display name of the user. */
  fullName: string;

  /** Email address (denormalized for display). */
  email: string;

  /** URL to the user's avatar photo. */
  photoUrl: string;
}
