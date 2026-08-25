import { BarChart3, Bell } from 'lucide-react';
import { FeaturePageLayout } from '#/components/marketing/FeaturePageLayout';
import { useLocale } from '#/lib/i18n';

const FUNNEL = [
  { statusKey: 'status.draft', value: 34, color: 'bg-gray-400' },
  { statusKey: 'status.applied', value: 21, color: 'bg-blue-500' },
  { statusKey: 'status.interviewing', value: 9, color: 'bg-purple-500' },
  { statusKey: 'status.offered', value: 3, color: 'bg-orange-500' },
  { statusKey: 'status.accepted', value: 1, color: 'bg-green-500' },
] as const;

function AnalyticsMockup() {
  const { t } = useLocale();
  const max = FUNNEL[0].value;
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg shadow-gray-900/5 dark:border-gray-800 dark:bg-gray-800/50">
      <div className="border-b border-gray-200 px-5 py-3.5 text-base font-bold text-gray-900 dark:border-gray-800 dark:text-gray-100">
        {t('features.analytics.panelTitle')}
      </div>
      <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
        {[
          {
            value: '34',
            labelKey: 'features.analytics.statTotal',
            color: 'text-gray-900 dark:text-gray-100',
          },
          {
            value: '9',
            labelKey: 'features.analytics.statActive',
            color: 'text-gray-900 dark:text-gray-100',
          },
          { value: '47%', labelKey: 'features.analytics.statResponseRate', color: 'text-blue-600' },
          { value: '18%', labelKey: 'features.analytics.statGhosted', color: 'text-orange-600' },
        ].map((stat) => (
          <div
            key={stat.labelKey}
            className="rounded-lg border border-gray-200 p-3.5 dark:border-gray-700"
          >
            <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400">{t(stat.labelKey)}</div>
          </div>
        ))}
      </div>
      <div className="grid gap-3 px-5 pb-5 sm:grid-cols-[1.3fr_1fr]">
        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <div className="mb-3 text-xs font-bold text-gray-700 dark:text-gray-300">
            {t('features.analytics.funnelTitle')}
          </div>
          <div className="flex h-24 items-end gap-2.5">
            {FUNNEL.map((stage) => (
              <div key={stage.statusKey} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className={`w-full rounded-t ${stage.color}`}
                  style={{ height: `${(stage.value / max) * 100}%` }}
                />
                <span className="text-[9px] text-gray-400">{t(stage.statusKey)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <div className="mb-3 text-xs font-bold text-gray-700 dark:text-gray-300">
            {t('features.analytics.responseTimeTitle')}
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            6.2
            <span className="text-sm font-medium text-gray-400">
              {' '}
              {t('features.analytics.daysUnit')}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            {t('features.analytics.medianFirstResponse')}
          </div>
        </div>
      </div>
    </div>
  );
}

export function FeatureAnalyticsPage() {
  const { t } = useLocale();
  return (
    <FeaturePageLayout
      eyebrowIcon={BarChart3}
      eyebrowLabel={t('features.analytics.eyebrow')}
      title={t('features.analytics.title')}
      description={t('features.analytics.description')}
      heroVisual={<AnalyticsMockup />}
      benefits={[
        {
          title: t('features.analytics.benefit1.title'),
          description: t('features.analytics.benefit1.description'),
          visual: (
            <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:divide-gray-700 dark:border-gray-800 dark:bg-gray-800/50">
              {(
                [
                  ['status.applied', 21],
                  ['status.interviewing', 9],
                  ['status.offered', 3],
                ] as const
              ).map(([statusKey, value]) => (
                <div key={statusKey} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-gray-700 dark:text-gray-300">{t(statusKey)}</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100">{value}</span>
                </div>
              ))}
            </div>
          ),
        },
        {
          title: t('features.analytics.benefit2.title'),
          description: t('features.analytics.benefit2.description'),
          visual: (
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-5 dark:border-orange-900 dark:bg-orange-900/20">
              <div className="flex items-center gap-1.5 text-xs font-bold text-orange-700 dark:text-orange-400">
                <Bell className="size-3.5" />
                {t('features.analytics.ghostedBadge')}
              </div>
              <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                {t('features.analytics.ghostedExample')}
              </div>
            </div>
          ),
        },
        {
          title: t('features.analytics.benefit3.title'),
          description: t('features.analytics.benefit3.description'),
          visual: (
            <div className="space-y-2.5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-800/50">
              {(
                [
                  ['features.analytics.channelReferral', 82],
                  ['features.analytics.channelDirect', 54],
                  ['features.analytics.channelJobBoard', 28],
                ] as const
              ).map(([channelKey, pct]) => (
                <div key={channelKey} className="flex items-center gap-3">
                  <span className="w-16 shrink-0 text-xs text-gray-500 dark:text-gray-400">
                    {t(channelKey)}
                  </span>
                  <div className="h-2 flex-1 rounded-full bg-gray-100 dark:bg-gray-700">
                    <div className="h-full rounded-full bg-blue-600" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ),
        },
      ]}
      ctaHeadline={t('features.analytics.ctaHeadline')}
    />
  );
}
