import { AuthResponse } from './auth-response';
import { Account } from '../domain/model/account.entity';

/**
 * @summary Maps AuthResponse DTOs from the API into Account domain entities.
 * Uses static methods — no @Injectable, no side effects.
 * @author Jesús Iván Castillo Vidal
 */
export class AccountAssembler {

  /**
   * Converts a raw AuthResponse DTO into an Account domain entity.
   *
   * @param response - The raw user object returned by json-server.
   * @returns A fully populated Account entity.
   */
  static toEntity(response: AuthResponse): Account {
    const account = new Account();
    account.id = response.id;
    account.email = response.email;
    account.role = response.role;
    return account;
  }
}
