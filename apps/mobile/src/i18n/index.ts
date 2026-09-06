import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en';
import es from './locales/es';
import { DEFAULT_LANGUAGE } from './config';

export const resources = { en, es } as const;

void i18n.use(initReactI18next).init({
  resources,
  lng: DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  defaultNS: 'common',
  ns: Object.keys(en),
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

export default i18n;
