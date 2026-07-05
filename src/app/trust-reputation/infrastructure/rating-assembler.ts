import { TripRating, RatingStatus } from '../domain/model/trip-rating.entity';
import { DriverReputation } from '../domain/model/driver-reputation.entity';
import { PassengerReputation } from '../domain/model/passenger-reputation.entity';
import { TripRatingResponse, DriverReputationResponse, PassengerReputationResponse } from '../../shared/infrastructure/api/generated/model';

/**
 * @summary Maps Trust & Reputation API responses to domain entities.
 * @author Jesús Iván Castillo Vidal
 */
export class RatingAssembler {

  /**
   * Converts a TripRatingResponse DTO into a TripRating domain entity.
   */
  static toEntity(response: TripRatingResponse): TripRating {
    const entity = new TripRating();
    entity.id = response.id || '';
    entity.tripId = response.tripId || '';
    entity.driverId = response.driverId || '';
    entity.passengerId = response.passengerId || '';
    entity.driverRatingStatus = (response.driverRatingStatus || 'PENDING') as RatingStatus;
    entity.passengerRatingStatus = (response.passengerRatingStatus || 'PENDING') as RatingStatus;
    entity.driverScore = response.driverScore ?? 0;
    entity.passengerScore = response.passengerScore ?? 0;
    entity.passengerComment = response.passengerComment || '';
    entity.rateableUntil = response.rateableUntil || '';
    entity.createdAt = response.createdAt || '';
    return entity;
  }

  /**
   * Converts a DriverReputationResponse DTO into a DriverReputation domain entity.
   */
  static toDriverReputation(response: DriverReputationResponse): DriverReputation {
    const entity = new DriverReputation();
    entity.id = `drep-${response.driverId}`;
    entity.driverId = response.driverId || '';
    entity.averageScore = response.averageScore ?? 0;
    entity.totalRatings = Number(response.totalRatings ?? 0);
    return entity;
  }

  /**
   * Converts a PassengerReputationResponse DTO into a PassengerReputation domain entity.
   */
  static toPassengerReputation(response: PassengerReputationResponse): PassengerReputation {
    const entity = new PassengerReputation();
    entity.id = `prep-${response.passengerId}`;
    entity.passengerId = response.passengerId || '';
    entity.averageScore = response.averageScore ?? 0;
    entity.totalRatings = Number(response.totalRatings ?? 0);
    return entity;
  }
}
