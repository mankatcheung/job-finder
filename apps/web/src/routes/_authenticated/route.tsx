import { useState, useEffect } from 'react';
import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useChildMatches,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { gqlClient, hydrateSession, setAccessToken } from '#/graphql/client';
import { queryClient } from '#/lib/queryClient';
import { useTheme, type Theme } from '#/lib/theme';
import { useHotkeys, getKeyModifier } from '#/hooks/useHotkeys';
import { CommandPalette } from '#/components/CommandPalette';
import { ShortcutCheatSheet } from '#/components/ShortcutCheatSheet';
import { LogoMark } from '#/components/LogoMark';
import {
  BarChart2Icon,
  BriefcaseIcon,
  CalendarIcon,
  KeyboardIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MenuIcon,
  MessageCircleIcon,
  MonitorIcon,
  MoonIcon,
  PlugIcon,
  BellIcon,
  DatabaseIcon,
  ShieldIcon,
  SunIcon,
  UserIcon,
  XIcon,
} from 'lucide-react';

const THEME_CYCLE: Record<Theme, Theme> = { light: 'dark', dark: 'system', system: 'light' };
const THEME_ICON: Record<Theme, React.ReactNode> = {
  light: <SunIcon size={18} />,
  dark: <MoonIcon size={18} />,
  system: <MonitorIcon size={18} />,
};
const THEME_LABEL: Record<Theme, string> = { light: 'Light', dark: 'Dark', system: 'System' };

function ThemeToggleButton({ className = '' }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={() => setTheme(THEME_CYCLE[theme])}
      aria-label={`Theme: ${THEME_LABEL[theme]}. Click to switch theme.`}
      title={`Theme: ${THEME_LABEL[theme]}`}
      className={`p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 rounded-lg transition-colors ${className}`}
    >
      <span key={theme} className="theme-toggle-icon">
        {THEME_ICON[theme]}
      </span>
    </button>
  );
}

const LOGOUT_MUTATION = `mutation { logout }`;
const AVATAR_QUERY = `query AccountAvatar { me { avatarUrl } }`;

function AccountAvatarIcon({
  avatarUrl,
  size,
}: {
  avatarUrl: string | null | undefined;
  size: number;
}) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt="Your avatar"
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return <UserIcon size={size} />;
}

const SETTINGS_NAV = [
  { to: '/settings/profile', label: 'Profile', icon: UserIcon },
  { to: '/settings/security', label: 'Security', icon: ShieldIcon },
  { to: '/settings/integrations', label: 'Integrations', icon: PlugIcon },
  { to: '/settings/notifications', label: 'Notifications', icon: BellIcon },
  { to: '/settings/data', label: 'Data', icon: DatabaseIcon },
] as const;

export const Route = createFileRoute('/_authenticated')({
  // See routes/index.tsx for why this must be ssr: false.
  ssr: false,
  beforeLoad: async () => {
    const authed = await hydrateSession();
    if (!authed) throw redirect({ to: '/login' });
  },
  component: AuthenticatedLayout,
});

export function AuthenticatedLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // Keyed by the immediate child route (dashboard/applications/settings/…)
  // rather than the full pathname, so switching between nested settings tabs
  // doesn't also remount the settings layout's own sub-nav.
  const sectionKey = useChildMatches()[0]?.routeId ?? pathname;
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: avatarData } = useQuery({
    queryKey: ['me', 'avatarUrl'],
    queryFn: () => gqlClient.request<{ me: { avatarUrl: string | null } | null }>(AVATAR_QUERY),
  });
  const avatarUrl = avatarData?.me?.avatarUrl;

  const handleLogout = async () => {
    await gqlClient.request(LOGOUT_MUTATION);
    setAccessToken(null);
    queryClient.clear();
    await navigate({ to: '/login' });
  };

  useHotkeys({ key: 'n', ctrl: true }, () => {
    navigate({ to: '/applications/new' });
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setShortcutsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      <CommandPalette />
      <ShortcutCheatSheet isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

      {/* Mobile sidebar drawer backdrop */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <span className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-gray-100">
            <LogoMark size={22} />
            Job Finder
          </span>
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
            className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 rounded-lg transition-colors"
          >
            <XIcon size={18} />
          </button>
        </div>

        <nav className="px-3 py-4 space-y-1 overflow-y-auto">
          <NavItem
            to="/dashboard"
            icon={<LayoutDashboardIcon size={18} />}
            label="Dashboard"
            active={pathname.startsWith('/dashboard')}
          />
          <NavItem
            to="/applications"
            icon={<BriefcaseIcon size={18} />}
            label="Applications"
            active={pathname.startsWith('/applications')}
          />
          <NavItem
            to="/calendar"
            icon={<CalendarIcon size={18} />}
            label="Calendar"
            active={pathname.startsWith('/calendar')}
          />
          <NavItem
            to="/analytics"
            icon={<BarChart2Icon size={18} />}
            label="Analytics"
            active={pathname.startsWith('/analytics')}
          />
          <NavItem
            to="/assistant"
            icon={<MessageCircleIcon size={18} />}
            label="Assistant"
            active={pathname.startsWith('/assistant')}
          />

          <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
              <AccountAvatarIcon avatarUrl={avatarUrl} size={18} />
              Settings
            </div>
            <div className="ml-2 space-y-0.5">
              {SETTINGS_NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 pl-5 pr-3 py-1.5 text-sm rounded-lg transition-colors ${
                    pathname.startsWith(item.to)
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <item.icon size={14} />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 px-3 py-4 border-t border-gray-200 dark:border-gray-700 space-y-1 bg-white dark:bg-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <LogOutIcon size={18} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top header */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 rounded-lg transition-colors"
          >
            <MenuIcon size={18} />
          </button>
          <span className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-gray-100">
            <LogoMark size={22} />
            Job Finder
          </span>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggleButton />
        </div>
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-col">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <span className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-gray-100">
            <LogoMark size={22} />
            Job Finder
          </span>
          <ThemeToggleButton />
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavItem
            to="/dashboard"
            icon={<LayoutDashboardIcon size={18} />}
            label="Dashboard"
            active={pathname.startsWith('/dashboard')}
          />
          <NavItem
            to="/applications"
            icon={<BriefcaseIcon size={18} />}
            label="Applications"
            active={pathname.startsWith('/applications')}
          />
          <NavItem
            to="/calendar"
            icon={<CalendarIcon size={18} />}
            label="Calendar"
            active={pathname.startsWith('/calendar')}
          />
          <NavItem
            to="/analytics"
            icon={<BarChart2Icon size={18} />}
            label="Analytics"
            active={pathname.startsWith('/analytics')}
          />
          <NavItem
            to="/assistant"
            icon={<MessageCircleIcon size={18} />}
            label="Assistant"
            active={pathname.startsWith('/assistant')}
          />
        </nav>

        <div className="px-3 pb-2 space-y-1">
          <NavItem
            to="/settings/profile"
            icon={<AccountAvatarIcon avatarUrl={avatarUrl} size={18} />}
            label="Settings"
            active={pathname.startsWith('/settings')}
          />
        </div>

        <div className="px-3 py-4 border-t border-gray-200 dark:border-gray-700 space-y-1">
          <button
            onClick={() => setShortcutsOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Show keyboard shortcuts"
          >
            <KeyboardIcon size={18} />
            Shortcuts
            <kbd className="ml-auto text-[10px] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded font-mono">
              {getKeyModifier()}+/
            </kbd>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <LogOutIcon size={18} />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto pt-14 lg:pt-0 pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0">
        <div key={sectionKey} className="route-transition">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex pb-[env(safe-area-inset-bottom)]">
        <BottomNavItem
          to="/dashboard"
          icon={<LayoutDashboardIcon size={20} />}
          label="Dashboard"
          active={pathname.startsWith('/dashboard')}
        />
        <BottomNavItem
          to="/applications"
          icon={<BriefcaseIcon size={20} />}
          label="Apps"
          active={pathname.startsWith('/applications')}
        />
        <BottomNavItem
          to="/calendar"
          icon={<CalendarIcon size={20} />}
          label="Calendar"
          active={pathname.startsWith('/calendar')}
        />
        <BottomNavItem
          to="/assistant"
          icon={<MessageCircleIcon size={20} />}
          label="Assistant"
          active={pathname.startsWith('/assistant')}
        />
      </nav>
    </div>
  );
}

function NavItem({
  to,
  icon,
  label,
  active,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
        active
          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}

function BottomNavItem({
  to,
  icon,
  label,
  active,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-colors ${
        active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
