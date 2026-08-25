import { useQuery } from '@tanstack/react-query';
import { useLocale } from '#/lib/i18n';
import { Card, EmptyState, Skeleton } from '@trakwyn/ui';
import { documentVersionOutcomesQueryOptions } from './-document-version-outcomes-queries';

const DOCUMENT_TYPE_BADGE_STYLE: Record<string, string> = {
  resume: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  cover_letter: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
};

// Below this application count, an interview rate is more noise than signal
// — flagged as a small sample rather than hidden, since even a directional
// read can be useful (JEF-58's open question on statistical significance).
const SMALL_SAMPLE_THRESHOLD = 3;

/**
 * Turns per-application resume/cover-letter uploads into a longitudinal
 * view of which version tends to lead to interviews. Fetches independently
 * of the rest of the analytics page and degrades silently on error (no
 * retry button) — this is a supplementary insight, not critical path, and a
 * failure here shouldn't compete with the page's primary error state.
 */
export function DocumentVersionOutcomesPanel() {
  const { t } = useLocale();
  const DOCUMENT_TYPE_LABEL: Record<string, string> = {
    resume: t('documents.resume'),
    cover_letter: t('documentOutcomes.coverLetterLabel'),
  };
  const { data, isLoading } = useQuery(documentVersionOutcomesQueryOptions);

  if (isLoading) {
    return <Skeleton className="h-48 rounded-xl" />;
  }

  const outcomes = data?.documentVersionOutcomes;
  if (!outcomes) return null;

  return (
    <Card className="p-6">
      <h2 className="mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
        {t('documentOutcomes.title')}
      </h2>
      <p className="mb-4 text-xs text-gray-400 dark:text-gray-500">
        {t('documentOutcomes.description')}
      </p>

      {outcomes.length === 0 ? (
        <EmptyState size="compact" className="py-8" message={t('documentOutcomes.emptyMessage')} />
      ) : (
        <div className="space-y-3">
          {outcomes.map((o) => {
            const smallSample = o.applicationCount < SMALL_SAMPLE_THRESHOLD;
            return (
              <div
                key={`${o.documentType}::${o.version ?? ''}`}
                className="flex items-center gap-3 border-b border-gray-100 py-2 last:border-0 dark:border-gray-700"
              >
                <span
                  className={`shrink-0 rounded-sm px-1.5 py-0.5 text-[10px] font-medium ${
                    DOCUMENT_TYPE_BADGE_STYLE[o.documentType] ??
                    'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {DOCUMENT_TYPE_LABEL[o.documentType] ?? o.documentType}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-gray-900 dark:text-gray-100">
                  {o.version ?? (
                    <span className="text-gray-400 italic">{t('documentOutcomes.noVersion')}</span>
                  )}
                </span>
                <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
                  {t('documentOutcomes.interviewsCount', {
                    interviewCount: o.interviewCount,
                    applicationCount: o.applicationCount,
                  })}
                </span>
                <div className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                  <div className="h-full bg-purple-500" style={{ width: `${o.interviewRate}%` }} />
                </div>
                <span className="w-10 shrink-0 text-right text-xs font-medium text-gray-700 dark:text-gray-300">
                  {o.interviewRate}%
                </span>
                {smallSample && (
                  <span className="shrink-0 text-[10px] text-gray-400 dark:text-gray-500">
                    {t('interviewAnalytics.smallSample')}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
