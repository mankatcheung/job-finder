import { Link, useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { gqlClient } from '#/graphql/client';
import { showUndoToast } from '#/lib/undoToast';
import { getErrorMessage } from '#/lib/errors';
import { ErrorState } from '#/components/ErrorState';
import { StatusBadge } from '../../../-components/StatusBadge';
import {
  ActivityIcon,
  Building2Icon,
  CalendarIcon,
  CheckIcon,
  DollarSignIcon,
  EditIcon,
  FileTextIcon,
  PenLineIcon,
  PlusIcon,
  StarIcon,
  XIcon,
  Trash2Icon,
  UploadIcon,
  UsersIcon,
} from 'lucide-react';
import { applicationQueryOptions, type Application } from '../-application-query';
import type { BoardApplication } from '../../-board-queries';
import { InfoItem } from './InfoItem';
import { HealthScorePanel, type HealthScore } from './HealthScorePanel';
import { ActivityTab } from './ActivityTab';
import { InterviewsTab } from './InterviewsTab';
import { ContactsTab } from './ContactsTab';
import { DocumentsTab } from './DocumentsTab';
import { CompanyBriefingTab } from './CompanyBriefingTab';
import { CoverLetterTab } from './CoverLetterTab';
import { ResumeMatchTab } from './ResumeMatchTab';
import { Route } from '../index';

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

type Note = {
  id: string;
  applicationId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export function ApplicationDetailPage() {
  const { applicationId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [noteContent, setNoteContent] = useState('');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [activeTab, setActiveTab] = useState<
    | 'notes'
    | 'interviews'
    | 'contacts'
    | 'activity'
    | 'documents'
    | 'company briefing'
    | 'cover letter'
    | 'resume match'
    | 'offers'
  >('notes');

  const TABS = [
    { id: 'notes' as const, label: 'Notes', icon: FileTextIcon },
    { id: 'interviews' as const, label: 'Interviews', icon: CalendarIcon },
    { id: 'contacts' as const, label: 'Contacts', icon: UsersIcon },
    { id: 'activity' as const, label: 'Activity', icon: ActivityIcon },
    { id: 'documents' as const, label: 'Documents', icon: UploadIcon },
    { id: 'company briefing' as const, label: 'Company Briefing', icon: Building2Icon },
    { id: 'cover letter' as const, label: 'Cover Letter', icon: PenLineIcon },
    { id: 'resume match' as const, label: 'Resume Match', icon: FileTextIcon },
    { id: 'offers' as const, label: 'Offers', icon: DollarSignIcon },
  ];

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
    onMutate: async (content) => {
      await qc.cancelQueries({ queryKey: ['notes', applicationId] });
      const prevNotes = qc.getQueryData<{ notes: Note[] }>(['notes', applicationId]);
      const optimistic: Note = {
        id: `__tmp_${Date.now()}`,
        applicationId,
        content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      qc.setQueryData<{ notes: Note[] }>(['notes', applicationId], (old) => ({
        notes: [...(old?.notes ?? []), optimistic],
      }));
      return { prevNotes };
    },
    onError: (_err, _content, context) => {
      if (context?.prevNotes) qc.setQueryData(['notes', applicationId], context.prevNotes);
    },
    onSuccess: () => setNoteContent(''),
    onSettled: () => qc.invalidateQueries({ queryKey: ['notes', applicationId] }),
  });
  const updateNote = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      gqlClient.request(UPDATE_NOTE, { id, content }),
    onMutate: async ({ id, content }) => {
      await qc.cancelQueries({ queryKey: ['notes', applicationId] });
      const prevNotes = qc.getQueryData<{ notes: Note[] }>(['notes', applicationId]);
      qc.setQueryData<{ notes: Note[] }>(['notes', applicationId], (old) => ({
        notes: (old?.notes ?? []).map((n) =>
          n.id === id ? { ...n, content, updatedAt: new Date().toISOString() } : n,
        ),
      }));
      return { prevNotes };
    },
    onError: (_err, _vars, context) => {
      if (context?.prevNotes) qc.setQueryData(['notes', applicationId], context.prevNotes);
    },
    onSuccess: () => setEditingNote(null),
    onSettled: () => qc.invalidateQueries({ queryKey: ['notes', applicationId] }),
  });
  const deleteNote = useMutation({
    mutationFn: (id: string) => gqlClient.request(DELETE_NOTE, { id }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['notes', applicationId] });
      const prevNotes = qc.getQueryData<{ notes: Note[] }>(['notes', applicationId]);
      qc.setQueryData<{ notes: Note[] }>(['notes', applicationId], (old) => ({
        notes: (old?.notes ?? []).filter((n) => n.id !== id),
      }));
      return { prevNotes };
    },
    onError: (_err, _id, context) => {
      if (context?.prevNotes) qc.setQueryData(['notes', applicationId], context.prevNotes);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['notes', applicationId] }),
  });
  const toggleStar = useMutation({
    mutationFn: (starred: boolean) =>
      gqlClient.request(UPDATE_STARRED, { id: applicationId, input: { starred } }),
    onMutate: async (starred) => {
      await qc.cancelQueries({ queryKey: ['application', applicationId] });

      const prevApp = qc.getQueryData<{ application: Application }>(['application', applicationId]);

      qc.setQueryData<{ application: Application }>(['application', applicationId], (old) =>
        old ? { ...old, application: { ...old.application, starred } } : old,
      );

      // Optimistically update board cache
      qc.setQueriesData<{ applications: BoardApplication[] }>(
        { queryKey: ['applications'], exact: false },
        (old) => {
          if (!old?.applications) return old;
          return {
            ...old,
            applications: old.applications.map((a) =>
              a.id === applicationId ? { ...a, starred } : a,
            ),
          };
        },
      );

      return { prevApp };
    },
    onError: (_err, _starred, context) => {
      if (context?.prevApp) {
        qc.setQueryData(['application', applicationId], context.prevApp);
      }
      qc.invalidateQueries({ queryKey: ['applications'] });
    },
    onSettled: () => {
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
                showUndoToast({
                  message: 'Application deleted',
                  onExecute: () => deleteApp.mutate(),
                  onUndo: () => {},
                });
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

      <div className="flex flex-col md:flex-row gap-6">
        {/* Mobile: horizontal scrollable strip */}
        <div
          className="md:hidden flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto -mx-4 px-4"
          aria-label="Section tabs"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 flex-shrink-0 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Desktop: vertical sidebar */}
        <nav
          className="hidden md:flex flex-col w-44 flex-shrink-0 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 p-2 h-fit sticky top-20"
          aria-label="Section navigation"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors text-left ${
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-gray-200'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Content area */}
        <div className="flex-1 min-w-0">
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
                    aria-label="Add note"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-medium rounded-lg"
                  >
                    <PlusIcon size={14} /> <span className="hidden sm:inline">Add note</span>
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
                        onChange={(e) =>
                          setEditingNote({ ...editingNote, content: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24"
                      />
                      <div className="mt-2 flex gap-2 justify-end">
                        <button
                          onClick={() =>
                            updateNote.mutate({ id: note.id, content: editingNote.content })
                          }
                          aria-label="Save"
                          className="flex items-center gap-1 text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg"
                        >
                          <CheckIcon size={14} /> <span className="hidden sm:inline">Save</span>
                        </button>
                        <button
                          onClick={() => setEditingNote(null)}
                          aria-label="Cancel"
                          className="flex items-center gap-1 text-xs px-3 py-1.5 text-gray-500 hover:text-gray-700"
                        >
                          <XIcon size={14} /> <span className="hidden sm:inline">Cancel</span>
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
                          onClick={() => {
                            const snapshot = qc.getQueryData(['notes', applicationId]);
                            qc.setQueryData(['notes', applicationId], (prev: any) => ({
                              notes: (prev?.notes ?? []).filter((n: any) => n.id !== note.id),
                            }));
                            showUndoToast({
                              message: 'Note deleted',
                              onExecute: () => deleteNote.mutate(note.id),
                              onUndo: () => qc.setQueryData(['notes', applicationId], snapshot),
                            });
                          }}
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

          {activeTab === 'company briefing' && <CompanyBriefingTab applicationId={applicationId} />}

          {activeTab === 'cover letter' && <CoverLetterTab applicationId={applicationId} />}

          {activeTab === 'resume match' && <ResumeMatchTab applicationId={applicationId} />}

          {activeTab === 'offers' && (
            <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Offer comparison
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Record compensation details and compare this application with offers from other
                applications.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  to="/applications/$applicationId/offers"
                  params={{ applicationId }}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Manage offers
                </Link>
                <Link
                  to="/applications/$applicationId/offers/compare"
                  params={{ applicationId }}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Compare offers
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
