// Live Location Service: Throttled broadcast channel for active job GPS tracking
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, isBackendEnabled } from '../supabase/client';
import { locationApi } from '../api/locationApi';

export interface LocationPayload {
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  timestamp?: number;
}

export const liveLocationService = {
  /**
   * Start publishing live coordinates for an active en-route job (throttled every 6 seconds).
   * Used by collector / picker when en route to household doorstep.
   */
  startBroadcasting(
    jobId: string,
    getCoords: () => { lat: number; lng: number; heading?: number; speed?: number } | null,
    userId: string = 'current_user'
  ): () => void {
    if (!jobId) return () => {};

    let channel: RealtimeChannel | null = null;
    let intervalId: any = null;
    let isBroadcasting = true;

    if (isBackendEnabled()) {
      try {
        channel = supabase.channel(`job:${jobId}`, {
          config: { broadcast: { self: false } },
        });
        channel.subscribe();
      } catch (e) {
        if (__DEV__) console.warn('[liveLocationService] Failed to create broadcast channel:', e);
      }
    }

    const broadcast = async () => {
      if (!isBroadcasting) return;
      const coords = getCoords();
      if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') return;

      const payload: LocationPayload = {
        lat: coords.lat,
        lng: coords.lng,
        heading: coords.heading,
        speed: coords.speed,
        timestamp: Date.now(),
      };

      // 1. Supabase WebSockets Broadcast for zero-latency screen updates
      if (channel) {
        channel.send({
          type: 'broadcast',
          event: 'location',
          payload,
        }).catch(() => {});
      }

      // 2. Dual-mode database persistence
      locationApi.upsertLocation({
        userId,
        jobId,
        lat: coords.lat,
        lng: coords.lng,
        heading: coords.heading,
        speed: coords.speed,
      }).catch(() => {});
    };

    // Broadcast immediately, then throttle every 6 seconds
    broadcast();
    intervalId = setInterval(broadcast, 6000);

    return () => {
      isBroadcasting = false;
      if (intervalId) clearInterval(intervalId);
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch {}
      }
    };
  },

  /**
   * Subscribe to live location broadcasts for an active job.
   * Used by household screen to display moving collector on map / live route.
   */
  subscribeToJobLocation(
    jobId: string,
    onLocation: (location: LocationPayload) => void
  ): () => void {
    if (!jobId) return () => {};

    let channel: RealtimeChannel | null = null;

    if (isBackendEnabled()) {
      try {
        channel = supabase.channel(`job:${jobId}`, {
          config: { broadcast: { self: false } },
        });

        channel
          .on('broadcast', { event: 'location' }, (payload: any) => {
            if (payload?.payload && typeof payload.payload.lat === 'number') {
              onLocation(payload.payload as LocationPayload);
            }
          })
          .subscribe();
      } catch (e) {
        if (__DEV__) console.warn('[liveLocationService] Error subscribing to location channel:', e);
      }
    }

    return () => {
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch {}
      }
    };
  },
};
