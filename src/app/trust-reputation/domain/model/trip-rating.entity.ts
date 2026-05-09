import { BaseEntity } from '../../../shared/domain/model/base-entity';

export type RatingStatus   = 'PENDING' | 'RATED' | 'SKIPPED' | 'EXPIRED';
export type RatedPartyType = 'DRIVER' | 'PASSENGER';

export class TripRating implements BaseEntity {
  id: number = 0;
  tripId: number = 0;
  driverId: number = 0;
  passengerId: number = 0;
  driverRatingStatus: RatingStatus = 'PENDING';
  passengerRatingStatus: RatingStatus = 'PENDING';
  driverScore: number = 0;
  passengerScore: number = 0;
  passengerComment: string = '';
  rateableUntil: string = '';

  getId(): number                                       { return this.id; }
  setId(v: number): void                               { this.id = v; }
  getTripId(): number                                  { return this.tripId; }
  setTripId(v: number): void                           { this.tripId = v; }
  getDriverId(): number                               { return this.driverId; }
  setDriverId(v: number): void                        { this.driverId = v; }
  getPassengerId(): number                            { return this.passengerId; }
  setPassengerId(v: number): void                     { this.passengerId = v; }
  getDriverRatingStatus(): RatingStatus               { return this.driverRatingStatus; }
  setDriverRatingStatus(v: RatingStatus): void        { this.driverRatingStatus = v; }
  getPassengerRatingStatus(): RatingStatus            { return this.passengerRatingStatus; }
  setPassengerRatingStatus(v: RatingStatus): void     { this.passengerRatingStatus = v; }
  getDriverScore(): number                            { return this.driverScore; }
  setDriverScore(v: number): void                     { this.driverScore = v; }
  getPassengerScore(): number                         { return this.passengerScore; }
  setPassengerScore(v: number): void                  { this.passengerScore = v; }
  getPassengerComment(): string                       { return this.passengerComment; }
  setPassengerComment(v: string): void                { this.passengerComment = v; }
  getRateableUntil(): string                          { return this.rateableUntil; }
  setRateableUntil(v: string): void                   { this.rateableUntil = v; }

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
