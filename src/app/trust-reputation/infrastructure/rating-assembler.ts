import { TripRating } from '../domain/model/trip-rating.entity';
import { RatingResponse } from './rating-response';

export class RatingAssembler {
  static toEntity(response: RatingResponse): TripRating {
    const entity = new TripRating();
    entity.id = response.id;
    entity.rideId = response.rideId;
    entity.ratingValue = response.rating;
    entity.comment = response.comment;
    return entity;
  }
}
