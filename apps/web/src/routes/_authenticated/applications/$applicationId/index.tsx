import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { put as putBlob } from '@vercel/blob/client';
import { gqlClient } from '#/graphql/client';
import { getGqlErrorCode, AI_NOT_CONFIGURED_CODE } from '#/lib/graphqlError';
import { getErrorMessage } from '#/lib/errors';
import { ErrorState } from '#/components/ErrorState';
import { StatusBadge } from '../../dashboard';
import {
  CalendarIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EditIcon,
  ExternalLinkIcon,
  PlusIcon,
  StarIcon,
  Trash2Icon,
} from 'lucide-react';
import { applicationQueryOptions } from './-application-query';
import { DocumentPreviewModal, isPreviewableMimeType } from './-components/DocumentPreviewModal';

const UPDATE_STARRED = `
  mutation UpdateApplication($id: ID!, $input: UpdateApplicationInput!) {
    updateApplication(id: $id, input: $input) { id starred }
  }
`;
const NOTES_QUERY = `
  query Notes($applicationId: ID!) {
    notes(applicationId: $applicationId) { id applicationId content createdAt updatedAt }
  }
`;
const CREATE_NOTE = `
  mutation CreateNote($applicationId: ID!, $content: String!) {
    createNote(applicationId: $applicationId, content: $content) { id applicationId content createdAt updatedAt }
  }
`;
const UPDATE_NOTE = `
  mutation UpdateNote($id: ID!, $content: String!) {
    updateNote(id: $id, content: $content) { id applicationId content createdAt updatedAt }
  }
`;
const DELETE_NOTE = `mutation DeleteNote($id: ID!) { deleteNote(id: $id) }`;
const DELETE_APPLICATION = `mutation DeleteApplication($id: ID!) { deleteApplication(id: $id) }`;
const HEALTH_SCORE_QUERY = `
  query ApplicationHealthScore($applicationId: ID!) {
    applicationHealthScore(applicationId: $applicationId) {
      score label
      criteria { key label points earned met }
    }
  }
`;

type HealthScoreCriterion = {
  key: string;
  label: string;
  points: number;
  earned: number;
  met: boolean;
};
type HealthScore = { score: number; label: string; criteria: HealthScoreCriterion[] };

type Note = {
  id: string;
  applicationId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export const Route = createFileRoute('/_authenticated/applications/$applicationId/')({
  loader: ({ context: { queryClient }, params: { applicationId } }) =>
    queryClient.ensureQueryData(applicationQueryOptions(applicationId)),
  component: ApplicationDetailPage,
});

export function ApplicationDetailPage() {
  const { applicationId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [noteContent, setNoteContent] = useState('');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [activeTab, setActiveTab] = useState<
    'notes' | 'interviews' | 'contacts' | 'activity' | 'documents' | 'cover letter' | 'resume match'
  >('notes');

  const {
    data: appData,
    isError: isAppError,
    error: appError,
    refetch: refetchApp,
  } = useQuery(applicationQueryOptions(applicationId));
  const {
    data: notesData,
    isError: isNotesError,
    error: notesError,
  } = useQuery({
    queryKey: ['notes', applicationId],
    queryFn: () => gqlClient.request<{ notes: Note[] }>(NOTES_QUERY, { applicationId }),
  });
  const { data: healthScoreData } = useQuery({
    queryKey: ['healthScore', applicationId],
    queryFn: () =>
      gqlClient.request<{ applicationHealthScore: HealthScore }>(HEALTH_SCORE_QUERY, {
        applicationId,
      }),
  });

  const createNote = useMutation({
    mutationFn: (content: string) => gqlClient.request(CREATE_NOTE, { applicationId, content }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notes', applicationId] });
      setNoteContent('');
    },
  });
  const updateNote = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      gqlClient.request(UPDATE_NOTE, { id, content }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notes', applicationId] });
      setEditingNote(null);
    },
  });
  const deleteNote = useMutation({
    mutationFn: (id: string) => gqlClient.request(DELETE_NOTE, { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes', applicationId] }),
  });
  const toggleStar = useMutation({
    mutationFn: (starred: boolean) =>
      gqlClient.request(UPDATE_STARRED, { id: applicationId, input: { starred } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['application', applicationId] });
      qc.invalidateQueries({ queryKey: ['applications'] });
    },
  });
  const deleteApp = useMutation({
    mutationFn: () => gqlClient.request(DELETE_APPLICATION, { id: applicationId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applications'] });
      navigate({ to: '/applications' });
    },
  });

  const app = appData?.application;
  const notes = notesData?.notes ?? [];
  const healthScore = healthScoreData?.applicationHealthScore;

  if (isAppError) {
    return (
      <div className="p-4 sm:p-8 max-w-3xl mx-auto">
        <ErrorState error={appError} onRetry={() => refetchApp()} />
      </div>
    );
  }

  if (!app)
    return (
      <div className="p-4 sm:p-8">
        <div className="h-8 w-64 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
      </div>
    );

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto">
      <div className="mb-4">
        <a
          href="/applications"
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ← Applications
        </a>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-6">
        <div className="flex items-start justify-between gap-x-3 gap-y-2 flex-wrap">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{app.company}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-0.5">{app.role}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <StatusBadge status={app.status} />
            <button
              onClick={() => toggleStar.mutate(!app.starred)}
              className={`p-2 rounded-lg transition-colors ${
                app.starred
                  ? 'text-yellow-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                  : 'text-gray-400 hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
              }`}
              title={app.starred ? 'Unstar' : 'Star'}
            >
              <StarIcon size={16} className={app.starred ? 'fill-yellow-400' : ''} />
            </button>
            <Link
              to="/applications/$applicationId/edit"
              params={{ applicationId }}
              className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <EditIcon size={16} />
            </Link>
            <button
              onClick={() => {
                if (confirm('Delete this application?')) deleteApp.mutate();
              }}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
              title="Delete application"
            >
              <Trash2Icon size={16} />
            </button>
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          {app.location && <InfoItem label="Location" value={app.location} />}
          {app.salaryRange && <InfoItem label="Salary" value={app.salaryRange} />}
          {app.appliedAt && (
            <InfoItem label="Applied" value={new Date(app.appliedAt).toLocaleDateString()} />
          )}
          {app.source && <InfoItem label="Source" value={app.source} />}
          {app.followUpAt && (
            <div>
              <InfoItem
                label="Follow up"
                value={new Date(app.followUpAt).toLocaleDateString()}
                highlight={new Date(app.followUpAt) <= new Date()}
              />
              <p className="text-xs text-gray-400 mt-0.5">
                Email reminder will be sent 24 h before this date.
              </p>
            </div>
          )}
          {app.tags.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {app.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          {app.jobUrl && (
            <div className="col-span-1 sm:col-span-2 md:col-span-3">
              <dt className="text-xs text-gray-400">Job URL</dt>
              <a
                href={app.jobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-xs break-all"
              >
                {app.jobUrl}
              </a>
            </div>
          )}
          {app.description && (
            <div className="col-span-1 sm:col-span-2 md:col-span-3">
              <dt className="text-xs text-gray-400 mb-1">Description</dt>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {app.description}
              </p>
            </div>
          )}
        </dl>

        {healthScore && <HealthScorePanel healthScore={healthScore} />}
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
        {(
          [
            'notes',
            'interviews',
            'contacts',
            'activity',
            'documents',
            'cover letter',
            'resume match',
          ] as const
        ).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-shrink-0 px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'notes' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24"
              placeholder="Add a note…"
            />
            <div className="mt-2 flex justify-end">
              <button
                onClick={() => {
                  if (noteContent.trim()) createNote.mutate(noteContent.trim());
                }}
                disabled={!noteContent.trim() || createNote.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-medium rounded-lg"
              >
                <PlusIcon size={14} /> Add note
              </button>
            </div>
          </div>

          {isNotesError && (
            <p className="text-sm text-red-600 dark:text-red-400 py-2">
              {getErrorMessage(notesError)}
            </p>
          )}

          {notes.map((note) => (
            <div
              key={note.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
            >
              {editingNote?.id === note.id ? (
                <>
                  <textarea
                    value={editingNote.content}
                    onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24"
                  />
                  <div className="mt-2 flex gap-2 justify-end">
                    <button
                      onClick={() =>
                        updateNote.mutate({ id: note.id, content: editingNote.content })
                      }
                      className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingNote(null)}
                      className="text-xs px-3 py-1.5 text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex justify-between gap-3">
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap flex-1">
                    {note.content}
                  </p>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => setEditingNote(note)}
                      className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      <EditIcon size={14} />
                    </button>
                    <button
                      onClick={() => deleteNote.mutate(note.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                      <Trash2Icon size={14} />
                    </button>
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-400 mt-2">
                {new Date(note.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'interviews' && (
        <InterviewsTab applicationId={applicationId} company={app.company} role={app.role} />
      )}

      {activeTab === 'contacts' && <ContactsTab applicationId={applicationId} />}

      {activeTab === 'activity' && <ActivityTab applicationId={applicationId} />}

      {activeTab === 'documents' && <DocumentsTab applicationId={applicationId} />}

      {activeTab === 'cover letter' && <CoverLetterTab applicationId={applicationId} />}

      {activeTab === 'resume match' && <ResumeMatchTab applicationId={applicationId} />}
    </div>
  );
}

const SCORE_COLORS = {
  green: {
    ring: 'text-green-500',
    bg: 'bg-green-50 dark:bg-green-900/20',
    badge: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    bar: 'bg-green-500',
  },
  blue: {
    ring: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    bar: 'bg-blue-500',
  },
  amber: {
    ring: 'text-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    bar: 'bg-amber-500',
  },
  red: {
    ring: 'text-red-500',
    bg: 'bg-red-50 dark:bg-red-900/20',
    badge: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    bar: 'bg-red-500',
  },
} as const;

function scoreColor(score: number): keyof typeof SCORE_COLORS {
  if (score >= 91) return 'green';
  if (score >= 71) return 'blue';
  if (score >= 41) return 'amber';
  return 'red';
}

function HealthScorePanel({ healthScore }: { healthScore: HealthScore }) {
  const [open, setOpen] = useState(false);
  const color = SCORE_COLORS[scoreColor(healthScore.score)];
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (healthScore.score / 100) * circumference;

  return (
    <div className={`mt-4 rounded-xl border border-gray-100 dark:border-gray-700 ${color.bg} p-3`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <svg width="52" height="52" viewBox="0 0 52 52" className="shrink-0">
            <circle
              cx="26"
              cy="26"
              r={radius}
              fill="none"
              strokeWidth="5"
              className="text-gray-200 dark:text-gray-700"
              stroke="currentColor"
            />
            <circle
              cx="26"
              cy="26"
              r={radius}
              fill="none"
              strokeWidth="5"
              stroke="currentColor"
              className={color.ring}
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform="rotate(-90 26 26)"
            />
            <text
              x="26"
              y="30"
              textAnchor="middle"
              fontSize="13"
              fontWeight="bold"
              fill="currentColor"
              className={color.ring}
            >
              {healthScore.score}
            </text>
          </svg>
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              Application health
            </p>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color.badge}`}
            >
              {healthScore.label}
            </span>
          </div>
        </div>
        {open ? (
          <ChevronUpIcon size={16} className="text-gray-400 shrink-0" />
        ) : (
          <ChevronDownIcon size={16} className="text-gray-400 shrink-0" />
        )}
      </button>

      {open && (
        <ul className="mt-3 space-y-1.5">
          {healthScore.criteria.map((c) => (
            <li key={c.key} className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${c.met ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                >
                  {c.met && <CheckIcon size={10} className="text-white" />}
                </span>
                <span className={c.met ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}>
                  {c.label}
                </span>
              </div>
              <span
                className={`shrink-0 font-medium ${c.met ? 'text-gray-600 dark:text-gray-300' : 'text-gray-300 dark:text-gray-600'}`}
              >
                +{c.points}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function InfoItem({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs text-gray-400">{label}</dt>
      <dd
        className={highlight ? 'text-orange-500 font-medium' : 'text-gray-700 dark:text-gray-300'}
      >
        {value}
      </dd>
    </div>
  );
}

const ACTIVITY_LOGS_QUERY = `
  query ActivityLogs($applicationId: ID!) {
    activityLogs(applicationId: $applicationId) {
      id eventType payload createdAt
    }
  }
`;

type ActivityLog = {
  id: string;
  eventType: string;
  payload: string;
  createdAt: string;
};

const EVENT_LABELS: Record<string, string> = {
  status_changed: 'Status changed',
  note_added: 'Note added',
  note_deleted: 'Note deleted',
  document_uploaded: 'Document uploaded',
  document_deleted: 'Document deleted',
  interview_added: 'Interview round added',
  field_updated: 'Fields updated',
};

const EVENT_ICONS: Record<string, string> = {
  status_changed: '🔄',
  note_added: '📝',
  note_deleted: '🗑️',
  document_uploaded: '📎',
  document_deleted: '🗑️',
  interview_added: '🎙️',
  field_updated: '✏️',
};

function formatActivityPayload(eventType: string, payloadStr: string): string {
  try {
    const p = JSON.parse(payloadStr);
    if (eventType === 'status_changed') return `${p.from} → ${p.to}`;
    if (eventType === 'field_updated' && Array.isArray(p.fields)) return p.fields.join(', ');
  } catch {
    // ignore parse errors
  }
  return '';
}

function ActivityTab({ applicationId }: { applicationId: string }) {
  const { data } = useQuery({
    queryKey: ['activityLogs', applicationId],
    queryFn: () =>
      gqlClient.request<{ activityLogs: ActivityLog[] }>(ACTIVITY_LOGS_QUERY, { applicationId }),
  });

  const logs = data?.activityLogs ?? [];

  return (
    <div className="space-y-3">
      {logs.length === 0 && (
        <p className="text-sm text-gray-400 py-4 text-center">No activity yet.</p>
      )}
      {logs.map((log) => {
        const detail = formatActivityPayload(log.eventType, log.payload);
        return (
          <div
            key={log.id}
            className="flex items-start gap-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3"
          >
            <span className="text-lg leading-none mt-0.5">{EVENT_ICONS[log.eventType] ?? '•'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {EVENT_LABELS[log.eventType] ?? log.eventType}
                {detail && <span className="font-normal text-gray-500 ml-1">— {detail}</span>}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date(log.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const INTERVIEW_ROUNDS_QUERY = `
  query InterviewRounds($applicationId: ID!) {
    interviewRounds(applicationId: $applicationId) {
      id applicationId type scheduledAt completedAt interviewerName notes outcome createdAt updatedAt
    }
  }
`;
const CREATE_ROUND = `
  mutation CreateInterviewRound($input: CreateInterviewRoundInput!) {
    createInterviewRound(input: $input) {
      id applicationId type scheduledAt completedAt interviewerName notes outcome createdAt updatedAt
    }
  }
`;
const UPDATE_ROUND = `
  mutation UpdateInterviewRound($id: ID!, $input: UpdateInterviewRoundInput!) {
    updateInterviewRound(id: $id, input: $input) {
      id applicationId type scheduledAt completedAt interviewerName notes outcome createdAt updatedAt
    }
  }
`;
const DELETE_ROUND = `mutation DeleteInterviewRound($id: ID!) { deleteInterviewRound(id: $id) }`;

type InterviewRound = {
  id: string;
  applicationId: string;
  type: string;
  scheduledAt?: string | null;
  completedAt?: string | null;
  interviewerName?: string | null;
  notes?: string | null;
  outcome: string;
  createdAt: string;
  updatedAt: string;
};

type RoundFormState = {
  type: string;
  scheduledAt: string;
  interviewerName: string;
  notes: string;
  outcome: string;
};

const ROUND_TYPES = ['phone', 'technical', 'onsite', 'hr', 'other'] as const;
const ROUND_OUTCOMES = ['pending', 'passed', 'failed', 'cancelled'] as const;

const OUTCOME_STYLES: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  passed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  cancelled: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
};

function emptyForm(): RoundFormState {
  return { type: 'phone', scheduledAt: '', interviewerName: '', notes: '', outcome: 'pending' };
}

function generateIcs(rounds: InterviewRound[], company: string, role: string): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const toIcsDate = (iso: string) => {
    const d = new Date(iso);
    return (
      `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
      `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`
    );
  };
  const endDate = (iso: string) => {
    const d = new Date(new Date(iso).getTime() + 60 * 60 * 1000);
    return (
      `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
      `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`
    );
  };
  const esc = (s: string) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');

  const events = rounds
    .filter((r) => r.scheduledAt)
    .map((r) =>
      [
        'BEGIN:VEVENT',
        `UID:${r.id}@job-finder`,
        `DTSTART:${toIcsDate(r.scheduledAt!)}`,
        `DTEND:${endDate(r.scheduledAt!)}`,
        `SUMMARY:${esc(`${r.type.charAt(0).toUpperCase() + r.type.slice(1)} interview — ${role} at ${company}`)}`,
        `DESCRIPTION:${esc([r.interviewerName && `Interviewer: ${r.interviewerName}`, r.notes].filter(Boolean).join('\n'))}`,
        'END:VEVENT',
      ].join('\r\n'),
    );

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Job Finder//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');
}

function downloadIcs(content: string, company: string, role: string) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `interview-${company.replace(/\s+/g, '-').toLowerCase()}-${role.replace(/\s+/g, '-').toLowerCase()}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

function InterviewsTab({
  applicationId,
  company,
  role,
}: {
  applicationId: string;
  company: string;
  role: string;
}) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingRound, setEditingRound] = useState<InterviewRound | null>(null);
  const [form, setForm] = useState<RoundFormState>(emptyForm());

  const { data } = useQuery({
    queryKey: ['interviewRounds', applicationId],
    queryFn: () =>
      gqlClient.request<{ interviewRounds: InterviewRound[] }>(INTERVIEW_ROUNDS_QUERY, {
        applicationId,
      }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['interviewRounds', applicationId] });

  const createRound = useMutation({
    mutationFn: (f: RoundFormState) =>
      gqlClient.request(CREATE_ROUND, {
        input: {
          applicationId,
          type: f.type,
          ...(f.scheduledAt ? { scheduledAt: f.scheduledAt } : {}),
          ...(f.interviewerName ? { interviewerName: f.interviewerName } : {}),
          ...(f.notes ? { notes: f.notes } : {}),
          outcome: f.outcome,
        },
      }),
    onSuccess: () => {
      invalidate();
      setShowForm(false);
      setForm(emptyForm());
    },
  });

  const updateRound = useMutation({
    mutationFn: ({ id, f }: { id: string; f: RoundFormState }) =>
      gqlClient.request(UPDATE_ROUND, {
        id,
        input: {
          type: f.type,
          scheduledAt: f.scheduledAt || null,
          interviewerName: f.interviewerName || null,
          notes: f.notes || null,
          outcome: f.outcome,
        },
      }),
    onSuccess: () => {
      invalidate();
      setEditingRound(null);
    },
  });

  const deleteRound = useMutation({
    mutationFn: (id: string) => gqlClient.request(DELETE_ROUND, { id }),
    onSuccess: invalidate,
  });

  const rounds = data?.interviewRounds ?? [];

  const openEdit = (r: InterviewRound) => {
    setEditingRound(r);
    setForm({
      type: r.type,
      scheduledAt: r.scheduledAt ? r.scheduledAt.slice(0, 16) : '',
      interviewerName: r.interviewerName ?? '',
      notes: r.notes ?? '',
      outcome: r.outcome,
    });
  };

  const inputCls =
    'w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500';

  const RoundForm = ({
    onSubmit,
    onCancel,
    submitting,
  }: {
    onSubmit: () => void;
    onCancel: () => void;
    submitting: boolean;
  }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className={inputCls}
          >
            {ROUND_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Outcome</label>
          <select
            value={form.outcome}
            onChange={(e) => setForm({ ...form, outcome: e.target.value })}
            className={inputCls}
          >
            {ROUND_OUTCOMES.map((o) => (
              <option key={o} value={o}>
                {o.charAt(0).toUpperCase() + o.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Scheduled at</label>
        <input
          type="datetime-local"
          value={form.scheduledAt}
          onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
          className={inputCls}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Interviewer</label>
        <input
          value={form.interviewerName}
          onChange={(e) => setForm({ ...form, interviewerName: e.target.value })}
          className={inputCls}
          placeholder="Name or team"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className={`${inputCls} h-20 resize-none`}
          placeholder="How did it go?"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-medium rounded-lg"
        >
          {submitting ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-200"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {!showForm && !editingRound && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setShowForm(true);
              setForm(emptyForm());
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg"
          >
            <PlusIcon size={14} /> Add interview round
          </button>
          {rounds.some((r) => r.scheduledAt) && (
            <button
              onClick={() => downloadIcs(generateIcs(rounds, company, role), company, role)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-medium rounded-lg"
            >
              <CalendarIcon size={14} /> Export to Calendar
            </button>
          )}
        </div>
      )}

      {showForm && (
        <RoundForm
          onSubmit={() => createRound.mutate(form)}
          onCancel={() => setShowForm(false)}
          submitting={createRound.isPending}
        />
      )}

      {rounds.length === 0 && !showForm && (
        <p className="text-sm text-gray-400 py-4 text-center">No interview rounds yet.</p>
      )}

      {rounds.map((round) => (
        <div
          key={round.id}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
        >
          {editingRound?.id === round.id ? (
            <RoundForm
              onSubmit={() => updateRound.mutate({ id: round.id, f: form })}
              onCancel={() => setEditingRound(null)}
              submitting={updateRound.isPending}
            />
          ) : (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                      {round.type}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${OUTCOME_STYLES[round.outcome] ?? OUTCOME_STYLES.pending}`}
                    >
                      {round.outcome}
                    </span>
                  </div>
                  {round.interviewerName && (
                    <p className="text-xs text-gray-500">with {round.interviewerName}</p>
                  )}
                  {round.scheduledAt && (
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <CheckIcon size={11} />
                      {new Date(round.scheduledAt).toLocaleString()}
                    </p>
                  )}
                  {round.notes && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap mt-2">
                      {round.notes}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(round)}
                    className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <EditIcon size={14} />
                  </button>
                  <button
                    onClick={() => deleteRound.mutate(round.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  >
                    <Trash2Icon size={14} />
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {new Date(round.createdAt).toLocaleString()}
              </p>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

const CONTACTS_QUERY = `
  query Contacts($applicationId: ID!) {
    contacts(applicationId: $applicationId) { id applicationId name role email phone linkedinUrl notes createdAt updatedAt }
  }
`;
const CREATE_CONTACT = `
  mutation CreateContact($applicationId: ID!, $name: String!, $role: String, $email: String, $phone: String, $linkedinUrl: String, $notes: String) {
    createContact(applicationId: $applicationId, name: $name, role: $role, email: $email, phone: $phone, linkedinUrl: $linkedinUrl, notes: $notes) {
      id applicationId name role email phone linkedinUrl notes createdAt updatedAt
    }
  }
`;
const UPDATE_CONTACT = `
  mutation UpdateContact($id: ID!, $name: String, $role: String, $email: String, $phone: String, $linkedinUrl: String, $notes: String) {
    updateContact(id: $id, name: $name, role: $role, email: $email, phone: $phone, linkedinUrl: $linkedinUrl, notes: $notes) {
      id applicationId name role email phone linkedinUrl notes createdAt updatedAt
    }
  }
`;
const DELETE_CONTACT = `mutation DeleteContact($id: ID!) { deleteContact(id: $id) }`;

type Contact = {
  id: string;
  applicationId: string;
  name: string;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  linkedinUrl?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

type ContactFormState = {
  name: string;
  role: string;
  email: string;
  phone: string;
  linkedinUrl: string;
  notes: string;
};

function emptyContactForm(): ContactFormState {
  return { name: '', role: '', email: '', phone: '', linkedinUrl: '', notes: '' };
}

function contactToForm(c: Contact): ContactFormState {
  return {
    name: c.name,
    role: c.role ?? '',
    email: c.email ?? '',
    phone: c.phone ?? '',
    linkedinUrl: c.linkedinUrl ?? '',
    notes: c.notes ?? '',
  };
}

function ContactsTab({ applicationId }: { applicationId: string }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [form, setForm] = useState<ContactFormState>(emptyContactForm());

  const { data } = useQuery({
    queryKey: ['contacts', applicationId],
    queryFn: () => gqlClient.request<{ contacts: Contact[] }>(CONTACTS_QUERY, { applicationId }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['contacts', applicationId] });

  const createContact = useMutation({
    mutationFn: (f: ContactFormState) =>
      gqlClient.request(CREATE_CONTACT, {
        applicationId,
        name: f.name,
        ...(f.role ? { role: f.role } : {}),
        ...(f.email ? { email: f.email } : {}),
        ...(f.phone ? { phone: f.phone } : {}),
        ...(f.linkedinUrl ? { linkedinUrl: f.linkedinUrl } : {}),
        ...(f.notes ? { notes: f.notes } : {}),
      }),
    onSuccess: () => {
      invalidate();
      setShowForm(false);
      setForm(emptyContactForm());
    },
  });

  const updateContact = useMutation({
    mutationFn: ({ id, f }: { id: string; f: ContactFormState }) =>
      gqlClient.request(UPDATE_CONTACT, {
        id,
        name: f.name || undefined,
        role: f.role || null,
        email: f.email || null,
        phone: f.phone || null,
        linkedinUrl: f.linkedinUrl || null,
        notes: f.notes || null,
      }),
    onSuccess: () => {
      invalidate();
      setEditingContact(null);
    },
  });

  const deleteContact = useMutation({
    mutationFn: (id: string) => gqlClient.request(DELETE_CONTACT, { id }),
    onSuccess: invalidate,
  });

  const contacts = data?.contacts ?? [];

  const inputCls =
    'w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500';

  const ContactForm = ({
    onSubmit,
    onCancel,
    submitting,
  }: {
    onSubmit: () => void;
    onCancel: () => void;
    submitting: boolean;
  }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Name *</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={inputCls}
            placeholder="Jane Smith"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Role</label>
          <input
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className={inputCls}
            placeholder="Technical Recruiter"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={inputCls}
            placeholder="jane@company.com"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className={inputCls}
            placeholder="+1 555 000 0000"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">LinkedIn URL</label>
        <input
          value={form.linkedinUrl}
          onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })}
          className={inputCls}
          placeholder="https://linkedin.com/in/..."
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className={`${inputCls} h-20 resize-none`}
          placeholder="How did you meet? Any details…"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <button
          onClick={onSubmit}
          disabled={!form.name.trim() || submitting}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-medium rounded-lg"
        >
          {submitting ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-200"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {!showForm && !editingContact && (
        <button
          onClick={() => {
            setShowForm(true);
            setForm(emptyContactForm());
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg"
        >
          <PlusIcon size={14} /> Add contact
        </button>
      )}

      {showForm && (
        <ContactForm
          onSubmit={() => {
            if (form.name.trim()) createContact.mutate(form);
          }}
          onCancel={() => setShowForm(false)}
          submitting={createContact.isPending}
        />
      )}

      {contacts.length === 0 && !showForm && (
        <p className="text-sm text-gray-400 py-4 text-center">No contacts yet.</p>
      )}

      {contacts.map((contact) => (
        <div
          key={contact.id}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
        >
          {editingContact?.id === contact.id ? (
            <ContactForm
              onSubmit={() => updateContact.mutate({ id: contact.id, f: form })}
              onCancel={() => setEditingContact(null)}
              submitting={updateContact.isPending}
            />
          ) : (
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {contact.name}
                  </span>
                  {contact.role && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      {contact.role}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
                  {contact.email && (
                    <a
                      href={`mailto:${contact.email}`}
                      className="hover:text-blue-600 hover:underline"
                    >
                      {contact.email}
                    </a>
                  )}
                  {contact.phone && <span>{contact.phone}</span>}
                  {contact.linkedinUrl && (
                    <a
                      href={contact.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-600 hover:underline"
                    >
                      LinkedIn
                    </a>
                  )}
                </div>
                {contact.notes && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap mt-1">
                    {contact.notes}
                  </p>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => {
                    setEditingContact(contact);
                    setForm(contactToForm(contact));
                  }}
                  className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <EditIcon size={14} />
                </button>
                <button
                  onClick={() => deleteContact.mutate(contact.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                >
                  <Trash2Icon size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const DOCUMENTS_QUERY = `
  query Documents($applicationId: ID!) {
    documents(applicationId: $applicationId) { id applicationId name mimeType sizeBytes url documentType version createdAt }
  }
`;
const REQUEST_UPLOAD_URL = `
  mutation RequestUploadUrl($input: RequestUploadUrlInput!) {
    requestUploadUrl(input: $input) { uploadUrl storageKey }
  }
`;
const CONFIRM_DOCUMENT = `
  mutation ConfirmDocument($input: ConfirmDocumentInput!) {
    confirmDocument(input: $input) { id applicationId name mimeType sizeBytes url documentType version createdAt }
  }
`;
const DELETE_DOCUMENT = `mutation DeleteDocument($id: ID!) { deleteDocument(id: $id) }`;

type Document = {
  id: string;
  applicationId: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  documentType: string;
  version?: string | null;
  createdAt: string;
};

type PendingUpload = {
  storageKey: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
};

const DOC_TYPE_LABELS: Record<string, string> = {
  resume: 'Resume',
  cover_letter: 'Cover Letter',
  portfolio: 'Portfolio',
  other: 'Other',
};

const DOC_TYPE_BADGE: Record<string, string> = {
  resume: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  cover_letter: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  portfolio: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

function DocumentsTab({ applicationId }: { applicationId: string }) {
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(null);
  const [docType, setDocType] = useState('other');
  const [docVersion, setDocVersion] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);

  const { data } = useQuery({
    queryKey: ['documents', applicationId],
    queryFn: () => gqlClient.request<{ documents: Document[] }>(DOCUMENTS_QUERY, { applicationId }),
  });
  const deleteDoc = useMutation({
    mutationFn: (id: string) => gqlClient.request(DELETE_DOCUMENT, { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents', applicationId] }),
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const { requestUploadUrl } = await gqlClient.request<{
        requestUploadUrl: { uploadUrl: string; storageKey: string };
      }>(REQUEST_UPLOAD_URL, {
        input: { applicationId, filename: file.name, mimeType: file.type },
      });

      // `uploadUrl` is a Vercel Blob client token (not a fetchable URL) —
      // put() uploads directly to Blob storage, bypassing our API.
      await putBlob(requestUploadUrl.storageKey, file, {
        access: 'public',
        token: requestUploadUrl.uploadUrl,
        contentType: file.type,
      });

      setPendingUpload({
        storageKey: requestUploadUrl.storageKey,
        name: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
      });
      setDocType('other');
      setDocVersion('');
    } catch {
      setUploadError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleConfirm = async () => {
    if (!pendingUpload) return;
    setConfirming(true);
    try {
      await gqlClient.request(CONFIRM_DOCUMENT, {
        input: {
          applicationId,
          storageKey: pendingUpload.storageKey,
          name: pendingUpload.name,
          mimeType: pendingUpload.mimeType,
          sizeBytes: pendingUpload.sizeBytes,
          documentType: docType,
          ...(docVersion.trim() ? { version: docVersion.trim() } : {}),
        },
      });
      qc.invalidateQueries({ queryKey: ['documents', applicationId] });
      setPendingUpload(null);
    } catch {
      setUploadError('Failed to save document. Please try again.');
    } finally {
      setConfirming(false);
    }
  };

  const inputCls =
    'w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500';

  const docs = data?.documents ?? [];

  return (
    <div className="space-y-4">
      {!pendingUpload && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-6 text-center">
          <label className="cursor-pointer">
            <input
              type="file"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {uploading ? (
                <span>Uploading…</span>
              ) : (
                <>
                  <span className="text-blue-600 font-medium hover:underline">Click to upload</span>{' '}
                  a document
                </>
              )}
            </div>
          </label>
          {uploadError && <p className="mt-2 text-xs text-red-600">{uploadError}</p>}
        </div>
      )}

      {pendingUpload && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-700 p-4 space-y-3">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Uploaded:{' '}
            <span className="font-normal text-gray-600 dark:text-gray-400">
              {pendingUpload.name}
            </span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Document type</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className={inputCls}
              >
                <option value="other">Other</option>
                <option value="resume">Resume</option>
                <option value="cover_letter">Cover Letter</option>
                <option value="portfolio">Portfolio</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Version <span className="font-normal">(optional)</span>
              </label>
              <input
                value={docVersion}
                onChange={(e) => setDocVersion(e.target.value)}
                className={inputCls}
                placeholder="e.g. v2"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleConfirm}
              disabled={confirming}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-medium rounded-lg"
            >
              {confirming ? 'Saving…' : 'Confirm upload'}
            </button>
            <button
              onClick={() => setPendingUpload(null)}
              className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-200"
            >
              Cancel
            </button>
          </div>
          {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
        </div>
      )}

      {docs.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {isPreviewableMimeType(doc.mimeType) ? (
                <button
                  type="button"
                  onClick={() => setPreviewDoc(doc)}
                  className="text-sm font-medium text-blue-600 hover:underline truncate text-left"
                >
                  {doc.name}
                </button>
              ) : (
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-600 hover:underline truncate"
                >
                  {doc.name}
                </a>
              )}
              {doc.documentType !== 'other' && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${DOC_TYPE_BADGE[doc.documentType] ?? ''}`}
                >
                  {DOC_TYPE_LABELS[doc.documentType] ?? doc.documentType}
                </span>
              )}
              {doc.version && <span className="text-xs text-gray-400">{doc.version}</span>}
            </div>
            <p className="text-xs text-gray-400">
              {doc.mimeType} · {(doc.sizeBytes / 1024).toFixed(1)} KB
            </p>
          </div>
          <div className="ml-4 flex items-center gap-1 shrink-0">
            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
              title="Open in new tab"
            >
              <ExternalLinkIcon size={14} />
            </a>
            <button
              onClick={() => deleteDoc.mutate(doc.id)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
            >
              <Trash2Icon size={14} />
            </button>
          </div>
        </div>
      ))}
      <DocumentPreviewModal document={previewDoc} onClose={() => setPreviewDoc(null)} />
    </div>
  );
}

const GENERATE_COVER_LETTER = `
  mutation GenerateCoverLetter($applicationId: ID!, $resumeText: String) {
    generateCoverLetter(applicationId: $applicationId, resumeText: $resumeText)
  }
`;

function CoverLetterTab({ applicationId }: { applicationId: string }) {
  const [resumeText, setResumeText] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [copied, setCopied] = useState(false);

  const generate = useMutation({
    mutationFn: () =>
      gqlClient.request<{ generateCoverLetter: string }>(GENERATE_COVER_LETTER, {
        applicationId,
        resumeText: resumeText.trim() || null,
      }),
    onSuccess: (data) => {
      setCoverLetter(data.generateCoverLetter);
      setCopied(false);
    },
  });

  const handleCopy = () => {
    void navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inputCls =
    'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none';

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Your resume / background{' '}
            <span className="font-normal text-gray-400">
              (optional — paste for a tailored letter)
            </span>
          </label>
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            rows={6}
            placeholder="Paste your resume or relevant experience here…"
            className={inputCls}
          />
        </div>
        <button
          onClick={() => generate.mutate()}
          disabled={generate.isPending}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          {generate.isPending ? (
            <>
              <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
              Generating…
            </>
          ) : (
            <>✨ {coverLetter ? 'Regenerate' : 'Generate cover letter'}</>
          )}
        </button>
        {generate.isError && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {getGqlErrorCode(generate.error) === AI_NOT_CONFIGURED_CODE ? (
              <>
                Add your AI API key in{' '}
                <Link to="/settings/profile" className="underline">
                  Account settings
                </Link>{' '}
                to use this feature.
              </>
            ) : (
              (generate.error as Error).message
            )}
          </p>
        )}
      </div>

      {coverLetter && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Generated cover letter
            </h3>
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 text-xs font-medium border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-sans leading-relaxed">
            {coverLetter}
          </pre>
        </div>
      )}
    </div>
  );
}

const COMPUTE_RESUME_MATCH_SCORE = `
  mutation ComputeResumeMatchScore($applicationId: ID!, $resumeText: String) {
    computeResumeMatchScore(applicationId: $applicationId, resumeText: $resumeText) {
      score
      label
      matchedKeywords
      missingKeywords
      summary
    }
  }
`;

type ResumeMatchScoreResult = {
  score: number;
  label: string;
  matchedKeywords: string[];
  missingKeywords: string[];
  summary: string;
};

function ResumeMatchTab({ applicationId }: { applicationId: string }) {
  const [resumeText, setResumeText] = useState('');
  const [overridePaste, setOverridePaste] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const { data: documentsData } = useQuery({
    queryKey: ['documents', applicationId],
    queryFn: () => gqlClient.request<{ documents: Document[] }>(DOCUMENTS_QUERY, { applicationId }),
  });
  const resumeDoc = (documentsData?.documents ?? [])
    .filter((d) => d.documentType === 'resume')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  const usingUploadedResume = Boolean(resumeDoc) && !overridePaste;

  const compute = useMutation({
    mutationFn: () =>
      gqlClient.request<{ computeResumeMatchScore: ResumeMatchScoreResult }>(
        COMPUTE_RESUME_MATCH_SCORE,
        { applicationId, resumeText: usingUploadedResume ? null : resumeText.trim() || null },
      ),
  });

  const result = compute.data?.computeResumeMatchScore;
  const color = result ? SCORE_COLORS[scoreColor(result.score)] : null;
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = result ? circumference - (result.score / 100) * circumference : circumference;

  const inputCls =
    'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none';

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
        {usingUploadedResume && resumeDoc ? (
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Using your uploaded resume — <span className="font-medium">{resumeDoc.name}</span>
            </p>
            <div className="flex items-center gap-3 shrink-0">
              {isPreviewableMimeType(resumeDoc.mimeType) && (
                <button
                  type="button"
                  onClick={() => setPreviewOpen(true)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Preview
                </button>
              )}
              <button
                type="button"
                onClick={() => setOverridePaste(true)}
                className="text-xs text-blue-600 hover:underline"
              >
                Paste different text instead
              </button>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Your resume
            </label>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              rows={6}
              placeholder="Paste your resume text here…"
              className={inputCls}
            />
            {resumeDoc && (
              <button
                type="button"
                onClick={() => setOverridePaste(false)}
                className="mt-1 text-xs text-blue-600 hover:underline"
              >
                Use uploaded resume ({resumeDoc.name}) instead
              </button>
            )}
          </div>
        )}

        <button
          onClick={() => compute.mutate()}
          disabled={compute.isPending || (!usingUploadedResume && !resumeText.trim())}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          {compute.isPending ? (
            <>
              <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
              Checking match…
            </>
          ) : (
            <>🎯 {result ? 'Check again' : 'Check match'}</>
          )}
        </button>

        {compute.isError && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {getGqlErrorCode(compute.error) === AI_NOT_CONFIGURED_CODE ? (
              <>
                Add your AI API key in{' '}
                <Link to="/settings/profile" className="underline">
                  Account settings
                </Link>{' '}
                to use this feature.
              </>
            ) : (
              getErrorMessage(compute.error)
            )}
          </p>
        )}
      </div>

      {result && color && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-4">
          <div
            className={`rounded-xl border border-gray-100 dark:border-gray-700 ${color.bg} p-3 flex items-center gap-3`}
          >
            <svg width="52" height="52" viewBox="0 0 52 52" className="shrink-0">
              <circle
                cx="26"
                cy="26"
                r={radius}
                fill="none"
                strokeWidth="5"
                className="text-gray-200 dark:text-gray-700"
                stroke="currentColor"
              />
              <circle
                cx="26"
                cy="26"
                r={radius}
                fill="none"
                strokeWidth="5"
                stroke="currentColor"
                className={color.ring}
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                transform="rotate(-90 26 26)"
              />
              <text
                x="26"
                y="30"
                textAnchor="middle"
                fontSize="13"
                fontWeight="bold"
                fill="currentColor"
                className={color.ring}
              >
                {result.score}
              </text>
            </svg>
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Resume match</p>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color.badge}`}
              >
                {result.label}
              </span>
            </div>
          </div>

          {result.summary && (
            <p className="text-sm text-gray-700 dark:text-gray-300">{result.summary}</p>
          )}

          {result.matchedKeywords.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                Matched keywords
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {result.matchedKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {result.missingKeywords.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                Missing keywords
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {result.missingKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      <DocumentPreviewModal
        document={previewOpen && resumeDoc ? resumeDoc : null}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  );
}
