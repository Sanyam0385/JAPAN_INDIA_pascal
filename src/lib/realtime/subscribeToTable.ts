// Reusable Supabase Realtime Subscription Helper
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, isBackendEnabled } from '../supabase/client';
import { isRecentlyModifiedLocally } from './optimisticTracker';

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

export interface SubscriptionOptions<T = any> {
  table: string;
  schema?: string;
  filter?: string; // e.g. "ward=eq.Ward 151" or "household_id=eq.uuid"
  event?: RealtimeEvent;
  onInsert?: (record: T) => void;
  onUpdate?: (newRecord: T, oldRecord: Partial<T>) => void;
  onDelete?: (oldRecord: Partial<T>) => void;
  onError?: (error: Error) => void;
  channelName?: string;
}

export interface SubscriptionHandle {
  unsubscribe: () => void;
  isConnected: () => boolean;
}

/**
 * Subscribe to Supabase Postgres changes on a table with automatic deduplication,
 * exponential backoff reconnection, and lifecycle management.
 */
export function subscribeToTable<T = any>(
  options: SubscriptionOptions<T>
): SubscriptionHandle {
  if (!isBackendEnabled()) {
    return {
      unsubscribe: () => {},
      isConnected: () => false,
    };
  }

  let channel: RealtimeChannel | null = null;
  let isSubscribed = false;
  let isUnmounted = false;
  let reconnectTimer: any = null;
  let backoffDelayMs = 1000;
  const maxBackoffMs = 30000;

  const baseChannelName =
    options.channelName ||
    `table-${options.table}-${options.filter ? options.filter.replace(/[^a-zA-Z0-9]/g, '_') : 'all'}-${Date.now().toString(36)}`;

  function cleanupChannel() {
    if (channel) {
      try {
        supabase.removeChannel(channel);
      } catch (e) {
        if (__DEV__) console.warn('[subscribeToTable] Error removing channel:', e);
      }
      channel = null;
    }
    isSubscribed = false;
  }

  function scheduleReconnect() {
    if (isUnmounted) return;
    cleanupChannel();

    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(() => {
      if (isUnmounted) return;
      if (__DEV__) {
        console.log(`[subscribeToTable] Attempting reconnection for ${options.table} in ${backoffDelayMs}ms`);
      }
      backoffDelayMs = Math.min(backoffDelayMs * 1.5, maxBackoffMs);
      connect();
    }, backoffDelayMs);
  }

  function connect() {
    if (isUnmounted) return;

    try {
      const channelInstance = supabase.channel(baseChannelName);

      channelInstance.on(
        'postgres_changes',
        {
          event: options.event || '*',
          schema: options.schema || 'public',
          table: options.table,
          filter: options.filter,
        },
        (payload: any) => {
          if (isUnmounted) return;

          const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
          const newRow = payload.new as T & { id?: string };
          const oldRow = payload.old as Partial<T> & { id?: string };

          // Optimistic local update deduplication:
          // If we recently performed a local action on this record ID,
          // ignore the redundant insert or identical update echo.
          const targetId = newRow?.id || oldRow?.id;
          if (targetId && isRecentlyModifiedLocally(targetId)) {
            if (__DEV__) {
              console.log(`[subscribeToTable] Skipping local echo for ${options.table} id=${targetId}`);
            }
            return;
          }

          if (eventType === 'INSERT' && options.onInsert && newRow) {
            options.onInsert(newRow);
          } else if (eventType === 'UPDATE' && options.onUpdate && newRow) {
            options.onUpdate(newRow, oldRow);
          } else if (eventType === 'DELETE' && options.onDelete && oldRow) {
            options.onDelete(oldRow);
          }
        }
      );

      channelInstance.subscribe((status, err) => {
        if (isUnmounted) {
          cleanupChannel();
          return;
        }

        if (status === 'SUBSCRIBED') {
          isSubscribed = true;
          backoffDelayMs = 1000; // Reset backoff on successful subscription
          if (__DEV__) {
            console.log(`[subscribeToTable] Successfully subscribed to ${options.table} (${options.filter || 'all'})`);
          }
        } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
          isSubscribed = false;
          if (options.onError && err) {
            options.onError(err);
          }
          if (__DEV__) {
            console.warn(`[subscribeToTable] Channel ${status} for ${options.table}:`, err?.message);
          }
          scheduleReconnect();
        } else if (status === 'CLOSED') {
          isSubscribed = false;
        }
      });

      channel = channelInstance;
    } catch (e: any) {
      if (__DEV__) console.warn(`[subscribeToTable] Failed to initialize subscription for ${options.table}:`, e);
      scheduleReconnect();
    }
  }

  // Initial connection
  connect();

  return {
    unsubscribe: () => {
      isUnmounted = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      cleanupChannel();
    },
    isConnected: () => isSubscribed,
  };
}
