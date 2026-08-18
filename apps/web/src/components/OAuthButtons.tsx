import { useLocale } from '#/lib/i18n';
import { DEFAULT_API_URL } from '#/constants';

interface OAuthButtonsProps {
  label: string;
}

// Mirrors the API_URL resolution in graphql/client.ts (not imported from
// there directly — that module is fully mocked in several component tests
// without an API_URL export, and this is a one-line computation not worth
// coupling to that mock surface for).
//
// In dev, this resolves to the relative "/graphql" (proxied to the API by
// Vite — see vite.config.ts), so API_ORIGIN is "" and the hrefs below stay
// relative, which the same dev proxy also covers for "/auth". In
// production, web and api are on different subdomains with no such proxy,
// so VITE_API_URL is an absolute URL there and this must be too, or these
// links 404 against the web app's own origin instead of reaching the API.
const API_URL = import.meta.env.VITE_API_URL ?? DEFAULT_API_URL;
const API_ORIGIN = API_URL.replace(/\/graphql$/, '');

export function OAuthButtons({ label }: OAuthButtonsProps) {
  const { t } = useLocale();
  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-gray-700" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">
            {t('common.or')}
          </span>
        </div>
      </div>

      <a
        href={`${API_ORIGIN}/auth/oauth/google/start`}
        className="flex w-full items-center justify-center gap-2 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        {label} {t('common.withGoogle')}
      </a>
      <a
        href={`${API_ORIGIN}/auth/oauth/github/start`}
        className="flex w-full items-center justify-center gap-2 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        {label} {t('common.withGitHub')}
      </a>
    </div>
  );
}
