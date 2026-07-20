import type { FastifyInstance } from 'fastify';
import { authedGql } from '../../lib/auth.js';
import { layout } from '../../views/layout.js';
import { ALL_STATUSES } from '../../views/statusBadge.js';
import { escapeHtml, formatDate } from '../../lib/format.js';
import { notesSection } from './notes.js';
import { contactsSection } from './contacts.js';
import { interviewsSection } from './interviews.js';

const GET_APP = `query GetApplication($id: ID!) {
  application(id: $id) {
    id company role location status starred followUpAt jobUrl salary description createdAt
    notes { id content createdAt }
    contacts { id name role email phone linkedIn notes }
    interviewRounds { id round type scheduledAt notes outcome }
  }
}`;

const TOGGLE_STAR = `mutation ToggleStar($id: ID!, $starred: Boolean!) {
  updateApplication(id: $id, input: { starred: $starred }) { id starred }
}`;

const UPDATE_STATUS = `mutation UpdateStatus($id: ID!, $status: String!) {
  updateApplication(id: $id, input: { status: $status }) { id status }
}`;

type FullApp = {
  id: string;
  company: string;
  role: string;
  location?: string | null;
  status: string;
  starred: boolean;
  followUpAt?: string | null;
  jobUrl?: string | null;
  salary?: string | null;
  description?: string | null;
  createdAt: string;
  notes: Array<{ id: string; content: string; createdAt: string }>;
  contacts: Array<{ id: string; name: string; role?: string | null; email?: string | null; phone?: string | null; linkedIn?: string | null; notes?: string | null }>;
  interviewRounds: Array<{ id: string; round: number; type: string; scheduledAt?: string | null; notes?: string | null; outcome?: string | null }>;
};

const starFilledIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
const starEmptyIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
const linkIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>`;

function detailPage(app: FullApp, activeTab = 'overview'): string {
  const overdue = app.followUpAt != null && new Date(app.followUpAt) <= new Date();

  const tabs = ['overview', 'notes', 'contacts', 'interviews'];
  const tabBar = tabs
    .map((t) => {
      const active = t === activeTab;
      const cls = active
        ? 'px-3 py-2 text-sm font-medium border-b-2 border-blue-600 text-blue-600'
        : 'px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border-b-2 border-transparent transition-colors';
      return `<a href="/applications/${app.id}?tab=${t}" class="${cls}" hx-get="/applications/${app.id}/tab/${t}" hx-target="#tab-content" hx-push-url="/applications/${app.id}?tab=${t}">${t.charAt(0).toUpperCase() + t.slice(1)}</a>`;
    })
    .join('');

  const tabContent = renderTab(app, activeTab);

  const statusOptions = ALL_STATUSES.map(
    (s) => `<option value="${s}" ${app.status === s ? 'selected' : ''}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`,
  ).join('');

  const content = `
    <div class="p-4 sm:p-8 max-w-4xl mx-auto">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div class="flex items-start gap-3">
          <a href="/applications" class="mt-1 text-gray-400 hover:text-gray-600 transition-colors shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>
          </a>
          <div>
            <h1 class="text-2xl font-bold text-gray-900">${escapeHtml(app.company)}</h1>
            <p class="text-gray-500">${escapeHtml(app.role)}${app.location ? ` · ${escapeHtml(app.location)}` : ''}</p>
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <!-- Star toggle -->
          <div id="star-toggle">
            <button class="${app.starred ? 'text-yellow-400 hover:text-yellow-500' : 'text-gray-300 hover:text-yellow-400'} transition-colors p-2 rounded-lg"
              hx-post="/applications/${app.id}/star"
              hx-target="#star-toggle"
              hx-swap="outerHTML"
              aria-label="Toggle star">
              ${app.starred ? starFilledIcon : starEmptyIcon}
            </button>
          </div>
          <a href="/applications/${app.id}/edit" class="px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Edit</a>
        </div>
      </div>

      <!-- Meta row -->
      <div class="flex flex-wrap items-center gap-3 mb-6">
        <!-- Status select -->
        <select class="px-2 py-1 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          hx-post="/applications/${app.id}/status"
          hx-trigger="change"
          hx-target="this"
          hx-swap="outerHTML"
          name="status">
          ${statusOptions}
        </select>

        ${app.salary ? `<span class="text-sm text-gray-600">${escapeHtml(app.salary)}</span>` : ''}
        ${overdue ? `<span class="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">Follow-up overdue</span>` : app.followUpAt ? `<span class="text-xs text-gray-500">Follow-up: ${formatDate(app.followUpAt)}</span>` : ''}
        ${app.jobUrl ? `<a href="${escapeHtml(app.jobUrl)}" target="_blank" rel="noopener" class="flex items-center gap-1 text-xs text-blue-600 hover:underline">${linkIcon} Job posting</a>` : ''}
        <span class="text-xs text-gray-400">Added ${formatDate(app.createdAt)}</span>
      </div>

      <!-- Tabs -->
      <div class="border-b border-gray-200 mb-6">
        <nav class="flex gap-1 -mb-px overflow-x-auto">${tabBar}</nav>
      </div>

      <div id="tab-content">${tabContent}</div>
    </div>`;

  return layout(content, `${app.company} — ${app.role}`, 'applications');
}

function renderTab(app: FullApp, tab: string): string {
  switch (tab) {
    case 'notes':
      return notesSection(app.notes, app.id);
    case 'contacts':
      return contactsSection(app.contacts, app.id);
    case 'interviews':
      return interviewsSection(app.interviewRounds, app.id);
    default:
      return overviewTab(app);
  }
}

function overviewTab(app: FullApp): string {
  return `
    <div class="space-y-4">
      ${
        app.description
          ? `<div class="bg-white rounded-xl border border-gray-200 p-4">
              <h3 class="text-sm font-semibold text-gray-700 mb-2">Description</h3>
              <p class="text-sm text-gray-600 whitespace-pre-wrap">${escapeHtml(app.description)}</p>
             </div>`
          : ''
      }
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p class="text-2xl font-bold text-gray-900">${app.notes.length}</p>
          <p class="text-xs text-gray-500">Notes</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p class="text-2xl font-bold text-gray-900">${app.contacts.length}</p>
          <p class="text-xs text-gray-500">Contacts</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p class="text-2xl font-bold text-gray-900">${app.interviewRounds.length}</p>
          <p class="text-xs text-gray-500">Interviews</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p class="text-lg font-bold text-gray-900 capitalize">${app.status}</p>
          <p class="text-xs text-gray-500">Status</p>
        </div>
      </div>
    </div>`;
}

export default async function applicationDetailRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/applications/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const tab = (request.query as Record<string, string>)['tab'] ?? 'overview';
    try {
      const data = await authedGql<{ application: FullApp }>(request, reply, GET_APP, { id });
      return reply.type('text/html').send(detailPage(data.application, tab));
    } catch (err) {
      if ((err as Error).message === 'Redirecting') return;
      throw err;
    }
  });

  // HTMX partial tab endpoint
  fastify.get('/applications/:id/tab/:tab', async (request, reply) => {
    const { id, tab } = request.params as { id: string; tab: string };
    try {
      const data = await authedGql<{ application: FullApp }>(request, reply, GET_APP, { id });
      return reply.type('text/html').send(renderTab(data.application, tab));
    } catch (err) {
      if ((err as Error).message === 'Redirecting') return;
      return reply.status(500).send('Error loading tab');
    }
  });

  // Star toggle — returns new star button only
  fastify.post('/applications/:id/star', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const getQ = `query { application(id: "${id}") { starred } }`;
      const current = await authedGql<{ application: { starred: boolean } }>(request, reply, getQ);
      const newStarred = !current.application.starred;
      await authedGql(request, reply, TOGGLE_STAR, { id, starred: newStarred });
      return reply.type('text/html').send(`
        <div id="star-toggle">
          <button class="${newStarred ? 'text-yellow-400 hover:text-yellow-500' : 'text-gray-300 hover:text-yellow-400'} transition-colors p-2 rounded-lg"
            hx-post="/applications/${id}/star"
            hx-target="#star-toggle"
            hx-swap="outerHTML">
            ${newStarred ? starFilledIcon : starEmptyIcon}
          </button>
        </div>`);
    } catch (err) {
      if ((err as Error).message === 'Redirecting') return;
      return reply.status(422).send('Error');
    }
  });

  // Status select — returns new select element
  fastify.post('/applications/:id/status', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { status?: string };
    const status = ALL_STATUSES.includes(body.status as (typeof ALL_STATUSES)[number])
      ? body.status!
      : 'draft';
    try {
      await authedGql(request, reply, UPDATE_STATUS, { id, status });
      const statusOptions = ALL_STATUSES.map(
        (s) => `<option value="${s}" ${status === s ? 'selected' : ''}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`,
      ).join('');
      return reply.type('text/html').send(`
        <select class="px-2 py-1 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          hx-post="/applications/${id}/status" hx-trigger="change" hx-target="this" hx-swap="outerHTML" name="status">
          ${statusOptions}
        </select>`);
    } catch (err) {
      if ((err as Error).message === 'Redirecting') return;
      return reply.status(422).send('Error');
    }
  });
}
