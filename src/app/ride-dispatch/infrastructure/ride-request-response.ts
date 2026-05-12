export interface RideRequestResponse {
  id: string;
  passengerId: string;
  driverId?: string;
  origin: string;
  destination: string;
  distanceKm: number;
  status: string;
  estimatedFare: number;
  isExpired: boolean;
}
