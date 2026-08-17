import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { EyeIcon } from 'lucide-react';
import { gqlClient } from '#/graphql/client';
import { getGqlErrorCode, AI_NOT_CONFIGURED_CODE } from '#/lib/graphqlError';
import { getErrorMessage } from '#/lib/errors';
import { useLocale } from '#/lib/i18n';
import { DocumentPreviewModal, isPreviewableMimeType } from './DocumentPreviewModal';
import { DOCUMENTS_QUERY, type Document } from './DocumentsTab';
import { SCORE_COLORS, scoreColor } from './HealthScorePanel';
import { Card, FormLabel, Spinner, Textarea } from '@trakwyn/ui';

const COMPUTE_RESUME_MATCH_SCORE = `
  mutation ComputeResumeMatchScore($applicationId: ID!, $resumeText: String) {
    computeResumeMatchScore(applicationId: $applicationId, resumeText: $resumeText) {
      score
      label
      matchedKeywords
      missingKeywords
      summary
    }
  }
`;

type ResumeMatchScoreResult = {
  score: number;
  label: string;
  matchedKeywords: string[];
  missingKeywords: string[];
  summary: string;
};

export function ResumeMatchTab({ applicationId }: { applicationId: string }) {
  const { t } = useLocale();
  const [resumeText, setResumeText] = useState('');
  const [overridePaste, setOverridePaste] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const { data: documentsData } = useQuery({
    queryKey: ['documents', applicationId],
    queryFn: () => gqlClient.request<{ documents: Document[] }>(DOCUMENTS_QUERY, { applicationId }),
  });
  const resumeDoc = (documentsData?.documents ?? [])
    .filter((d) => d.documentType === 'resume')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  const usingUploadedResume = Boolean(resumeDoc) && !overridePaste;

  const compute = useMutation({
    mutationFn: () =>
      gqlClient.request<{ computeResumeMatchScore: ResumeMatchScoreResult }>(
        COMPUTE_RESUME_MATCH_SCORE,
        { applicationId, resumeText: usingUploadedResume ? null : resumeText.trim() || null },
      ),
  });

  const result = compute.data?.computeResumeMatchScore;
  const color = result ? SCORE_COLORS[scoreColor(result.score)] : null;
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = result ? circumference - (result.score / 100) * circumference : circumference;

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        {usingUploadedResume && resumeDoc ? (
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {t('resumeMatch.usingUploadedResumePrefix')}{' '}
              <span className="font-medium">{resumeDoc.name}</span>
            </p>
            <div className="flex items-center gap-3 shrink-0">
              {isPreviewableMimeType(resumeDoc.mimeType) && (
                <button
                  type="button"
                  onClick={() => setPreviewOpen(true)}
                  aria-label={t('resumeMatch.preview')}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                >
                  <EyeIcon size={14} />{' '}
                  <span className="hidden sm:inline">{t('resumeMatch.preview')}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setOverridePaste(true)}
                className="text-xs text-blue-600 hover:underline"
              >
                {t('resumeMatch.pasteDifferentText')}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <FormLabel>{t('resumeMatch.yourResumeLabel')}</FormLabel>
            <Textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              rows={6}
              placeholder={t('resumeMatch.pasteResumePlaceholder')}
            />
            {resumeDoc && (
              <button
                type="button"
                onClick={() => setOverridePaste(false)}
                className="mt-1 text-xs text-blue-600 hover:underline"
              >
                {t('resumeMatch.useUploadedResumeInstead', { name: resumeDoc.name })}
              </button>
            )}
          </div>
        )}

        <button
          onClick={() => compute.mutate()}
          disabled={compute.isPending || (!usingUploadedResume && !resumeText.trim())}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          {compute.isPending ? (
            <>
              <Spinner tone="white" />
              {t('resumeMatch.checkingMatch')}
            </>
          ) : (
            <>🎯 {result ? t('resumeMatch.checkAgain') : t('resumeMatch.checkMatch')}</>
          )}
        </button>

        {compute.isError && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {getGqlErrorCode(compute.error) === AI_NOT_CONFIGURED_CODE ? (
              <>
                {t('resumeMatch.addApiKeyPrefix')}{' '}
                <Link to="/settings/profile" className="underline">
                  {t('resumeMatch.accountSettingsLinkText')}
                </Link>{' '}
                {t('resumeMatch.addApiKeySuffix')}
              </>
            ) : (
              getErrorMessage(compute.error)
            )}
          </p>
        )}
      </Card>

      {result && color && (
        <Card className="p-4 space-y-4">
          <div
            className={`rounded-xl border border-gray-100 dark:border-gray-700 ${color.bg} p-3 flex items-center gap-3`}
          >
            <svg width="52" height="52" viewBox="0 0 52 52" className="shrink-0">
              <circle
                cx="26"
                cy="26"
                r={radius}
                fill="none"
                strokeWidth="5"
                className="text-gray-200 dark:text-gray-700"
                stroke="currentColor"
              />
              <circle
                cx="26"
                cy="26"
                r={radius}
                fill="none"
                strokeWidth="5"
                stroke="currentColor"
                className={color.ring}
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                transform="rotate(-90 26 26)"
              />
              <text
                x="26"
                y="30"
                textAnchor="middle"
                fontSize="13"
                fontWeight="bold"
                fill="currentColor"
                className={color.ring}
              >
                {result.score}
              </text>
            </svg>
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                {t('resumeMatch.resumeMatchTitle')}
              </p>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color.badge}`}
              >
                {result.label}
              </span>
            </div>
          </div>

          {result.summary && (
            <p className="text-sm text-gray-700 dark:text-gray-300">{result.summary}</p>
          )}

          {result.matchedKeywords.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                {t('resumeMatch.matchedKeywords')}
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {result.matchedKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {result.missingKeywords.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                {t('resumeMatch.missingKeywords')}
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {result.missingKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
      <DocumentPreviewModal
        document={previewOpen && resumeDoc ? resumeDoc : null}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  );
}
