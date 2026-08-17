import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next, I18nextProvider, useTranslation } from 'react-i18next';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import en from '#/i18n/en.json';
import enGB from '#/i18n/en-GB.json';
import zhHK from '#/i18n/zh-HK.json';
import zhTW from '#/i18n/zh-TW.json';
import zhCN from '#/i18n/zh-CN.json';

export const SUPPORTED_LOCALES = ['en', 'en-GB', 'zh-HK', 'zh-TW', 'zh-CN'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const LOCALE_STORAGE_KEY = 'locale';
export const LOCALE_QUERY_KEY = 'locale';

export const LOCALE_OPTIONS: Array<{ value: Locale; label: string }> = [
  { value: 'en', label: 'English' },
  { value: 'en-GB', label: 'English (United Kingdom)' },
  { value: 'zh-HK', label: '中文（香港）' },
  { value: 'zh-TW', label: '繁體中文（台灣）' },
  { value: 'zh-CN', label: '简体中文' },
];

const resources = {
  en: { translation: en },
  'en-GB': { translation: enGB },
  'zh-HK': { translation: zhHK },
  'zh-TW': { translation: zhTW },
  'zh-CN': { translation: zhCN },
};

void i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LOCALES,
    nonExplicitSupportedLngs: false,
    interpolation: { escapeValue: false },
    detection: {
      order: ['querystring', 'navigator', 'localStorage'],
      lookupQuerystring: LOCALE_QUERY_KEY,
      lookupLocalStorage: LOCALE_STORAGE_KEY,
      caches: ['localStorage'],
    },
  });

export function isLocale(value: string | null | undefined): value is Locale {
  return !!value && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

function normalizeLocale(value: string | undefined): Locale {
  if (isLocale(value)) return value;
  if (value?.startsWith('zh-HK')) return 'zh-HK';
  if (value?.startsWith('zh-TW')) return 'zh-TW';
  if (value?.startsWith('zh')) return 'zh-CN';
  if (value?.startsWith('en-GB')) return 'en-GB';
  return 'en';
}

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return normalizeLocale(i18next.language);
  const queryLocale = new URLSearchParams(window.location.search).get(LOCALE_QUERY_KEY);
  return normalizeLocale(
    queryLocale ?? localStorage.getItem(LOCALE_STORAGE_KEY) ?? i18next.language,
  );
}

function writeLocaleToUrl(locale: Locale): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.searchParams.set(LOCALE_QUERY_KEY, locale);
  window.history.replaceState(window.history.state, '', url);
}

/** i18next interpolation values, e.g. `{{count}}`/`{{term}}` placeholders — also drives plural-form selection when `count` is present. */
type TranslateOptions = Record<string, string | number>;

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, options?: TranslateOptions) => string;
  formatDate: (value: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  useEffect(() => {
    const handleLanguageChanged = (next: string) => setLocaleState(normalizeLocale(next));
    i18next.on('languageChanged', handleLanguageChanged);
    return () => {
      i18next.off('languageChanged', handleLanguageChanged);
    };
  }, []);

  useEffect(() => {
    if (i18next.language !== locale) void i18next.changeLanguage(locale);
    document.documentElement.lang = locale;
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    writeLocaleToUrl(locale);
  }, [locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale: (next) => {
        writeLocaleToUrl(next);
        void i18next.changeLanguage(next);
      },
      t: (key, options) => String(i18next.getFixedT(locale)(key, options)),
      formatDate: (valueToFormat, options) =>
        new Intl.DateTimeFormat(locale, options).format(
          typeof valueToFormat === 'string' ? new Date(valueToFormat) : valueToFormat,
        ),
      formatNumber: (valueToFormat, options) =>
        new Intl.NumberFormat(locale, options).format(valueToFormat),
    }),
    [locale],
  );

  return (
    <I18nextProvider i18n={i18next}>
      <LocaleContextBridge value={value}>{children}</LocaleContextBridge>
    </I18nextProvider>
  );
}

// Kept separate so existing component tests can render pages without adding a
// provider while production pages still receive the i18next-backed context.
const LocaleContext = createContext<LocaleContextValue | null>(null);

function LocaleContextBridge({
  value,
  children,
}: {
  value: LocaleContextValue;
  children: React.ReactNode;
}) {
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  const translation = useTranslation();
  if (context) return context;
  const { i18n, t } = translation;
  const locale = normalizeLocale(i18n.language);
  return {
    locale,
    setLocale: (next) => void i18n.changeLanguage(next),
    t: (key, options) => String(t(key, options)),
    formatDate: (valueToFormat, options) =>
      new Intl.DateTimeFormat(locale, options).format(
        typeof valueToFormat === 'string' ? new Date(valueToFormat) : valueToFormat,
      ),
    formatNumber: (valueToFormat, options) =>
      new Intl.NumberFormat(locale, options).format(valueToFormat),
  };
}

export const LOCALE_INIT_SCRIPT = `(function(){try{var p=new URLSearchParams(location.search).get('${LOCALE_QUERY_KEY}');var l=p||localStorage.getItem('${LOCALE_STORAGE_KEY}')||((navigator.languages||[])[0])||'en';document.documentElement.lang=l;}catch(e){}})();`;
