import { GlobeIcon } from 'lucide-react';
import { LOCALE_OPTIONS, useLocale, type Locale } from '#/lib/i18n';

/**
 * Compact language switcher for the marketing pages (JEF-228 follow-up) —
 * `/` and `/features/*` never exposed `setLocale()` anywhere; only
 * `SettingsProfilePage`'s full labeled `<select>` did, so a visitor
 * couldn't change language before signing up. A native `<select>` (not a
 * custom dropdown) so it keeps free keyboard/touch/screen-reader support and
 * shares `LOCALE_OPTIONS` with Settings, rather than a second list to keep
 * in sync.
 *
 * @category Actions
 */
export function MarketingLocalePicker() {
  const { locale, setLocale, t } = useLocale();

  return (
    <div className="relative flex items-center">
      <GlobeIcon
        className="pointer-events-none absolute left-2 h-3.5 w-3.5 text-gray-400"
        aria-hidden="true"
      />
      <select
        aria-label={t('settings.language')}
        value={locale}
        onChange={(event) => setLocale(event.target.value as Locale)}
        className="appearance-none rounded-lg border border-gray-300 bg-white py-1.5 pl-7 pr-2 text-xs font-medium text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
      >
        {LOCALE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
