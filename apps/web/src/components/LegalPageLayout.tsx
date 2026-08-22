import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { LogoMark } from '#/components/LogoMark';

interface LegalPageLayoutProps {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}

/**
 * Shared shell for /privacy and /terms — a real static/SSR'd page (neither
 * route sets `ssr: false`, since unlike /login or /register there's no
 * client-only cookie check gating them), styled like the narrow auth-page
 * card family (login.tsx/register.tsx) but wider, since a policy document
 * needs room a one-field form doesn't.
 *
 * @category Layout
 */
export function LegalPageLayout({ title, lastUpdated, children }: LegalPageLayoutProps) {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12 dark:bg-gray-900 sm:py-16">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <Link to="/" className="flex items-center justify-center gap-2">
          <LogoMark size={28} />
          <span className="text-xl font-bold text-gray-900 dark:text-gray-100">Trakwyn</span>
        </Link>
        <div className="rounded-xl bg-white p-8 shadow-sm dark:bg-gray-800 sm:p-10">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Last updated: {lastUpdated}
          </p>
          <div className="prose prose-sm mt-8 max-w-none text-gray-700 dark:prose-invert dark:text-gray-300">
            {children}
          </div>
        </div>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          <Link to="/" className="hover:text-gray-700 dark:hover:text-gray-300">
            Back to Trakwyn
          </Link>
        </p>
      </div>
    </main>
  );
}
