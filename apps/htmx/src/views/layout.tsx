type ActiveNav = 'dashboard' | 'applications' | 'analytics' | 'account';

function NavItem({
  href,
  label,
  active,
  children,
}: {
  href: string;
  label: string;
  active: boolean;
  children: JSX.Element;
}) {
  const cls = active
    ? 'flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-blue-50 text-blue-600 font-medium'
    : 'flex items-center gap-2 px-3 py-2 text-sm rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors';
  return (
    <a href={href} class={cls}>
      {children}
      <span safe>{label}</span>
    </a>
  );
}

function BottomNavItem({
  href,
  label,
  active,
  children,
}: {
  href: string;
  label: string;
  active: boolean;
  children: JSX.Element;
}) {
  const cls = active
    ? 'flex-1 flex flex-col items-center gap-0.5 py-2 text-xs text-blue-600'
    : 'flex-1 flex flex-col items-center gap-0.5 py-2 text-xs text-gray-500';
  return (
    <a href={href} class={cls}>
      {children}
      <span safe>{label}</span>
    </a>
  );
}

function DashboardIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  );
}

function ApplicationsIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <rect width="20" height="14" x="2" y="7" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

function AnalyticsIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <line x1="18" x2="18" y1="20" y2="10" />
      <line x1="12" x2="12" y1="20" y2="4" />
      <line x1="6" x2="6" y1="20" y2="14" />
    </svg>
  );
}

function AccountIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M20 21a8 8 0 1 0-16 0" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  );
}

export function Layout({
  children,
  title,
  activeNav,
}: {
  children: JSX.Element;
  title: string;
  activeNav: ActiveNav;
}) {
  return (
    <>
      {`<!doctype html>`}
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title safe>{title} — Job Finder</title>
          <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
          <script src="https://unpkg.com/htmx.org@2.0.4"></script>
          <style type="text/tailwindcss">
            {`@custom-variant dark (&:where(.dark, .dark *));`}
          </style>
        </head>
        <body class="bg-gray-50 text-gray-900">
          <div class="min-h-screen flex">
            {/* Mobile top header */}
            <header class="lg:hidden fixed top-0 inset-x-0 z-40 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
              <span class="text-lg font-bold">Job Finder</span>
              <form action="/logout" method="POST">
                <button
                  type="submit"
                  aria-label="Sign out"
                  class="p-2 text-gray-500 hover:text-gray-900 rounded-lg transition-colors"
                >
                  <LogoutIcon />
                </button>
              </form>
            </header>

            {/* Desktop sidebar */}
            <aside class="hidden lg:flex w-60 flex-shrink-0 bg-white border-r border-gray-200 flex-col fixed top-0 left-0 h-full">
              <div class="px-6 py-5 border-b border-gray-200">
                <span class="text-lg font-bold">Job Finder</span>
              </div>
              <nav class="flex-1 px-3 py-4 space-y-1">
                <NavItem href="/dashboard" label="Dashboard" active={activeNav === 'dashboard'}>
                  <DashboardIcon />
                </NavItem>
                <NavItem
                  href="/applications"
                  label="Applications"
                  active={activeNav === 'applications'}
                >
                  <ApplicationsIcon />
                </NavItem>
                <NavItem href="/analytics" label="Analytics" active={activeNav === 'analytics'}>
                  <AnalyticsIcon />
                </NavItem>
              </nav>
              <div class="px-3 pb-2 space-y-1">
                <NavItem href="/account" label="Account" active={activeNav === 'account'}>
                  <AccountIcon />
                </NavItem>
              </div>
              <div class="px-3 py-4 border-t border-gray-200">
                <form action="/logout" method="POST">
                  <button
                    type="submit"
                    class="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <LogoutIcon />
                    Sign out
                  </button>
                </form>
              </div>
            </aside>

            {/* Content */}
            <main class="flex-1 lg:ml-60 overflow-auto pt-14 lg:pt-0 pb-16 lg:pb-0">
              {children}
            </main>

            {/* Mobile bottom nav */}
            <nav class="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 flex">
              <BottomNavItem href="/dashboard" label="Dashboard" active={activeNav === 'dashboard'}>
                <DashboardIcon />
              </BottomNavItem>
              <BottomNavItem
                href="/applications"
                label="Apps"
                active={activeNav === 'applications'}
              >
                <ApplicationsIcon />
              </BottomNavItem>
              <BottomNavItem href="/analytics" label="Analytics" active={activeNav === 'analytics'}>
                <AnalyticsIcon />
              </BottomNavItem>
              <BottomNavItem href="/account" label="Account" active={activeNav === 'account'}>
                <AccountIcon />
              </BottomNavItem>
            </nav>
          </div>
        </body>
      </html>
    </>
  );
}

export function AuthLayout({ children, title }: { children: JSX.Element; title: string }) {
  return (
    <>
      {`<!doctype html>`}
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title safe>{title} — Job Finder</title>
          <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
          <script src="https://unpkg.com/htmx.org@2.0.4"></script>
        </head>
        <body class="bg-gray-50 min-h-screen flex items-center justify-center px-4">
          {children}
        </body>
      </html>
    </>
  );
}

export const inputCls =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500';
export const labelCls = 'block text-sm font-medium text-gray-700 mb-1';
export const btnPrimary =
  'px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60';
export const btnSecondary =
  'px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors';
export const btnDanger =
  'px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors';
