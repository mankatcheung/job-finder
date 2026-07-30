import { useEffect } from 'react';
import { HeadContent, Link, Scripts, createRootRoute } from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { TanStackDevtools } from '@tanstack/react-devtools';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AlertTriangleIcon } from 'lucide-react';
import { queryClient } from '#/lib/queryClient';
import { THEME_INIT_SCRIPT, ThemeProvider, useTheme } from '#/lib/theme';

import appCss from '../styles.css?url';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Job Finder' },
      { name: 'theme-color', content: '#000000' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'manifest', href: '/manifest.webmanifest' },
      { rel: 'apple-touch-icon', href: '/logo192.png' },
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
  // Registered manually with the plain browser API rather than the plugin's
  // `virtual:pwa-register` helper or its index.html auto-injection: this
  // file is isomorphic (rendered for both the client and server Vite
  // environments), and vite-plugin-pwa's virtual module only resolves for
  // the client build — importing it here breaks the server bundle. sw.js
  // is a real static file (registerType: 'autoUpdate' means no update-prompt
  // callbacks are needed, so the plain API loses nothing here).
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
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
