import { useEffect } from 'react';
import { HeadContent, Link, Scripts, createRootRouteWithContext } from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { TanStackDevtools } from '@tanstack/react-devtools';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { Analytics } from '@vercel/analytics/react';
import { Toaster } from 'sonner';
import { AlertTriangleIcon } from 'lucide-react';
import { queryClient } from '#/lib/queryClient';
import { THEME_INIT_SCRIPT, ThemeProvider, useTheme } from '#/lib/theme';
import { NavigationProgressBar } from '#/components/NavigationProgressBar';
import { watchForServiceWorkerUpdate } from '#/lib/swUpdateToast';

import appCss from '../styles.css?url';

export interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1, viewport-fit=cover',
      },
      { title: 'Trakwyn' },
      { name: 'theme-color', content: '#1d4ed8' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'manifest', href: '/manifest.webmanifest' },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
      { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
    ],
  }),
  notFoundComponent: NotFound,
  errorComponent: RouteError,
  shellComponent: RootDocument,
});

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">404</h1>
        <p className="text-gray-500 dark:text-gray-400">Page not found</p>
        <Link to="/dashboard" className="inline-block text-blue-600 hover:underline text-sm">
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}

// TanStack Router's catch-all for a render-time exception anywhere in the
// route tree — without this, an uncaught error just blanks the page.
function RouteError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center space-y-4">
        <AlertTriangleIcon size={40} className="mx-auto text-red-500" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Something went wrong
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Try reloading the page. If this keeps happening, let us know.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg px-4 py-2 transition-colors"
          >
            Reload
          </button>
          <Link to="/dashboard" className="text-sm text-blue-600 hover:underline">
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

function AppToaster() {
  const { theme } = useTheme();
  return <Toaster richColors theme={theme} />;
}

function RootDocument({ children }: { children: React.ReactNode }) {
  // Registered manually with the plain browser API rather than a build
  // plugin's virtual-module helper: this file is isomorphic (rendered for
  // both the client and server Vite environments), and any such virtual
  // module only resolves for the client build — importing it here would
  // break the server bundle. sw.js (apps/web/public/sw.js) is a real,
  // hand-written static file — see its own comments for why.
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }
  }, []);

  // Prompts for a refresh when a new SW version takes over this tab instead
  // of leaving an already-open install running stale code — see
  // swUpdateToast.ts for why this needs more than just skipWaiting().
  useEffect(() => watchForServiceWorkerUpdate(), []);

  // Listen for messages from the service worker (e.g. push notification clicks)
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (
        event.data &&
        typeof event.data === 'object' &&
        event.data.type === 'push-notification-click' &&
        typeof event.data.url === 'string'
      ) {
        // Navigate within the SPA — the service worker has already focused
        // this window, so we can just change the URL
        window.location.href = event.data.url;
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handler);
      return () => navigator.serviceWorker.removeEventListener('message', handler);
    }
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <ThemeProvider>
          <Analytics />
          <NavigationProgressBar />
          <AppToaster />
          <QueryClientProvider client={queryClient}>
            {children}
            <TanStackDevtools
              config={{ position: 'bottom-right' }}
              plugins={[{ name: 'Tanstack Router', render: <TanStackRouterDevtoolsPanel /> }]}
            />
          </QueryClientProvider>
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}
