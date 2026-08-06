import { createContext, useContext, useEffect, useMemo, useState } from 'react';

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

const en: Messages = {
  'nav.dashboard': 'Dashboard',
  'nav.applications': 'Applications',
  'nav.calendar': 'Calendar',
  'nav.analytics': 'Analytics',
  'nav.assistant': 'Assistant',
  'nav.settings': 'Settings',
  'nav.signOut': 'Sign out',
  'settings.language': 'Language',
  'settings.languageDescription': 'Choose the language used across the web app.',
  'settings.profile': 'Profile',
  'settings.experience': 'Experience',
  'settings.security': 'Security',
  'settings.integrations': 'Integrations',
  'settings.notifications': 'Notifications',
  'settings.data': 'Data',
  'errors.notFound': 'Page not found',
  'errors.goDashboard': 'Go to dashboard',
  'errors.somethingWrong': 'Something went wrong',
  'errors.reloadHelp': 'Try reloading the page. If this keeps happening, let us know.',
  'errors.reload': 'Reload',
};

const enGB: Messages = { ...en };

const zhHK: Messages = {
  'nav.dashboard': '主頁',
  'nav.applications': '求職申請',
  'nav.calendar': '日曆',
  'nav.analytics': '分析',
  'nav.assistant': '助理',
  'nav.settings': '設定',
  'nav.signOut': '登出',
  'settings.language': '語言',
  'settings.languageDescription': '選擇網頁應用程式使用的語言。',
  'settings.profile': '個人資料',
  'settings.experience': '經歷',
  'settings.security': '安全性',
  'settings.integrations': '整合',
  'settings.notifications': '通知',
  'settings.data': '資料',
  'errors.notFound': '找不到頁面',
  'errors.goDashboard': '前往主頁',
  'errors.somethingWrong': '發生錯誤',
  'errors.reloadHelp': '請重新載入頁面。如問題持續，請通知我們。',
  'errors.reload': '重新載入',
};

const zhTW: Messages = {
  'nav.dashboard': '儀表板',
  'nav.applications': '求職申請',
  'nav.calendar': '行事曆',
  'nav.analytics': '分析',
  'nav.assistant': '助理',
  'nav.settings': '設定',
  'nav.signOut': '登出',
  'settings.language': '語言',
  'settings.languageDescription': '選擇網頁應用程式使用的語言。',
  'settings.profile': '個人資料',
  'settings.experience': '經歷',
  'settings.security': '安全性',
  'settings.integrations': '整合',
  'settings.notifications': '通知',
  'settings.data': '資料',
  'errors.notFound': '找不到頁面',
  'errors.goDashboard': '前往儀表板',
  'errors.somethingWrong': '發生錯誤',
  'errors.reloadHelp': '請重新載入頁面。如果問題持續，請通知我們。',
  'errors.reload': '重新載入',
};

const zhCN: Messages = {
  'nav.dashboard': '仪表盘',
  'nav.applications': '求职申请',
  'nav.calendar': '日历',
  'nav.analytics': '分析',
  'nav.assistant': '助手',
  'nav.settings': '设置',
  'nav.signOut': '退出登录',
  'settings.language': '语言',
  'settings.languageDescription': '选择网页应用使用的语言。',
  'settings.profile': '个人资料',
  'settings.experience': '经历',
  'settings.security': '安全',
  'settings.integrations': '集成',
  'settings.notifications': '通知',
  'settings.data': '数据',
  'errors.notFound': '页面未找到',
  'errors.goDashboard': '前往仪表盘',
  'errors.somethingWrong': '发生错误',
  'errors.reloadHelp': '请重新加载页面。如果问题持续，请通知我们。',
  'errors.reload': '重新加载',
};

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
