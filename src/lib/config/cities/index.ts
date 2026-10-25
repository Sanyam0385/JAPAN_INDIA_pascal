import type { CityConfig, CityBinConfig } from '../../../types';
import { calculateDistanceKm } from '../../location/distance';
import bengaluruRaw from './bengaluru.json';
import amritsarRaw from './amritsar.json';
import delhiRaw from './delhi.json';
import patialaRaw from './patiala.json';
import genericRaw from './generic.json';

// Indicative: Collection rules and schedules for Patiala are based on Punjab Municipal Solid Waste Bylaws;
// to be verified with Municipal Corporation Patiala (MCP).

function normalizeCityConfig(raw: any): CityConfig {
  const binsArray: CityBinConfig[] = (raw.bins || []).map((b: any) => ({
    key: b.key,
    label: b.label,
    localLabel: b.localLabel || b.label,
    colorHex: b.colorHex || b.color || '#2E7D32',
    color: b.colorHex || b.color || '#2E7D32',
    colorName: b.key === 'wet' ? 'Green' : b.key === 'dry' ? 'Blue' : 'Red',
    accepts: b.accepts || b.acceptedItems || [],
    acceptedItems: b.accepts || b.acceptedItems || [],
    rules: b.rules || [],
  }));

  const binsHybrid: any = [...binsArray];
  binsArray.forEach(b => {
    binsHybrid[b.key] = b;
  });

  const cityName = raw.cityName || raw.name || 'General Municipality';

  const schedule = raw.schedule || {
    wet: raw.cityCode === 'patiala'
      ? 'Mon, Wed, Fri (06:30 – 08:30 AM)'
      : raw.cityCode === 'amritsar'
      ? 'Mon, Wed, Fri (06:30 – 08:30 AM)'
      : raw.cityCode === 'delhi'
      ? 'Mon, Wed, Fri (07:00 – 09:30 AM)'
      : raw.cityCode === 'bengaluru'
      ? 'Mon, Wed, Fri (07:00 – 09:00 AM)'
      : 'Ask your local body for timings',
    dry: raw.cityCode === 'patiala'
      ? 'Tue, Thu, Sat (06:30 – 08:30 AM)'
      : raw.cityCode === 'amritsar'
      ? 'Tue, Thu, Sun (06:30 – 08:30 AM)'
      : raw.cityCode === 'delhi'
      ? 'Tue, Thu, Sun (07:00 – 09:30 AM)'
      : raw.cityCode === 'bengaluru'
      ? 'Tue, Thu, Sun (07:00 – 09:00 AM)'
      : 'Ask your local body for timings',
    hazardous: raw.cityCode === 'patiala'
      ? 'Saturday (07:00 – 09:00 AM)'
      : raw.cityCode === 'amritsar'
      ? 'Saturday (07:00 – 09:00 AM)'
      : raw.cityCode === 'delhi'
      ? 'Saturday (08:00 – 10:00 AM)'
      : raw.cityCode === 'bengaluru'
      ? 'Saturday (07:00 – 09:30 AM)'
      : 'Ask your local body for timings',
    sanitary: raw.cityCode === 'patiala'
      ? 'Saturday (07:00 – 09:00 AM)'
      : raw.cityCode === 'amritsar'
      ? 'Saturday (07:00 – 09:00 AM)'
      : raw.cityCode === 'delhi'
      ? 'Saturday (08:00 – 10:00 AM)'
      : raw.cityCode === 'bengaluru'
      ? 'Saturday (07:00 – 09:30 AM)'
      : 'Ask your local body for timings',
  };

  return {
    cityName,
    name: cityName,
    municipalName: raw.municipalName || (raw.cityCode === 'patiala' ? 'Municipal Corporation Patiala' : raw.cityCode === 'bengaluru' ? 'Bruhat Bengaluru Mahanagara Palike' : raw.cityCode === 'amritsar' ? 'Amritsar Municipal Corporation' : raw.cityCode === 'delhi' ? 'Municipal Corporation of Delhi' : 'Local Municipal Body'),
    state: raw.state || (raw.cityCode === 'patiala' || raw.cityCode === 'amritsar' ? 'Punjab' : raw.cityCode === 'bengaluru' ? 'Karnataka' : raw.cityCode === 'delhi' ? 'Delhi' : ''),
    wardName: raw.wardName || '',
    cityCode: raw.cityCode || '',
    isGeneric: Boolean(raw.isGeneric),
    notice: raw.notice || (raw.isGeneric ? "Your city isn't configured yet, so general segregation rules are shown." : undefined),
    centerCoords: raw.centerCoords || (
      raw.cityCode === 'patiala' ? { lat: 30.3398, lng: 76.3869 } :
      raw.cityCode === 'amritsar' ? { lat: 31.6340, lng: 74.8723 } :
      raw.cityCode === 'delhi' ? { lat: 28.6139, lng: 77.2090 } :
      raw.cityCode === 'bengaluru' ? { lat: 12.9716, lng: 77.5946 } : undefined
    ),
    bins: binsHybrid,
    collectionSchedule: raw.collectionSchedule || [],
    schedule,
  };
}

export const CITY_CONFIGS: Record<string, CityConfig> = {
  patiala: normalizeCityConfig(patialaRaw),
  amritsar: normalizeCityConfig(amritsarRaw),
  bengaluru: normalizeCityConfig(bengaluruRaw),
  delhi: normalizeCityConfig(delhiRaw),
  generic: normalizeCityConfig(genericRaw),
};

export const DEFAULT_CITY = 'generic';
export const DEFAULT_CITY_CONFIG = CITY_CONFIGS.generic;

export const AVAILABLE_CITIES = [
  { code: 'patiala', name: 'Patiala (MC Patiala)', state: 'Punjab' },
  { code: 'amritsar', name: 'Amritsar (AMC)', state: 'Punjab' },
  { code: 'bengaluru', name: 'Bengaluru (BBMP)', state: 'Karnataka' },
  { code: 'delhi', name: 'Delhi (MCD)', state: 'Delhi NCR' },
  { code: 'generic', name: 'Other (Standard Municipal Rules)', state: 'India' },
];

/**
 * Normalizes text to lowercase ASCII (stripping accents like ā -> a, etc.)
 */
function cleanText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export type CityResolveInput =
  | string
  | {
      city?: string | null;
      district?: string | null;
      region?: string | null;
      state?: string | null;
      subLocality?: string | null;
      locality?: string | null;
      cityName?: string | null;
      cityKey?: string | null;
      lat?: number | null;
      lng?: number | null;
      latitude?: number | null;
      longitude?: number | null;
    }
  | null
  | undefined;

/**
 * Resolves a CityConfig from raw location input.
 * Priority:
 * 1. Explicit cityKey match ('patiala', 'amritsar', 'bengaluru', 'delhi')
 * 2. Reverse-geocoded text matching (city, district, locality, state) with spelling variants
 * 3. Proximity fallback: nearest city within 50 km haversine distance
 * 4. Fallback: generic config (NEVER silently default to Bengaluru!)
 */
export function resolveCity(input: CityResolveInput): CityConfig {
  if (!input) {
    return CITY_CONFIGS.generic;
  }

  // 1. Direct string input
  if (typeof input === 'string') {
    const rawKey = input.toLowerCase().trim();
    if (CITY_CONFIGS[rawKey]) {
      return CITY_CONFIGS[rawKey];
    }
    const cleaned = cleanText(input);
    return matchCityByText(cleaned) || CITY_CONFIGS.generic;
  }

  // 2. Explicit cityKey
  if (input.cityKey && CITY_CONFIGS[input.cityKey.toLowerCase().trim()]) {
    return CITY_CONFIGS[input.cityKey.toLowerCase().trim()];
  }

  // 3. Match by text fields
  const combinedText = [
    input.city,
    input.district,
    input.subLocality,
    input.locality,
    input.region,
    input.state,
    input.cityName,
  ]
    .filter(Boolean)
    .join(' ');

  const cleaned = cleanText(combinedText);
  const textMatched = matchCityByText(cleaned);
  if (textMatched) {
    return textMatched;
  }

  // 4. Coordinates fallback (within 50 km only)
  const lat = typeof input.lat === 'number' ? input.lat : input.latitude;
  const lng = typeof input.lng === 'number' ? input.lng : input.longitude;

  if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
    let nearestCity: CityConfig | null = null;
    let minDistance = Infinity;

    for (const [key, config] of Object.entries(CITY_CONFIGS)) {
      if (key === 'generic' || !config.centerCoords) continue;
      const d = calculateDistanceKm(lat, lng, config.centerCoords.lat, config.centerCoords.lng);
      if (d < minDistance) {
        minDistance = d;
        nearestCity = config;
      }
    }

    if (nearestCity && minDistance <= 50) {
      return nearestCity;
    }
  }

  // 5. Fallback: generic rules (never silently default to Bengaluru!)
  return CITY_CONFIGS.generic;
}

function matchCityByText(text: string): CityConfig | null {
  if (!text) return null;

  // Patiala variants & key landmarks
  if (
    text.includes('patiala') ||
    text.includes('patiaala') ||
    text.includes('model town') ||
    text.includes('leela bhawan') ||
    text.includes('baradari') ||
    text.includes('tripuri') ||
    text.includes('passi road') ||
    text.includes('nabha') ||
    text.includes('samana') ||
    (text.includes('punjab') && (text.includes('mc patiala') || text.includes('patiala')))
  ) {
    return CITY_CONFIGS.patiala;
  }

  // Amritsar variants
  if (
    text.includes('amritsar') ||
    text.includes('amritser') ||
    text.includes('golden temple') ||
    text.includes('ranjit avenue') ||
    text.includes('amritsar cantt') ||
    text.includes('lawrence road') ||
    text.includes('majitha')
  ) {
    return CITY_CONFIGS.amritsar;
  }

  // Bengaluru variants
  if (
    text.includes('bengaluru') ||
    text.includes('bangalore') ||
    text.includes('koramangala') ||
    text.includes('indiranagar') ||
    text.includes('hsr layout') ||
    text.includes('whitefield') ||
    text.includes('jayanagar') ||
    text.includes('jp nagar') ||
    text.includes('bbmp') ||
    text.includes('electronic city')
  ) {
    return CITY_CONFIGS.bengaluru;
  }

  // Delhi variants
  if (
    text.includes('delhi') ||
    text.includes('new delhi') ||
    text.includes('dwarka') ||
    text.includes('rohini') ||
    text.includes('connaught place') ||
    text.includes('south delhi') ||
    text.includes('mcd')
  ) {
    return CITY_CONFIGS.delhi;
  }

  return null;
}
