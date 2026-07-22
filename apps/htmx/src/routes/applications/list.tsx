import type { FastifyInstance } from 'fastify';
import { authedGql } from '../../lib/auth.js';
import { Layout } from '../../views/layout.js';
import { StatusBadge, ALL_STATUSES } from '../../views/statusBadge.js';
import { StarIcon } from '../../views/icons.js';
import { formatDate } from '../../lib/format.js';

const QUERY = `query {
  applications {
    id company role location status starred followUpAt jobUrl salary createdAt
  }
}`;

type App = {
  id: string;
  company: string;
  role: string;
  location?: string | null;
  status: string;
  starred: boolean;
  followUpAt?: string | null;
  jobUrl?: string | null;
  salary?: string | null;
  createdAt: string;
};

function AppRow({ app, overdue }: { app: App; overdue: boolean }) {
  return (
    <a
      href={`/applications/${app.id}`}
      class="flex items-center gap-3 px-4 py-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
    >
      <span class="text-yellow-400 shrink-0" style={`visibility:${app.starred ? 'visible' : 'hidden'}`}>
        <StarIcon />
      </span>
      <div class="min-w-0 flex-1">
        <p class="font-medium text-gray-900 text-sm truncate" safe>
          {app.company} — {app.role}
        </p>
        <p class="text-xs text-gray-500 truncate" safe>
          {app.location ?? ''}
          {app.salary ? ` · ${app.salary}` : ''}
        </p>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <StatusBadge status={app.status} />
        {overdue ? (
          <span class="text-xs text-orange-600 font-medium hidden sm:block">Follow-up due</span>
        ) : (
          ''
        )}
        <span class="text-xs text-gray-400 hidden sm:block" safe>
          {formatDate(app.createdAt)}
        </span>
      </div>
    </a>
  );
}

export default async function applicationListRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/applications', async (request, reply) => {
    let apps: App[] = [];
    try {
      const data = await authedGql<{ applications: App[] }>(request, reply, QUERY);
      apps = data.applications;
    } catch (err) {
      if ((err as Error).message === 'Redirecting') return;
      throw err;
    }

    const q = request.query as Record<string, string>;
    const search = (q['search'] ?? '').toLowerCase();
    const filterStatus = q['status'] ?? '';
    const filterStarred = q['starred'] === '1';
    const now = new Date();

    let filtered = apps;
    if (search) {
      filtered = filtered.filter(
        (a) =>
          a.company.toLowerCase().includes(search) ||
          a.role.toLowerCase().includes(search) ||
          (a.location ?? '').toLowerCase().includes(search),
      );
    }
    if (filterStatus) filtered = filtered.filter((a) => a.status === filterStatus);
    if (filterStarred) filtered = filtered.filter((a) => a.starred);

    const overdue = (a: App) => a.followUpAt != null && new Date(a.followUpAt) <= now;

    return reply.type('text/html').send(
      <Layout title="Applications" activeNav="applications">
        <div class="p-4 sm:p-8 max-w-6xl mx-auto">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h1 class="text-2xl font-bold text-gray-900">Applications</h1>
            <div class="flex items-center gap-2">
              <a
                href="/applications/board"
                class="px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Board view
              </a>
              <a
                href="/applications/new"
                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                + New
              </a>
            </div>
          </div>

          {/* Filters */}
          <form
            method="GET"
            action="/applications"
            class="flex flex-wrap gap-2 mb-6"
            hx-get="/applications"
            hx-target="body"
            hx-push-url="true"
            hx-trigger="input delay:300ms, change"
          >
            <input
              name="search"
              value={search}
              type="search"
              placeholder="Search…"
              class="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
            />
            <select
              name="status"
              class="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" selected={!filterStatus}>
                All statuses
              </option>
              {ALL_STATUSES.map((s) => (
                <option value={s} selected={filterStatus === s} safe>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
            <label
              class={`flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm cursor-pointer ${filterStarred ? 'bg-yellow-50 border-yellow-300' : 'bg-white'}`}
            >
              <input type="checkbox" name="starred" value="1" checked={filterStarred} class="sr-only" />
              <span class="text-yellow-500">
                <StarIcon />
              </span>{' '}
              Starred
            </label>
          </form>

          <p class="text-sm text-gray-500 mb-4">
            {filtered.length} application{filtered.length === 1 ? '' : 's'}
          </p>

          {filtered.length === 0 ? (
            <div class="text-center py-16 text-gray-500">
              <p class="mb-2 font-medium">No applications found</p>
              <a href="/applications/new" class="text-blue-600 hover:underline text-sm">
                Add your first one →
              </a>
            </div>
          ) : (
            <div class="space-y-2">
              {filtered.map((app) => (
                <AppRow app={app} overdue={overdue(app)} />
              ))}
            </div>
          )}
        </div>
      </Layout>,
    );
  });
}
