import { useState, useEffect } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { gqlClient } from '#/graphql/client';
import { useLocale } from '#/lib/i18n';
import { Alert, Button, FormLabel, Input, Select } from '@trakwyn/ui';

const CREATE_DRAFT_MUTATION = `
  mutation CreateDocumentDraft($input: CreateDocumentDraftInput!) {
    createDocumentDraft(input: $input) {
      id
      applicationId
      type
      title
    }
  }
`;

const EXTRACT_TEXT_MUTATION = `
  mutation ExtractDocumentText($documentId: ID!) {
    extractDocumentText(documentId: $documentId) {
      text
    }
  }
`;

const DOCUMENTS_QUERY = `
  query Documents($applicationId: ID!) {
    documents(applicationId: $applicationId) {
      id
      name
      documentType
    }
  }
`;

export const Route = createFileRoute('/_authenticated/applications/$applicationId/documents/new')({
  component: NewDocumentDraftPage,
});

function NewDocumentDraftPage() {
  const { t } = useLocale();
  const { applicationId } = Route.useParams();
  const navigate = useNavigate();
  const [type, setType] = useState<'cover_letter' | 'resume'>('cover_letter');
  const [title, setTitle] = useState('');
  const [sourceDocumentId, setSourceDocumentId] = useState<string>('');
  const [documents, setDocuments] = useState<
    Array<{ id: string; name: string; documentType: string }>
  >([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    gqlClient
      .request<{ documents: Array<{ id: string; name: string; documentType: string }> }>(
        DOCUMENTS_QUERY,
        { applicationId },
      )
      .then((res) => setDocuments(res.documents))
      .catch(() => {})
      .finally(() => setLoadingDocs(false));
  }, [applicationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let contentJson =
        '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":""}]}]}';
      let plainText = '';

      if (sourceDocumentId) {
        const extractRes = await gqlClient.request<{ extractDocumentText: { text: string } }>(
          EXTRACT_TEXT_MUTATION,
          { documentId: sourceDocumentId },
        );
        plainText = extractRes.extractDocumentText.text;
        contentJson = JSON.stringify({
          type: 'doc',
          content: plainText.split('\n').map((line) => ({
            type: 'paragraph',
            content: [{ type: 'text', text: line }],
          })),
        });
      }

      const res = await gqlClient.request<{
        createDocumentDraft: { id: string; applicationId: string };
      }>(CREATE_DRAFT_MUTATION, {
        input: {
          applicationId,
          type,
          title:
            title ||
            (type === 'cover_letter' ? t('documents.cover_letter') : t('documents.resume')),
          contentJson,
          plainText,
          sourceDocumentId: sourceDocumentId || null,
        },
      });

      await navigate({
        to: '/applications/$applicationId/documents/$draftId',
        params: {
          applicationId: res.createDocumentDraft.applicationId,
          draftId: res.createDocumentDraft.id,
        },
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('documentDraft.createFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        {t('documentDraft.newDraftTitle')}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('documentDraft.typeLabel')}
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setType('cover_letter')}
              className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-colors ${
                type === 'cover_letter'
                  ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {t('documents.cover_letter')}
            </button>
            <button
              type="button"
              onClick={() => setType('resume')}
              className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-colors ${
                type === 'resume'
                  ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {t('documents.resume')}
            </button>
          </div>
        </div>

        <div>
          <FormLabel>{t('documentDraft.titleLabel')}</FormLabel>
          <Input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              type === 'cover_letter' ? t('documents.cover_letter') : t('documents.resume')
            }
          />
        </div>

        <div>
          <FormLabel>{t('documentDraft.startFromLabel')}</FormLabel>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            {t('documentDraft.startFromHelp')}
          </p>
          {loadingDocs ? (
            <Select disabled>
              <option>{t('common.loading')}</option>
            </Select>
          ) : (
            <Select value={sourceDocumentId} onChange={(e) => setSourceDocumentId(e.target.value)}>
              <option value="">{t('documentDraft.blankOption')}</option>
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name} ({doc.documentType})
                </option>
              ))}
            </Select>
          )}
        </div>

        {error && <Alert>{error}</Alert>}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              navigate({ to: '/applications/$applicationId', params: { applicationId } })
            }
          >
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={loading || !title.trim()}>
            {loading ? t('documentDraft.creating') : t('documentDraft.createDraft')}
          </Button>
        </div>
      </form>
    </div>
  );
}
