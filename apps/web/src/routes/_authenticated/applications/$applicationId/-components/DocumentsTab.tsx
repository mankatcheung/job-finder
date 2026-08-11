import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { put as putBlob } from '@vercel/blob/client';
import { CheckIcon, ExternalLinkIcon, PlusIcon, Trash2Icon, XIcon } from 'lucide-react';
import { gqlClient } from '#/graphql/client';
import { showUndoToast } from '#/lib/undoToast';
import { Button, Card, FormLabel, Input, Select } from '@job-finder/ui';
import { DocumentPreviewModal, isPreviewableMimeType } from './DocumentPreviewModal';

export const DOCUMENTS_QUERY = `
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

const DOCUMENT_DRAFTS_QUERY = `
  query DocumentDrafts($applicationId: ID!) {
    documentDrafts(applicationId: $applicationId) {
      id
      applicationId
      type
      title
      createdAt
      updatedAt
    }
  }
`;
const DELETE_DRAFT = `mutation DeleteDocumentDraft($id: ID!) { deleteDocumentDraft(id: $id) }`;

type DocumentDraft = {
  id: string;
  applicationId: string;
  type: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type Document = {
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

export function DocumentsTab({ applicationId }: { applicationId: string }) {
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(null);
  const [docType, setDocType] = useState('other');
  const [docVersion, setDocVersion] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);

  const { data: draftsData } = useQuery({
    queryKey: ['documentDrafts', applicationId],
    queryFn: () =>
      gqlClient.request<{ documentDrafts: DocumentDraft[] }>(DOCUMENT_DRAFTS_QUERY, {
        applicationId,
      }),
  });
  const deleteDraft = useMutation({
    mutationFn: (id: string) => gqlClient.request(DELETE_DRAFT, { id }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['documentDrafts', applicationId] });
      const prev = qc.getQueryData<{ documentDrafts: DocumentDraft[] }>([
        'documentDrafts',
        applicationId,
      ]);
      qc.setQueryData<{ documentDrafts: DocumentDraft[] }>(
        ['documentDrafts', applicationId],
        (old) => ({
          documentDrafts: (old?.documentDrafts ?? []).filter((d) => d.id !== id),
        }),
      );
      return { prev };
    },
    onError: (_err, _id, context) => {
      if (context?.prev) qc.setQueryData(['documentDrafts', applicationId], context.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['documentDrafts', applicationId] }),
  });

  const { data } = useQuery({
    queryKey: ['documents', applicationId],
    queryFn: () => gqlClient.request<{ documents: Document[] }>(DOCUMENTS_QUERY, { applicationId }),
  });
  const deleteDoc = useMutation({
    mutationFn: (id: string) => gqlClient.request(DELETE_DOCUMENT, { id }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['documents', applicationId] });
      const prev = qc.getQueryData<{ documents: Document[] }>(['documents', applicationId]);
      qc.setQueryData<{ documents: Document[] }>(['documents', applicationId], (old) => ({
        documents: (old?.documents ?? []).filter((d) => d.id !== id),
      }));
      return { prev };
    },
    onError: (_err, _id, context) => {
      if (context?.prev) qc.setQueryData(['documents', applicationId], context.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['documents', applicationId] }),
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

  const docs = data?.documents ?? [];
  const drafts = draftsData?.documentDrafts ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Link
          to="/applications/$applicationId/documents/new"
          params={{ applicationId }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
        >
          <PlusIcon size={14} /> <span className="hidden sm:inline">New Draft</span>
        </Link>
      </div>

      {drafts.length > 0 && (
        <div className="space-y-3">
          {drafts.map((draft) => (
            <Card key={draft.id} className="flex items-center justify-between px-4 py-3">
              <div className="min-w-0">
                <Link
                  to="/applications/$applicationId/documents/$draftId"
                  params={{ applicationId, draftId: draft.id }}
                  className="text-sm font-medium text-blue-600 hover:underline truncate block"
                >
                  {draft.title}
                </Link>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${draft.type === 'cover_letter' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}
                  >
                    {draft.type === 'cover_letter' ? 'Cover Letter' : 'Resume'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(draft.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  const snapshot = qc.getQueryData<{ documentDrafts: DocumentDraft[] }>([
                    'documentDrafts',
                    applicationId,
                  ]);
                  qc.setQueryData<{ documentDrafts: DocumentDraft[] }>(
                    ['documentDrafts', applicationId],
                    (prev) => ({
                      documentDrafts: (prev?.documentDrafts ?? []).filter((d) => d.id !== draft.id),
                    }),
                  );
                  showUndoToast({
                    message: 'Draft deleted',
                    onExecute: () => deleteDraft.mutate(draft.id),
                    onUndo: () => qc.setQueryData(['documentDrafts', applicationId], snapshot),
                  });
                }}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded shrink-0"
              >
                <Trash2Icon size={14} />
              </button>
            </Card>
          ))}
        </div>
      )}

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
              <FormLabel size="xs">Document type</FormLabel>
              <Select value={docType} onChange={(e) => setDocType(e.target.value)}>
                <option value="other">Other</option>
                <option value="resume">Resume</option>
                <option value="cover_letter">Cover Letter</option>
                <option value="portfolio">Portfolio</option>
              </Select>
            </div>
            <div>
              <FormLabel size="xs">
                Version <span className="font-normal">(optional)</span>
              </FormLabel>
              <Input
                value={docVersion}
                onChange={(e) => setDocVersion(e.target.value)}
                placeholder="e.g. v2"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={confirming}
              aria-label="Confirm upload"
            >
              <span className="flex items-center gap-1">
                <CheckIcon size={14} />{' '}
                <span className="hidden sm:inline">
                  {confirming ? 'Saving…' : 'Confirm upload'}
                </span>
              </span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPendingUpload(null)}
              aria-label="Cancel"
            >
              <span className="flex items-center gap-1">
                <XIcon size={14} /> <span className="hidden sm:inline">Cancel</span>
              </span>
            </Button>
          </div>
          {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
        </div>
      )}

      {docs.map((doc) => (
        <Card key={doc.id} className="flex items-center justify-between px-4 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {isPreviewableMimeType(doc.mimeType) ? (
                <Button
                  variant="link"
                  onClick={() => setPreviewDoc(doc)}
                  className="truncate text-left"
                >
                  {doc.name}
                </Button>
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
              onClick={() => {
                const snapshot = qc.getQueryData<{ documents: Document[] }>([
                  'documents',
                  applicationId,
                ]);
                qc.setQueryData<{ documents: Document[] }>(
                  ['documents', applicationId],
                  (prev) => ({
                    documents: (prev?.documents ?? []).filter((d) => d.id !== doc.id),
                  }),
                );
                showUndoToast({
                  message: 'Document deleted',
                  onExecute: () => deleteDoc.mutate(doc.id),
                  onUndo: () => qc.setQueryData(['documents', applicationId], snapshot),
                });
              }}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
            >
              <Trash2Icon size={14} />
            </button>
          </div>
        </Card>
      ))}
      <DocumentPreviewModal document={previewDoc} onClose={() => setPreviewDoc(null)} />
    </div>
  );
}
