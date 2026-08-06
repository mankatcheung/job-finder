import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarIcon, CheckIcon, EditIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { gqlClient } from '#/graphql/client';
import { showUndoToast } from '#/lib/undoToast';

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

export function InterviewsTab({
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
    onMutate: async (f) => {
      await qc.cancelQueries({ queryKey: ['interviewRounds', applicationId] });
      const prev = qc.getQueryData<{ interviewRounds: InterviewRound[] }>([
        'interviewRounds',
        applicationId,
      ]);
      const optimistic: InterviewRound = {
        id: `__tmp_${Date.now()}`,
        applicationId,
        type: f.type,
        scheduledAt: f.scheduledAt || null,
        interviewerName: f.interviewerName || null,
        notes: f.notes || null,
        outcome: f.outcome,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      qc.setQueryData<{ interviewRounds: InterviewRound[] }>(
        ['interviewRounds', applicationId],
        (old) => ({ interviewRounds: [...(old?.interviewRounds ?? []), optimistic] }),
      );
      return { prev };
    },
    onError: (_err, _f, context) => {
      if (context?.prev) qc.setQueryData(['interviewRounds', applicationId], context.prev);
    },
    onSuccess: () => {
      setShowForm(false);
      setForm(emptyForm());
    },
    onSettled: () => invalidate(),
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
    onMutate: async ({ id, f }) => {
      await qc.cancelQueries({ queryKey: ['interviewRounds', applicationId] });
      const prev = qc.getQueryData<{ interviewRounds: InterviewRound[] }>([
        'interviewRounds',
        applicationId,
      ]);
      qc.setQueryData<{ interviewRounds: InterviewRound[] }>(
        ['interviewRounds', applicationId],
        (old) => ({
          interviewRounds: (old?.interviewRounds ?? []).map((r) =>
            r.id === id
              ? {
                  ...r,
                  type: f.type,
                  scheduledAt: f.scheduledAt || null,
                  interviewerName: f.interviewerName || null,
                  notes: f.notes || null,
                  outcome: f.outcome,
                  updatedAt: new Date().toISOString(),
                }
              : r,
          ),
        }),
      );
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) qc.setQueryData(['interviewRounds', applicationId], context.prev);
    },
    onSuccess: () => setEditingRound(null),
    onSettled: () => invalidate(),
  });

  const deleteRound = useMutation({
    mutationFn: (id: string) => gqlClient.request(DELETE_ROUND, { id }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['interviewRounds', applicationId] });
      const prev = qc.getQueryData<{ interviewRounds: InterviewRound[] }>([
        'interviewRounds',
        applicationId,
      ]);
      qc.setQueryData<{ interviewRounds: InterviewRound[] }>(
        ['interviewRounds', applicationId],
        (old) => ({
          interviewRounds: (old?.interviewRounds ?? []).filter((r) => r.id !== id),
        }),
      );
      return { prev };
    },
    onError: (_err, _id, context) => {
      if (context?.prev) qc.setQueryData(['interviewRounds', applicationId], context.prev);
    },
    onSettled: () => invalidate(),
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
                    onClick={() => {
                      const snapshot = qc.getQueryData(['interviewRounds', applicationId]);
                      qc.setQueryData(['interviewRounds', applicationId], (prev: any) => ({
                        interviewRounds: (prev?.interviewRounds ?? []).filter(
                          (r: any) => r.id !== round.id,
                        ),
                      }));
                      showUndoToast({
                        message: 'Interview round deleted',
                        onExecute: () => deleteRound.mutate(round.id),
                        onUndo: () => qc.setQueryData(['interviewRounds', applicationId], snapshot),
                      });
                    }}
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
