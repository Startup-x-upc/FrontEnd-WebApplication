import { RideCandidate } from '../domain/model/ride-candidate.entity';
import { RideCandidateResponse } from './ride-candidate-response';

/**
 * @summary Maps rideCandidates API responses to RideCandidate domain entities.
 * @author Jesús Iván Castillo Vidal
 */
export class RideCandidateAssembler {
  static toEntity(response: RideCandidateResponse): RideCandidate {
    const entity = new RideCandidate();
    entity.id           = response.id;
    entity.requestId    = response.requestId;
    entity.driverId     = response.driverId;
    entity.driverName   = response.driverName;
    entity.vehicleType  = response.vehicleType;
    entity.ratingAverage = response.ratingAverage;
    entity.photoUrl     = response.photoUrl;
    entity.status       = response.status as RideCandidate['status'];
    entity.appliedAt    = response.appliedAt;
    return entity;
  }
}
