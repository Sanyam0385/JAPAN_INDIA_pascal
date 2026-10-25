// i18n setup with full React Native / Expo compatibility
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import hi from './locales/hi.json';
import pa from './locales/pa.json';
import ja from './locales/ja.json';

export const resources = {
  en: { translation: en },
  hi: { translation: hi },
  pa: { translation: pa },
  ja: { translation: ja },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
    react: {
      useSuspense: false,
    },
    compatibilityJSON: 'v4',
  });

export default i18n;
