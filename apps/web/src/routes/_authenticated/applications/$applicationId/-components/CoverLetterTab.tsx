import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { FileTextIcon } from 'lucide-react';
import { gqlClient } from '#/graphql/client';
import { getGqlErrorCode, AI_NOT_CONFIGURED_CODE } from '#/lib/graphqlError';
import { useLocale } from '#/lib/i18n';
import { Button, Card, EmptyState, FormLabel, Skeleton, Spinner, Textarea } from '@trakwyn/ui';
import { invalidateSectionCounts } from '../-sectionCounts';

const GENERATE_COVER_LETTER = `
  mutation GenerateCoverLetter($applicationId: ID!, $resumeText: String) {
    generateCoverLetter(applicationId: $applicationId, resumeText: $resumeText) {
      id
      title
      createdAt
    }
  }
`;

const DRAFTS_QUERY = `
  query DocumentDrafts($applicationId: ID!) {
    documentDrafts(applicationId: $applicationId) {
      id
      type
      title
      updatedAt
    }
  }
`;

type Draft = { id: string; type: string; title: string; updatedAt: string };

export function CoverLetterTab({ applicationId }: { applicationId: string }) {
  const { t, formatDate } = useLocale();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [resumeText, setResumeText] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['documentDrafts', applicationId],
    queryFn: () => gqlClient.request<{ documentDrafts: Draft[] }>(DRAFTS_QUERY, { applicationId }),
  });

  // Only cover letters: resume drafts live under Documents, and mixing them
  // here would make this tab a second, partial view of that list.
  const letters = (data?.documentDrafts ?? []).filter((d) => d.type === 'cover_letter');

  const generate = useMutation({
    mutationFn: () =>
      gqlClient.request<{ generateCoverLetter: { id: string } }>(GENERATE_COVER_LETTER, {
        applicationId,
        resumeText: resumeText.trim() || null,
      }),
    onSuccess: (result) => {
      // Generated letters are saved as drafts now, so the useful next step is
      // the editor rather than a copy button over throwaway text.
      void qc.invalidateQueries({ queryKey: ['documentDrafts', applicationId] });
      void invalidateSectionCounts(qc, applicationId);
      void navigate({
        to: '/applications/$applicationId/documents/$draftId',
        params: { applicationId, draftId: result.generateCoverLetter.id },
      });
    },
  });

  return (
    <div className="space-y-4">
      <Card className="space-y-3 p-4">
        <div>
          <FormLabel>
            {t('coverLetter.resumeBackgroundLabel')}{' '}
            <span className="font-normal text-gray-400">
              ({t('coverLetter.optionalTailoredNote')})
            </span>
          </FormLabel>
          <Textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            rows={6}
            placeholder={t('coverLetter.pastePlaceholder')}
          />
        </div>
        <Button onClick={() => generate.mutate()} disabled={generate.isPending}>
          <span className="flex items-center gap-2">
            {generate.isPending ? (
              <>
                <Spinner tone="white" />
                {t('coverLetter.generating')}
              </>
            ) : (
              <>✨ {t('coverLetter.generateCoverLetter')}</>
            )}
          </span>
        </Button>
        {generate.isError && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {getGqlErrorCode(generate.error) === AI_NOT_CONFIGURED_CODE ? (
              <>
                {t('resumeMatch.addApiKeyPrefix')}{' '}
                <Link to="/settings/ai" className="underline">
                  {t('resumeMatch.accountSettingsLinkText')}
                </Link>{' '}
                {t('resumeMatch.addApiKeySuffix')}
              </>
            ) : (
              (generate.error as Error).message
            )}
          </p>
        )}
      </Card>

      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('coverLetter.savedTitle')}
        </h3>

        {isLoading && <Skeleton className="h-12 w-full rounded-sm" />}

        {!isLoading && letters.length === 0 && (
          <EmptyState icon={<FileTextIcon size={32} />} message={t('coverLetter.noneSavedYet')} />
        )}

        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
          {letters.map((letter) => (
            <li key={letter.id} className="py-2">
              <Link
                to="/applications/$applicationId/documents/$draftId"
                params={{ applicationId, draftId: letter.id }}
                className="flex items-center justify-between gap-3 hover:underline"
              >
                <span className="truncate text-sm text-gray-800 dark:text-gray-200">
                  {letter.title}
                </span>
                <span className="shrink-0 text-xs text-gray-400">
                  {formatDate(new Date(letter.updatedAt), { dateStyle: 'medium' })}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
