import type { FastifyInstance } from 'fastify';
import { authedGql } from '../../lib/auth.js';
import { layout } from '../../views/layout.js';
import { ALL_STATUSES } from '../../views/statusBadge.js';
import { escapeHtml } from '../../lib/format.js';

const QUERY = `query {
  applications {
    id company role status starred
  }
}`;

const UPDATE_STATUS = `mutation UpdateStatus($id: ID!, $status: String!) {
  updateApplication(id: $id, input: { status: $status }) { id status }
}`;

type App = { id: string; company: string; role: string; status: string; starred: boolean };

const starIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="currentColor" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  applied: 'Applied',
  interviewing: 'Interviewing',
  offered: 'Offered',
  accepted: 'Accepted',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

const STATUS_HEADER_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  applied: 'bg-blue-100 text-blue-700',
  interviewing: 'bg-yellow-100 text-yellow-700',
  offered: 'bg-green-100 text-green-700',
  accepted: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
  withdrawn: 'bg-gray-100 text-gray-500',
};

function boardCard(app: App): string {
  const statusOptions = ALL_STATUSES.map(
    (s) =>
      `<option value="${s}" ${app.status === s ? 'selected' : ''}>${STATUS_LABELS[s] ?? s}</option>`,
  ).join('');

  return `
    <div class="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
      <a href="/applications/${app.id}" class="block mb-2">
        <p class="font-medium text-sm text-gray-900 truncate">${escapeHtml(app.company)}</p>
        <p class="text-xs text-gray-500 truncate">${escapeHtml(app.role)}</p>
      </a>
      <div class="flex items-center gap-1.5">
        ${app.starred ? `<span class="text-yellow-400">${starIcon}</span>` : ''}
        <select class="flex-1 px-2 py-1 border border-gray-200 rounded text-xs bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
          hx-post="/applications/${app.id}/board-status"
          hx-trigger="change"
          hx-target="closest [data-board-card]"
          hx-swap="outerHTML"
          name="status">
          ${statusOptions}
        </select>
      </div>
    </div>`;
}

function column(status: string, apps: App[]): string {
  const headerCls = STATUS_HEADER_COLORS[status] ?? 'bg-gray-100 text-gray-600';
  return `
    <div class="flex-shrink-0 w-56 flex flex-col">
      <div class="flex items-center justify-between px-2 py-1.5 rounded-lg mb-2 ${headerCls}">
        <span class="text-xs font-semibold">${STATUS_LABELS[status] ?? status}</span>
        <span class="text-xs font-medium">${apps.length}</span>
      </div>
      <div class="space-y-2 flex-1">
        ${apps.length === 0 ? '<p class="text-xs text-gray-300 text-center py-4">Empty</p>' : apps.map((a) => `<div data-board-card>${boardCard(a)}</div>`).join('')}
      </div>
    </div>`;
}

export default async function boardRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/applications/board', async (request, reply) => {
    let apps: App[] = [];
    try {
      const data = await authedGql<{ applications: App[] }>(request, reply, QUERY);
      apps = data.applications;
    } catch (err) {
      if ((err as Error).message === 'Redirecting') return;
      throw err;
    }

    const byStatus = Object.fromEntries(ALL_STATUSES.map((s) => [s, [] as App[]]));
    for (const app of apps) {
      (byStatus[app.status] ?? (byStatus['draft'] ??= [])).push(app);
    }

    const content = `
      <div class="p-4 sm:p-8">
        <div class="flex items-center justify-between mb-6">
          <h1 class="text-2xl font-bold text-gray-900">Board</h1>
          <div class="flex items-center gap-2">
            <a href="/applications" class="px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">List view</a>
            <a href="/applications/new" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">+ New</a>
          </div>
        </div>
        <div class="flex gap-4 overflow-x-auto pb-4">
          ${ALL_STATUSES.map((s) => column(s, byStatus[s] ?? [])).join('')}
        </div>
      </div>`;

    return reply.type('text/html').send(layout(content, 'Board', 'applications'));
  });

  // HTMX endpoint: status changed on board → move card to new column (full page reload approach via HX-Redirect)
  fastify.post('/applications/:id/board-status', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { status?: string };
    const status = ALL_STATUSES.includes(body.status as (typeof ALL_STATUSES)[number])
      ? body.status!
      : 'draft';
    try {
      await authedGql(request, reply, UPDATE_STATUS, { id, status });
      // Reload the board after status change
      reply.header('HX-Redirect', '/applications/board');
      return reply.send('');
    } catch (err) {
      if ((err as Error).message === 'Redirecting') return;
      return reply.status(422).send('Error');
    }
  });
}
