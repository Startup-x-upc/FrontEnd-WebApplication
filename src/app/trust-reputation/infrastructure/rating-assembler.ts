import { TripRating } from '../domain/model/trip-rating.entity';
import { RatingResponse } from './rating-response';

export class RatingAssembler {
  static toEntity(response: RatingResponse): TripRating {
    const entity = new TripRating();
    entity.id = response.id;
    entity.tripId = response.rideId;
    entity.driverScore = response.rating;
    entity.passengerScore = response.rating;
    entity.passengerComment = response.comment;
    return entity;
  }
}
