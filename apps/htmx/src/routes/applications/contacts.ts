import type { FastifyInstance } from 'fastify';
import { authedGql } from '../../lib/auth.js';
import { escapeHtml } from '../../lib/format.js';

const ADD_CONTACT = `mutation AddContact($applicationId: ID!, $input: AddContactInput!) {
  addContact(applicationId: $applicationId, input: $input) { id name role email phone linkedIn notes }
}`;

const UPDATE_CONTACT = `mutation UpdateContact($id: ID!, $input: UpdateContactInput!) {
  updateContact(id: $id, input: $input) { id name role email phone linkedIn notes }
}`;

const DELETE_CONTACT = `mutation DeleteContact($id: ID!) {
  deleteContact(id: $id)
}`;

const GET_CONTACTS = `query GetContacts($id: ID!) {
  application(id: $id) { contacts { id name role email phone linkedIn notes } }
}`;

type Contact = {
  id: string;
  name: string;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  linkedIn?: string | null;
  notes?: string | null;
};

const editIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
const trashIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6m4-6v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;

export function contactCard(c: Contact, appId: string): string {
  return `
    <div id="contact-${c.id}" class="bg-white rounded-lg border border-gray-200 p-3">
      <div class="flex items-start justify-between">
        <div>
          <p class="font-medium text-sm text-gray-900">${escapeHtml(c.name)}</p>
          ${c.role ? `<p class="text-xs text-gray-500">${escapeHtml(c.role)}</p>` : ''}
          <div class="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
            ${c.email ? `<a href="mailto:${escapeHtml(c.email)}" class="text-blue-600 hover:underline">${escapeHtml(c.email)}</a>` : ''}
            ${c.phone ? `<span>${escapeHtml(c.phone)}</span>` : ''}
            ${c.linkedIn ? `<a href="${escapeHtml(c.linkedIn)}" target="_blank" rel="noopener" class="text-blue-600 hover:underline">LinkedIn</a>` : ''}
          </div>
          ${c.notes ? `<p class="mt-1 text-xs text-gray-500 italic">${escapeHtml(c.notes)}</p>` : ''}
        </div>
        <div class="flex gap-1 shrink-0">
          <button class="p-1 text-gray-400 hover:text-gray-700 rounded transition-colors"
            hx-get="/applications/${appId}/contacts/${c.id}/edit"
            hx-target="#contact-${c.id}"
            hx-swap="outerHTML">
            ${editIcon}
          </button>
          <button class="p-1 text-red-400 hover:text-red-600 rounded transition-colors"
            hx-post="/applications/${appId}/contacts/${c.id}/delete"
            hx-target="#contact-${c.id}"
            hx-swap="outerHTML"
            hx-confirm="Delete this contact?">
            ${trashIcon}
          </button>
        </div>
      </div>
    </div>`;
}

const inputCls =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500';
const labelCls = 'block text-xs font-medium text-gray-600 mb-0.5';

function contactForm(appId: string, c?: Contact): string {
  const id = c?.id;
  const formId = id ? `contact-${id}` : 'new-contact-form';
  const action = id
    ? `/applications/${appId}/contacts/${id}/update`
    : `/applications/${appId}/contacts`;
  const target = id ? `#contact-${id}` : '#contacts-list';
  const swap = id ? 'outerHTML' : 'beforeend';
  const reset = id ? '' : `hx-on::after-request="this.reset()"`;

  return `
    <form id="${formId}" class="bg-white rounded-lg border border-blue-300 p-3"
          hx-post="${action}" hx-target="${target}" hx-swap="${swap}" ${reset}>
      <div class="grid grid-cols-2 gap-2 mb-2">
        <div>
          <label class="${labelCls}">Name *</label>
          <input name="name" type="text" required class="${inputCls}" value="${escapeHtml(c?.name ?? '')}" />
        </div>
        <div>
          <label class="${labelCls}">Role</label>
          <input name="role" type="text" class="${inputCls}" value="${escapeHtml(c?.role ?? '')}" />
        </div>
        <div>
          <label class="${labelCls}">Email</label>
          <input name="email" type="email" class="${inputCls}" value="${escapeHtml(c?.email ?? '')}" />
        </div>
        <div>
          <label class="${labelCls}">Phone</label>
          <input name="phone" type="tel" class="${inputCls}" value="${escapeHtml(c?.phone ?? '')}" />
        </div>
      </div>
      <div class="mb-2">
        <label class="${labelCls}">LinkedIn URL</label>
        <input name="linkedIn" type="url" class="${inputCls}" value="${escapeHtml(c?.linkedIn ?? '')}" />
      </div>
      <div class="mb-2">
        <label class="${labelCls}">Notes</label>
        <input name="notes" type="text" class="${inputCls}" value="${escapeHtml(c?.notes ?? '')}" />
      </div>
      <div class="flex gap-2">
        <button type="submit" class="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg">${id ? 'Save' : 'Add contact'}</button>
        ${
          id
            ? `<button type="button" class="px-3 py-1.5 border border-gray-300 text-gray-700 text-xs rounded-lg"
              hx-get="/applications/${appId}/contacts/${id}/cancel"
              hx-target="#contact-${id}" hx-swap="outerHTML">Cancel</button>`
            : ''
        }
      </div>
    </form>`;
}

export function contactsSection(contacts: Contact[], appId: string): string {
  return `
    <div id="contacts-section">
      <div class="space-y-3 mb-4" id="contacts-list">
        ${contacts.length === 0 ? '<p class="text-sm text-gray-400">No contacts yet.</p>' : contacts.map((c) => contactCard(c, appId)).join('')}
      </div>
      ${contactForm(appId)}
    </div>`;
}

function bodyToInput(body: Record<string, string>) {
  return {
    name: body['name'] ?? '',
    role: body['role'] || null,
    email: body['email'] || null,
    phone: body['phone'] || null,
    linkedIn: body['linkedIn'] || null,
    notes: body['notes'] || null,
  };
}

export default async function contactsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/applications/:appId/contacts', async (request, reply) => {
    const { appId } = request.params as { appId: string };
    const body = request.body as Record<string, string>;
    try {
      const data = await authedGql<{ addContact: Contact }>(request, reply, ADD_CONTACT, {
        applicationId: appId,
        input: bodyToInput(body),
      });
      return reply.type('text/html').send(contactCard(data.addContact, appId));
    } catch (err) {
      if ((err as Error).message === 'Redirecting') return;
      return reply.status(422).send('Error adding contact');
    }
  });

  fastify.get('/applications/:appId/contacts/:id/edit', async (request, reply) => {
    const { appId, id } = request.params as { appId: string; id: string };
    const data = await authedGql<{ application: { contacts: Contact[] } }>(
      request,
      reply,
      GET_CONTACTS,
      { id: appId },
    ).catch(() => ({ application: { contacts: [] } }));
    const contact = data.application.contacts.find((c) => c.id === id);
    if (!contact) return reply.status(404).send('Not found');
    return reply.type('text/html').send(contactForm(appId, contact));
  });

  fastify.get('/applications/:appId/contacts/:id/cancel', async (request, reply) => {
    const { appId, id } = request.params as { appId: string; id: string };
    const data = await authedGql<{ application: { contacts: Contact[] } }>(
      request,
      reply,
      GET_CONTACTS,
      { id: appId },
    ).catch(() => ({ application: { contacts: [] } }));
    const contact = data.application.contacts.find((c) => c.id === id);
    if (!contact) return reply.status(404).send('Not found');
    return reply.type('text/html').send(contactCard(contact, appId));
  });

  fastify.post('/applications/:appId/contacts/:id/update', async (request, reply) => {
    const { appId, id } = request.params as { appId: string; id: string };
    const body = request.body as Record<string, string>;
    try {
      const data = await authedGql<{ updateContact: Contact }>(request, reply, UPDATE_CONTACT, {
        id,
        input: bodyToInput(body),
      });
      return reply.type('text/html').send(contactCard(data.updateContact, appId));
    } catch (err) {
      if ((err as Error).message === 'Redirecting') return;
      return reply.status(422).send('Error updating contact');
    }
  });

  fastify.post('/applications/:appId/contacts/:id/delete', async (request, reply) => {
    const { id } = request.params as { appId: string; id: string };
    try {
      await authedGql(request, reply, DELETE_CONTACT, { id });
      return reply.type('text/html').send('');
    } catch (err) {
      if ((err as Error).message === 'Redirecting') return;
      return reply.status(422).send('Error deleting contact');
    }
  });
}
