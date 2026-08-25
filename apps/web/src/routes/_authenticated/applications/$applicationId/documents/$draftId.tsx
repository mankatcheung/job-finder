import { useState, useEffect } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { gqlClient } from '#/graphql/client';
import { useLocale } from '#/lib/i18n';
import { getErrorMessage } from '#/lib/errors';
import { DocumentDraftEditor } from '../-components/DocumentDraftEditor';
import { DownloadIcon, TrashIcon, ArrowLeftIcon } from 'lucide-react';
import { Alert, Button, IconButton } from '@trakwyn/ui';

const DRAFT_QUERY = `
  query DocumentDraft($id: ID!) {
    documentDraft(id: $id) {
      id
      applicationId
      type
      title
      contentJson
      plainText
      sourceDocumentId
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_CONTENT_MUTATION = `
  mutation UpdateDocumentDraftContent($input: UpdateDocumentDraftContentInput!) {
    updateDocumentDraftContent(input: $input) {
      id
      updatedAt
    }
  }
`;

const EXPORT_PDF_MUTATION = `
  mutation ExportDocumentDraftToPdf($draftId: ID!) {
    exportDocumentDraftToPdf(draftId: $draftId) {
      id
      name
      url
    }
  }
`;

const RENAME_DRAFT_MUTATION = `
  mutation RenameDocumentDraft($draftId: ID!, $title: String!) {
    renameDocumentDraft(draftId: $draftId, title: $title) {
      id
      title
    }
  }
`;

const DELETE_DRAFT_MUTATION = `
  mutation DeleteDocumentDraft($id: ID!) {
    deleteDocumentDraft(id: $id)
  }
`;

export const Route = createFileRoute(
  '/_authenticated/applications/$applicationId/documents/$draftId',
)({
  component: DocumentDraftEditPage,
});

function DocumentDraftEditPage() {
  const { t } = useLocale();
  const { applicationId, draftId } = Route.useParams();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<{
    id: string;
    type: string;
    title: string;
    contentJson: string;
    plainText: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');

  const commitRename = async () => {
    const title = titleDraft.trim();
    setRenaming(false);
    // An unchanged or emptied title is a no-op rather than an error: the user
    // clicked away, they did not ask for anything.
    if (!title || !draft || title === draft.title) return;
    const previous = draft.title;
    setDraft({ ...draft, title });
    try {
      await gqlClient.request(RENAME_DRAFT_MUTATION, { draftId, title });
    } catch (err) {
      setDraft((d) => (d ? { ...d, title: previous } : d));
      setError(getErrorMessage(err));
    }
  };

  useEffect(() => {
    gqlClient
      .request<{ documentDraft: typeof draft }>(DRAFT_QUERY, { id: draftId })
      .then((res) => setDraft(res.documentDraft))
      .catch((err) =>
        setError(err instanceof Error ? err.message : t('documentDraftEdit.loadFailed')),
      )
      .finally(() => setLoading(false));
  }, [draftId, t]);

  const handleUpdate = async (contentJson: string, plainText: string) => {
    if (!draft) return;
    setSaving(true);
    try {
      await gqlClient.request(UPDATE_CONTENT_MUTATION, {
        input: { draftId: draft.id, contentJson, plainText },
      });
      setLastSaved(new Date());
      setDraft((prev) => (prev ? { ...prev, contentJson, plainText } : prev));
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleExportPdf = async () => {
    if (!draft) return;
    setExporting(true);
    try {
      await gqlClient.request(EXPORT_PDF_MUTATION, { draftId: draft.id });
      await navigate({ to: '/applications/$applicationId', params: { applicationId } });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('documentDraftEdit.exportFailed'));
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!draft || !confirm(t('documentDraftEdit.deleteConfirm'))) return;
    try {
      await gqlClient.request(DELETE_DRAFT_MUTATION, { id: draft.id });
      await navigate({ to: '/applications/$applicationId', params: { applicationId } });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('documentDraftEdit.deleteFailed'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {t('documentDraftEdit.loadingDraft')}
        </div>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-red-600">{t('documentDraftEdit.draftNotFound')}</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <IconButton
            label={t('documentDraftEdit.backAria')}
            icon={<ArrowLeftIcon className="size-5" />}
            onClick={() =>
              navigate({ to: '/applications/$applicationId', params: { applicationId } })
            }
          />
          <div>
            {renaming ? (
              <input
                autoFocus
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={() => void commitRename()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void commitRename();
                  if (e.key === 'Escape') setRenaming(false);
                }}
                aria-label={t('documentDraftEdit.renameAria')}
                className="border-b border-blue-500 bg-transparent text-xl font-bold text-gray-900 outline-none dark:text-gray-100"
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  setTitleDraft(draft.title);
                  setRenaming(true);
                }}
                title={t('documentDraftEdit.renameAria')}
                className="text-left text-xl font-bold text-gray-900 hover:underline dark:text-gray-100"
              >
                {draft.title}
              </button>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {draft.type === 'cover_letter' ? t('documents.cover_letter') : t('documents.resume')}
              {lastSaved && (
                <span className="ml-2">
                  · {t('documentDraftEdit.savedAt', { time: lastSaved.toLocaleTimeString() })}
                </span>
              )}
              {saving && <span className="ml-2 text-blue-600">{t('applicationForm.saving')}</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleExportPdf} disabled={exporting}>
            <span className="inline-flex items-center gap-1.5">
              <DownloadIcon className="size-4" />
              {exporting ? t('documentDraftEdit.exporting') : t('documentDraftEdit.exportPdf')}
            </span>
          </Button>
          <IconButton
            label={t('common.delete')}
            icon={<TrashIcon className="size-4" />}
            variant="danger"
            onClick={handleDelete}
          />
        </div>
      </div>

      {error && <Alert className="mb-4">{error}</Alert>}

      <DocumentDraftEditor contentJson={draft.contentJson} onUpdate={handleUpdate} />
    </div>
  );
}
