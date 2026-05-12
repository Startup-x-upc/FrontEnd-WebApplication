import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * @summary Represents the operational availability state of a driver.
 * `isBusy` prevents the driver from being shown as available for new requests
 * while they have an active ride. `activeRideId` links to the current ride.
 * @author Jesús Iván Castillo Vidal
 */
export class DriverAvailability implements BaseEntity {
  id: string = '';
  driverId: string = '';
  isAvailable: boolean = false;
  /** True when the driver has an active ride and should not see new open requests. */
  isBusy: boolean = false;
  /** ID of the currently active ride, or null. */
  activeRideId: string | null = null;
  latitude: number = 0;
  longitude: number = 0;

  activate(): void   { this.isAvailable = true; }
  deactivate(): void { this.isAvailable = false; }
}
