/**
 * @summary Raw response contract for the /fareConfig endpoint from json-server.
 * @author Sebastian Aiquipa Poma
 * */

export interface FarePolicyResponse {
  /**ID of the fare policy*/
  id: string;
  /**Base fare for the route*/
  baseFare: number;
  /**Price per km for the route*/
  pricePerKm: number;
  /**Minimum fare for the route*/
  minimumFare: number;
}
