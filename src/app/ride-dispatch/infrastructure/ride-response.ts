export interface RideResponse {
  id: string;
  passengerId: string;
  driverId: string;
  origin: string;
  destination: string;
  status: string;
  estimatedFare: number;
  createdAt: string;
  completedAt: string;
}
