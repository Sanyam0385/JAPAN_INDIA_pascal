// Single source of truth hook for user location and city resolution
import { useMemo, useCallback } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useAppStore } from '../../stores/appStore';
import { resolveCity, CITY_CONFIGS } from '../config/cities';
import type { CityConfig, User } from '../../types';

export interface UserLocationState {
  locality: string;
  subLocality?: string;
  city?: string;
  state?: string;
  wardName?: string;
  cityKey: string;
  lat?: number;
  lng?: number;
  accuracy?: number | null;
  locationSource: 'gps' | 'manual' | 'demo' | 'none';
  locationUpdatedAt?: string;
  hasLocation: boolean;
  displayLocation: string;
  municipalName: string;
  cityConfig: CityConfig;
  isConfiguredCity: boolean;
  isDemoUser: boolean;
  updateLocation: (data: Partial<User>) => void;
  userLocation: UserLocationState;
}

/**
 * Cleanly formats locality and city without nested brackets.
 * E.g., "Patiala, Punjab", "Model Town, Patiala", "Koramangala, Bengaluru"
 */
export function formatLocationTitle(locality?: string, city?: string, state?: string): string {
  if (!locality && !city) return '';

  const clean = (str?: string) =>
    (str || '')
      .replace(/\s*\([^)]*\)/g, '') // remove existing parentheses
      .trim();

  const cLoc = clean(locality);
  const cCity = clean(city);
  const cState = clean(state);

  if (cLoc && cCity && cLoc.toLowerCase() !== cCity.toLowerCase()) {
    if (cLoc.toLowerCase().includes(cCity.toLowerCase())) {
      return cLoc;
    }
    return `${cLoc}, ${cCity}`;
  }

  if (cLoc && cState && !cLoc.toLowerCase().includes(cState.toLowerCase())) {
    return `${cLoc}, ${cState}`;
  }

  return cLoc || cCity || 'Location Detected';
}

export function useUserLocation(): UserLocationState {
  const user = useAuthStore((s) => s.user);
  const isDemoMode = useAuthStore((s) => s.isDemoMode);
  const updateUserLocation = useAuthStore((s) => s.updateUserLocation);
  const setAppCity = useAppStore((s) => s.setCity);

  const isDemoUser = Boolean(
    isDemoMode && user?.id && (user.id.startsWith('demo-') || user.email.includes('@circulo.app'))
  );

  return useMemo(() => {
    // 1. Demo Persona fallback: Priya Sharma, Ramesh, etc. keep seeded Bengaluru
    if (isDemoUser) {
      const demoConfig = CITY_CONFIGS.bengaluru;
      const demoLocality = user?.locality || 'Koramangala, Bengaluru';
      const demoState: any = {
        locality: demoLocality,
        subLocality: 'Koramangala',
        city: 'Bengaluru',
        state: 'Karnataka',
        wardName: 'Zone 3A — Koramangala Ward 151',
        cityKey: 'bengaluru',
        lat: 12.9352,
        lng: 77.6245,
        accuracy: 10,
        locationSource: 'demo',
        locationUpdatedAt: user?.locationUpdatedAt,
        hasLocation: true,
        displayLocation: demoLocality,
        municipalName: demoConfig.municipalName || 'Bruhat Bengaluru Mahanagara Palike (BBMP)',
        cityConfig: demoConfig,
        isConfiguredCity: true,
        isDemoUser: true,
        updateLocation: (data: Partial<User>) => {
          updateUserLocation(data);
          if (data.cityKey) setAppCity(data.cityKey);
        },
      };
      demoState.userLocation = demoState;
      return demoState;
    }

    // 2. Real Registered User
    const hasLocation = Boolean(
      user &&
        (user.locality?.trim() ||
          user.cityKey ||
          (typeof user.lat === 'number' && typeof user.lng === 'number'))
    );

    const lat = user?.lat ?? user?.coordinates?.latitude;
    const lng = user?.lng ?? user?.coordinates?.longitude;

    const resolvedConfig = resolveCity({
      cityKey: user?.cityKey,
      city: user?.city,
      district: user?.locality,
      subLocality: user?.subLocality,
      state: user?.state,
      locality: user?.locality,
      lat,
      lng,
    });

    const isConfiguredCity = !resolvedConfig.isGeneric && resolvedConfig.cityCode !== 'generic';
    const displayLocation = hasLocation
      ? formatLocationTitle(user?.locality, user?.city, user?.state)
      : '';

    const municipalName =
      resolvedConfig.municipalName ||
      (isConfiguredCity ? resolvedConfig.name : 'Local Municipal Authority');

    const realState: any = {
      locality: user?.locality || '',
      subLocality: user?.subLocality,
      city: user?.city,
      state: user?.state,
      wardName: user?.wardName || resolvedConfig.wardName || '',
      cityKey: resolvedConfig.cityCode || 'generic',
      lat,
      lng,
      accuracy: user?.accuracy,
      locationSource: user?.locationSource || (hasLocation ? 'gps' : 'none'),
      locationUpdatedAt: user?.locationUpdatedAt,
      hasLocation,
      displayLocation,
      municipalName,
      cityConfig: resolvedConfig,
      isConfiguredCity,
      isDemoUser: false,
      updateLocation: (data: Partial<User>) => {
        updateUserLocation(data);
        const nextConfig = resolveCity({
          cityKey: data.cityKey || user?.cityKey,
          locality: data.locality || user?.locality,
          city: data.city || user?.city,
          state: data.state || user?.state,
          lat: data.lat ?? user?.lat,
          lng: data.lng ?? user?.lng,
        });
        if (nextConfig.cityCode) {
          setAppCity(nextConfig.cityCode);
        }
      },
    };
    realState.userLocation = realState;
    return realState;
  }, [user, isDemoUser, updateUserLocation, setAppCity]);
}
