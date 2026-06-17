export interface DriverResponse {
  id: string;
  accountId: string;
  fullName: string;
  vehicleType: string;
  verificationStatus: string;
  operationalStatus: string;
  ratingAverage?: number;
  ratingCount?: number;
  photoUrl?: string;
  licenseNumber?: string;
  soatNumber?: string;
}
