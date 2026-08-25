import { BarChart3, Bell } from 'lucide-react';
import { FeaturePageLayout } from '#/components/marketing/FeaturePageLayout';

const FUNNEL = [
  { label: 'Draft', value: 34, color: 'bg-gray-400' },
  { label: 'Applied', value: 21, color: 'bg-blue-500' },
  { label: 'Interview', value: 9, color: 'bg-purple-500' },
  { label: 'Offered', value: 3, color: 'bg-orange-500' },
  { label: 'Accepted', value: 1, color: 'bg-green-500' },
];

function AnalyticsMockup() {
  const max = FUNNEL[0].value;
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg shadow-gray-900/5 dark:border-gray-800 dark:bg-gray-800/50">
      <div className="border-b border-gray-200 px-5 py-3.5 text-base font-bold text-gray-900 dark:border-gray-800 dark:text-gray-100">
        Analytics
      </div>
      <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
        {[
          { value: '34', label: 'Total applications', color: 'text-gray-900 dark:text-gray-100' },
          { value: '9', label: 'Active', color: 'text-gray-900 dark:text-gray-100' },
          { value: '47%', label: 'Response rate', color: 'text-blue-600' },
          { value: '18%', label: 'Likely ghosted', color: 'text-orange-600' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-gray-200 p-3.5 dark:border-gray-700"
          >
            <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400">{stat.label}</div>
          </div>
        ))}
      </div>
      <div className="grid gap-3 px-5 pb-5 sm:grid-cols-[1.3fr_1fr]">
        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <div className="mb-3 text-xs font-bold text-gray-700 dark:text-gray-300">
            Pipeline funnel
          </div>
          <div className="flex h-24 items-end gap-2.5">
            {FUNNEL.map((stage) => (
              <div key={stage.label} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className={`w-full rounded-t ${stage.color}`}
                  style={{ height: `${(stage.value / max) * 100}%` }}
                />
                <span className="text-[9px] text-gray-400">{stage.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <div className="mb-3 text-xs font-bold text-gray-700 dark:text-gray-300">
            Response time
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            6.2<span className="text-sm font-medium text-gray-400"> days</span>
          </div>
          <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            median first response
          </div>
        </div>
      </div>
    </div>
  );
}

export function FeatureAnalyticsPage() {
  return (
    <FeaturePageLayout
      eyebrowIcon={BarChart3}
      eyebrowLabel="Analytics & insights"
      title="See what's actually working"
      description="Response rates, interview conversion, ghosting patterns, time-to-offer — the numbers behind your search, not just a list of applications."
      heroVisual={<AnalyticsMockup />}
      benefits={[
        {
          title: 'Your funnel, stage by stage',
          description:
            'See exactly where applications drop off — from draft through applied, interviewing, offered and accepted — instead of guessing why the pipeline feels stuck.',
          visual: (
            <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:divide-gray-700 dark:border-gray-800 dark:bg-gray-800/50">
              {[
                ['Applied', 21],
                ['Interviewing', 9],
                ['Offered', 3],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-gray-700 dark:text-gray-300">{label}</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100">{value}</span>
                </div>
              ))}
            </div>
          ),
        },
        {
          title: "Know when you're being ghosted",
          description:
            "Response rate and a likely-ghosted flag on applications that have gone quiet too long — so you know exactly when it's time to follow up instead of waiting indefinitely.",
          visual: (
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-5 dark:border-orange-900 dark:bg-orange-900/20">
              <div className="flex items-center gap-1.5 text-xs font-bold text-orange-700 dark:text-orange-400">
                <Bell className="size-3.5" />
                Likely ghosted
              </div>
              <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                Ashgrove Retail — applied 21 days ago, no response
              </div>
            </div>
          ),
        },
        {
          title: 'Where your offers come from',
          description:
            'Channel and response-time analytics show which sources — referrals, job boards, direct applications — are actually converting, so you can spend more time where it works.',
          visual: (
            <div className="space-y-2.5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-800/50">
              {[
                ['Referral', 82],
                ['Direct', 54],
                ['Job board', 28],
              ].map(([label, pct]) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="w-16 shrink-0 text-xs text-gray-500 dark:text-gray-400">
                    {label}
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
      ctaHeadline="See your numbers, not just your list"
    />
  );
}
