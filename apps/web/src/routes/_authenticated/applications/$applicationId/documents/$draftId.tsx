import { useState, useEffect } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { gqlClient } from '#/graphql/client';
import { DocumentDraftEditor } from '../-components/DocumentDraftEditor';
import { DownloadIcon, TrashIcon, ArrowLeftIcon } from 'lucide-react';
import { Alert, Button, IconButton } from '@job-finder/ui';

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

  useEffect(() => {
    gqlClient
      .request<{ documentDraft: typeof draft }>(DRAFT_QUERY, { id: draftId })
      .then((res) => setDraft(res.documentDraft))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load draft'))
      .finally(() => setLoading(false));
  }, [draftId]);

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
      setError(err instanceof Error ? err.message : 'Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!draft || !confirm('Delete this draft?')) return;
    try {
      await gqlClient.request(DELETE_DRAFT_MUTATION, { id: draft.id });
      await navigate({ to: '/applications/$applicationId', params: { applicationId } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete draft');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-gray-500 dark:text-gray-400">Loading draft…</div>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-red-600">Draft not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <IconButton
            label="Back"
            icon={<ArrowLeftIcon className="h-5 w-5" />}
            onClick={() =>
              navigate({ to: '/applications/$applicationId', params: { applicationId } })
            }
          />
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{draft.title}</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {draft.type === 'cover_letter' ? 'Cover Letter' : 'Resume'}
              {lastSaved && <span className="ml-2">· Saved {lastSaved.toLocaleTimeString()}</span>}
              {saving && <span className="ml-2 text-blue-600">Saving…</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleExportPdf} disabled={exporting}>
            <span className="inline-flex items-center gap-1.5">
              <DownloadIcon className="h-4 w-4" />
              {exporting ? 'Exporting…' : 'Export PDF'}
            </span>
          </Button>
          <IconButton
            label="Delete"
            icon={<TrashIcon className="h-4 w-4" />}
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
