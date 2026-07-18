import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { gqlClient } from '#/graphql/client';
import { StatusBadge } from '../../dashboard';
import { EditIcon, PlusIcon, Trash2Icon } from 'lucide-react';

const APPLICATION_QUERY = `
  query Application($id: ID!) {
    application(id: $id) {
      id company role status jobUrl location salaryRange description appliedAt createdAt updatedAt
    }
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
  const [activeTab, setActiveTab] = useState<'notes' | 'documents'>('notes');

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
      <div className="p-8">
        <div className="h-8 w-64 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
      </div>
    );

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-4">
        <a
          href="/applications"
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ← Applications
        </a>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{app.company}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-0.5">{app.role}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={app.status} />
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

      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        {(['notes', 'documents'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${
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

      {activeTab === 'documents' && <DocumentsTab applicationId={applicationId} />}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-gray-400">{label}</dt>
      <dd className="text-gray-700 dark:text-gray-300">{value}</dd>
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
