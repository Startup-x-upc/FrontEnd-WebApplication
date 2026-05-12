export interface DriverAvailabilityResponse {
  id: string;
  driverId: string;
  currentLocation: string;
  isAvailable: boolean;
  isBusy: boolean;
  activeRideId: string | null;
}
