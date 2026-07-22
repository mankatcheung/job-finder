import type { FastifyInstance } from 'fastify';
import { authedGql } from '../../lib/auth.js';
import { Layout } from '../../views/layout.js';
import { ALL_STATUSES } from '../../views/statusBadge.js';
import { StarIcon, ChevronLeftIcon } from '../../views/icons.js';
import { sanitizeUrl, formatDate } from '../../lib/format.js';
import { NotesSection } from './notes.js';
import { ContactsSection } from './contacts.js';
import { InterviewsSection } from './interviews.js';

const GET_APP = `query GetApplication($id: ID!) {
  application(id: $id) {
    id company role location status starred followUpAt jobUrl salary description createdAt
    notes { id content createdAt }
    contacts { id name role email phone linkedIn notes }
    interviewRounds { id round type scheduledAt notes outcome }
  }
}`;

const GET_STARRED = `query GetStarred($id: ID!) {
  application(id: $id) { starred }
}`;

const GENERATE_COVER_LETTER = `mutation GenerateCoverLetter($applicationId: ID!, $resumeText: String) {
  generateCoverLetter(applicationId: $applicationId, resumeText: $resumeText)
}`;

const GET_HEALTH_SCORE = `query HealthScore($applicationId: ID!) {
  applicationHealthScore(applicationId: $applicationId) {
    score label
    criteria { key label points earned met }
  }
}`;

type HealthScoreCriterion = {
  key: string;
  label: string;
  points: number;
  earned: number;
  met: boolean;
};
type HealthScore = { score: number; label: string; criteria: HealthScoreCriterion[] };

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
  contacts: Array<{
    id: string;
    name: string;
    role?: string | null;
    email?: string | null;
    phone?: string | null;
    linkedIn?: string | null;
    notes?: string | null;
  }>;
  interviewRounds: Array<{
    id: string;
    round: number;
    type: string;
    scheduledAt?: string | null;
    notes?: string | null;
    outcome?: string | null;
  }>;
};

function StarToggle({ id, starred }: { id: string; starred: boolean }) {
  return (
    <div id="star-toggle">
      <button
        class={`${starred ? 'text-yellow-400 hover:text-yellow-500' : 'text-gray-300 hover:text-yellow-400'} transition-colors p-2 rounded-lg`}
        hx-post={`/applications/${id}/star`}
        hx-target="#star-toggle"
        hx-swap="outerHTML"
        aria-label="Toggle star"
      >
        <StarIcon size={16} filled={starred} />
      </button>
    </div>
  );
}

function StatusSelect({ id, status }: { id: string; status: string }) {
  return (
    <select
      class="px-2 py-1 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      hx-post={`/applications/${id}/status`}
      hx-trigger="change"
      hx-target="this"
      hx-swap="outerHTML"
      name="status"
    >
      {ALL_STATUSES.map((s) => (
        <option value={s} selected={status === s} safe>
          {s.charAt(0).toUpperCase() + s.slice(1)}
        </option>
      ))}
    </select>
  );
}

function DetailPage({ app, activeTab = 'overview' }: { app: FullApp; activeTab?: string }) {
  const overdue = app.followUpAt != null && new Date(app.followUpAt) <= new Date();
  const jobUrlHref = sanitizeUrl(app.jobUrl);

  const tabs = ['overview', 'notes', 'contacts', 'interviews', 'cover-letter'];

  return (
    <Layout title={`${app.company} — ${app.role}`} activeNav="applications">
      <div class="p-4 sm:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div class="flex items-start gap-3">
            <a href="/applications" class="mt-1 text-gray-400 hover:text-gray-600 transition-colors shrink-0">
              <ChevronLeftIcon />
            </a>
            <div>
              <h1 class="text-2xl font-bold text-gray-900" safe>
                {app.company}
              </h1>
              <p class="text-gray-500" safe>
                {app.role}
                {app.location ? ` · ${app.location}` : ''}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <StarToggle id={app.id} starred={app.starred} />
            <a
              href={`/applications/${app.id}/edit`}
              class="px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Edit
            </a>
          </div>
        </div>

        {/* Meta row */}
        <div class="flex flex-wrap items-center gap-3 mb-6">
          <StatusSelect id={app.id} status={app.status} />

          {app.salary ? <span class="text-sm text-gray-600" safe>{app.salary}</span> : ''}
          {overdue ? (
            <span class="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
              Follow-up overdue
            </span>
          ) : app.followUpAt ? (
            <span class="text-xs text-gray-500" safe>
              Follow-up: {formatDate(app.followUpAt)}
            </span>
          ) : (
            ''
          )}
          {jobUrlHref ? (
            <a
              href={jobUrlHref}
              target="_blank"
              rel="noopener"
              class="flex items-center gap-1 text-xs text-blue-600 hover:underline"
            >
              <LinkIcon /> Job posting
            </a>
          ) : (
            ''
          )}
          <span class="text-xs text-gray-400" safe>
            Added {formatDate(app.createdAt)}
          </span>
        </div>

        {/* Tabs */}
        <div class="border-b border-gray-200 mb-6">
          <nav class="flex gap-1 -mb-px overflow-x-auto">
            {tabs.map((t) => {
              const active = t === activeTab;
              const cls = active
                ? 'px-3 py-2 text-sm font-medium border-b-2 border-blue-600 text-blue-600'
                : 'px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border-b-2 border-transparent transition-colors';
              const label = t === 'cover-letter' ? 'Cover Letter' : t.charAt(0).toUpperCase() + t.slice(1);
              return (
                <a
                  href={`/applications/${app.id}?tab=${t}`}
                  class={cls}
                  hx-get={`/applications/${app.id}/tab/${t}`}
                  hx-target="#tab-content"
                  hx-push-url={`/applications/${app.id}?tab=${t}`}
                  safe
                >
                  {label}
                </a>
              );
            })}
          </nav>
        </div>

        <div id="tab-content">{renderTab(app, activeTab)}</div>
      </div>
    </Layout>
  );
}

function LinkIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="13"
      height="13"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      viewBox="0 0 24 24"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" x2="21" y1="14" y2="3" />
    </svg>
  );
}

function renderTab(app: FullApp, tab: string): JSX.Element {
  switch (tab) {
    case 'notes':
      return <NotesSection notes={app.notes} appId={app.id} />;
    case 'contacts':
      return <ContactsSection contacts={app.contacts} appId={app.id} />;
    case 'interviews':
      return <InterviewsSection interviews={app.interviewRounds} appId={app.id} />;
    case 'cover-letter':
      return <CoverLetterTab appId={app.id} />;
    default:
      return <OverviewTab app={app} />;
  }
}

function CoverLetterTab({ appId }: { appId: string }) {
  const textareaCls =
    'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none';
  return (
    <div class="space-y-4">
      <div class="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <form
          hx-post={`/applications/${appId}/cover-letter`}
          hx-target="#cover-letter-result"
          hx-swap="innerHTML"
          hx-indicator="#cover-letter-spinner"
          class="space-y-3"
        >
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Your resume / background
              <span class="font-normal text-gray-400">(optional — paste for a tailored letter)</span>
            </label>
            <textarea
              name="resumeText"
              rows="6"
              placeholder="Paste your resume or relevant experience here…"
              class={textareaCls}
            ></textarea>
          </div>
          <div class="flex items-center gap-3">
            <button
              type="submit"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors htmx-active:opacity-60"
            >
              ✨ Generate cover letter
            </button>
            <span id="cover-letter-spinner" class="htmx-indicator text-sm text-blue-500 animate-pulse">
              Generating…
            </span>
          </div>
        </form>
      </div>
      <div id="cover-letter-result"></div>
    </div>
  );
}

function healthScoreColor(score: number): { bar: string; badge: string; bg: string } {
  if (score >= 91)
    return {
      bar: 'bg-green-500',
      badge: 'bg-green-100 text-green-800',
      bg: 'bg-green-50 border-green-100',
    };
  if (score >= 71)
    return {
      bar: 'bg-blue-500',
      badge: 'bg-blue-100 text-blue-800',
      bg: 'bg-blue-50 border-blue-100',
    };
  if (score >= 41)
    return {
      bar: 'bg-amber-500',
      badge: 'bg-amber-100 text-amber-800',
      bg: 'bg-amber-50 border-amber-100',
    };
  return { bar: 'bg-red-500', badge: 'bg-red-100 text-red-800', bg: 'bg-red-50 border-red-100' };
}

function HealthCheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="10"
      height="10"
      fill="none"
      stroke="white"
      stroke-width="3"
      viewBox="0 0 24 24"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function HealthScoreFragment({ hs }: { hs: HealthScore }) {
  const c = healthScoreColor(hs.score);
  return (
    <div class={`rounded-xl border ${c.bg} p-4`}>
      <div class="flex items-center gap-4 mb-3">
        <div class="flex-1">
          <div class="flex items-center justify-between mb-1">
            <p class="text-sm font-semibold text-gray-800">Application health</p>
            <span class="text-lg font-bold text-gray-900">
              {hs.score}
              <span class="text-sm font-normal text-gray-400">/100</span>
            </span>
          </div>
          <div class="h-2 rounded-full bg-gray-200 overflow-hidden">
            <div class={`h-2 rounded-full ${c.bar} transition-all`} style={`width:${hs.score}%`}></div>
          </div>
          <p class="text-xs mt-1">
            <span class={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${c.badge}`} safe>
              {hs.label}
            </span>
          </p>
        </div>
      </div>
      <ul class="space-y-1.5">
        {hs.criteria.map((cr) => (
          <li class="flex items-center justify-between gap-2 text-xs">
            <div class="flex items-center gap-2 min-w-0">
              <span
                class={`shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${cr.met ? 'bg-green-500' : 'bg-gray-200'}`}
              >
                {cr.met ? <HealthCheckIcon /> : ''}
              </span>
              <span class={cr.met ? 'text-gray-700' : 'text-gray-400'} safe>
                {cr.label}
              </span>
            </div>
            <span class={`shrink-0 font-medium ${cr.met ? 'text-gray-600' : 'text-gray-300'}`}>
              +{cr.points}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function OverviewTab({ app }: { app: FullApp }) {
  return (
    <div class="space-y-4">
      {/* Health score: lazily fetched via HTMX on tab load */}
      <div hx-get={`/applications/${app.id}/health-score`} hx-trigger="load" hx-swap="outerHTML">
        <div class="rounded-xl border border-gray-100 bg-gray-50 p-4 animate-pulse h-24"></div>
      </div>

      {app.description ? (
        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <h3 class="text-sm font-semibold text-gray-700 mb-2">Description</h3>
          <p class="text-sm text-gray-600 whitespace-pre-wrap" safe>
            {app.description}
          </p>
        </div>
      ) : (
        ''
      )}
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p class="text-2xl font-bold text-gray-900">{app.notes.length}</p>
          <p class="text-xs text-gray-500">Notes</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p class="text-2xl font-bold text-gray-900">{app.contacts.length}</p>
          <p class="text-xs text-gray-500">Contacts</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p class="text-2xl font-bold text-gray-900">{app.interviewRounds.length}</p>
          <p class="text-xs text-gray-500">Interviews</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p class="text-lg font-bold text-gray-900 capitalize" safe>
            {app.status}
          </p>
          <p class="text-xs text-gray-500">Status</p>
        </div>
      </div>
    </div>
  );
}

export default async function applicationDetailRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/applications/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const tab = (request.query as Record<string, string>)['tab'] ?? 'overview';
    try {
      const data = await authedGql<{ application: FullApp }>(request, reply, GET_APP, { id });
      return reply.type('text/html').send(<DetailPage app={data.application} activeTab={tab} />);
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

  // Health score fragment — loaded lazily by the overview tab
  fastify.get('/applications/:id/health-score', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const data = await authedGql<{ applicationHealthScore: HealthScore }>(
        request,
        reply,
        GET_HEALTH_SCORE,
        { applicationId: id },
      );
      return reply.type('text/html').send(<HealthScoreFragment hs={data.applicationHealthScore} />);
    } catch (err) {
      if ((err as Error).message === 'Redirecting') return;
      return reply
        .type('text/html')
        .send(
          <div class="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-400">
            Could not load health score.
          </div>,
        );
    }
  });

  // Star toggle — returns new star button only
  fastify.post('/applications/:id/star', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const current = await authedGql<{ application: { starred: boolean } }>(
        request,
        reply,
        GET_STARRED,
        { id },
      );
      const newStarred = !current.application.starred;
      await authedGql(request, reply, TOGGLE_STAR, { id, starred: newStarred });
      return reply.type('text/html').send(<StarToggle id={id} starred={newStarred} />);
    } catch (err) {
      if ((err as Error).message === 'Redirecting') return;
      return reply.status(422).send('Error');
    }
  });

  // Cover letter generation
  fastify.post('/applications/:id/cover-letter', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { resumeText?: string };
    const resumeText = body.resumeText?.trim() || null;
    try {
      const data = await authedGql<{ generateCoverLetter: string }>(
        request,
        reply,
        GENERATE_COVER_LETTER,
        { applicationId: id, resumeText },
      );
      return reply.type('text/html').send(
        <div class="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-gray-700">Generated cover letter</h3>
            <button
              onclick="navigator.clipboard.writeText(this.closest('div').querySelector('pre').innerText); this.textContent='✓ Copied'; setTimeout(()=>this.textContent='Copy',2000)"
              class="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Copy
            </button>
          </div>
          <pre class="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed" safe>
            {data.generateCoverLetter}
          </pre>
        </div>,
      );
    } catch (err) {
      if ((err as Error).message === 'Redirecting') return;
      return reply.type('text/html').send(
        <p class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2" safe>
          {(err as Error).message || 'Failed to generate cover letter'}
        </p>,
      );
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
      return reply.type('text/html').send(<StatusSelect id={id} status={status} />);
    } catch (err) {
      if ((err as Error).message === 'Redirecting') return;
      return reply.status(422).send('Error');
    }
  });
}
