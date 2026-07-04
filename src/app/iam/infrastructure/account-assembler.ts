import { Account } from '../domain/model/account.entity';

/**
 * @summary Maps user responses from the API into Account domain entities.
 * Uses static methods — no @Injectable, no side effects.
 * @author Jesús Iván Castillo Vidal
 */
export class AccountAssembler {

  /**
   * Converts a raw user object returned by Spring Boot API into an Account domain entity.
   *
   * @param response - The raw user object (e.g. UserResource).
   * @returns A fully populated Account entity.
   */
  static toEntity(response: any): Account {
    const account = new Account();
    account.id = response.id || '';
    account.email = response.email || '';
    account.role = response.role || '';
    return account;
  }
}
