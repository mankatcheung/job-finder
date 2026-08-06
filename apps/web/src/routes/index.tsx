import { useState } from 'react';
import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { hydrateSession } from '#/graphql/client';
import { useLocale } from '#/lib/i18n';
import {
  LayoutDashboard,
  BarChart3,
  CalendarDays,
  Sparkles,
  FileText,
  Bell,
  ArrowRight,
} from 'lucide-react';

export const Route = createFileRoute('/')({
  // The API and web app are on separate domains, so there is no cookie the
  // server can ever see — the auth check can only run client-side. ssr:
  // false forces TanStack Start's hydrate() to call beforeLoad again on the
  // client instead of trusting an SSR-computed (and here undecidable) result.
  ssr: false,
  beforeLoad: async () => {
    const authed = await hydrateSession();
    if (authed) throw redirect({ to: '/dashboard' });
  },
  component: LandingPage,
});

const features = [
  {
    icon: LayoutDashboard,
    titleKey: 'landing.tracking',
    descriptionKey: 'landing.trackingDescription',
  },
  {
    icon: Sparkles,
    titleKey: 'landing.assistant',
    descriptionKey: 'landing.assistantDescription',
  },
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
  {
    icon: FileText,
    titleKey: 'landing.documents',
    descriptionKey: 'landing.documentsDescription',
  },
  {
    icon: Bell,
    titleKey: 'landing.notifications',
    descriptionKey: 'landing.notificationsDescription',
  },
];

const steps = ['landing.step1', 'landing.step2', 'landing.step3', 'landing.step4'];

function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useLocale();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <svg width={24} height={24} viewBox="0 0 48 48" fill="none" aria-hidden="true">
                <rect x="9" y="29" width="9" height="9" rx="2" fill="#1d4ed8" opacity="0.35" />
                <rect
                  x="18.5"
                  y="19.5"
                  width="11.5"
                  height="11.5"
                  rx="2.5"
                  fill="#1d4ed8"
                  opacity="0.65"
                />
                <rect x="29" y="9" width="13.5" height="13.5" rx="3" fill="#1d4ed8" />
                <path
                  d="M32.3,16 l2.6,3 l6,-6.6"
                  stroke="#ffffff"
                  strokeWidth="2.1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">Job Finder</span>
            </Link>
            <div className="hidden sm:flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                {t('landing.signIn')}
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
                to="/login"
                className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('landing.signIn')}
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
              {t('landing.heroTitle')}
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
                to="/login"
                className="rounded-lg border border-gray-300 dark:border-gray-600 px-6 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {t('landing.signIn')}
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
                {t('landing.howItWorks')}
              </h2>
            </div>
            <div className="mt-12 space-y-6">
              {steps.map((step, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                    {i + 1}
                  </div>
                  <p className="text-lg text-gray-700 dark:text-gray-300 pt-0.5">{t(step)}</p>
                </div>
              ))}
            </div>
            <div className="mt-12 text-center">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
              >
                {t('landing.getStarted')}
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
              <svg width={20} height={20} viewBox="0 0 48 48" fill="none" aria-hidden="true">
                <rect x="9" y="29" width="9" height="9" rx="2" fill="#1d4ed8" opacity="0.35" />
                <rect
                  x="18.5"
                  y="19.5"
                  width="11.5"
                  height="11.5"
                  rx="2.5"
                  fill="#1d4ed8"
                  opacity="0.65"
                />
                <rect x="29" y="9" width="13.5" height="13.5" rx="3" fill="#1d4ed8" />
                <path
                  d="M32.3,16 l2.6,3 l6,-6.6"
                  stroke="#ffffff"
                  strokeWidth="2.1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Job Finder
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
              <Link
                to="/login"
                className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                {t('landing.signIn')}
              </Link>
              <Link
                to="/register"
                className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                {t('auth.register')}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
