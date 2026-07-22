import type { FastifyInstance } from 'fastify';
import { authedGql } from '../../lib/auth.js';
import { formatDateTime } from '../../lib/format.js';
import { EditIcon, TrashIcon } from '../../views/icons.js';
import { inputCls } from '../../views/layout.js';

const ADD_NOTE = `mutation AddNote($applicationId: ID!, $content: String!) {
  addNote(applicationId: $applicationId, content: $content) { id content createdAt }
}`;

const UPDATE_NOTE = `mutation UpdateNote($id: ID!, $content: String!) {
  updateNote(id: $id, content: $content) { id content createdAt }
}`;

const DELETE_NOTE = `mutation DeleteNote($id: ID!) {
  deleteNote(id: $id)
}`;

const GET_NOTES = `query GetNotes($id: ID!) {
  application(id: $id) { notes { id content createdAt } }
}`;

type Note = { id: string; content: string; createdAt: string };

export function NoteCard({ note, appId }: { note: Note; appId: string }) {
  return (
    <div id={`note-${note.id}`} class="bg-white rounded-lg border border-gray-200 p-3">
      <p class="text-sm text-gray-800 whitespace-pre-wrap mb-2" safe>
        {note.content}
      </p>
      <div class="flex items-center justify-between">
        <span class="text-xs text-gray-400" safe>
          {formatDateTime(note.createdAt)}
        </span>
        <div class="flex items-center gap-1">
          <button
            class="p-1 text-gray-400 hover:text-gray-700 rounded transition-colors"
            hx-get={`/applications/${appId}/notes/${note.id}/edit`}
            hx-target={`#note-${note.id}`}
            hx-swap="outerHTML"
            aria-label="Edit note"
          >
            <EditIcon />
          </button>
          <button
            class="p-1 text-red-400 hover:text-red-600 rounded transition-colors"
            hx-post={`/applications/${appId}/notes/${note.id}/delete`}
            hx-target={`#note-${note.id}`}
            hx-swap="outerHTML"
            hx-confirm="Delete this note?"
            aria-label="Delete note"
          >
            <TrashIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

export function NotesSection({ notes, appId }: { notes: Note[]; appId: string }) {
  return (
    <div id="notes-section">
      <div class="space-y-3 mb-4" id="notes-list">
        {notes.length === 0 ? (
          <p class="text-sm text-gray-400">No notes yet.</p>
        ) : (
          notes.map((n) => <NoteCard note={n} appId={appId} />)
        )}
      </div>
      <form
        hx-post={`/applications/${appId}/notes`}
        hx-target="#notes-list"
        hx-swap="beforeend"
        attrs={{ 'hx-on::after-request': 'this.reset()' }}
        class="flex gap-2"
      >
        <textarea
          name="content"
          rows="2"
          required
          placeholder="Add a note…"
          class={`${inputCls} resize-none flex-1`}
        ></textarea>
        <button
          type="submit"
          class="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors self-start"
        >
          Add
        </button>
      </form>
    </div>
  );
}

export default async function notesRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/applications/:appId/notes', async (request, reply) => {
    const { appId } = request.params as { appId: string };
    const body = request.body as { content?: string };
    try {
      const data = await authedGql<{ addNote: Note }>(request, reply, ADD_NOTE, {
        applicationId: appId,
        content: body.content ?? '',
      });
      return reply.type('text/html').send(<NoteCard note={data.addNote} appId={appId} />);
    } catch (err) {
      if ((err as Error).message === 'Redirecting') return;
      return reply.status(422).send('Error adding note');
    }
  });

  fastify.get('/applications/:appId/notes/:id/edit', async (request, reply) => {
    const { appId, id } = request.params as { appId: string; id: string };
    const data = await authedGql<{ application: { notes: Note[] } }>(request, reply, GET_NOTES, {
      id: appId,
    }).catch(() => ({ application: { notes: [] } }));
    const note = data.application.notes.find((n) => n.id === id);
    if (!note) return reply.status(404).send('Not found');

    return reply.type('text/html').send(
      <form
        id={`note-${id}`}
        class="bg-white rounded-lg border border-blue-300 p-3"
        hx-post={`/applications/${appId}/notes/${id}/update`}
        hx-target={`#note-${id}`}
        hx-swap="outerHTML"
      >
        <textarea name="content" rows="3" class={`${inputCls} resize-none mb-2`} safe>
          {note.content}
        </textarea>
        <div class="flex gap-2">
          <button type="submit" class="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg">
            Save
          </button>
          <button
            type="button"
            class="px-3 py-1.5 border border-gray-300 text-gray-700 text-xs rounded-lg"
            hx-get={`/applications/${appId}/notes/${id}/cancel`}
            hx-target={`#note-${id}`}
            hx-swap="outerHTML"
          >
            Cancel
          </button>
        </div>
      </form>,
    );
  });

  fastify.get('/applications/:appId/notes/:id/cancel', async (request, reply) => {
    const { appId, id } = request.params as { appId: string; id: string };
    const data = await authedGql<{ application: { notes: Note[] } }>(request, reply, GET_NOTES, {
      id: appId,
    }).catch(() => ({ application: { notes: [] } }));
    const note = data.application.notes.find((n) => n.id === id);
    if (!note) return reply.status(404).send('Not found');
    return reply.type('text/html').send(<NoteCard note={note} appId={appId} />);
  });

  fastify.post('/applications/:appId/notes/:id/update', async (request, reply) => {
    const { appId, id } = request.params as { appId: string; id: string };
    const body = request.body as { content?: string };
    try {
      const data = await authedGql<{ updateNote: Note }>(request, reply, UPDATE_NOTE, {
        id,
        content: body.content ?? '',
      });
      return reply.type('text/html').send(<NoteCard note={data.updateNote} appId={appId} />);
    } catch (err) {
      if ((err as Error).message === 'Redirecting') return;
      return reply.status(422).send('Error updating note');
    }
  });

  fastify.post('/applications/:appId/notes/:id/delete', async (request, reply) => {
    const { id } = request.params as { appId: string; id: string };
    try {
      await authedGql(request, reply, DELETE_NOTE, { id });
      return reply.type('text/html').send('');
    } catch (err) {
      if ((err as Error).message === 'Redirecting') return;
      return reply.status(422).send('Error deleting note');
    }
  });
}
