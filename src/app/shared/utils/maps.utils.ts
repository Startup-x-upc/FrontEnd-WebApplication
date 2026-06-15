/**
 * @summary Utility functions for building external map navigation URLs.
 * These links open Google Maps in the browser/native app without embedding a map.
 * @author Jesús Iván Castillo Vidal
 */

/**
 * Builds a Google Maps Directions URL for external navigation.
 * Opens the destination in Google Maps with driving mode.
 *
 * @param coord - Coordinate string in "lat,lng" format.
 * @returns A Google Maps directions URL.
 */
export function buildGoogleMapsDirectionsUrl(coord: string): string {
  const [lat, lng] = coord.split(',').map(s => s.trim());
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
}

/**
 * Builds a Google Maps Directions URL with both origin and destination,
 * showing the full route in driving mode.
 *
 * @param origin - Origin coordinate string in "lat,lng" format.
 * @param destination - Destination coordinate string in "lat,lng" format.
 * @returns A Google Maps directions URL with origin, destination, and route.
 */
export function buildGoogleMapsRouteUrl(origin: string, destination: string): string {
  const [oLat, oLng] = origin.split(',').map(s => s.trim());
  const [dLat, dLng] = destination.split(',').map(s => s.trim());
  return `https://www.google.com/maps/dir/?api=1&origin=${oLat},${oLng}&destination=${dLat},${dLng}&travelmode=driving`;
}
