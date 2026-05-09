/**
 * @summary Raw response contract for the /users endpoint from json-server.
 * Reflects exactly the JSON structure stored in db.json.
 * @author Jesús Iván Castillo Vidal
 */
export interface AuthResponse {
  /** Unique identifier of the user account. */
  id: string;

  /** Email used for authentication. */
  email: string;

  /** Hashed or plain password (mock only). */
  password: string;

  /** Role assigned to this account. */
  role: 'PASSENGER' | 'DRIVER' | 'ADMIN';
}
