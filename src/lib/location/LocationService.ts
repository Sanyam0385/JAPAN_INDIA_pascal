// Core Location Service managing permissions, live tracking, and geocoding
import { Platform, AppState, AppStateStatus } from 'react-native';
import * as Location from 'expo-location';
import type { UserLocationCoords } from '../../types';
import { useLocationStore, LocationPermissionStatus } from './locationStore';
import { resolveCity } from '../config/cities';

export interface LocationResult {
  coords: UserLocationCoords;
  locality: string;
  subLocality?: string;
  city?: string;
  state?: string;
  district?: string;
  wardName?: string;
  cityKey?: string;
}

class LocationServiceImpl {
  private subscription: Location.LocationSubscription | null = null;
  private webWatchId: number | null = null;
  private appStateSubscription: any = null;
  private lastUpdateTimestamp = 0;
  private throttleMs = 4000; // Throttle live updates to avoid high render frequency

  constructor() {
    this.handleAppStateChange = this.handleAppStateChange.bind(this);
  }

  /**
   * Requests foreground location permission across native and web.
   */
  async requestPermission(): Promise<LocationPermissionStatus> {
    try {
      if (Platform.OS === 'web') {
        if (!navigator?.geolocation) {
          useLocationStore.getState().setPermissionStatus('denied');
          useLocationStore.getState().setError('Geolocation is not supported by your browser.');
          return 'denied';
        }
        useLocationStore.getState().setPermissionStatus('granted');
        return 'granted';
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      const mappedStatus: LocationPermissionStatus = status === 'granted' ? 'granted' : 'denied';
      useLocationStore.getState().setPermissionStatus(mappedStatus);
      return mappedStatus;
    } catch (e) {
      useLocationStore.getState().setPermissionStatus('denied');
      useLocationStore.getState().setError((e as Error).message);
      return 'denied';
    }
  }

  /**
   * Fetches current location with balanced accuracy and reverse-geocodes locality.
   */
  async getCurrentLocation(timeoutMs = 9000): Promise<LocationResult> {
    return this.getCurrentPositionAsync(timeoutMs);
  }

  async getCurrentPositionAsync(timeoutMs = 9000): Promise<LocationResult> {
    const store = useLocationStore.getState();
    store.setError(null);

    const permission = await this.requestPermission();
    if (permission !== 'granted') {
      const err = 'Location permission not granted';
      store.setError(err);
      throw new Error(err);
    }

    // WEB FALLBACK
    if (Platform.OS === 'web') {
      return new Promise<LocationResult>((resolve, reject) => {
        if (!navigator?.geolocation) {
          const fallbackLocality = 'Location unavailable';
          store.setLocality(fallbackLocality);
          resolve({
            coords: { latitude: 30.3398, longitude: 76.3869, accuracy: 100, timestamp: Date.now() },
            locality: fallbackLocality,
          });
          return;
        }

        const timer = setTimeout(() => {
          const fallbackLocality = 'Approximate Location';
          store.setLocality(fallbackLocality);
          resolve({
            coords: { latitude: 30.3398, longitude: 76.3869, accuracy: 100, timestamp: Date.now() },
            locality: fallbackLocality,
          });
        }, timeoutMs);

        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            clearTimeout(timer);
            const coords: UserLocationCoords = {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              heading: pos.coords.heading,
              speed: pos.coords.speed,
              timestamp: pos.timestamp,
            };
            store.setCoords(coords);

            let detailed: Partial<LocationResult> = {};
            try {
              detailed = await this.reverseGeocodeStructured(coords.latitude, coords.longitude);
            } catch {
              detailed = {
                locality: `${coords.latitude.toFixed(3)}°, ${coords.longitude.toFixed(3)}° (Approx)`,
              };
            }
            const locality = detailed.locality || `${coords.latitude.toFixed(3)}°, ${coords.longitude.toFixed(3)}°`;
            store.setLocality(locality);
            resolve({
              coords,
              locality,
              ...detailed,
            });
          },
          (err) => {
            clearTimeout(timer);
            store.setError(err.message);
            reject(new Error(err.message));
          },
          { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 60000 }
        );
      });
    }

    // NATIVE (iOS & Android)
    try {
      const isEnabled = await Location.hasServicesEnabledAsync();
      if (!isEnabled) {
        throw new Error('Device location services are disabled.');
      }

      // Race position check against timeout
      const positionPromise = Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Location request timed out.')), timeoutMs)
      );

      const location = await Promise.race([positionPromise, timeoutPromise]);
      const coords: UserLocationCoords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        heading: location.coords.heading,
        speed: location.coords.speed,
        timestamp: location.timestamp,
      };

      store.setCoords(coords);
      const detailed = await this.reverseGeocodeStructured(coords.latitude, coords.longitude);
      store.setLocality(detailed.locality);

      return {
        coords,
        ...detailed,
      };
    } catch (e) {
      const msg = (e as Error).message || 'Unable to detect location';
      store.setError(msg);
      throw e;
    }
  }

  /**
   * Reverse-geocodes coordinates into a structured location result.
   */
  async reverseGeocodeStructured(latitude: number, longitude: number): Promise<{
    locality: string;
    subLocality?: string;
    city?: string;
    state?: string;
    district?: string;
    wardName?: string;
    cityKey?: string;
  }> {
    try {
      const results = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (results && results.length > 0) {
        const place = results[0];
        const sub = place.district || place.subregion || (place as any).subLocality || place.name || '';
        const city = place.city || place.subregion || place.district || '';
        const state = place.region || place.country || '';
        const ward = (place as any).ward || '';

        const resolvedConfig = resolveCity({
          city,
          district: place.district,
          subLocality: sub,
          state,
          lat: latitude,
          lng: longitude,
        });

        let localityString = '';
        if (sub && city && sub.toLowerCase() !== city.toLowerCase()) {
          localityString = `${sub}, ${city}`;
        } else if (city && state && city.toLowerCase() !== state.toLowerCase()) {
          localityString = `${city}, ${state}`;
        } else if (city) {
          localityString = city;
        } else if (sub) {
          localityString = sub;
        } else {
          localityString = `${latitude.toFixed(3)}°, ${longitude.toFixed(3)}°`;
        }

        return {
          locality: localityString,
          subLocality: sub || undefined,
          city: city || undefined,
          state: state || undefined,
          district: place.district || undefined,
          wardName: ward || undefined,
          cityKey: resolvedConfig.cityCode,
        };
      }
    } catch {
      // Graceful fallback without hardcoded defaults
    }

    const resolved = resolveCity({ lat: latitude, lng: longitude });
    return {
      locality: `${latitude.toFixed(3)}°, ${longitude.toFixed(3)}°`,
      cityKey: resolved.cityCode,
    };
  }

  /**
   * Reverse-geocodes coordinates into clean string (backward compatibility).
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    const res = await this.reverseGeocodeStructured(latitude, longitude);
    return res.locality;
  }

  /**
   * Starts live position tracking with AppState foreground management.
   */
  async startTracking(
    callback?: (coords: UserLocationCoords) => void,
    options: { timeInterval?: number; distanceInterval?: number } = {}
  ): Promise<void> {
    if (this.subscription || this.webWatchId !== null) {
      return; // Already tracking
    }

    const { timeInterval = 5000, distanceInterval = 10 } = options;
    const store = useLocationStore.getState();
    store.setTracking(true);

    // Register AppState listener to automatically pause tracking when backgrounded
    if (!this.appStateSubscription) {
      this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
    }

    if (Platform.OS === 'web') {
      if (!navigator?.geolocation) return;
      this.webWatchId = navigator.geolocation.watchPosition(
        (pos) => {
          const now = Date.now();
          if (now - this.lastUpdateTimestamp < this.throttleMs) return;
          this.lastUpdateTimestamp = now;

          const coords: UserLocationCoords = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            heading: pos.coords.heading,
            speed: pos.coords.speed,
            timestamp: pos.timestamp,
          };

          store.setCoords(coords);
          if (callback) callback(coords);
        },
        (err) => store.setError(err.message),
        { enableHighAccuracy: false, maximumAge: 5000 }
      );
      return;
    }

    try {
      this.subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval,
          distanceInterval,
        },
        (location) => {
          const now = Date.now();
          if (now - this.lastUpdateTimestamp < this.throttleMs) return;
          this.lastUpdateTimestamp = now;

          const coords: UserLocationCoords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            heading: location.coords.heading,
            speed: location.coords.speed,
            timestamp: location.timestamp,
          };

          store.setCoords(coords);
          if (callback) callback(coords);
        }
      );
    } catch (e) {
      store.setError((e as Error).message);
      this.stopTracking();
    }
  }

  /**
   * Stops tracking and cleans up subscriptions.
   */
  stopTracking(): void {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }
    if (this.webWatchId !== null && Platform.OS === 'web' && navigator?.geolocation) {
      navigator.geolocation.clearWatch(this.webWatchId);
      this.webWatchId = null;
    }
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }

    useLocationStore.getState().setTracking(false);
  }

  private handleAppStateChange(nextAppState: AppStateStatus): void {
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      if (this.subscription) {
        this.subscription.remove();
        this.subscription = null;
      }
      if (this.webWatchId !== null && Platform.OS === 'web' && navigator?.geolocation) {
        navigator.geolocation.clearWatch(this.webWatchId);
        this.webWatchId = null;
      }
    } else if (nextAppState === 'active') {
      if (useLocationStore.getState().isTracking) {
        this.startTracking();
      }
    }
  }
}

export const LocationService = new LocationServiceImpl();
export const locationService = LocationService;
