import { LayoutDashboard, CalendarDays, Bell, FileText } from 'lucide-react';
import { FeaturePageLayout } from '#/components/marketing/FeaturePageLayout';
import { APPLICATION_STATUSES, statusColor } from '#/lib/statusColors';
import { useLocale } from '#/lib/i18n';

/** Sample board data — illustrative, not a live capture (JEF-228). */
const BOARD_CARDS: Partial<Record<(typeof APPLICATION_STATUSES)[number], string[]>> = {
  draft: ['Arden Health'],
  applied: ['Northwind Labs', 'Halcyon Data', 'Fernbridge'],
  interviewing: ['Verdant Systems', 'Solace Group'],
  offered: ['Mosaic & Co'],
  rejected: ['Ashgrove Retail'],
};

const SAMPLE_POSTING_URL = 'northwindlabs.com/careers/senior-designer';

function BoardMockup() {
  const { t } = useLocale();
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg shadow-gray-900/5 dark:border-gray-800 dark:bg-gray-800/50">
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3.5 dark:border-gray-800">
        <span className="text-base font-bold text-gray-900 dark:text-gray-100">
          {t('features.tracking.boardLabel')}
        </span>
        <span className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white">
          {t('features.tracking.addApplicationShort')}
        </span>
      </div>
      <div className="flex gap-2.5 overflow-x-auto bg-gray-50 p-4 dark:bg-gray-900/40">
        {APPLICATION_STATUSES.map((status) => {
          const colors = statusColor(status);
          const cards = BOARD_CARDS[status] ?? [];
          return (
            <div
              key={status}
              className={`w-40 shrink-0 rounded-lg border border-t-4 border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 ${colors.columnBorder}`}
            >
              <div className="flex items-center justify-between px-2.5 py-2">
                <span className={`text-[11px] font-bold ${colors.columnHeading}`}>
                  {t(`status.${status}`)}
                </span>
                <span className="rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                  {cards.length}
                </span>
              </div>
              <div className="flex flex-col gap-1.5 px-1.5 pb-2">
                {cards.map((card) => (
                  <div
                    key={card}
                    className="rounded-md border border-gray-200 px-2 py-1.5 text-[11px] font-medium text-gray-700 dark:border-gray-700 dark:text-gray-300"
                  >
                    {card}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function FeatureTrackingPage() {
  const { t } = useLocale();
  return (
    <FeaturePageLayout
      eyebrowIcon={LayoutDashboard}
      eyebrowLabel={t('features.tracking.eyebrow')}
      title={t('features.tracking.title')}
      description={t('features.tracking.description')}
      heroVisual={<BoardMockup />}
      benefits={[
        {
          title: t('features.tracking.benefit1.title'),
          description: t('features.tracking.benefit1.description'),
          visual: (
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-800/50">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                {t('features.tracking.jobPostingUrl')}
              </div>
              <div className="mt-2 rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 dark:border-gray-600 dark:text-gray-300">
                {SAMPLE_POSTING_URL}
              </div>
              <div className="mt-3.5 inline-block rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white">
                {t('features.tracking.addApplication')}
              </div>
            </div>
          ),
        },
        {
          title: t('features.tracking.benefit2.title'),
          description: t('features.tracking.benefit2.description'),
          visual: (
            <div className="flex gap-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-800/50">
              <div className="flex-1 rounded-lg bg-blue-50 px-2 py-2.5 text-center text-xs font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                {t('features.tracking.boardLabel')}
              </div>
              <div className="flex-1 rounded-lg px-2 py-2.5 text-center text-xs font-semibold text-gray-400">
                {t('features.tracking.listLabel')}
              </div>
            </div>
          ),
        },
        {
          title: t('features.tracking.benefit3.title'),
          description: t('features.tracking.benefit3.description'),
          visual: (
            <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:divide-gray-700 dark:border-gray-800 dark:bg-gray-800/50">
              <div className="flex items-center gap-2.5 py-2.5 text-sm text-gray-700 dark:text-gray-300">
                <CalendarDays className="size-4 shrink-0 text-blue-600" />
                {t('features.tracking.reminderInterview')}
              </div>
              <div className="flex items-center gap-2.5 py-2.5 text-sm text-gray-700 dark:text-gray-300">
                <Bell className="size-4 shrink-0 text-blue-600" />
                {t('features.tracking.reminderFollowUp')}
              </div>
              <div className="flex items-center gap-2.5 py-2.5 text-sm text-gray-700 dark:text-gray-300">
                <FileText className="size-4 shrink-0 text-blue-600" />
                {t('features.tracking.reminderDocument')}
              </div>
            </div>
          ),
        },
      ]}
      ctaHeadline={t('features.tracking.ctaHeadline')}
    />
  );
}
