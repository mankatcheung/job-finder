import { useEffect, useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { hasSessionCookie } from '#/graphql/client';
import { LogoMark } from '#/components/LogoMark';
import { useLocale } from '#/lib/i18n';
import { requestOpenCookiePreferences } from '#/lib/cookieConsent';
import {
  LayoutDashboard,
  BarChart3,
  CalendarDays,
  Sparkles,
  FileText,
  Bell,
  ArrowRight,
} from 'lucide-react';

const SITE_URL = 'https://www.trakwyn.com';
const OG_TITLE = 'Trakwyn — Your Job Search, Organized and Powered by AI';
const OG_DESCRIPTION =
  'Track applications, get AI-generated cover letters and resume feedback, visualize your pipeline, and never miss an interview. Everything you need to land your next role.';
const OG_IMAGE = `${SITE_URL}/logo512.png`;

const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Trakwyn',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description: OG_DESCRIPTION,
  url: SITE_URL,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
};

export const Route = createFileRoute('/')({
  // Real content worth indexing — unlike /login and /register (which stay
  // ssr: false, since they're utility pages behind a client-only auth
  // check, not marketing pages), this route SSRs unconditionally. The
  // already-logged-in redirect moved to a client-only effect in
  // LandingPage below specifically so it wouldn't force ssr: false here
  // (see JEF-206) — the API and web app are on separate domains, so
  // hasSessionCookie() still can't run on the server either way.
  head: () => ({
    meta: [
      { title: OG_TITLE },
      { name: 'description', content: OG_DESCRIPTION },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: SITE_URL },
      { property: 'og:title', content: OG_TITLE },
      { property: 'og:description', content: OG_DESCRIPTION },
      { property: 'og:image', content: OG_IMAGE },
      { property: 'og:image:width', content: '512' },
      { property: 'og:image:height', content: '512' },
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:title', content: OG_TITLE },
      { name: 'twitter:description', content: OG_DESCRIPTION },
      { name: 'twitter:image', content: OG_IMAGE },
    ],
    links: [{ rel: 'canonical', href: SITE_URL }],
  }),
  component: LandingPage,
});

const features = [
  {
    icon: LayoutDashboard,
    titleKey: 'landing.tracking',
    descriptionKey: 'landing.trackingDescription',
  },
  { icon: Sparkles, titleKey: 'landing.assistant', descriptionKey: 'landing.assistantDescription' },
  {
    icon: BarChart3,
    titleKey: 'landing.analytics',
    descriptionKey: 'landing.analyticsDescription',
  },
  {
    icon: CalendarDays,
    titleKey: 'landing.calendar',
    descriptionKey: 'landing.calendarDescription',
  },
  { icon: FileText, titleKey: 'landing.documents', descriptionKey: 'landing.documentsDescription' },
  {
    icon: Bell,
    titleKey: 'landing.notifications',
    descriptionKey: 'landing.notificationsDescription',
  },
] as const;

const stepKeys = ['landing.step1', 'landing.step2', 'landing.step3', 'landing.step4'] as const;

export function LandingPage() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Starts false so the client's first render matches the SSR'd markup —
  // the server can never see the session cookie (see Route.head comment
  // above), so it always renders the logged-out variant. A real logged-in
  // visitor gets redirected by the effect below before this would matter.
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (hasSessionCookie()) {
      setIsLoggedIn(true);
      navigate({ to: '/dashboard', replace: true });
    }
  }, [navigate]);

  const authLink: '/dashboard' | '/login' = isLoggedIn ? '/dashboard' : '/login';
  const authLabel = isLoggedIn ? t('landing.goDashboard') : t('landing.signIn');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
      />
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <LogoMark size={24} />
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">Trakwyn</span>
            </Link>
            <div className="hidden sm:flex items-center gap-3">
              <Link
                to={authLink}
                className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                {authLabel}
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                {t('landing.getStarted')}
              </Link>
            </div>
            <button
              type="button"
              className="sm:hidden p-2 text-gray-600 dark:text-gray-400"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                </svg>
              )}
            </button>
          </div>
          {mobileMenuOpen && (
            <div className="sm:hidden pb-4 space-y-2">
              <Link
                to={authLink}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => setMobileMenuOpen(false)}
              >
                {authLabel}
              </Link>
              <Link
                to="/register"
                className="block rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('landing.getStarted')}
              </Link>
            </div>
          )}
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden py-24 sm:py-32">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-blue-50 to-gray-50 dark:from-gray-900 dark:to-gray-900" />
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-6xl">
              {t('landing.heroTitleLine1')}
              <br />
              <span className="text-blue-600">{t('landing.heroTitleLine2')}</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {t('landing.heroDescription')}
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                to="/register"
                className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
              >
                {t('landing.startFree')}
              </Link>
              <Link
                to={authLink}
                className="rounded-lg border border-gray-300 dark:border-gray-600 px-6 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {authLabel}
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 sm:py-32">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
                {t('landing.everything')}
              </h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                {t('landing.everythingDescription')}
              </p>
            </div>
            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.titleKey}
                  className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 p-6 shadow-sm"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30">
                    <feature.icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {t(feature.titleKey)}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">
                    {t(feature.descriptionKey)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-24 sm:py-32 bg-gray-100 dark:bg-gray-800/30">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
                {t('landing.getStartedMinutes')}
              </h2>
            </div>
            <div className="mt-12 space-y-6">
              {stepKeys.map((stepKey, i) => (
                <div key={stepKey} className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                    {i + 1}
                  </div>
                  <p className="text-lg text-gray-700 dark:text-gray-300 pt-0.5">{t(stepKey)}</p>
                </div>
              ))}
            </div>
            <div className="mt-12 text-center">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
              >
                {t('landing.getStartedFree')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-2">
              <LogoMark size={20} />
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Trakwyn
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
              <Link
                to={authLink}
                className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                {authLabel}
              </Link>
              <Link
                to="/register"
                className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                {t('auth.register')}
              </Link>
              <Link
                to="/privacy"
                className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                {t('auth.privacyPolicy')}
              </Link>
              <Link
                to="/terms"
                className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                {t('auth.termsOfService')}
              </Link>
              <Link
                to="/accessibility"
                className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                {t('auth.accessibility')}
              </Link>
              <button
                type="button"
                onClick={requestOpenCookiePreferences}
                className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                {t('cookieConsent.footerLink')}
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
