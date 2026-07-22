import type { FastifyInstance } from 'fastify';
import { authedGql } from '../../lib/auth.js';
import { sanitizeUrl } from '../../lib/format.js';
import { EditIcon, TrashIcon } from '../../views/icons.js';
import { inputCls, labelCls } from '../../views/layout.js';

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

export function ContactCard({ c, appId }: { c: Contact; appId: string }) {
  const linkedInHref = sanitizeUrl(c.linkedIn);
  return (
    <div id={`contact-${c.id}`} class="bg-white rounded-lg border border-gray-200 p-3">
      <div class="flex items-start justify-between">
        <div>
          <p class="font-medium text-sm text-gray-900" safe>
            {c.name}
          </p>
          {c.role ? (
            <p class="text-xs text-gray-500" safe>
              {c.role}
            </p>
          ) : (
            ''
          )}
          <div class="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
            {c.email ? (
              <a href={`mailto:${c.email}`} class="text-blue-600 hover:underline" safe>
                {c.email}
              </a>
            ) : (
              ''
            )}
            {c.phone ? <span safe>{c.phone}</span> : ''}
            {linkedInHref ? (
              <a
                href={linkedInHref}
                target="_blank"
                rel="noopener"
                class="text-blue-600 hover:underline"
              >
                LinkedIn
              </a>
            ) : (
              ''
            )}
          </div>
          {c.notes ? (
            <p class="mt-1 text-xs text-gray-500 italic" safe>
              {c.notes}
            </p>
          ) : (
            ''
          )}
        </div>
        <div class="flex gap-1 shrink-0">
          <button
            class="p-1 text-gray-400 hover:text-gray-700 rounded transition-colors"
            hx-get={`/applications/${appId}/contacts/${c.id}/edit`}
            hx-target={`#contact-${c.id}`}
            hx-swap="outerHTML"
          >
            <EditIcon />
          </button>
          <button
            class="p-1 text-red-400 hover:text-red-600 rounded transition-colors"
            hx-post={`/applications/${appId}/contacts/${c.id}/delete`}
            hx-target={`#contact-${c.id}`}
            hx-swap="outerHTML"
            hx-confirm="Delete this contact?"
          >
            <TrashIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

function ContactForm({ appId, c }: { appId: string; c?: Contact }) {
  const id = c?.id;
  const formId = id ? `contact-${id}` : 'new-contact-form';
  const action = id
    ? `/applications/${appId}/contacts/${id}/update`
    : `/applications/${appId}/contacts`;
  const target = id ? `#contact-${id}` : '#contacts-list';
  const swap = id ? 'outerHTML' : 'beforeend';

  return (
    <form
      id={formId}
      class="bg-white rounded-lg border border-blue-300 p-3"
      hx-post={action}
      hx-target={target}
      hx-swap={swap}
      attrs={id ? undefined : { 'hx-on::after-request': 'this.reset()' }}
    >
      <div class="grid grid-cols-2 gap-2 mb-2">
        <div>
          <label class={labelCls}>Name *</label>
          <input name="name" type="text" required class={inputCls} value={c?.name ?? ''} />
        </div>
        <div>
          <label class={labelCls}>Role</label>
          <input name="role" type="text" class={inputCls} value={c?.role ?? ''} />
        </div>
        <div>
          <label class={labelCls}>Email</label>
          <input name="email" type="email" class={inputCls} value={c?.email ?? ''} />
        </div>
        <div>
          <label class={labelCls}>Phone</label>
          <input name="phone" type="tel" class={inputCls} value={c?.phone ?? ''} />
        </div>
      </div>
      <div class="mb-2">
        <label class={labelCls}>LinkedIn URL</label>
        <input name="linkedIn" type="url" class={inputCls} value={c?.linkedIn ?? ''} />
      </div>
      <div class="mb-2">
        <label class={labelCls}>Notes</label>
        <input name="notes" type="text" class={inputCls} value={c?.notes ?? ''} />
      </div>
      <div class="flex gap-2">
        <button type="submit" class="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg">
          {id ? 'Save' : 'Add contact'}
        </button>
        {id ? (
          <button
            type="button"
            class="px-3 py-1.5 border border-gray-300 text-gray-700 text-xs rounded-lg"
            hx-get={`/applications/${appId}/contacts/${id}/cancel`}
            hx-target={`#contact-${id}`}
            hx-swap="outerHTML"
          >
            Cancel
          </button>
        ) : (
          ''
        )}
      </div>
    </form>
  );
}

export function ContactsSection({ contacts, appId }: { contacts: Contact[]; appId: string }) {
  return (
    <div id="contacts-section">
      <div class="space-y-3 mb-4" id="contacts-list">
        {contacts.length === 0 ? (
          <p class="text-sm text-gray-400">No contacts yet.</p>
        ) : (
          contacts.map((c) => <ContactCard c={c} appId={appId} />)
        )}
      </div>
      <ContactForm appId={appId} />
    </div>
  );
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
      return reply.type('text/html').send(<ContactCard c={data.addContact} appId={appId} />);
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
    return reply.type('text/html').send(<ContactForm appId={appId} c={contact} />);
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
    return reply.type('text/html').send(<ContactCard c={contact} appId={appId} />);
  });

  fastify.post('/applications/:appId/contacts/:id/update', async (request, reply) => {
    const { appId, id } = request.params as { appId: string; id: string };
    const body = request.body as Record<string, string>;
    try {
      const data = await authedGql<{ updateContact: Contact }>(request, reply, UPDATE_CONTACT, {
        id,
        input: bodyToInput(body),
      });
      return reply.type('text/html').send(<ContactCard c={data.updateContact} appId={appId} />);
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
