/**
 * @summary Spatial and geolocation utility functions.
 */

/**
 * Calculates a rough Euclidean distance between two coordinate tuples.
 * This is an approximation for demo purposes and assumes a flat earth locally.
 * Multiplies by 111 to convert degrees to kilometers roughly.
 *
 * @param origin - Tuple of [latitude, longitude].
 * @param destination - Tuple of [latitude, longitude].
 * @returns Estimated distance in kilometers (rounded, minimum 1).
 */
export function calculateEstimatedDistance(origin: [number, number], destination: [number, number]): number {
  const dist = Math.sqrt(Math.pow(origin[0] - destination[0], 2) + Math.pow(origin[1] - destination[1], 2)) * 111;
  return Math.max(1, Math.round(dist));
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
