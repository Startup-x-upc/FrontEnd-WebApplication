import { TripRating, RatingStatus } from '../domain/model/trip-rating.entity';
import { RatingResponse } from './rating-response';

/**
 * @summary Maps RatingResponse DTOs from json-server into TripRating domain entities.
 * Uses static methods — no @Injectable, no side effects.
 * @author Sprint 3 — Trust & Reputation Bounded Context
 */
export class RatingAssembler {

  /**
   * Converts a raw RatingResponse DTO into a TripRating domain entity.
   * Maps all fields from the db.json ratings collection.
   *
   * @param response - The raw rating object returned by json-server.
   * @returns A fully populated TripRating entity.
   */
  static toEntity(response: RatingResponse): TripRating {
    const entity = new TripRating();
    entity.id = response.id;
    entity.tripId = response.rideId;
    entity.driverId = response.driverId;
    entity.passengerId = response.passengerId;
    entity.driverRatingStatus = response.driverRatingStatus as RatingStatus;
    entity.passengerRatingStatus = response.passengerRatingStatus as RatingStatus;
    entity.driverScore = response.driverScore;
    entity.passengerScore = response.passengerScore;
    entity.passengerComment = response.passengerComment;
    entity.rateableUntil = response.rateableUntil;
    return entity;
  }

  /**
   * Converts a TripRating entity back into a plain object for POST/PATCH requests.
   *
   * @param entity - The TripRating domain entity to serialize.
   * @returns A plain object matching the db.json ratings schema.
   */
  static toResponse(entity: TripRating): RatingResponse {
    return {
      id: entity.id,
      rideId: entity.tripId,
      driverId: entity.driverId,
      passengerId: entity.passengerId,
      driverRatingStatus: entity.driverRatingStatus,
      passengerRatingStatus: entity.passengerRatingStatus,
      driverScore: entity.driverScore,
      passengerScore: entity.passengerScore,
      passengerComment: entity.passengerComment,
      rateableUntil: entity.rateableUntil,
    };
  }
}
