// Distance utility using Haversine formula
import type { UserLocationCoords } from '../../types';

/**
 * Calculates the great-circle distance between two geographic coordinates in kilometers.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's mean radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10; // Round to 1 decimal place
}

/**
 * Calculates distance between two UserLocationCoords objects.
 */
export function getDistanceBetweenCoords(
  c1?: UserLocationCoords | null,
  c2?: UserLocationCoords | null
): number | null {
  if (!c1 || !c2 || typeof c1.latitude !== 'number' || typeof c2.latitude !== 'number') {
    return null;
  }
  return calculateDistanceKm(c1.latitude, c1.longitude, c2.latitude, c2.longitude);
}

/**
 * Formats a distance in kilometers to user-friendly string (e.g. "1.2 km" or "450 m").
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
