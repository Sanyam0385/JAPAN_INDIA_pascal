// OSRM Routing & Navigation Service for CIRCULO
import i18n from '../../i18n';
import { LatLng, distance } from './geo';

export interface RouteStep {
  instruction: string;
  distanceM: number;
  durationS: number;
  location: LatLng;
  maneuverType?: string;
  modifier?: string;
}

export interface RouteResult {
  geometry: LatLng[];
  distanceM: number;
  durationS: number;
  steps: RouteStep[];
  source: 'osrm' | 'fallback';
}

export type RoutingMode = 'picker' | 'collector' | 'walking';

// Speed assumptions for offline / network-error fallbacks
const MODE_SPEED_METERS_PER_SEC: Record<RoutingMode, number> = {
  picker: (20 * 1000) / 3600, // 20 km/h picker cart-rickshaw (~5.56 m/s)
  collector: (25 * 1000) / 3600, // 25 km/h municipal collector truck (~6.94 m/s)
  walking: (5 * 1000) / 3600, // 5 km/h walking (~1.39 m/s)
};

const OSRM_BASE_URL = 'https://router.project-osrm.org';
const TIMEOUT_MS = 6000;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 mins

// In-memory route cache keyed by rounded coordinates
const routeCache = new Map<string, { result: RouteResult; timestamp: number }>();

function getCacheKey(mode: RoutingMode, from: LatLng, to: LatLng): string {
  return `${mode}:${from.latitude.toFixed(4)},${from.longitude.toFixed(4)}->${to.latitude.toFixed(4)},${to.longitude.toFixed(4)}`;
}

/**
 * Translate OSRM maneuver type and modifier through i18n
 */
export function translateManeuver(type?: string, modifier?: string, streetName?: string): string {
  const t = (key: string, def: string) => i18n.t(key, { defaultValue: def });

  let text = '';

  if (type === 'depart') {
    text = t('map.maneuvers.depart', 'Head toward your destination');
  } else if (type === 'arrive') {
    text = t('map.maneuvers.arrive', 'You have arrived at your destination');
  } else if (type === 'roundabout') {
    text = t('map.maneuvers.roundabout', 'Enter the roundabout');
  } else if (type === 'merge') {
    text = t('map.maneuvers.merge', 'Merge');
  } else {
    switch (modifier) {
      case 'left':
        text = t('map.maneuvers.turnLeft', 'Turn left');
        break;
      case 'right':
        text = t('map.maneuvers.turnRight', 'Turn right');
        break;
      case 'slight left':
        text = t('map.maneuvers.turnSlightLeft', 'Slight left');
        break;
      case 'slight right':
        text = t('map.maneuvers.turnSlightRight', 'Slight right');
        break;
      case 'sharp left':
        text = t('map.maneuvers.turnSharpLeft', 'Sharp left');
        break;
      case 'sharp right':
        text = t('map.maneuvers.turnSharpRight', 'Sharp right');
        break;
      case 'uturn':
        text = t('map.maneuvers.uTurn', 'Make a U-turn');
        break;
      case 'straight':
      default:
        text = t('map.maneuvers.continueStraight', 'Continue straight');
        break;
    }
  }

  if (streetName && streetName.trim().length > 0 && streetName !== '') {
    text += ` ${t('map.maneuvers.ontoStreet', 'onto')} ${streetName}`;
  }

  return text;
}

/**
 * Generate straight-line fallback route when OSRM is offline or times out
 */
function createFallbackRoute(from: LatLng, to: LatLng, mode: RoutingMode): RouteResult {
  const distM = distance(from, to);
  const speed = MODE_SPEED_METERS_PER_SEC[mode] || MODE_SPEED_METERS_PER_SEC.picker;
  const durationS = Math.max(30, Math.round(distM / speed));

  const steps: RouteStep[] = [
    {
      instruction: translateManeuver('depart'),
      distanceM: distM,
      durationS,
      location: from,
      maneuverType: 'depart',
    },
    {
      instruction: translateManeuver('arrive'),
      distanceM: 0,
      durationS: 0,
      location: to,
      maneuverType: 'arrive',
    },
  ];

  return {
    geometry: [from, to],
    distanceM: Math.round(distM),
    durationS,
    steps,
    source: 'fallback',
  };
}

/**
 * Fetch road route between two points using OSRM with in-memory caching and offline fallback
 */
export async function getRoute(
  from: LatLng,
  to: LatLng,
  mode: RoutingMode = 'picker'
): Promise<RouteResult> {
  if (!from || !to) {
    return createFallbackRoute({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 0 }, mode);
  }

  const cacheKey = getCacheKey(mode, from, to);
  const cached = routeCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.result;
  }

  // OSRM coordinates are formatted as lon,lat;lon,lat
  const coordsStr = `${from.longitude},${from.latitude};${to.longitude},${to.latitude}`;
  const profile = mode === 'walking' ? 'foot' : 'driving';
  const url = `${OSRM_BASE_URL}/route/v1/${profile}/${coordsStr}?overview=full&geometries=geojson&steps=true`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CIRCULO-Urban-Circular-Economy/1.0',
        'Referer': 'https://circulo.app',
      },
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      throw new Error(`OSRM HTTP error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      throw new Error('OSRM returned no routes');
    }

    const route = data.routes[0];
    const geojsonCoords: [number, number][] = route.geometry.coordinates;

    const geometry: LatLng[] = geojsonCoords.map(([lng, lat]) => ({
      latitude: lat,
      longitude: lng,
    }));

    const rawSteps = route.legs?.[0]?.steps || [];
    const steps: RouteStep[] = rawSteps.map((s: any) => {
      const maneuverType = s.maneuver?.type;
      const modifier = s.maneuver?.modifier;
      const streetName = s.name;
      const loc: LatLng = {
        latitude: s.maneuver?.location?.[1] || 0,
        longitude: s.maneuver?.location?.[0] || 0,
      };

      return {
        instruction: translateManeuver(maneuverType, modifier, streetName),
        distanceM: Math.round(s.distance || 0),
        durationS: Math.round(s.duration || 0),
        location: loc,
        maneuverType,
        modifier,
      };
    });

    // If steps are empty, create default departure & arrival steps
    if (steps.length === 0) {
      steps.push(
        {
          instruction: translateManeuver('depart'),
          distanceM: Math.round(route.distance),
          durationS: Math.round(route.duration),
          location: from,
        },
        {
          instruction: translateManeuver('arrive'),
          distanceM: 0,
          durationS: 0,
          location: to,
        }
      );
    }

    const result: RouteResult = {
      geometry,
      distanceM: Math.round(route.distance),
      durationS: Math.round(route.duration),
      steps,
      source: 'osrm',
    };

    routeCache.set(cacheKey, { result, timestamp: Date.now() });
    return result;
  } catch (err: any) {
    clearTimeout(timer);
    if (__DEV__) {
      console.log('[routing.getRoute] OSRM unavailable or timed out, using fallback:', err.message);
    }
    const fallback = createFallbackRoute(from, to, mode);
    // Cache fallback briefly (30s) to prevent spamming failed network calls
    routeCache.set(cacheKey, { result: fallback, timestamp: Date.now() - (CACHE_TTL_MS - 30000) });
    return fallback;
  }
}

/**
 * Multi-stop routing for collector routes or multi-job rounds.
 * Attempts OSRM trip / route endpoint, falling back to nearest-neighbour ordering.
 */
export async function getMultiStopRoute(
  points: LatLng[],
  mode: RoutingMode = 'collector'
): Promise<RouteResult> {
  if (!points || points.length < 2) {
    return {
      geometry: points || [],
      distanceM: 0,
      durationS: 0,
      steps: [],
      source: 'fallback',
    };
  }

  // Construct coordinate query string
  const coordsStr = points.map((p) => `${p.longitude},${p.latitude}`).join(';');
  const url = `${OSRM_BASE_URL}/route/v1/driving/${coordsStr}?overview=full&geometries=geojson&steps=true`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS + 2000);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CIRCULO-Urban-Circular-Economy/1.0',
        'Referer': 'https://circulo.app',
      },
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      throw new Error(`OSRM multi-stop error: ${response.status}`);
    }

    const data = await response.json();
    if (!data.routes || data.routes.length === 0) {
      throw new Error('No multi-stop route found');
    }

    const route = data.routes[0];
    const geojsonCoords: [number, number][] = route.geometry.coordinates;

    const geometry: LatLng[] = geojsonCoords.map(([lng, lat]) => ({
      latitude: lat,
      longitude: lng,
    }));

    const allSteps: RouteStep[] = [];
    if (route.legs) {
      route.legs.forEach((leg: any) => {
        (leg.steps || []).forEach((s: any) => {
          allSteps.push({
            instruction: translateManeuver(s.maneuver?.type, s.maneuver?.modifier, s.name),
            distanceM: Math.round(s.distance || 0),
            durationS: Math.round(s.duration || 0),
            location: {
              latitude: s.maneuver?.location?.[1] || 0,
              longitude: s.maneuver?.location?.[0] || 0,
            },
            maneuverType: s.maneuver?.type,
            modifier: s.maneuver?.modifier,
          });
        });
      });
    }

    return {
      geometry,
      distanceM: Math.round(route.distance),
      durationS: Math.round(route.duration),
      steps: allSteps,
      source: 'osrm',
    };
  } catch (e: any) {
    clearTimeout(timer);
    if (__DEV__) {
      console.log('[routing.getMultiStopRoute] Falling back to sequential straight-line segments:', e.message);
    }

    // Fallback: Connect points in order
    let totalDistM = 0;
    const geometry: LatLng[] = [...points];

    for (let i = 0; i < points.length - 1; i++) {
      totalDistM += distance(points[i], points[i + 1]);
    }

    const speed = MODE_SPEED_METERS_PER_SEC[mode] || MODE_SPEED_METERS_PER_SEC.collector;
    const durationS = Math.max(60, Math.round(totalDistM / speed));

    return {
      geometry,
      distanceM: Math.round(totalDistM),
      durationS,
      steps: [
        {
          instruction: translateManeuver('depart'),
          distanceM: Math.round(totalDistM),
          durationS,
          location: points[0],
        },
        {
          instruction: translateManeuver('arrive'),
          distanceM: 0,
          durationS: 0,
          location: points[points.length - 1],
        },
      ],
      source: 'fallback',
    };
  }
}
