/**
 * @summary Represents a fare policy for a given route.
 * @author Sebastian Andres Aiquipa Poma
 * */

export class FarePolicy {
  /**ID of the fare policy*/
  id: string;
  /**Base fare for the route*/
  baseFare: number;
  /**Price per km for the route*/
  pricePerKm: number;
  /**Minimum fare for the route*/
  minimumFare: number;

  constructor(props: { id: string; baseFare: number; pricePerKm: number; minimumFare: number }) {
    this.id = props.id;
    this.baseFare = props.baseFare;
    this.pricePerKm = props.pricePerKm;
    this.minimumFare = props.minimumFare;
  }
}
