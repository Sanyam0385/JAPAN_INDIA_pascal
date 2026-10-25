// Profile API: Dual-mode profile retrieval, update, and live location preference
import { supabase, isBackendEnabled } from '../supabase/client';
import { DEMO_USERS } from '../demo/demoData';
import type { User, UserRole } from '../../types';

export const profileApi = {
  /**
   * Fetch user profile by ID
   */
  async getProfile(userId: string): Promise<User | null> {
    if (isBackendEnabled()) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (error) {
          if (__DEV__) console.warn('[profileApi.getProfile] Supabase error:', error);
        } else if (data) {
          return {
            id: data.id,
            email: data.email || '',
            name: data.full_name || data.name || 'Circulo User',
            role: data.role as UserRole,
            locality: data.locality || undefined,
            wardName: data.ward || undefined,
            cityKey: data.city_key || undefined,
            lat: data.lat ?? undefined,
            lng: data.lng ?? undefined,
            phone: data.phone || undefined,
            preferredLanguage: data.language || 'en',
            avatarUrl: data.avatar_url || undefined,
            createdAt: data.created_at,
          };
        }
      } catch (e) {
        if (__DEV__) console.warn('[profileApi.getProfile] Network error:', e);
      }
    }

    // Local Demo Fallback
    const demoUser = DEMO_USERS[userId] || Object.values(DEMO_USERS).find((u) => u.id === userId);
    return demoUser || null;
  },

  /**
   * Update user profile fields (name, locality, coordinates, phone, language)
   */
  async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    if (isBackendEnabled()) {
      try {
        const dbUpdates: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };
        if (updates.name !== undefined) {
          dbUpdates.full_name = updates.name;
          dbUpdates.name = updates.name;
        }
        if (updates.locality !== undefined) dbUpdates.locality = updates.locality;
        if (updates.wardName !== undefined) dbUpdates.ward = updates.wardName;
        if (updates.cityKey !== undefined) dbUpdates.city_key = updates.cityKey;
        if (updates.lat !== undefined) dbUpdates.lat = updates.lat;
        if (updates.lng !== undefined) dbUpdates.lng = updates.lng;
        if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
        if (updates.preferredLanguage !== undefined) dbUpdates.language = updates.preferredLanguage;
        if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;

        const { data, error } = await supabase
          .from('profiles')
          .update(dbUpdates)
          .eq('id', userId)
          .select()
          .single();

        if (error) {
          if (__DEV__) console.warn('[profileApi.updateProfile] Supabase error:', error);
          throw new Error(error.message);
        }

        if (data) {
          return {
            id: data.id,
            email: data.email || updates.email || '',
            name: data.full_name || data.name || updates.name || 'Circulo User',
            role: data.role as UserRole,
            locality: data.locality || updates.locality,
            wardName: data.ward || updates.wardName,
            cityKey: data.city_key || updates.cityKey,
            lat: data.lat ?? updates.lat,
            lng: data.lng ?? updates.lng,
            phone: data.phone || updates.phone,
            preferredLanguage: data.language || updates.preferredLanguage || 'en',
            avatarUrl: data.avatar_url || updates.avatarUrl,
            createdAt: data.created_at,
          };
        }
      } catch (e) {
        if (__DEV__) console.warn('[profileApi.updateProfile] Failed:', e);
        // Throw if live, fallback if offline
        if (!isBackendEnabled()) {
          // Demo fallback
        } else {
          throw e;
        }
      }
    }

    // Local Demo Fallback
    const existing = DEMO_USERS[userId] || {
      id: userId,
      email: updates.email || '',
      role: updates.role || 'household',
      name: updates.name || 'Circulo User',
      preferredLanguage: updates.preferredLanguage || 'en',
      createdAt: new Date().toISOString(),
    };
    const updated: User = { ...existing, ...updates };
    DEMO_USERS[userId] = updated;
    return updated;
  },

  /**
   * Update live location sharing permission
   */
  async updateLiveLocationOptIn(userId: string, enabled: boolean): Promise<void> {
    if (isBackendEnabled()) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            share_live_location: enabled,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (error && __DEV__) {
          console.warn('[profileApi.updateLiveLocationOptIn] Error:', error);
        }
      } catch (e) {
        if (__DEV__) console.warn('[profileApi.updateLiveLocationOptIn] Network error:', e);
      }
    }
  },
};
