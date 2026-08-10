import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, Outlet, useChildMatches, useNavigate, useRouterState } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { gqlClient, setAccessToken } from '#/graphql/client';
import { queryClient } from '#/lib/queryClient';
import { useHotkeys, getKeyModifier } from '#/hooks/useHotkeys';
import { CommandPalette } from '#/components/CommandPalette';
import { ShortcutCheatSheet } from '#/components/ShortcutCheatSheet';
import { LogoMark } from '#/components/LogoMark';
import { ChatDockProvider } from '#/lib/chatDock';
import { ChatDockFooter } from '../-chat-dock-footer';
import { ChatDockFloatingWindow } from '../-chat-dock-floating-window';
import { NotificationInboxButton } from '../-notification-inbox';
import {
  BarChart2Icon,
  BriefcaseIcon,
  CalendarIcon,
  KeyboardIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MenuIcon,
  MessageCircleIcon,
  PlugIcon,
  BellIcon,
  DatabaseIcon,
  ShieldIcon,
  UserIcon,
  XIcon,
} from 'lucide-react';

const LOGOUT_MUTATION = `mutation { logout }`;
const AVATAR_QUERY = `query AccountAvatar { me { avatarUrl } }`;

const SETTINGS_NAV = [
  { to: '/settings/profile', label: 'Profile', icon: UserIcon },
  { to: '/settings/experience', label: 'Experience', icon: BriefcaseIcon },
  { to: '/settings/security', label: 'Security', icon: ShieldIcon },
  { to: '/settings/integrations', label: 'Integrations', icon: PlugIcon },
  { to: '/settings/notifications', label: 'Notifications', icon: BellIcon },
  { to: '/settings/data', label: 'Data', icon: DatabaseIcon },
] as const;

const MAIN_NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboardIcon },
  { to: '/applications', label: 'Applications', icon: BriefcaseIcon },
  { to: '/calendar', label: 'Calendar', icon: CalendarIcon },
  { to: '/analytics', label: 'Analytics', icon: BarChart2Icon },
  { to: '/assistant', label: 'Assistant', icon: MessageCircleIcon },
] as const;

export function AuthenticatedLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // Keyed by the immediate child route (dashboard/applications/settings/…)
  // rather than the full pathname, so switching between nested settings tabs
  // doesn't also remount the settings layout's own sub-nav.
  const sectionKey = useChildMatches()[0]?.routeId ?? pathname;
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const sidebarTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openSidebar = useCallback(() => {
    setSidebarVisible(true);
    // Force a frame so the browser renders the element at opacity-0 before transitioning
    requestAnimationFrame(() => {
      setSidebarOpen(true);
    });
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
    // Wait for the transition to complete before removing from DOM
    const prevTimer = sidebarTimerRef.current;
    if (prevTimer !== null) clearTimeout(prevTimer);
    sidebarTimerRef.current = setTimeout(() => {
      setSidebarVisible(false);
    }, 350);
  }, []);

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
    closeSidebar();
  }, [pathname, closeSidebar]);

  // Cleanup sidebar timer on unmount
  useEffect(() => {
    return () => {
      const timer = sidebarTimerRef.current;
      if (timer !== null) clearTimeout(timer);
    };
  }, []);

  return (
    <ChatDockProvider>
      <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
        <CommandPalette />
        <ShortcutCheatSheet isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

        {/* Mobile sidebar drawer backdrop */}
        {sidebarVisible && (
          <div
            className={`lg:hidden fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 ease-out ${
              sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onClick={closeSidebar}
          />
        )}

        {/* Mobile sidebar drawer */}
        {sidebarVisible && (
          <aside
            className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-xl flex flex-col transform transition-transform duration-300 ease-out ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <span className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-gray-100">
                <LogoMark size={22} />
                Job Finder
              </span>
              <button
                onClick={closeSidebar}
                aria-label="Close menu"
                className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 rounded-lg transition-colors"
              >
                <XIcon size={18} />
              </button>
            </div>

            <nav
              aria-label="Main navigation"
              className="flex-1 px-3 py-4 space-y-1 overflow-y-auto"
            >
              {MAIN_NAV.map((item, i) => (
                <NavItem
                  key={item.to}
                  to={item.to}
                  icon={<item.icon size={18} />}
                  label={item.label}
                  active={pathname.startsWith(item.to)}
                  staggerIndex={i}
                />
              ))}

              <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                  <AccountAvatarIcon avatarUrl={avatarUrl} size={18} />
                  Settings
                </div>
                <div className="ml-2 space-y-0.5">
                  {SETTINGS_NAV.map((item, i) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`flex items-center gap-2 pl-5 pr-3 py-1.5 text-sm rounded-lg transition-colors sidebar-nav-item ${
                        pathname.startsWith(item.to)
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      style={{ animationDelay: `${(MAIN_NAV.length + i) * 50}ms` }}
                    >
                      <item.icon size={14} />
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </nav>

            <div className="px-3 py-4 border-t border-gray-200 dark:border-gray-700 space-y-1 bg-white dark:bg-gray-800">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <LogOutIcon size={18} />
                Sign out
              </button>
            </div>
          </aside>
        )}

        {/* Mobile top header */}
        <header className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <button
              onClick={openSidebar}
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
            <NotificationInboxButton />
          </div>
        </header>

        {/* Desktop sidebar */}
        <aside className="hidden lg:flex w-60 flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-col sidebar-desktop-entrance">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sidebar-entrance-item">
            <span className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-gray-100">
              <LogoMark size={22} />
              Job Finder
            </span>
            <NotificationInboxButton />
          </div>

          <nav aria-label="Main navigation" className="flex-1 px-3 py-4 space-y-1">
            {MAIN_NAV.map((item, i) => (
              <NavItem
                key={item.to}
                to={item.to}
                icon={<item.icon size={18} />}
                label={item.label}
                active={pathname.startsWith(item.to)}
                staggerIndex={i}
              />
            ))}
          </nav>

          <div className="px-3 pb-2 space-y-1">
            <div
              className="sidebar-entrance-item"
              style={{ animationDelay: `${MAIN_NAV.length * 50}ms` }}
            >
              <NavItem
                to="/settings/profile"
                icon={<AccountAvatarIcon avatarUrl={avatarUrl} size={18} />}
                label="Settings"
                active={pathname.startsWith('/settings')}
                staggerDelay={MAIN_NAV.length * 50}
              />
            </div>
          </div>

          <div className="px-3 py-4 border-t border-gray-200 dark:border-gray-700 space-y-1">
            <button
              onClick={() => setShortcutsOpen(true)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors sidebar-entrance-item"
              style={{ animationDelay: `${(MAIN_NAV.length + 1) * 50}ms` }}
              title="Show keyboard shortcuts"
            >
              <KeyboardIcon size={18} />
              Shortcuts
              <kbd className="ml-auto text-[10px] text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded font-mono">
                {getKeyModifier()}+/
              </kbd>
            </button>
            <div
              className="sidebar-entrance-item"
              style={{ animationDelay: `${(MAIN_NAV.length + 2) * 50}ms` }}
            >
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <LogOutIcon size={18} />
                Sign out
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-auto pt-14 lg:pt-0 pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-12">
          <div key={sectionKey} className="route-transition">
            <Outlet />
          </div>
        </main>

        {/* Mobile bottom nav. Height = 4rem content + safe-area-inset-bottom.
          The main element's pb already matches this total so content doesn't
          overlap. */}
        <nav
          aria-label="Bottom navigation"
          className="lg:hidden fixed bottom-0 inset-x-0 z-40 h-[calc(4rem+env(safe-area-inset-bottom))] bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center pb-[env(safe-area-inset-bottom)]"
        >
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

        <ChatDockFooter />
        <ChatDockFloatingWindow />
      </div>
    </ChatDockProvider>
  );
}

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

function NavItem({
  to,
  icon,
  label,
  active,
  staggerIndex,
  staggerDelay,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  staggerIndex?: number;
  staggerDelay?: number;
}) {
  const delay = staggerDelay ?? (staggerIndex !== undefined ? staggerIndex * 50 : 0);

  return (
    <Link
      to={to}
      className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all duration-200 sidebar-nav-item ${
        active
          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
      }`}
      style={{ animationDelay: `${delay}ms` }}
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
