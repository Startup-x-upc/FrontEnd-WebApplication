/**
 * @summary Raw response contract for the /ratings endpoint from json-server.
 * Maps to the ratings collection in db.json. One entry per trip,
 * holding both driver and passenger rating data.
 * @author Sprint 3 — Trust & Reputation Bounded Context
 */
export interface RatingResponse {
  /** Unique identifier for this rating record. */
  id: string;
  /** The ride/trip this rating belongs to (maps to rides.id in db.json). */
  rideId: string;
  /** Driver being rated. */
  driverId: string;
  /** Passenger being rated. */
  passengerId: string;
  /** Rating status for the driver side: 'PENDING' | 'RATED' | 'SKIPPED' | 'EXPIRED'. */
  driverRatingStatus: string;
  /** Rating status for the passenger side: 'PENDING' | 'RATED' | 'SKIPPED' | 'EXPIRED'. */
  passengerRatingStatus: string;
  /** Score given to the driver (1-5). 0 if not yet rated. */
  driverScore: number;
  /** Score given to the passenger (1-5). 0 if not yet rated. */
  passengerScore: number;
  /** Optional comment from the driver when rating the passenger. */
  passengerComment: string;
  /** ISO date string — ratings must be submitted before this time (24h window). */
  rateableUntil: string;
}
