import { BaseEntity } from '../../../shared/domain/model/base-entity';

export type RatingStatus   = 'PENDING' | 'RATED' | 'SKIPPED' | 'EXPIRED';
export type RatedPartyType = 'DRIVER' | 'PASSENGER';

export class TripRating implements BaseEntity {
  id: string = '';
  tripId: string = '';
  driverId: string = '';
  passengerId: string = '';
  driverRatingStatus: RatingStatus = 'PENDING';
  passengerRatingStatus: RatingStatus = 'PENDING';
  driverScore: number = 0;
  passengerScore: number = 0;
  passengerComment: string = '';
  rateableUntil: string = '';


  openForRating(): void      { this.driverRatingStatus = 'PENDING'; this.passengerRatingStatus = 'PENDING'; }
  rateDriver(score: number): void     { this.driverScore = score; this.driverRatingStatus = 'RATED'; }
  ratePassenger(score: number): void  { this.passengerScore = score; this.passengerRatingStatus = 'RATED'; }
  skipDriverRating(): void            { this.driverRatingStatus = 'SKIPPED'; }
  skipPassengerRating(): void         { this.passengerRatingStatus = 'SKIPPED'; }
  recordPassengerLowRatingComment(comment: string): void { this.passengerComment = comment; }

  isStillRateable(): boolean {
    if (!this.rateableUntil) return false;
    return new Date() < new Date(this.rateableUntil);
  }
}
