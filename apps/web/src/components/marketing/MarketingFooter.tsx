import { Link } from '@tanstack/react-router';
import { LogoMark } from '#/components/LogoMark';
import { LegalFooterLinks } from '#/components/LegalFooterLinks';
import { useLocale } from '#/lib/i18n';
import { useIsLoggedIn } from '#/lib/useIsLoggedIn';

/**
 * Shared footer for every public marketing page (`/` and `/features/*`).
 * Adds a Product link column pointing at the four feature deep-dive pages
 * (JEF-228) on top of the legal links every non-landing page already carries
 * via {@link LegalFooterLinks}.
 *
 * @category Layout
 */
export function MarketingFooter() {
  const { t } = useLocale();
  const isLoggedIn = useIsLoggedIn();

  const authLink: '/dashboard' | '/login' = isLoggedIn ? '/dashboard' : '/login';
  const authLabel = isLoggedIn ? t('landing.goDashboard') : t('landing.signIn');

  return (
    <footer className="border-t border-gray-200 dark:border-gray-800">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2">
              <LogoMark size={22} />
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Trakwyn
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-6 text-gray-500 dark:text-gray-400">
              Your job search, organized and powered by AI. Free to start.
            </p>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
              Product
            </div>
            <div className="mt-3.5 flex flex-col gap-2.5">
              <Link
                to="/features/tracking"
                className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                Application tracking
              </Link>
              <Link
                to="/features/ai-assistant"
                className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                AI assistant
              </Link>
              <Link
                to="/features/resume-cover-letter"
                className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                Resume &amp; cover letters
              </Link>
              <Link
                to="/features/analytics"
                className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                Analytics
              </Link>
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
              Account
            </div>
            <div className="mt-3.5 flex flex-col gap-2.5">
              <Link
                to={authLink}
                className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                {authLabel}
              </Link>
              <Link
                to="/register"
                className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                {t('auth.register')}
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center gap-4 border-t border-gray-200 pt-6 dark:border-gray-800 sm:flex-row sm:justify-between">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            © {new Date().getFullYear()} Trakwyn. All rights reserved.
          </span>
          <LegalFooterLinks className="flex max-w-xs flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-gray-500 dark:text-gray-400 sm:max-w-none" />
        </div>
      </div>
    </footer>
  );
}
