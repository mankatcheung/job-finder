import { createFileRoute, Link, Outlet, useLocation } from '@tanstack/react-router';
import {
  UserIcon,
  ShieldIcon,
  PlugIcon,
  BellIcon,
  DatabaseIcon,
  BriefcaseIcon,
} from 'lucide-react';

export const Route = createFileRoute('/_authenticated/settings')({
  component: SettingsLayout,
});

const SETTINGS_NAV = [
  { to: '/settings/profile', label: 'Profile', icon: UserIcon },
  { to: '/settings/experience', label: 'Experience', icon: BriefcaseIcon },
  { to: '/settings/security', label: 'Security', icon: ShieldIcon },
  { to: '/settings/integrations', label: 'Integrations', icon: PlugIcon },
  { to: '/settings/notifications', label: 'Notifications', icon: BellIcon },
  { to: '/settings/data', label: 'Data', icon: DatabaseIcon },
] as const;

function SettingsLayout() {
  const { pathname } = useLocation();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Settings</h1>
      <div className="flex flex-col lg:flex-row gap-8">
        <nav className="hidden lg:block lg:w-48 shrink-0 space-y-1">
          {SETTINGS_NAV.map((item) => {
            const active = pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                  active
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex-1 min-w-0">
          <div key={pathname} className="route-transition">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
