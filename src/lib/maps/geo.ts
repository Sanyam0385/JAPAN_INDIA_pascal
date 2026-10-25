// Geospatial utility functions for CIRCULO maps & navigation
export interface LatLng {
  latitude: number;
  longitude: number;
}

const EARTH_RADIUS_METERS = 6371000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Calculate Haversine distance in meters between two coordinates
 */
export function distance(from: LatLng, to: LatLng): number {
  if (
    !from ||
    !to ||
    typeof from.latitude !== 'number' ||
    typeof from.longitude !== 'number' ||
    typeof to.latitude !== 'number' ||
    typeof to.longitude !== 'number'
  ) {
    return 0;
  }

  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

/**
 * Calculate initial compass bearing in degrees [0, 360) from start to destination
 */
export function bearing(from: LatLng, to: LatLng): number {
  if (!from || !to) return 0;

  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const dLon = toRadians(to.longitude - from.longitude);

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  const brng = toDegrees(Math.atan2(y, x));
  return (brng + 360) % 360;
}

/**
 * Check whether two coordinates are within a specified radius in meters
 */
export function isWithin(from: LatLng, to: LatLng, radiusM: number): boolean {
  return distance(from, to) <= radiusM;
}

/**
 * Distance from point P to line segment AB in meters
 */
export function pointToSegmentDistance(p: LatLng, a: LatLng, b: LatLng): number {
  const dAB = distance(a, b);
  if (dAB === 0) return distance(p, a);

  // Project point onto line using cartesian approximation for small geographic areas
  const dLat = b.latitude - a.latitude;
  const dLng = b.longitude - a.longitude;

  const t = Math.max(
    0,
    Math.min(
      1,
      ((p.latitude - a.latitude) * dLat + (p.longitude - a.longitude) * dLng) /
        (dLat * dLat + dLng * dLng)
    )
  );

  const projection: LatLng = {
    latitude: a.latitude + t * dLat,
    longitude: a.longitude + t * dLng,
  };

  return distance(p, projection);
}

/**
 * Minimum distance in meters from point to any segment along a polyline.
 * Essential for off-route detection (e.g. picker > 50 m off route).
 */
export function pointToPolylineDistance(point: LatLng, polyline: LatLng[]): number {
  if (!polyline || polyline.length === 0) return Infinity;
  if (polyline.length === 1) return distance(point, polyline[0]);

  let minDistance = Infinity;
  for (let i = 0; i < polyline.length - 1; i++) {
    const d = pointToSegmentDistance(point, polyline[i], polyline[i + 1]);
    if (d < minDistance) {
      minDistance = d;
    }
  }

  return minDistance;
}

/**
 * Estimate completion progress along a polyline (returns fraction between 0.0 and 1.0)
 */
export function polylineProgress(point: LatLng, polyline: LatLng[]): number {
  if (!polyline || polyline.length < 2) return 0;

  let totalLength = 0;
  const segmentLengths: number[] = [];

  for (let i = 0; i < polyline.length - 1; i++) {
    const segLen = distance(polyline[i], polyline[i + 1]);
    segmentLengths.push(segLen);
    totalLength += segLen;
  }

  if (totalLength === 0) return 0;

  // Find nearest segment
  let nearestSegmentIndex = 0;
  let minDistance = Infinity;

  for (let i = 0; i < polyline.length - 1; i++) {
    const d = pointToSegmentDistance(point, polyline[i], polyline[i + 1]);
    if (d < minDistance) {
      minDistance = d;
      nearestSegmentIndex = i;
    }
  }

  // Calculate distance traversed up to nearest segment
  let traversed = 0;
  for (let i = 0; i < nearestSegmentIndex; i++) {
    traversed += segmentLengths[i];
  }

  // Add partial projection on nearest segment
  const a = polyline[nearestSegmentIndex];
  const b = polyline[nearestSegmentIndex + 1];
  const dLat = b.latitude - a.latitude;
  const dLng = b.longitude - a.longitude;
  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.latitude - a.latitude) * dLat + (point.longitude - a.longitude) * dLng) /
        (dLat * dLat + dLng * dLng)
    )
  );

  traversed += t * (segmentLengths[nearestSegmentIndex] || 0);

  return Math.min(1, Math.max(0, traversed / totalLength));
}

/**
 * Format meters to human-readable string (e.g. "450 m" or "2.4 km")
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Format seconds to human-readable duration (e.g. "4 min" or "1 hr 15 min")
 */
export function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) {
    return `${Math.max(1, mins)} min`;
  }
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  if (remainingMins === 0) {
    return `${hours} hr`;
  }
  return `${hours} hr ${remainingMins} min`;
}

/**
 * Greedy nearest-neighbour ordering for a collection round
 */
export function optimizeStops<T extends { coordinate: LatLng }>(
  origin: LatLng,
  stops: T[]
): T[] {
  if (stops.length <= 1) return [...stops];
  const remaining = [...stops];
  const ordered: T[] = [];
  let currentPos = origin;

  while (remaining.length > 0) {
    let nearestIdx = 0;
    let minDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = distance(currentPos, remaining[i].coordinate);
      if (d < minDist) {
        minDist = d;
        nearestIdx = i;
      }
    }
    const [next] = remaining.splice(nearestIdx, 1);
    ordered.push(next);
    currentPos = next.coordinate;
  }

  return ordered;
}
