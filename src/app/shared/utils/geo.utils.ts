/**
 * @summary Spatial and geolocation utility functions.
 */

/**
 * Calculates the great-circle distance between two coordinate tuples
 * using the Haversine formula. Returns distance in kilometers.
 *
 * @param origin - Tuple of [latitude, longitude].
 * @param destination - Tuple of [latitude, longitude].
 * @returns Distance in kilometers (rounded, minimum 1).
 */
export function calculateEstimatedDistance(origin: [number, number], destination: [number, number]): number {
  const R = 6371; // Earth's radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(destination[0] - origin[0]);
  const dLng = toRad(destination[1] - origin[1]);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(origin[0])) * Math.cos(toRad(destination[0])) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.max(1, Math.round(R * c));
}

/**
 * Parses a "lat,lng" string into a tuple of numbers.
 * Returns null if the string is invalid.
 *
 * @param coordStr - String in "lat,lng" format.
 * @returns Tuple of [lat, lng] or null.
 */
export function parseCoordString(coordStr: string): [number, number] | null {
  if (!coordStr) return null;
  const parts = coordStr.split(',');
  if (parts.length === 2) {
    const lat = parseFloat(parts[0].trim());
    const lng = parseFloat(parts[1].trim());
    if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
  }
  return null;
}
