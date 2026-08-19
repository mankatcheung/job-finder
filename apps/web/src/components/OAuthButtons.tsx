import { useLocale } from '#/lib/i18n';
import { API_ORIGIN } from '#/lib/apiOrigin';
import { OAuthProviderLogo } from '#/components/OAuthProviderLogo';

interface OAuthButtonsProps {
  label: string;
  returnTo?: string;
}

export function OAuthButtons({ label, returnTo }: OAuthButtonsProps) {
  const { t } = useLocale();
  const returnToQuery = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : '';
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
        href={`${API_ORIGIN}/auth/oauth/google/start${returnToQuery}`}
        className="flex w-full items-center justify-center gap-2 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <OAuthProviderLogo provider="google" />
        {label} {t('common.withGoogle')}
      </a>
      <a
        href={`${API_ORIGIN}/auth/oauth/github/start${returnToQuery}`}
        className="flex w-full items-center justify-center gap-2 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <OAuthProviderLogo provider="github" />
        {label} {t('common.withGitHub')}
      </a>
    </div>
  );
}
