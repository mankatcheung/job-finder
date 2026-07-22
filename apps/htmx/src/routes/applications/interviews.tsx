import type { FastifyInstance } from 'fastify';
import { authedGql } from '../../lib/auth.js';
import { formatDateTime } from '../../lib/format.js';
import { EditIcon, TrashIcon } from '../../views/icons.js';
import { inputCls, labelCls } from '../../views/layout.js';

const ADD_INTERVIEW = `mutation AddInterviewRound($applicationId: ID!, $input: AddInterviewRoundInput!) {
  addInterviewRound(applicationId: $applicationId, input: $input) { id round type scheduledAt notes outcome }
}`;

const UPDATE_INTERVIEW = `mutation UpdateInterviewRound($id: ID!, $input: UpdateInterviewRoundInput!) {
  updateInterviewRound(id: $id, input: $input) { id round type scheduledAt notes outcome }
}`;

const DELETE_INTERVIEW = `mutation DeleteInterviewRound($id: ID!) {
  deleteInterviewRound(id: $id)
}`;

const GET_INTERVIEWS = `query GetInterviews($id: ID!) {
  application(id: $id) { interviewRounds { id round type scheduledAt notes outcome } }
}`;

type Interview = {
  id: string;
  round: number;
  type: string;
  scheduledAt?: string | null;
  notes?: string | null;
  outcome?: string | null;
};

const INTERVIEW_TYPES = ['phone', 'video', 'onsite', 'technical', 'behavioral', 'other'];
const OUTCOMES = ['pending', 'passed', 'failed', 'withdrawn'];

function OutcomeBadge({ outcome }: { outcome?: string | null }) {
  if (!outcome || outcome === 'pending') return '';
  const colors: Record<string, string> = {
    passed: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
    withdrawn: 'bg-gray-100 text-gray-500',
  };
  return (
    <span
      class={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${colors[outcome] ?? 'bg-gray-100 text-gray-500'}`}
      safe
    >
      {outcome}
    </span>
  );
}

export function InterviewCard({ iv, appId }: { iv: Interview; appId: string }) {
  return (
    <div id={`interview-${iv.id}`} class="bg-white rounded-lg border border-gray-200 p-3">
      <div class="flex items-start justify-between">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="font-medium text-sm text-gray-900" safe>
              Round {iv.round} — {iv.type.charAt(0).toUpperCase() + iv.type.slice(1)}
            </span>
            <OutcomeBadge outcome={iv.outcome} />
          </div>
          {iv.scheduledAt ? (
            <p class="text-xs text-gray-500" safe>
              {formatDateTime(iv.scheduledAt)}
            </p>
          ) : (
            ''
          )}
          {iv.notes ? (
            <p class="mt-1 text-xs text-gray-600 whitespace-pre-wrap" safe>
              {iv.notes}
            </p>
          ) : (
            ''
          )}
        </div>
        <div class="flex gap-1 shrink-0">
          <button
            class="p-1 text-gray-400 hover:text-gray-700 rounded transition-colors"
            hx-get={`/applications/${appId}/interviews/${iv.id}/edit`}
            hx-target={`#interview-${iv.id}`}
            hx-swap="outerHTML"
          >
            <EditIcon />
          </button>
          <button
            class="p-1 text-red-400 hover:text-red-600 rounded transition-colors"
            hx-post={`/applications/${appId}/interviews/${iv.id}/delete`}
            hx-target={`#interview-${iv.id}`}
            hx-swap="outerHTML"
            hx-confirm="Delete this interview round?"
          >
            <TrashIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

function InterviewForm({
  appId,
  iv,
  nextRound = 1,
}: {
  appId: string;
  iv?: Interview;
  nextRound?: number;
}) {
  const id = iv?.id;
  const formId = id ? `interview-${id}` : 'new-interview-form';
  const action = id
    ? `/applications/${appId}/interviews/${id}/update`
    : `/applications/${appId}/interviews`;
  const target = id ? `#interview-${id}` : '#interviews-list';
  const swap = id ? 'outerHTML' : 'beforeend';

  const localScheduled = iv?.scheduledAt ? new Date(iv.scheduledAt).toISOString().slice(0, 16) : '';

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
          <label class={labelCls}>Round #</label>
          <input
            name="round"
            type="number"
            min="1"
            required
            class={inputCls}
            value={String(iv?.round ?? nextRound)}
          />
        </div>
        <div>
          <label class={labelCls}>Type</label>
          <select name="type" class={inputCls}>
            {INTERVIEW_TYPES.map((t) => (
              <option value={t} selected={(iv?.type ?? '') === t} safe>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-2 mb-2">
        <div>
          <label class={labelCls}>Scheduled at</label>
          <input name="scheduledAt" type="datetime-local" class={inputCls} value={localScheduled} />
        </div>
        <div>
          <label class={labelCls}>Outcome</label>
          <select name="outcome" class={inputCls}>
            {OUTCOMES.map((o) => (
              <option value={o} selected={(iv?.outcome ?? 'pending') === o} safe>
                {o.charAt(0).toUpperCase() + o.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div class="mb-2">
        <label class={labelCls}>Notes</label>
        <textarea name="notes" rows="2" class={`${inputCls} resize-none`} safe>
          {iv?.notes ?? ''}
        </textarea>
      </div>
      <div class="flex gap-2">
        <button type="submit" class="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg">
          {id ? 'Save' : 'Add round'}
        </button>
        {id ? (
          <button
            type="button"
            class="px-3 py-1.5 border border-gray-300 text-gray-700 text-xs rounded-lg"
            hx-get={`/applications/${appId}/interviews/${id}/cancel`}
            hx-target={`#interview-${id}`}
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

export function InterviewsSection({
  interviews,
  appId,
}: {
  interviews: Interview[];
  appId: string;
}) {
  const nextRound = interviews.length > 0 ? Math.max(...interviews.map((i) => i.round)) + 1 : 1;
  return (
    <div id="interviews-section">
      <div class="space-y-3 mb-4" id="interviews-list">
        {interviews.length === 0 ? (
          <p class="text-sm text-gray-400">No interview rounds yet.</p>
        ) : (
          interviews.map((iv) => <InterviewCard iv={iv} appId={appId} />)
        )}
      </div>
      <InterviewForm appId={appId} nextRound={nextRound} />
    </div>
  );
}

function bodyToInput(body: Record<string, string>) {
  return {
    round: parseInt(body['round'] ?? '1', 10),
    type: body['type'] ?? 'phone',
    scheduledAt: body['scheduledAt'] ? new Date(body['scheduledAt']).toISOString() : null,
    outcome: body['outcome'] || 'pending',
    notes: body['notes'] || null,
  };
}

export default async function interviewsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/applications/:appId/interviews', async (request, reply) => {
    const { appId } = request.params as { appId: string };
    const body = request.body as Record<string, string>;
    try {
      const data = await authedGql<{ addInterviewRound: Interview }>(
        request,
        reply,
        ADD_INTERVIEW,
        { applicationId: appId, input: bodyToInput(body) },
      );
      return reply
        .type('text/html')
        .send(<InterviewCard iv={data.addInterviewRound} appId={appId} />);
    } catch (err) {
      if ((err as Error).message === 'Redirecting') return;
      return reply.status(422).send('Error adding interview');
    }
  });

  fastify.get('/applications/:appId/interviews/:id/edit', async (request, reply) => {
    const { appId, id } = request.params as { appId: string; id: string };
    const data = await authedGql<{ application: { interviewRounds: Interview[] } }>(
      request,
      reply,
      GET_INTERVIEWS,
      { id: appId },
    ).catch(() => ({ application: { interviewRounds: [] } }));
    const iv = data.application.interviewRounds.find((i) => i.id === id);
    if (!iv) return reply.status(404).send('Not found');
    return reply.type('text/html').send(<InterviewForm appId={appId} iv={iv} />);
  });

  fastify.get('/applications/:appId/interviews/:id/cancel', async (request, reply) => {
    const { appId, id } = request.params as { appId: string; id: string };
    const data = await authedGql<{ application: { interviewRounds: Interview[] } }>(
      request,
      reply,
      GET_INTERVIEWS,
      { id: appId },
    ).catch(() => ({ application: { interviewRounds: [] } }));
    const iv = data.application.interviewRounds.find((i) => i.id === id);
    if (!iv) return reply.status(404).send('Not found');
    return reply.type('text/html').send(<InterviewCard iv={iv} appId={appId} />);
  });

  fastify.post('/applications/:appId/interviews/:id/update', async (request, reply) => {
    const { appId, id } = request.params as { appId: string; id: string };
    const body = request.body as Record<string, string>;
    try {
      const data = await authedGql<{ updateInterviewRound: Interview }>(
        request,
        reply,
        UPDATE_INTERVIEW,
        { id, input: bodyToInput(body) },
      );
      return reply
        .type('text/html')
        .send(<InterviewCard iv={data.updateInterviewRound} appId={appId} />);
    } catch (err) {
      if ((err as Error).message === 'Redirecting') return;
      return reply.status(422).send('Error updating interview');
    }
  });

  fastify.post('/applications/:appId/interviews/:id/delete', async (request, reply) => {
    const { id } = request.params as { appId: string; id: string };
    try {
      await authedGql(request, reply, DELETE_INTERVIEW, { id });
      return reply.type('text/html').send('');
    } catch (err) {
      if ((err as Error).message === 'Redirecting') return;
      return reply.status(422).send('Error deleting interview');
    }
  });
}
