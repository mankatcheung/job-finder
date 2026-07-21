import type { FastifyInstance } from 'fastify';
import { authedGql } from '../../lib/auth.js';
import { layout } from '../../views/layout.js';
import { ALL_STATUSES } from '../../views/statusBadge.js';
import { escapeHtml } from '../../lib/format.js';

const GET_QUERY = `query GetApplication($id: ID!) {
  application(id: $id) {
    id company role location status starred followUpAt jobUrl salary description notes { id }
  }
}`;

const CREATE_MUTATION = `mutation CreateApplication($input: CreateApplicationInput!) {
  createApplication(input: $input) { id }
}`;

const UPDATE_MUTATION = `mutation UpdateApplication($id: ID!, $input: UpdateApplicationInput!) {
  updateApplication(id: $id, input: $input) { id }
}`;

const DELETE_MUTATION = `mutation DeleteApplication($id: ID!) {
  deleteApplication(id: $id)
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
  description?: string | null;
};

const inputCls =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500';
const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

function formPage(app: App | null, error?: string): string {
  const isEdit = app !== null;
  const title = isEdit ? `Edit ${app.company}` : 'New application';
  const action = isEdit ? `/applications/${app.id}/edit` : '/applications/new';

  const val = (field: string, fallback = '') => {
    if (!app) return escapeHtml(fallback);
    return escapeHtml(((app as Record<string, unknown>)[field] as string) ?? fallback);
  };

  const statusOptions = ALL_STATUSES.map((s) => {
    const selected = (app?.status ?? 'draft') === s ? 'selected' : '';
    return `<option value="${s}" ${selected}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`;
  }).join('');

  const content = `
    <div class="p-4 sm:p-8 max-w-2xl mx-auto">
      <div class="flex items-center gap-3 mb-6">
        <a href="${isEdit ? `/applications/${app.id}` : '/applications'}" class="text-gray-400 hover:text-gray-600 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>
        </a>
        <h1 class="text-2xl font-bold text-gray-900">${title}</h1>
      </div>

      ${error ? `<div class="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">${error}</div>` : ''}

      <form action="${action}" method="POST" class="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="${labelCls}" for="company">Company *</label>
            <input id="company" name="company" type="text" required class="${inputCls}" value="${val('company')}" />
          </div>
          <div>
            <label class="${labelCls}" for="role">Role *</label>
            <input id="role" name="role" type="text" required class="${inputCls}" value="${val('role')}" />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="${labelCls}" for="status">Status</label>
            <select id="status" name="status" class="${inputCls}">${statusOptions}</select>
          </div>
          <div>
            <label class="${labelCls}" for="location">Location</label>
            <input id="location" name="location" type="text" class="${inputCls}" value="${val('location')}" />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="${labelCls}" for="salary">Salary</label>
            <input id="salary" name="salary" type="text" class="${inputCls}" value="${val('salary')}" placeholder="e.g. £60,000" />
          </div>
          <div>
            <label class="${labelCls}" for="followUpAt">Follow-up date</label>
            <input id="followUpAt" name="followUpAt" type="date" class="${inputCls}" value="${app?.followUpAt ? app.followUpAt.split('T')[0] : ''}" />
          </div>
        </div>

        <div>
          <label class="${labelCls}" for="jobUrl">Job URL</label>
          <input id="jobUrl" name="jobUrl" type="url" class="${inputCls}" value="${val('jobUrl')}" placeholder="https://…" />
        </div>

        <div>
          <label class="${labelCls}" for="description">Description</label>
          <textarea id="description" name="description" rows="4" class="${inputCls}">${val('description')}</textarea>
        </div>

        <div class="flex items-center gap-2">
          <input id="starred" name="starred" type="checkbox" value="1" ${app?.starred ? 'checked' : ''} class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          <label for="starred" class="text-sm text-gray-700">Starred</label>
        </div>

        <div class="flex items-center gap-3 pt-2">
          <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
            ${isEdit ? 'Save changes' : 'Create application'}
          </button>
          <a href="${isEdit ? `/applications/${app.id}` : '/applications'}" class="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">Cancel</a>
          ${
            isEdit
              ? `<form action="/applications/${app.id}/delete" method="POST" class="ml-auto" onsubmit="return confirm('Delete this application? This cannot be undone.')">
                  <button type="submit" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors">Delete</button>
                 </form>`
              : ''
          }
        </div>
      </form>
    </div>`;

  return layout(content, title, 'applications');
}

export default async function applicationFormRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/applications/new', async (_request, reply) => {
    return reply.type('text/html').send(formPage(null));
  });

  fastify.post('/applications/new', async (request, reply) => {
    const body = request.body as Record<string, string>;
    try {
      const input = {
        company: body['company'] ?? '',
        role: body['role'] ?? '',
        location: body['location'] || null,
        status: body['status'] ?? 'draft',
        salary: body['salary'] || null,
        followUpAt: body['followUpAt'] ? new Date(body['followUpAt']).toISOString() : null,
        jobUrl: body['jobUrl'] || null,
        description: body['description'] || null,
        starred: body['starred'] === '1',
      };
      const data = await authedGql<{ createApplication: { id: string } }>(
        request,
        reply,
        CREATE_MUTATION,
        { input },
      );
      return reply.redirect(`/applications/${data.createApplication.id}`);
    } catch (err) {
      if ((err as Error).message === 'Redirecting') return;
      return reply
        .type('text/html')
        .send(formPage(null, (err as Error).message || 'Failed to create application'));
    }
  });

  fastify.get('/applications/:id/edit', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const data = await authedGql<{ application: App }>(request, reply, GET_QUERY, { id });
      return reply.type('text/html').send(formPage(data.application));
    } catch (err) {
      if ((err as Error).message === 'Redirecting') return;
      throw err;
    }
  });

  fastify.post('/applications/:id/edit', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as Record<string, string>;
    try {
      const input = {
        company: body['company'] ?? '',
        role: body['role'] ?? '',
        location: body['location'] || null,
        status: body['status'] ?? 'draft',
        salary: body['salary'] || null,
        followUpAt: body['followUpAt'] ? new Date(body['followUpAt']).toISOString() : null,
        jobUrl: body['jobUrl'] || null,
        description: body['description'] || null,
        starred: body['starred'] === '1',
      };
      await authedGql(request, reply, UPDATE_MUTATION, { id, input });
      return reply.redirect(`/applications/${id}`);
    } catch (err) {
      if ((err as Error).message === 'Redirecting') return;
      const data = await authedGql<{ application: App }>(request, reply, GET_QUERY, { id }).catch(
        () => ({ application: null }),
      );
      return reply
        .type('text/html')
        .send(formPage(data.application, (err as Error).message || 'Failed to save'));
    }
  });

  fastify.post('/applications/:id/delete', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      await authedGql(request, reply, DELETE_MUTATION, { id });
    } catch (err) {
      if ((err as Error).message === 'Redirecting') return;
    }
    return reply.redirect('/applications');
  });
}
