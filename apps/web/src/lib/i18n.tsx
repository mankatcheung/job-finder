import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import en from '#/i18n/en.json';
import enGB from '#/i18n/en-GB.json';
import zhHK from '#/i18n/zh-HK.json';
import zhTW from '#/i18n/zh-TW.json';
import zhCN from '#/i18n/zh-CN.json';

export const SUPPORTED_LOCALES = ['en', 'en-GB', 'zh-HK', 'zh-TW', 'zh-CN'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const LOCALE_STORAGE_KEY = 'locale';

export const LOCALE_OPTIONS: Array<{ value: Locale; label: string }> = [
  { value: 'en', label: 'English' },
  { value: 'en-GB', label: 'English (United Kingdom)' },
  { value: 'zh-HK', label: '中文（香港）' },
  { value: 'zh-TW', label: '繁體中文（台灣）' },
  { value: 'zh-CN', label: '简体中文' },
];

type Messages = Record<string, string>;

const messages: Record<Locale, Messages> = {
  en,
  'en-GB': enGB,
  'zh-HK': zhHK,
  'zh-TW': zhTW,
  'zh-CN': zhCN,
};

export function isLocale(value: string | null | undefined): value is Locale {
  return !!value && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

function detectLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (isLocale(stored)) return stored;
  for (const language of navigator.languages) {
    if (isLocale(language)) return language;
    if (language.startsWith('zh-HK')) return 'zh-HK';
    if (language.startsWith('zh-TW')) return 'zh-TW';
    if (language.startsWith('zh')) return 'zh-CN';
    if (language.startsWith('en-GB')) return 'en-GB';
    if (language.startsWith('en')) return 'en';
  }
  return 'en';
}

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  formatDate: (value: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  }, [locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale: (next) => setLocaleState(next),
      t: (key) => messages[locale][key] ?? messages.en[key] ?? key,
      formatDate: (valueToFormat, options) =>
        new Intl.DateTimeFormat(locale, options).format(
          typeof valueToFormat === 'string' ? new Date(valueToFormat) : valueToFormat,
        ),
      formatNumber: (valueToFormat, options) =>
        new Intl.NumberFormat(locale, options).format(valueToFormat),
    }),
    [locale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (context) return context;
  return {
    locale: 'en',
    setLocale: () => undefined,
    t: (key) => messages.en[key] ?? key,
    formatDate: (valueToFormat, options) =>
      new Intl.DateTimeFormat('en', options).format(
        typeof valueToFormat === 'string' ? new Date(valueToFormat) : valueToFormat,
      ),
    formatNumber: (valueToFormat, options) =>
      new Intl.NumberFormat('en', options).format(valueToFormat),
  };
}

export const LOCALE_INIT_SCRIPT = `(function(){try{var l=localStorage.getItem('${LOCALE_STORAGE_KEY}');if(!l){l=(navigator.languages||[]).find(function(x){return ['en','en-GB','zh-HK','zh-TW','zh-CN'].indexOf(x)>=0;})||'en';}document.documentElement.lang=l;}catch(e){}})();`;
