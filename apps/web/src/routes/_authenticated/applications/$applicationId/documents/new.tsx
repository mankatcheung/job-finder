import { useState, useEffect } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { gqlClient } from '#/graphql/client';

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
          title: title || (type === 'cover_letter' ? 'Cover Letter' : 'Resume'),
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
      setError(err instanceof Error ? err.message : 'Failed to create draft');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        New Document Draft
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Type
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
              Cover Letter
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
              Resume
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={type === 'cover_letter' ? 'Cover Letter' : 'Resume'}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Start from (optional)
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Import text from an existing document, or start blank.
          </p>
          {loadingDocs ? (
            <select
              disabled
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option>Loading…</option>
            </select>
          ) : (
            <select
              value={sourceDocumentId}
              onChange={(e) => setSourceDocumentId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Blank (start from scratch)</option>
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name} ({doc.documentType})
                </option>
              ))}
            </select>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() =>
              navigate({ to: '/applications/$applicationId', params: { applicationId } })
            }
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !title.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {loading ? 'Creating…' : 'Create Draft'}
          </button>
        </div>
      </form>
    </div>
  );
}
