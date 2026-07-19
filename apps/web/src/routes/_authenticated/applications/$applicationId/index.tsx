import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { gqlClient } from '#/graphql/client';
import { StatusBadge } from '../../dashboard';
import { CheckIcon, EditIcon, PlusIcon, StarIcon, Trash2Icon } from 'lucide-react';

const APPLICATION_QUERY = `
  query Application($id: ID!) {
    application(id: $id) {
      id company role status jobUrl location salaryRange description appliedAt starred source followUpAt createdAt updatedAt
    }
  }
`;
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

type Application = {
  id: string;
  company: string;
  role: string;
  status: string;
  jobUrl?: string | null;
  location?: string | null;
  salaryRange?: string | null;
  description?: string | null;
  appliedAt?: string | null;
  starred: boolean;
  source?: string | null;
  followUpAt?: string | null;
  createdAt: string;
};
type Note = {
  id: string;
  applicationId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export const Route = createFileRoute('/_authenticated/applications/$applicationId/')({
  component: ApplicationDetailPage,
});

export function ApplicationDetailPage() {
  const { applicationId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [noteContent, setNoteContent] = useState('');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [activeTab, setActiveTab] = useState<'notes' | 'interviews' | 'activity' | 'documents'>('notes');

  const { data: appData } = useQuery({
    queryKey: ['application', applicationId],
    queryFn: () =>
      gqlClient.request<{ application: Application }>(APPLICATION_QUERY, { id: applicationId }),
  });
  const { data: notesData } = useQuery({
    queryKey: ['notes', applicationId],
    queryFn: () => gqlClient.request<{ notes: Note[] }>(NOTES_QUERY, { applicationId }),
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
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{app.company}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-0.5">{app.role}</p>
          </div>
          <div className="flex items-center gap-2">
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

        <dl className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          {app.location && <InfoItem label="Location" value={app.location} />}
          {app.salaryRange && <InfoItem label="Salary" value={app.salaryRange} />}
          {app.appliedAt && (
            <InfoItem label="Applied" value={new Date(app.appliedAt).toLocaleDateString()} />
          )}
          {app.source && <InfoItem label="Source" value={app.source} />}
          {app.followUpAt && (
            <InfoItem
              label="Follow up"
              value={new Date(app.followUpAt).toLocaleDateString()}
              highlight={new Date(app.followUpAt) <= new Date()}
            />
          )}
          {app.jobUrl && (
            <div className="col-span-2 sm:col-span-3">
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
            <div className="col-span-2 sm:col-span-3">
              <dt className="text-xs text-gray-400 mb-1">Description</dt>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {app.description}
              </p>
            </div>
          )}
        </dl>
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
        {(['notes', 'interviews', 'activity', 'documents'] as const).map((tab) => (
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

      {activeTab === 'interviews' && <InterviewsTab applicationId={applicationId} />}

      {activeTab === 'activity' && <ActivityTab applicationId={applicationId} />}

      {activeTab === 'documents' && <DocumentsTab applicationId={applicationId} />}
    </div>
  );
}

function InfoItem({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-gray-400">{label}</dt>
      <dd className={highlight ? 'text-orange-500 font-medium' : 'text-gray-700 dark:text-gray-300'}>
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
              <p className="text-xs text-gray-400 mt-0.5">{new Date(log.createdAt).toLocaleString()}</p>
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

function InterviewsTab({ applicationId }: { applicationId: string }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingRound, setEditingRound] = useState<InterviewRound | null>(null);
  const [form, setForm] = useState<RoundFormState>(emptyForm());

  const { data } = useQuery({
    queryKey: ['interviewRounds', applicationId],
    queryFn: () =>
      gqlClient.request<{ interviewRounds: InterviewRound[] }>(INTERVIEW_ROUNDS_QUERY, { applicationId }),
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
        <button
          onClick={() => { setShowForm(true); setForm(emptyForm()); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg"
        >
          <PlusIcon size={14} /> Add interview round
        </button>
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
              <p className="text-xs text-gray-400 mt-2">{new Date(round.createdAt).toLocaleString()}</p>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

const DOCUMENTS_QUERY = `
  query Documents($applicationId: ID!) {
    documents(applicationId: $applicationId) { id applicationId name mimeType sizeBytes url createdAt }
  }
`;
const REQUEST_UPLOAD_URL = `
  mutation RequestUploadUrl($input: RequestUploadUrlInput!) {
    requestUploadUrl(input: $input) { uploadUrl storageKey }
  }
`;
const CONFIRM_DOCUMENT = `
  mutation ConfirmDocument($input: ConfirmDocumentInput!) {
    confirmDocument(input: $input) { id applicationId name mimeType sizeBytes url createdAt }
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
  createdAt: string;
};

function DocumentsTab({ applicationId }: { applicationId: string }) {
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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
        input: { applicationId, filename: file.name, mimeType: file.type, sizeBytes: file.size },
      });

      await fetch(requestUploadUrl.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      await gqlClient.request(CONFIRM_DOCUMENT, {
        input: {
          applicationId,
          storageKey: requestUploadUrl.storageKey,
          name: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        },
      });
      qc.invalidateQueries({ queryKey: ['documents', applicationId] });
    } catch {
      setUploadError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const docs = data?.documents ?? [];

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-6 text-center">
        <label className="cursor-pointer">
          <input type="file" className="hidden" onChange={handleFileChange} disabled={uploading} />
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {uploading ? (
              <span>Uploading…</span>
            ) : (
              <>
                <span className="text-blue-600 font-medium hover:underline">Click to upload</span> a
                document
              </>
            )}
          </div>
        </label>
        {uploadError && <p className="mt-2 text-xs text-red-600">{uploadError}</p>}
      </div>

      {docs.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3"
        >
          <div className="min-w-0">
            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-blue-600 hover:underline truncate block"
            >
              {doc.name}
            </a>
            <p className="text-xs text-gray-400">
              {doc.mimeType} · {(doc.sizeBytes / 1024).toFixed(1)} KB
            </p>
          </div>
          <button
            onClick={() => deleteDoc.mutate(doc.id)}
            className="ml-4 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded shrink-0"
          >
            <Trash2Icon size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
