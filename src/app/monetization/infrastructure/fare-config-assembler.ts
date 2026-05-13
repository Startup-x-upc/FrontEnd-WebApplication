import { FarePolicy } from '../domain/model/fare-policy.entity';
import { FareConfigResponse } from './fare-config-response';

export class FareConfigAssembler {
  static toEntity(response: FareConfigResponse): FarePolicy {
    const entity = new FarePolicy();
    entity.id = response.id.toString(); // db.json uses number for id, entity uses string
    entity.baseFare = response.baseFare;
    entity.pricePerKm = response.pricePerKm;
    entity.minimumFare = response.minimumFare;
    return entity;
  }
}
