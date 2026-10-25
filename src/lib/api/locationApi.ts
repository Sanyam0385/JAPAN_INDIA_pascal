// Location API: Live GPS location upsert, real-time subscriptions & fleet telemetry
import { supabase, isBackendEnabled } from '../supabase/client';
import { useLocationStore } from '../location/locationStore';
import { subscribeToTable, SubscriptionHandle } from '../realtime/subscribeToTable';
import { collectorRouteApi } from './collectorRouteApi';
import type { RouteStopData } from '../../types';

export interface LiveLocationData {
  userId: string;
  jobId?: string;
  role?: string | null;
  name?: string | null;
  vehicleNumber?: string | null;
  ward?: string | null;
  lat: number;
  lng: number;
  accuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
  updatedAt?: string;
}

const THROTTLE_MS = 4000; // Enforce max 1 write per 4 seconds per user
const lastUpsertTimes: Record<string, number> = {};

// In-memory registry of live positions across all active workers
const localLiveLocations: Record<string, LiveLocationData> = {
  'demo-collector-1': {
    userId: 'demo-collector-1',
    role: 'formal_collector',
    name: 'Ramesh Kumar',
    vehicleNumber: 'KA-01-EA-4412',
    ward: 'Ward 151 (Koramangala)',
    lat: 12.9352,
    lng: 77.6245,
    heading: 90,
    speed: 18,
    accuracy: 10,
    updatedAt: new Date().toISOString(),
  },
  'demo-picker-1': {
    userId: 'demo-picker-1',
    role: 'informal_picker',
    name: 'Meena Devi',
    vehicleNumber: 'Hand-cart #08',
    ward: 'Ward 151 (Koramangala)',
    lat: 12.9328,
    lng: 77.6310,
    heading: 45,
    speed: 4,
    accuracy: 8,
    updatedAt: new Date().toISOString(),
  },
};

// Seed fleet used for Admin Fleet Telemetry & dual-mode simulation
const DEMO_FLEET_BASE: LiveLocationData[] = [
  {
    userId: 'fleet-1',
    name: 'Ramesh Kumar',
    role: 'formal_collector',
    vehicleNumber: 'KA-01-EA-4412',
    ward: 'Ward 151 (Koramangala)',
    lat: 12.9352,
    lng: 77.6245,
    heading: 90,
    speed: 18,
    accuracy: 10,
    updatedAt: new Date(Date.now() - 30 * 1000).toISOString(),
  },
  {
    userId: 'fleet-2',
    name: 'Suresh Babu',
    role: 'formal_collector',
    vehicleNumber: 'KA-01-EA-5102',
    ward: 'Ward 151 (Koramangala)',
    lat: 12.9380,
    lng: 77.6270,
    heading: 180,
    speed: 14,
    accuracy: 12,
    updatedAt: new Date(Date.now() - 45 * 1000).toISOString(),
  },
  {
    userId: 'fleet-3',
    name: 'Venkatesh N.',
    role: 'formal_collector',
    vehicleNumber: 'KA-01-EA-3388',
    ward: 'Ward 111 (MG Road)',
    lat: 12.9750,
    lng: 77.6050,
    heading: 45,
    speed: 0,
    accuracy: 15,
    updatedAt: new Date(Date.now() - 190 * 1000).toISOString(), // > 2 min ago (STALE)
  },
  {
    userId: 'fleet-4',
    name: 'Meena Devi',
    role: 'informal_picker',
    vehicleNumber: 'Hand-cart #08',
    ward: 'Ward 151 (Koramangala)',
    lat: 12.9328,
    lng: 77.6310,
    heading: 60,
    speed: 4,
    accuracy: 8,
    updatedAt: new Date(Date.now() - 20 * 1000).toISOString(),
  },
  {
    userId: 'fleet-5',
    name: 'Lakshmi Bai',
    role: 'informal_picker',
    vehicleNumber: 'Cycle-cart #14',
    ward: 'Ward 134 (Indiranagar)',
    lat: 12.9690,
    lng: 77.6390,
    heading: 270,
    speed: 5,
    accuracy: 8,
    updatedAt: new Date(Date.now() - 50 * 1000).toISOString(),
  },
  {
    userId: 'fleet-6',
    name: 'Raju Nayak',
    role: 'informal_picker',
    vehicleNumber: 'Push-cart #22',
    ward: 'Ward 174 (HSR Layout)',
    lat: 12.9140,
    lng: 77.6450,
    heading: 0,
    speed: 0,
    accuracy: 20,
    updatedAt: new Date(Date.now() - 260 * 1000).toISOString(), // > 2 min ago (STALE)
  },
];

// Active local subscribers for worker positions
const workerSubscribers = new Map<string, Set<(loc: LiveLocationData) => void>>();

function notifyWorkerSubscribers(loc: LiveLocationData) {
  const set = workerSubscribers.get(loc.userId);
  if (set) {
    set.forEach((cb) => {
      try {
        cb(loc);
      } catch (err) {
        if (__DEV__) console.warn('[locationApi] Worker callback error:', err);
      }
    });
  }
}

export const locationApi = {
  /**
   * Throttled upsert (max 1 write per 4-5s per user) into live_locations table.
   * Enforces privacy: checks share_live_location setting before publishing.
   */
  async upsertLiveLocation(data: LiveLocationData, bypassPrivacyCheck = false): Promise<boolean> {
    // 1. Privacy Check: Only share live location if user opted in or explicitly bypassed (simulated worker)
    const isSharing = useLocationStore.getState().shareLiveLocation;
    const isSimulatedWorker = data.userId.startsWith('demo-') || data.userId.startsWith('fleet-');

    if (!isSharing && !bypassPrivacyCheck && !isSimulatedWorker) {
      console.log('[locationApi] Skipping live update: share_live_location is disabled');
      return false;
    }

    // 2. Throttle Check: Maximum 1 write per 4 seconds per user
    const now = Date.now();
    const lastTime = lastUpsertTimes[data.userId] || 0;
    const isThrottled = now - lastTime < THROTTLE_MS;

    // Always update in-memory cache to keep client views responsive
    const fullData: LiveLocationData = {
      ...localLiveLocations[data.userId],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    localLiveLocations[data.userId] = fullData;

    // Update Zustand worker positions
    useLocationStore.getState().updateWorkerPosition({
      workerId: data.userId,
      workerName: data.name || (data.role === 'formal_collector' ? 'Ramesh Kumar' : 'Meena Devi'),
      role: data.role === 'informal_picker' ? 'informal_picker' : 'formal_collector',
      coords: {
        latitude: data.lat,
        longitude: data.lng,
        heading: data.heading ?? 0,
        speed: data.speed ?? 0,
        accuracy: data.accuracy ?? 10,
        timestamp: now,
      },
      updatedAt: fullData.updatedAt!,
    });

    notifyWorkerSubscribers(fullData);

    if (isThrottled) {
      return false;
    }
    lastUpsertTimes[data.userId] = now;

    // 3. Database Upsert when backend is enabled
    if (isBackendEnabled()) {
      try {
        const { error } = await supabase.from('live_locations').upsert({
          user_id: data.userId,
          job_id: data.jobId || null,
          role: data.role || null,
          lat: data.lat,
          lng: data.lng,
          accuracy: data.accuracy ?? null,
          heading: data.heading ?? null,
          speed: data.speed ?? null,
          updated_at: new Date().toISOString(),
        });

        if (error && __DEV__) {
          console.warn('[locationApi.upsertLiveLocation] Supabase error:', error);
        }
      } catch (e) {
        if (__DEV__) console.warn('[locationApi.upsertLiveLocation] Network error:', e);
      }
    }

    return true;
  },

  /**
   * Backwards-compatible alias for upsertLiveLocation
   */
  async upsertLocation(data: LiveLocationData): Promise<void> {
    await this.upsertLiveLocation(data);
  },

  /**
   * Fetch latest live coordinates for a given user (picker or collector)
   */
  async getLocation(userId: string): Promise<LiveLocationData | null> {
    if (isBackendEnabled()) {
      try {
        const { data, error } = await supabase
          .from('live_locations')
          .select('user_id, job_id, role, lat, lng, accuracy, heading, speed, updated_at')
          .eq('user_id', userId)
          .maybeSingle();

        if (error) {
          if (__DEV__) console.warn('[locationApi.getLocation] Supabase error:', error);
        } else if (data) {
          const mapped: LiveLocationData = {
            userId: data.user_id,
            jobId: data.job_id || undefined,
            role: data.role,
            lat: data.lat,
            lng: data.lng,
            accuracy: data.accuracy,
            heading: data.heading,
            speed: data.speed,
            updatedAt: data.updated_at,
          };
          localLiveLocations[userId] = { ...localLiveLocations[userId], ...mapped };
          return mapped;
        }
      } catch (e) {
        if (__DEV__) console.warn('[locationApi.getLocation] Network error:', e);
      }
    }

    return localLiveLocations[userId] || null;
  },

  /**
   * Remove live location row when job ends or shift finishes
   */
  async clearLocation(userId: string): Promise<void> {
    delete localLiveLocations[userId];
    delete lastUpsertTimes[userId];

    if (isBackendEnabled()) {
      try {
        await supabase.from('live_locations').delete().eq('user_id', userId);
      } catch (e) {
        if (__DEV__) console.warn('[locationApi.clearLocation] Network error:', e);
      }
    }
  },

  /**
   * Real-time subscription to a worker's live location (e.g. household tracking approaching truck/picker).
   * Features: Supabase realtime Postgres changes, exponential backoff reconnects, and dual-mode heartbeat.
   */
  subscribeToWorkerLocation(
    workerId: string,
    callback: (loc: LiveLocationData) => void
  ): () => void {
    if (!workerId) return () => {};

    // 1. Register local subscriber
    if (!workerSubscribers.has(workerId)) {
      workerSubscribers.set(workerId, new Set());
    }
    workerSubscribers.get(workerId)!.add(callback);

    // 2. Emit initial known position immediately
    const initial = localLiveLocations[workerId];
    if (initial) {
      callback(initial);
    } else {
      const stored = useLocationStore.getState().workerPositions[workerId];
      if (stored) {
        callback({
          userId: workerId,
          name: stored.workerName,
          role: stored.role,
          lat: stored.coords.latitude,
          lng: stored.coords.longitude,
          heading: stored.coords.heading,
          speed: stored.coords.speed,
          accuracy: stored.coords.accuracy,
          updatedAt: stored.updatedAt,
        });
      }
    }

    // 3. Supabase Realtime Subscription with automatic reconnect backoff
    let tableSub: SubscriptionHandle | null = null;
    if (isBackendEnabled()) {
      tableSub = subscribeToTable<any>({
        table: 'live_locations',
        filter: `user_id=eq.${workerId}`,
        onInsert: (row) => {
          const loc: LiveLocationData = {
            userId: row.user_id,
            jobId: row.job_id || undefined,
            role: row.role,
            lat: row.lat,
            lng: row.lng,
            accuracy: row.accuracy,
            heading: row.heading,
            speed: row.speed,
            updatedAt: row.updated_at,
          };
          localLiveLocations[workerId] = { ...localLiveLocations[workerId], ...loc };
          callback(loc);
        },
        onUpdate: (row) => {
          const loc: LiveLocationData = {
            userId: row.user_id,
            jobId: row.job_id || undefined,
            role: row.role,
            lat: row.lat,
            lng: row.lng,
            accuracy: row.accuracy,
            heading: row.heading,
            speed: row.speed,
            updatedAt: row.updated_at,
          };
          localLiveLocations[workerId] = { ...localLiveLocations[workerId], ...loc };
          callback(loc);
        },
      });
    }

    // 4. Dual-mode realistic simulation heartbeat (every 4.5s) if offline or demo
    const simInterval = setInterval(() => {
      const curr = localLiveLocations[workerId];
      if (curr && (!isBackendEnabled() || workerId.startsWith('demo-'))) {
        // Subtle realistic GPS drift / motion
        const dLat = (Math.random() - 0.49) * 0.0001;
        const dLng = (Math.random() - 0.49) * 0.0001;
        const updated: LiveLocationData = {
          ...curr,
          lat: curr.lat + dLat,
          lng: curr.lng + dLng,
          updatedAt: new Date().toISOString(),
        };
        localLiveLocations[workerId] = updated;
        callback(updated);
      }
    }, 4500);

    return () => {
      workerSubscribers.get(workerId)?.delete(callback);
      if (workerSubscribers.get(workerId)?.size === 0) {
        workerSubscribers.delete(workerId);
      }
      if (tableSub) tableSub.unsubscribe();
      clearInterval(simInterval);
    };
  },

  /**
   * Real-time subscription to the entire municipal fleet for Admin Fleet Telemetry & Monitoring.
   * Supports ward filtering, live vehicle telemetry, stale vehicle detection, and dual-mode simulation.
   */
  subscribeToFleet(
    wardOrCb: string | undefined | ((fleet: LiveLocationData[]) => void),
    callbackArg?: (fleet: LiveLocationData[]) => void
  ): () => void {
    const ward = typeof wardOrCb === 'string' ? wardOrCb : undefined;
    const callback = typeof wardOrCb === 'function' ? wardOrCb : (callbackArg || (() => {}));
    const fleetMap = new Map<string, LiveLocationData>();

    // Seed demo fleet base
    DEMO_FLEET_BASE.forEach((vehicle) => {
      fleetMap.set(vehicle.userId, { ...vehicle });
    });

    // Incorporate current local live locations
    Object.values(localLiveLocations).forEach((loc) => {
      const existing = fleetMap.get(loc.userId);
      fleetMap.set(loc.userId, {
        ...existing,
        ...loc,
      });
    });

    const emit = () => {
      const list = Array.from(fleetMap.values());
      const filtered =
        ward && ward !== 'all'
          ? list.filter((v) => v.ward && v.ward.toLowerCase().includes(ward.toLowerCase()))
          : list;
      callback(filtered);
    };

    // Emit initial fleet
    emit();

    // Supabase Realtime subscription
    let tableSub: SubscriptionHandle | null = null;
    if (isBackendEnabled()) {
      // Query initial rows
      supabase
        .from('live_locations')
        .select('*')
        .then(({ data, error }) => {
          if (!error && data && data.length > 0) {
            data.forEach((row) => {
              const existing = fleetMap.get(row.user_id);
              fleetMap.set(row.user_id, {
                ...existing,
                userId: row.user_id,
                jobId: row.job_id || undefined,
                role: row.role || existing?.role || 'formal_collector',
                lat: row.lat,
                lng: row.lng,
                accuracy: row.accuracy,
                heading: row.heading,
                speed: row.speed,
                updatedAt: row.updated_at,
              });
            });
            emit();
          }
        });

      tableSub = subscribeToTable<any>({
        table: 'live_locations',
        onInsert: (row) => {
          const existing = fleetMap.get(row.user_id);
          fleetMap.set(row.user_id, {
            ...existing,
            userId: row.user_id,
            jobId: row.job_id || undefined,
            role: row.role || existing?.role || 'formal_collector',
            lat: row.lat,
            lng: row.lng,
            accuracy: row.accuracy,
            heading: row.heading,
            speed: row.speed,
            updatedAt: row.updated_at,
          });
          emit();
        },
        onUpdate: (row) => {
          const existing = fleetMap.get(row.user_id);
          fleetMap.set(row.user_id, {
            ...existing,
            userId: row.user_id,
            jobId: row.job_id || undefined,
            role: row.role || existing?.role || 'formal_collector',
            lat: row.lat,
            lng: row.lng,
            accuracy: row.accuracy,
            heading: row.heading,
            speed: row.speed,
            updatedAt: row.updated_at,
          });
          emit();
        },
        onDelete: (oldRow) => {
          if (oldRow?.user_id) {
            fleetMap.delete(oldRow.user_id);
            emit();
          }
        },
      });
    }

    // Dual-mode telemetry pulse for active moving vehicles
    const telemetryPulse = setInterval(() => {
      let changed = false;
      fleetMap.forEach((v) => {
        if (v.speed && v.speed > 0) {
          const dLat = (Math.random() - 0.49) * 0.00015;
          const dLng = (Math.random() - 0.49) * 0.00015;
          v.lat += dLat;
          v.lng += dLng;
          v.updatedAt = new Date().toISOString();
          changed = true;
        }
      });
      if (changed) {
        emit();
      }
    }, 5000);

    return () => {
      if (tableSub) tableSub.unsubscribe();
      clearInterval(telemetryPulse);
    };
  },

  /**
   * Real-time subscription to route stops for route completion synchronization.
   */
  subscribeToRouteStops(
    routeId: string,
    callback: (stops: RouteStopData[]) => void
  ): () => void {
    return collectorRouteApi.subscribeToRouteStops(routeId, callback);
  },
};
