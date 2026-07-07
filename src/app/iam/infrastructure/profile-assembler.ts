import { Profile } from '../domain/model/profile.entity';

/**
 * @summary Maps ProfileResponse DTO from the API into Profile domain entity.
 * Uses static methods — no @Injectable, no side effects.
 * @author Jesús Iván Castillo Vidal
 */
export class ProfileAssembler {

  /**
   * Converts a raw profile object returned by Spring Boot API (composed or simple) into a Profile domain entity.
   *
   * @param response - The raw profile object from the API.
   * @returns A fully populated Profile entity.
   */
  static toEntity(response: any): Profile {
    const profile = new Profile();
    profile.id = response.profileId || response.id || '';
    profile.accountId = response.userId || response.accountId || '';
    profile.fullName = response.fullName || '';
    profile.email = response.email || '';
    profile.photoUrl = response.photoUrl || '';
    profile.createdAt = response.createdAt || '';
    profile.updatedAt = response.updatedAt || '';
    return profile;
  }
}
