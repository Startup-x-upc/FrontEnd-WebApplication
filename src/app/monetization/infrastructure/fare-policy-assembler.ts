import { FarePolicyResponse } from './fare-policy-response';
import { FarePolicy } from '../domain/model/fare-policy.entity';

/**
 * @summary Maps FarePolicyResponse DTOs from the API into FarePolicy domain entities.
 * Uses static methods — no @Injectable, no side effects.
 * @author Sebastian Andres Aiquipa Poma
 */
export class FarePolicyAssembler {
  /**
   * Converts a raw FarePolicyResponse DTO into a FarePolicy domain entity.
   *
   * @param response - The raw fareConfig object returned by json-server.
   * @returns A fully populated FarePolicy entity.
   */
  static toEntity(response: FarePolicyResponse): FarePolicy {
    return new FarePolicy({
      id: response.id,
      baseFare: response.baseFare,
      pricePerKm: response.pricePerKm,
      minimumFare: response.minimumFare,
    });
  }
}
