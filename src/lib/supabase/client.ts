// Supabase Client with graceful fallback for Demo Mode
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Safe environment variable retrieval
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://demo-placeholder.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'demo-anon-key-placeholder';

export const isSupabaseConfigured = (): boolean => {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  return (
    typeof url === 'string' &&
    typeof key === 'string' &&
    url.length > 0 &&
    key.length > 0 &&
    !url.includes('your-project-id') &&
    !url.includes('demo-placeholder') &&
    (url.startsWith('https://') || url.startsWith('http://'))
  );
};

export const isBackendEnabled = (): boolean => {
  return isSupabaseConfigured();
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
