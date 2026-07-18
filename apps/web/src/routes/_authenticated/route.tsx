import { createFileRoute, Outlet, redirect, useNavigate } from '@tanstack/react-router';
import { isAuthenticated, getIsAuthenticated } from '#/lib/auth';
import { gqlClient } from '#/graphql/client';
import { queryClient } from '#/lib/queryClient';
import { BriefcaseIcon, LayoutDashboardIcon, LogOutIcon } from 'lucide-react';

const LOGOUT_MUTATION = `mutation { logout }`;

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    const authed =
      typeof window !== 'undefined' ? isAuthenticated() : await getIsAuthenticated();
    if (!authed) throw redirect({ to: '/login' });
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await gqlClient.request(LOGOUT_MUTATION);
    queryClient.clear();
    await navigate({ to: '/login' });
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      <aside className="w-60 flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">Job Finder</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavItem to="/dashboard" icon={<LayoutDashboardIcon size={18} />} label="Dashboard" />
          <NavItem to="/applications" icon={<BriefcaseIcon size={18} />} label="Applications" />
        </nav>

        <div className="px-3 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <LogOutIcon size={18} />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <a
      href={to}
      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
    >
      {icon}
      {label}
    </a>
  );
}
