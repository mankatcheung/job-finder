import type { FastifyInstance } from 'fastify';
import { authedGql } from '../lib/auth.js';
import { Layout } from '../views/layout.js';
import { StatusBadge } from '../views/statusBadge.js';
import { StarIcon } from '../views/icons.js';
import { formatDate } from '../lib/format.js';

const QUERY = `query {
  applications {
    id company role status starred followUpAt createdAt
  }
}`;

type App = {
  id: string;
  company: string;
  role: string;
  status: string;
  starred: boolean;
  followUpAt?: string | null;
  createdAt: string;
};

const colors: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600',
  indigo: 'bg-indigo-50 text-indigo-600',
  yellow: 'bg-yellow-50 text-yellow-600',
  green: 'bg-green-50 text-green-600',
  orange: 'bg-orange-50 text-orange-600',
};

function StatCard({
  label,
  value,
  color,
  children,
}: {
  label: string;
  value: number;
  color: string;
  children: JSX.Element;
}) {
  return (
    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <div class={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${colors[color] ?? colors['blue']}`}>
        {children}
      </div>
      <p class="text-2xl font-bold text-gray-900">{value}</p>
      <p class="text-xs text-gray-500" safe>
        {label}
      </p>
    </div>
  );
}

function BriefcaseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      viewBox="0 0 24 24"
    >
      <rect width="20" height="14" x="2" y="7" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      viewBox="0 0 24 24"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      viewBox="0 0 24 24"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  );
}

function RecentAppRow({ app, isOverdue }: { app: App; isOverdue: boolean }) {
  return (
    <a
      href={`/applications/${app.id}`}
      class="flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
    >
      <div class="flex items-center gap-2 min-w-0">
        {app.starred ? (
          <span class="text-yellow-400">
            <StarIcon size={13} />
          </span>
        ) : (
          ''
        )}
        {isOverdue ? (
          <span class="text-orange-500">
            <AlertIcon />
          </span>
        ) : (
          ''
        )}
        <div class="min-w-0">
          <p class="font-medium text-gray-900 text-sm truncate" safe>
            {app.company}
          </p>
          <p class="text-xs text-gray-500 truncate" safe>
            {app.role}
          </p>
        </div>
      </div>
      <div class="flex items-center gap-3 shrink-0">
        <StatusBadge status={app.status} />
        <span class="text-xs text-gray-400 hidden sm:block" safe>
          {formatDate(app.createdAt)}
        </span>
      </div>
    </a>
  );
}

export default async function dashboardRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/dashboard', async (request, reply) => {
    let apps: App[] = [];
    try {
      const data = await authedGql<{ applications: App[] }>(request, reply, QUERY);
      apps = data.applications;
    } catch (err) {
      if ((err as Error).message === 'Redirecting') return;
      throw err;
    }

    const now = new Date();
    const counts = {
      total: apps.length,
      applied: apps.filter((a) => a.status === 'applied').length,
      interviewing: apps.filter((a) => a.status === 'interviewing').length,
      offered: apps.filter((a) => a.status === 'offered').length,
      overdue: apps.filter((a) => a.followUpAt != null && new Date(a.followUpAt) <= now).length,
    };

    const recentApps = apps.slice(0, 8);

    return reply.type('text/html').send(
      <Layout title="Dashboard" activeNav="dashboard">
        <div class="p-4 sm:p-8 max-w-5xl mx-auto">
          <div class="flex items-center justify-between mb-8">
            <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
            <a
              href="/applications/new"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              + New application
            </a>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
            <StatCard label="Total" value={counts.total} color="blue">
              <BriefcaseIcon />
            </StatCard>
            <StatCard label="Applied" value={counts.applied} color="indigo">
              <FileIcon />
            </StatCard>
            <StatCard label="Interviewing" value={counts.interviewing} color="yellow">
              <ClockIcon />
            </StatCard>
            <StatCard label="Offered" value={counts.offered} color="green">
              <CheckCircleIcon />
            </StatCard>
            <StatCard label="Follow-up due" value={counts.overdue} color="orange">
              <AlertIcon />
            </StatCard>
          </div>

          <div>
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Recent applications</h2>
            {recentApps.length === 0 ? (
              <div class="text-center py-12 text-gray-500">
                <p class="mb-2">No applications yet.</p>
                <a href="/applications/new" class="text-blue-600 hover:underline text-sm">
                  Add your first one →
                </a>
              </div>
            ) : (
              <div class="space-y-2">
                {recentApps.map((app) => (
                  <RecentAppRow
                    app={app}
                    isOverdue={app.followUpAt != null && new Date(app.followUpAt) <= now}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </Layout>,
    );
  });
}
