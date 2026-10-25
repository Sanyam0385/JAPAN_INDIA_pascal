// Collector Route API: Dual-mode municipal waste collection route and stop management
import { supabase, isBackendEnabled } from '../supabase/client';
import { subscribeToTable, SubscriptionHandle } from '../realtime/subscribeToTable';
import type { CollectorRoute, RouteStopData, RouteStopStatus, WasteCategory } from '../../types';

// Ward 151 Transfer Station / Recycler destination
export const WARD_TRANSFER_STATION = {
  id: 'station-ward-151',
  name: 'Ward 151 Municipal Transfer Station',
  address: 'Plot 4, Koramangala Industrial Area, Bengaluru',
  latitude: 12.9380,
  longitude: 77.6290,
  operatingHours: '06:00 – 20:00',
  capacityTonnes: 50,
};

export const INITIAL_ROUTE_STOPS: RouteStopData[] = [
  {
    id: 's1',
    sequence: 1,
    houseNumber: '#42',
    address: '5th Cross, Koramangala 4th Block',
    locality: 'Koramangala',
    ward: 'Ward 151',
    latitude: 12.9345,
    longitude: 77.6245,
    wasteType: 'wet',
    timeSlot: '07:10',
    status: 'completed',
    collectedKg: 4.2,
    segregationRating: 5,
    completedAt: '2026-10-24T07:15:00Z',
  },
  {
    id: 's2',
    sequence: 2,
    houseNumber: '#17',
    address: '8th Main, HSR Layout Sector 2',
    locality: 'HSR Layout',
    ward: 'Ward 151',
    latitude: 12.9120,
    longitude: 77.6430,
    wasteType: 'dry',
    timeSlot: '07:30',
    status: 'completed',
    collectedKg: 6.8,
    segregationRating: 4,
    completedAt: '2026-10-24T07:35:00Z',
  },
  {
    id: 's3',
    sequence: 3,
    houseNumber: '#89',
    address: '1st Cross, Indiranagar 12th Main',
    locality: 'Indiranagar',
    ward: 'Ward 151',
    latitude: 12.9710,
    longitude: 77.6410,
    wasteType: 'recyclable',
    timeSlot: '07:55',
    status: 'completed',
    collectedKg: 8.5,
    segregationRating: 5,
    completedAt: '2026-10-24T08:00:00Z',
  },
  {
    id: 's4',
    sequence: 4,
    houseNumber: '#33',
    address: '2nd Block, JP Nagar Phase 2',
    locality: 'JP Nagar',
    ward: 'Ward 151',
    latitude: 12.9080,
    longitude: 77.5920,
    wasteType: 'wet',
    timeSlot: '08:20',
    status: 'completed',
    collectedKg: 5.1,
    segregationRating: 4,
    completedAt: '2026-10-24T08:24:00Z',
  },
  {
    id: 's5',
    sequence: 5,
    houseNumber: '#71',
    address: 'Outer Ring Road, Marathahalli',
    locality: 'Marathahalli',
    ward: 'Ward 151',
    latitude: 12.9540,
    longitude: 77.7010,
    wasteType: 'dry',
    timeSlot: '08:40',
    status: 'completed',
    collectedKg: 12.4,
    segregationRating: 4,
    completedAt: '2026-10-24T08:46:00Z',
  },
  {
    id: 's6',
    sequence: 6,
    houseNumber: '#14',
    address: 'Church Street, MG Road Area',
    locality: 'MG Road',
    ward: 'Ward 151',
    latitude: 12.9750,
    longitude: 77.6050,
    wasteType: 'wet',
    timeSlot: '09:00',
    status: 'completed',
    collectedKg: 7.2,
    segregationRating: 5,
    completedAt: '2026-10-24T09:05:00Z',
  },
  {
    id: 's7',
    sequence: 7,
    houseNumber: '#55',
    address: '100 Feet Road, Jayanagar',
    locality: 'Jayanagar',
    ward: 'Ward 151',
    latitude: 12.9300,
    longitude: 77.5850,
    wasteType: 'dry',
    timeSlot: '09:20',
    status: 'completed',
    collectedKg: 9.3,
    segregationRating: 4,
    completedAt: '2026-10-24T09:25:00Z',
  },
  {
    id: 's8',
    sequence: 8,
    houseNumber: '#28',
    address: 'Domlur Layout, Domlur',
    locality: 'Domlur',
    ward: 'Ward 151',
    latitude: 12.9352,
    longitude: 77.6255,
    wasteType: 'recyclable',
    timeSlot: '09:45',
    status: 'current',
  },
  {
    id: 's9',
    sequence: 9,
    houseNumber: '#96',
    address: '3rd Main, Koramangala 1st Block',
    locality: 'Koramangala',
    ward: 'Ward 151',
    latitude: 12.9310,
    longitude: 77.6320,
    wasteType: 'wet',
    timeSlot: '10:10',
    status: 'pending',
  },
  {
    id: 's10',
    sequence: 10,
    houseNumber: '#11',
    address: 'BTM Layout 2nd Stage',
    locality: 'BTM Layout',
    ward: 'Ward 151',
    latitude: 12.9160,
    longitude: 77.6100,
    wasteType: 'dry',
    timeSlot: '10:30',
    status: 'pending',
  },
  {
    id: 's11',
    sequence: 11,
    houseNumber: '#63',
    address: 'Koramangala 6th Block, 80ft Road',
    locality: 'Koramangala',
    ward: 'Ward 151',
    latitude: 12.9375,
    longitude: 77.6260,
    wasteType: 'hazardous',
    timeSlot: '10:55',
    status: 'pending',
  },
  {
    id: 's12',
    sequence: 12,
    houseNumber: '#47',
    address: 'Koramangala 5th Block, Jyoti Nivas College Rd',
    locality: 'Koramangala',
    ward: 'Ward 151',
    latitude: 12.9360,
    longitude: 77.6210,
    wasteType: 'recyclable',
    timeSlot: '11:20',
    status: 'pending',
  },
];

let localRoute: CollectorRoute = {
  id: 'route-today-151',
  collectorId: 'demo-collector-1',
  collectorName: 'Ramesh Kumar',
  vehicleNumber: 'KA-01-EA-4412',
  shiftDate: new Date().toISOString().split('T')[0],
  ward: 'Koramangala Ward 151',
  cityKey: 'BLR',
  truckCapacityKg: 5000,
  currentLoadKg: 3600, // 72% full
  status: 'active',
  totalStops: 12,
  completedStops: 7,
  stops: [...INITIAL_ROUTE_STOPS],
};

const stopListeners = new Set<(stops: RouteStopData[]) => void>();

export function notifyRouteStopListeners(stops: RouteStopData[]): void {
  stopListeners.forEach((listener) => {
    try {
      listener(stops);
    } catch (e) {
      if (__DEV__) console.warn('[collectorRouteApi] Listener callback error:', e);
    }
  });
}

export const collectorRouteApi = {
  /**
   * Fetch today's assigned route with stops
   */
  async getTodayRoute(collectorId = 'demo-collector-1'): Promise<CollectorRoute> {
    if (isBackendEnabled()) {
      try {
        const todayDate = new Date().toISOString().split('T')[0];
        let { data: routeData, error: routeError } = await supabase
          .from('collector_routes')
          .select('*')
          .eq('shift_date', todayDate)
          .maybeSingle();

        if (routeError) {
          if (__DEV__) console.warn('[collectorRouteApi.getTodayRoute] Route select error:', routeError);
        }

        // If no route exists yet, seed one into the database
        if (!routeData) {
          const { data: insertedRoute, error: insertError } = await supabase
            .from('collector_routes')
            .insert({
              collector_id: collectorId,
              collector_name: 'Ramesh Kumar',
              vehicle_number: 'KA-01-EA-4412',
              shift_date: todayDate,
              ward: 'Koramangala Ward 151',
              city_key: 'BLR',
              truck_capacity_kg: 5000,
              current_load_kg: 3600,
              status: 'active',
              total_stops: 12,
              completed_stops: 7,
            })
            .select()
            .single();

          if (!insertError && insertedRoute) {
            routeData = insertedRoute;

            // Seed stops
            const stopInserts = INITIAL_ROUTE_STOPS.map((s) => ({
              route_id: insertedRoute.id,
              sequence: s.sequence,
              house_number: s.houseNumber,
              address: s.address,
              locality: s.locality,
              ward: s.ward || 'Ward 151',
              lat: s.latitude,
              lng: s.longitude,
              waste_type: s.wasteType,
              time_slot: s.timeSlot,
              status: s.status,
              collected_kg: s.collectedKg ?? null,
              segregation_rating: s.segregationRating ?? null,
              completed_at: s.completedAt ?? null,
              notes: s.notes ?? null,
            }));

            await supabase.from('route_stops').insert(stopInserts);
          }
        }

        if (routeData) {
          const { data: stopsData, error: stopsError } = await supabase
            .from('route_stops')
            .select('*')
            .eq('route_id', routeData.id)
            .order('sequence', { ascending: true });

          if (!stopsError && stopsData && stopsData.length > 0) {
            const mappedStops: RouteStopData[] = stopsData.map((s) => ({
              id: s.id,
              routeId: s.route_id,
              sequence: s.sequence,
              householdId: s.household_id || undefined,
              houseNumber: s.house_number,
              address: s.address,
              locality: s.locality,
              ward: s.ward || undefined,
              latitude: s.lat,
              longitude: s.lng,
              wasteType: s.waste_type as any,
              timeSlot: s.time_slot,
              status: s.status as RouteStopStatus,
              collectedKg: s.collected_kg ?? undefined,
              segregationRating: s.segregation_rating ?? undefined,
              completedAt: s.completed_at || undefined,
              notes: s.notes || undefined,
            }));

            const completedCount = mappedStops.filter((s) => s.status === 'completed').length;

            return {
              id: routeData.id,
              collectorId: routeData.collector_id || undefined,
              collectorName: routeData.collector_name,
              vehicleNumber: routeData.vehicle_number || undefined,
              shiftDate: routeData.shift_date,
              ward: routeData.ward,
              cityKey: routeData.city_key,
              truckCapacityKg: Number(routeData.truck_capacity_kg),
              currentLoadKg: Number(routeData.current_load_kg),
              status: routeData.status as any,
              totalStops: mappedStops.length,
              completedStops: completedCount,
              stops: mappedStops,
            };
          }
        }
      } catch (e) {
        if (__DEV__) console.warn('[collectorRouteApi.getTodayRoute] Network exception:', e);
      }
    }

    return localRoute;
  },

  /**
   * Update a stop's status (completed, current, skipped) and record verification
   */
  async updateStopStatus(
    stopId: string,
    status: RouteStopStatus,
    collection?: {
      weightKg: number;
      wasteType: WasteCategory;
      segregationRating: number;
      notes?: string;
    }
  ): Promise<RouteStopData> {
    const completedAt = status === 'completed' ? new Date().toISOString() : undefined;

    // Update in local memory
    const stopIdx = localRoute.stops.findIndex((s) => s.id === stopId);
    if (stopIdx !== -1) {
      localRoute.stops[stopIdx] = {
        ...localRoute.stops[stopIdx],
        status,
        collectedKg: collection?.weightKg ?? localRoute.stops[stopIdx].collectedKg,
        segregationRating: collection?.segregationRating ?? localRoute.stops[stopIdx].segregationRating,
        completedAt: completedAt || localRoute.stops[stopIdx].completedAt,
        notes: collection?.notes ?? localRoute.stops[stopIdx].notes,
      };

      if (status === 'completed' && collection?.weightKg) {
        localRoute.currentLoadKg = Math.min(
          localRoute.truckCapacityKg,
          localRoute.currentLoadKg + collection.weightKg
        );
      }

      localRoute.completedStops = localRoute.stops.filter((s) => s.status === 'completed').length;
    }

    notifyRouteStopListeners(localRoute.stops);

    // Backend sync
    if (isBackendEnabled()) {
      try {
        await supabase
          .from('route_stops')
          .update({
            status,
            collected_kg: collection?.weightKg ?? null,
            segregation_rating: collection?.segregationRating ?? null,
            completed_at: completedAt ?? null,
            notes: collection?.notes ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', stopId);

        if (status === 'completed' && collection) {
          // Record collection entry
          await supabase.from('collections').insert({
            collector_id: localRoute.collectorId || null,
            household_id: localRoute.stops[stopIdx]?.householdId || null,
            ward: localRoute.ward,
            category: collection.wasteType,
            weight_kg: collection.weightKg,
            segregation_rating: collection.segregationRating,
            notes: collection.notes || null,
          });

          // Update route truck load
          await supabase
            .from('collector_routes')
            .update({
              current_load_kg: localRoute.currentLoadKg,
              completed_stops: localRoute.completedStops,
              updated_at: new Date().toISOString(),
            })
            .eq('id', localRoute.id);
        }
      } catch (e) {
        if (__DEV__) console.warn('[collectorRouteApi.updateStopStatus] Sync error:', e);
      }
    }

    return localRoute.stops[stopIdx];
  },

  /**
   * Reorder stops on the route (e.g. after running route optimization)
   */
  async reorderStops(routeId: string, stopIdsInOrder: string[]): Promise<RouteStopData[]> {
    const reordered: RouteStopData[] = [];

    stopIdsInOrder.forEach((id, index) => {
      const found = localRoute.stops.find((s) => s.id === id);
      if (found) {
        reordered.push({
          ...found,
          sequence: index + 1,
        });
      }
    });

    localRoute.stops = reordered;
    notifyRouteStopListeners(localRoute.stops);

    if (isBackendEnabled()) {
      try {
        const updates = stopIdsInOrder.map((id, index) =>
          supabase
            .from('route_stops')
            .update({ sequence: index + 1, updated_at: new Date().toISOString() })
            .eq('id', id)
        );
        await Promise.allSettled(updates);
      } catch (e) {
        if (__DEV__) console.warn('[collectorRouteApi.reorderStops] Sync error:', e);
      }
    }

    return localRoute.stops;
  },

  /**
   * Update truck capacity or load
   */
  async updateTruckLoad(newLoadKg: number): Promise<number> {
    localRoute.currentLoadKg = newLoadKg;

    if (isBackendEnabled()) {
      try {
        await supabase
          .from('collector_routes')
          .update({
            current_load_kg: newLoadKg,
            updated_at: new Date().toISOString(),
          })
          .eq('id', localRoute.id);
      } catch (e) {
        if (__DEV__) console.warn('[collectorRouteApi.updateTruckLoad] Sync error:', e);
      }
    }

    return localRoute.currentLoadKg;
  },

  /**
   * Reset local demo route to initial state
   */
  resetDemoRoute(): CollectorRoute {
    localRoute = {
      id: 'route-today-151',
      collectorId: 'demo-collector-1',
      collectorName: 'Ramesh Kumar',
      vehicleNumber: 'KA-01-EA-4412',
      shiftDate: new Date().toISOString().split('T')[0],
      ward: 'Koramangala Ward 151',
      cityKey: 'BLR',
      truckCapacityKg: 5000,
      currentLoadKg: 3600,
      status: 'active',
      totalStops: 12,
      completedStops: 7,
      stops: [...INITIAL_ROUTE_STOPS],
    };
    return localRoute;
  },

  /**
   * Real-time subscription to route stop changes with Supabase Postgres Changes and exponential backoff
   */
  subscribeToRouteStops(
    routeId: string,
    callback: (stops: RouteStopData[]) => void
  ): () => void {
    stopListeners.add(callback);
    // Emit current stops immediately
    callback(localRoute.stops);

    let tableSub: SubscriptionHandle | null = null;
    if (isBackendEnabled()) {
      tableSub = subscribeToTable<any>({
        table: 'route_stops',
        filter: `route_id=eq.${routeId}`,
        onInsert: async () => {
          const fresh = await collectorRouteApi.getTodayRoute();
          callback(fresh.stops);
        },
        onUpdate: async () => {
          const fresh = await collectorRouteApi.getTodayRoute();
          callback(fresh.stops);
        },
        onDelete: async () => {
          const fresh = await collectorRouteApi.getTodayRoute();
          callback(fresh.stops);
        },
      });
    }

    return () => {
      stopListeners.delete(callback);
      if (tableSub) tableSub.unsubscribe();
    };
  },
};
