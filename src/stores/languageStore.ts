// Persisted language store with device locale detection and i18next synchronization
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from '../i18n';
import { useAppStore } from './appStore';

export type SupportedLanguageCode = 'en' | 'hi' | 'pa' | 'ja';

export interface LanguageState {
  language: SupportedLanguageCode;
  isInitialized: boolean;
  setLanguage: (lang: SupportedLanguageCode) => Promise<void>;
  initLanguage: () => Promise<void>;
}

export function detectDeviceLanguage(): SupportedLanguageCode {
  try {
    const locales = Localization.getLocales ? Localization.getLocales() : [];
    const code = (locales[0]?.languageCode || (typeof navigator !== 'undefined' ? navigator.language : ''))
      .toLowerCase()
      .split(/[-_]/)[0];

    if (code === 'hi') return 'hi';
    if (code === 'pa') return 'pa';
    if (code === 'ja') return 'ja';
  } catch {
    // Fall back to default
  }
  return 'en';
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: 'en',
      isInitialized: false,

      setLanguage: async (lang: SupportedLanguageCode) => {
        if (get().language === lang && i18n.language === lang) return;
        set({ language: lang });
        try {
          await i18n.changeLanguage(lang);
        } catch (e) {
          console.warn('[LanguageStore] Failed to change language on i18n:', e);
        }
        // Backward compatibility with useAppStore without triggering cycles
        try {
          useAppStore.setState({ language: lang });
        } catch {
          // ignore
        }
      },

      initLanguage: async () => {
        if (get().isInitialized) return;
        const current = get().language;
        const target = current && ['en', 'hi', 'pa', 'ja'].includes(current)
          ? current
          : detectDeviceLanguage();

        set({ language: target, isInitialized: true });
        try {
          await i18n.changeLanguage(target);
        } catch {
          // fallback
        }
        try {
          useAppStore.setState({ language: target });
        } catch {
          // ignore
        }
      },
    }),
    {
      name: 'circulo-language-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ language: state.language }),
    }
  )
);
