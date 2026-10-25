// Optimistic Tracker: Prevents duplicate state updates & race conditions
// When a client locally inserts or updates an item, we record its ID and timestamp.
// If an echo arrives via Supabase Realtime within a threshold window, we avoid redundant processing.

const localModificationTimestamps = new Map<string, number>();

// Clean up stale entries every 60 seconds
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [id, timestamp] of localModificationTimestamps.entries()) {
      if (now - timestamp > 30000) {
        localModificationTimestamps.delete(id);
      }
    }
  }, 60000);
}

/**
 * Record that an entity was created or modified locally
 */
export function recordLocalModification(id: string): void {
  if (!id) return;
  localModificationTimestamps.set(id, Date.now());
}

/**
 * Check whether this entity was modified locally within the threshold window
 */
export function isRecentlyModifiedLocally(id: string, thresholdMs = 2500): boolean {
  if (!id) return false;
  const timestamp = localModificationTimestamps.get(id);
  if (!timestamp) return false;
  if (Date.now() - timestamp < thresholdMs) {
    return true;
  }
  localModificationTimestamps.delete(id);
  return false;
}

/**
 * Clear all tracked modification timestamps
 */
export function clearTrackedModifications(): void {
  localModificationTimestamps.clear();
}
