import { ProfileResponse } from './profile-response';
import { Profile } from '../domain/model/profile.entity';

/**
 * @summary Maps ProfileResponse DTOs from the API into Profile domain entities.
 * Uses static methods — no @Injectable, no side effects.
 * @author Jesús Iván Castillo Vidal
 */
export class ProfileAssembler {

  /**
   * Converts a raw ProfileResponse DTO into a Profile domain entity.
   *
   * @param response - The raw profile object returned by json-server.
   * @returns A fully populated Profile entity.
   */
  static toEntity(response: ProfileResponse): Profile {
    const profile = new Profile();
    profile.id = response.id;
    profile.accountId = response.accountId;
    profile.fullName = response.fullName;
    profile.email = response.email;
    profile.photoUrl = response.photoUrl;
    return profile;
  }
}
