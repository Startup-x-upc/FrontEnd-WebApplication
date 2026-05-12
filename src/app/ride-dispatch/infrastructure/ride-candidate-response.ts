/**
 * @summary Raw DTO for a rideCandidates collection entry from json-server.
 * @author Jesús Iván Castillo Vidal
 */
export interface RideCandidateResponse {
  id: string;
  requestId: string;
  driverId: string;
  driverName: string;
  vehicleType: string;
  ratingAverage: number;
  photoUrl: string;
  status: string;
  appliedAt: string;
}
