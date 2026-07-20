import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authedGql } from '../lib/auth.js';
import { layout, inputCls, labelCls, btnPrimary, btnDanger } from '../views/layout.js';
import { escapeHtml, formatDate } from '../lib/format.js';

const ME_QUERY = `query { me { id email } }`;

const API_TOKENS_QUERY = `query { apiTokens { id name scope lastUsedAt createdAt } }`;

const UPDATE_EMAIL = `mutation UpdateEmail($email: String!) { updateEmail(email: $email) { id email } }`;

const UPDATE_PASSWORD = `mutation UpdatePassword($currentPassword: String!, $newPassword: String!) {
  updatePassword(currentPassword: $currentPassword, newPassword: $newPassword)
}`;

const CREATE_TOKEN = `mutation CreateApiToken($name: String!, $scope: String) {
  createApiToken(name: $name, scope: $scope) { id name scope token createdAt }
}`;

const DELETE_TOKEN = `mutation DeleteApiToken($id: ID!) { deleteApiToken(id: $id) }`;

const DELETE_ACCOUNT = `mutation { deleteAccount }`;

type Token = {
  id: string;
  name: string;
  scope: string;
  lastUsedAt?: string | null;
  createdAt: string;
};

function tokenRow(t: Token, newToken?: string): string {
  return `
    <div id="token-${t.id}" class="flex items-start justify-between py-3 border-b border-gray-100 last:border-0">
      <div>
        <p class="text-sm font-medium text-gray-900">${escapeHtml(t.name)}</p>
        <p class="text-xs text-gray-400">${t.scope} · Created ${formatDate(t.createdAt)}${t.lastUsedAt ? ` · Last used ${formatDate(t.lastUsedAt)}` : ''}</p>
        ${newToken ? `<div class="mt-1 flex items-center gap-2"><code class="text-xs bg-gray-100 px-2 py-1 rounded font-mono select-all">${newToken}</code><span class="text-xs text-orange-600 font-medium">Copy now — won't be shown again</span></div>` : ''}
      </div>
      <button class="shrink-0 ml-2 px-2 py-1 text-xs text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors"
        hx-post="/account/tokens/${t.id}/delete"
        hx-target="#token-${t.id}"
        hx-swap="outerHTML"
        hx-confirm="Delete this API token? It will stop working immediately.">
        Delete
      </button>
    </div>`;
}

function accountPage(email: string, tokens: Token[], flash?: { type: string; msg: string }): string {
  const alertCls =
    flash?.type === 'error'
      ? 'mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700'
      : 'mb-4 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700';

  const content = `
    <div class="p-4 sm:p-8 max-w-2xl mx-auto space-y-6">
      <h1 class="text-2xl font-bold text-gray-900">Account</h1>

      ${flash ? `<div class="${alertCls}">${escapeHtml(flash.msg)}</div>` : ''}

      <!-- Email -->
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <h2 class="text-base font-semibold text-gray-900 mb-4">Email address</h2>
        <form action="/account/email" method="POST" class="space-y-3">
          <div>
            <label class="${labelCls}" for="email">Email</label>
            <input id="email" name="email" type="email" required class="${inputCls}" value="${escapeHtml(email)}" />
          </div>
          <button type="submit" class="${btnPrimary}">Update email</button>
        </form>
      </div>

      <!-- Password -->
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <h2 class="text-base font-semibold text-gray-900 mb-4">Change password</h2>
        <form action="/account/password" method="POST" class="space-y-3">
          <div>
            <label class="${labelCls}" for="currentPassword">Current password</label>
            <input id="currentPassword" name="currentPassword" type="password" required class="${inputCls}" />
          </div>
          <div>
            <label class="${labelCls}" for="newPassword">New password</label>
            <input id="newPassword" name="newPassword" type="password" required class="${inputCls}" />
          </div>
          <button type="submit" class="${btnPrimary}">Update password</button>
        </form>
      </div>

      <!-- API tokens -->
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <h2 class="text-base font-semibold text-gray-900 mb-1">API tokens</h2>
        <p class="text-xs text-gray-500 mb-4">Read-scoped tokens can be used with the MCP server for AI agent access.</p>

        <div id="tokens-list">
          ${tokens.length === 0 ? '<p class="text-sm text-gray-400">No tokens yet.</p>' : tokens.map((t) => tokenRow(t)).join('')}
        </div>

        <form class="mt-4 flex flex-wrap items-end gap-2"
              hx-post="/account/tokens"
              hx-target="#tokens-list"
              hx-swap="beforeend"
              hx-on::after-request="this.reset()">
          <div class="flex-1 min-w-32">
            <label class="${labelCls}" for="tokenName">Name</label>
            <input id="tokenName" name="name" type="text" required class="${inputCls}" placeholder="My CLI" />
          </div>
          <div>
            <label class="${labelCls}" for="tokenScope">Scope</label>
            <select id="tokenScope" name="scope" class="${inputCls} w-auto">
              <option value="full">Full</option>
              <option value="read">Read-only (MCP)</option>
            </select>
          </div>
          <button type="submit" class="${btnPrimary}">Create token</button>
        </form>
      </div>

      <!-- Danger zone -->
      <div class="bg-white rounded-xl border border-red-200 p-5">
        <h2 class="text-base font-semibold text-red-700 mb-2">Danger zone</h2>
        <p class="text-sm text-gray-500 mb-3">Deleting your account is permanent and cannot be undone.</p>
        <form action="/account/delete" method="POST" onsubmit="return confirm('Delete your account? All data will be lost.')">
          <button type="submit" class="${btnDanger}">Delete account</button>
        </form>
      </div>
    </div>`;

  return layout(content, 'Account', 'account');
}

async function loadPage(
  request: FastifyRequest,
  reply: FastifyReply,
  flash?: { type: string; msg: string },
) {
  const [meData, tokensData] = await Promise.all([
    authedGql<{ me: { id: string; email: string } }>(request, reply, ME_QUERY),
    authedGql<{ apiTokens: Token[] }>(request, reply, API_TOKENS_QUERY),
  ]);
  return accountPage(meData.me.email, tokensData.apiTokens, flash);
}

export default async function accountRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/account', async (request, reply) => {
    try {
      const html = await loadPage(request, reply);
      return reply.type('text/html').send(html);
    } catch (err) {
      if ((err as Error).message === 'Redirecting') return;
      throw err;
    }
  });

  fastify.post('/account/email', async (request, reply) => {
    const body = request.body as { email?: string };
    try {
      await authedGql(request, reply, UPDATE_EMAIL, { email: body.email ?? '' });
      const html = await loadPage(request, reply, { type: 'success', msg: 'Email updated.' });
      return reply.type('text/html').send(html);
    } catch (err) {
      if ((err as Error).message === 'Redirecting') return;
      const html = await loadPage(request, reply, {
        type: 'error',
        msg: (err as Error).message || 'Failed to update email.',
      }).catch(() => '');
      return reply.type('text/html').send(html);
    }
  });

  fastify.post('/account/password', async (request, reply) => {
    const body = request.body as { currentPassword?: string; newPassword?: string };
    try {
      await authedGql(request, reply, UPDATE_PASSWORD, {
        currentPassword: body.currentPassword ?? '',
        newPassword: body.newPassword ?? '',
      });
      const html = await loadPage(request, reply, { type: 'success', msg: 'Password updated.' });
      return reply.type('text/html').send(html);
    } catch (err) {
      if ((err as Error).message === 'Redirecting') return;
      const html = await loadPage(request, reply, {
        type: 'error',
        msg: (err as Error).message || 'Failed to update password.',
      }).catch(() => '');
      return reply.type('text/html').send(html);
    }
  });

  // HTMX: create token → returns new row
  fastify.post('/account/tokens', async (request, reply) => {
    const body = request.body as { name?: string; scope?: string };
    try {
      const data = await authedGql<{
        createApiToken: Token & { token: string };
      }>(request, reply, CREATE_TOKEN, { name: body.name ?? '', scope: body.scope ?? 'full' });
      const { token: rawToken, ...rest } = data.createApiToken;
      return reply.type('text/html').send(tokenRow(rest, rawToken));
    } catch (err) {
      if ((err as Error).message === 'Redirecting') return;
      return reply.status(422).send('Error creating token');
    }
  });

  // HTMX: delete token → returns empty string (removes element)
  fastify.post('/account/tokens/:id/delete', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      await authedGql(request, reply, DELETE_TOKEN, { id });
      return reply.type('text/html').send('');
    } catch (err) {
      if ((err as Error).message === 'Redirecting') return;
      return reply.status(422).send('Error deleting token');
    }
  });

  fastify.post('/account/delete', async (request, reply) => {
    try {
      await authedGql(request, reply, DELETE_ACCOUNT);
    } catch {
      // ignore
    }
    void reply.header(
      'set-cookie',
      'jf_access_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly',
    );
    void reply.header(
      'set-cookie',
      'jf_refresh_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly',
    );
    return reply.redirect('/login');
  });
}
