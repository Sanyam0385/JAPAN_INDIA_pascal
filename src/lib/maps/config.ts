// src/lib/maps/config.ts
// Centralized cross-platform map provider configuration & geo-seeding helpers
import { Platform } from 'react-native';
import { PROVIDER_GOOGLE, Region } from 'react-native-maps';
import type { User, CityConfig } from '../../types';
import type { LatLng } from './geo';

/**
 * Cross-platform map provider config:
 * - iOS: undefined -> Native Apple Maps (no API keys required in code)
 * - Android: PROVIDER_GOOGLE -> Native Google Maps in Expo Go (works out-of-the-box without key in code)
 * - mapType: 'standard'
 *
 * NOTE FOR PRODUCTION BUILDS:
 * Standalone production Android APK/AAB builds require a Google Maps API key in app.json
 * under `android.config.googleMaps.apiKey`, which should be injected via an environment
 * variable (e.g. EXPO_PUBLIC_GOOGLE_MAPS_API_KEY) in EAS Build secrets, NEVER committed.
 */
export const mapConfig = {
  provider: (Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined) as 'google' | undefined,
  mapType: 'standard' as const,
};

/**
 * Default fallback coordinates for India (national center / New Delhi)
 */
export const DEFAULT_INDIA_COORDS: LatLng = {
  latitude: 28.6139,
  longitude: 77.2090,
};

export const DEFAULT_MAP_REGION: Region = {
  latitude: DEFAULT_INDIA_COORDS.latitude,
  longitude: DEFAULT_INDIA_COORDS.longitude,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

/**
 * Resolve the user's active geographic center:
 * Priority:
 * 1. Live GPS position (if available)
 * 2. Stored profile lat/lng
 * 3. Resolved city center config (e.g. Patiala has 30.3398, 76.3869)
 * 4. India default center (28.6139, 77.2090)
 *
 * Never defaults to Bengaluru for real accounts.
 */
export function getResolvedUserCenter(
  user?: User | null,
  liveCoords?: LatLng | null,
  cityConfig?: CityConfig | null
): LatLng {
  if (
    liveCoords &&
    typeof liveCoords.latitude === 'number' &&
    typeof liveCoords.longitude === 'number' &&
    (liveCoords.latitude !== 0 || liveCoords.longitude !== 0)
  ) {
    return {
      latitude: liveCoords.latitude,
      longitude: liveCoords.longitude,
    };
  }

  if (
    user?.lat &&
    user?.lng &&
    typeof user.lat === 'number' &&
    typeof user.lng === 'number' &&
    (user.lat !== 0 || user.lng !== 0)
  ) {
    return {
      latitude: user.lat,
      longitude: user.lng,
    };
  }

  if (
    user?.coordinates?.latitude &&
    user?.coordinates?.longitude &&
    (user.coordinates.latitude !== 0 || user.coordinates.longitude !== 0)
  ) {
    return {
      latitude: user.coordinates.latitude,
      longitude: user.coordinates.longitude,
    };
  }

  if (
    cityConfig?.centerCoords?.lat &&
    cityConfig?.centerCoords?.lng &&
    (cityConfig.centerCoords.lat !== 0 || cityConfig.centerCoords.lng !== 0)
  ) {
    return {
      latitude: cityConfig.centerCoords.lat,
      longitude: cityConfig.centerCoords.lng,
    };
  }

  return DEFAULT_INDIA_COORDS;
}

/**
 * Helper to get initial map region from resolved coordinates
 */
export function getInitialMapRegion(
  user?: User | null,
  liveCoords?: LatLng | null,
  cityConfig?: CityConfig | null,
  delta: number = 0.06
): Region {
  const center = getResolvedUserCenter(user, liveCoords, cityConfig);
  return {
    latitude: center.latitude,
    longitude: center.longitude,
    latitudeDelta: delta,
    longitudeDelta: delta,
  };
}

/**
 * Deterministically generates demo coordinates around a given center
 * with small realistic offsets (about 0.3 - 2.0 km) for real user accounts in any city.
 */
export function seedCoordsAround(center: LatLng, count: number): LatLng[] {
  if (count <= 0) return [];
  const coords: LatLng[] = [];
  const latRad = (center.latitude * Math.PI) / 180;
  // 1 degree latitude ~ 110.574 km
  // 1 degree longitude ~ 111.320 * cos(lat) km
  const cosLat = Math.cos(latRad) || 0.86;

  for (let i = 0; i < count; i++) {
    // Distribute distance between 0.35 km and 1.95 km
    const distKm = 0.35 + (((i * 7 + 3) % 10) / 10) * 1.5;
    // Spread angles evenly around 360 deg with alternating perturbation
    const angleDeg = (i * (360 / Math.max(1, count)) + ((i % 3) * 24 - 24)) % 360;
    const angleRad = (angleDeg * Math.PI) / 180;

    const dLat = (distKm * Math.cos(angleRad)) / 110.574;
    const dLng = (distKm * Math.sin(angleRad)) / (111.32 * cosLat);

    coords.push({
      latitude: Number((center.latitude + dLat).toFixed(6)),
      longitude: Number((center.longitude + dLng).toFixed(6)),
    });
  }

  return coords;
}
