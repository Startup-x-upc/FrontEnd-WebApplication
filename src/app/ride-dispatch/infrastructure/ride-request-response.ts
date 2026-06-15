/**
 * @summary Raw DTO for a rideRequests collection entry from json-server.
 * @author Jesús Iván Castillo Vidal
 */
export interface RideRequestResponse {
  id: string;
  passengerId: string;
  /** Set only after passenger confirms a candidate selection. */
  selectedDriverId: string | null;
  origin: string;
  destination: string;
  distanceKm: number;
  status: string;
  estimatedFare: number;
  isExpired: boolean;
  createdAt?: string;
}
