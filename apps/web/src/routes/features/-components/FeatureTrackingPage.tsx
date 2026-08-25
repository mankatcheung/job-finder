import { LayoutDashboard, CalendarDays, Bell, FileText } from 'lucide-react';
import { FeaturePageLayout } from '#/components/marketing/FeaturePageLayout';
import { APPLICATION_STATUSES, statusColor } from '#/lib/statusColors';

/** Sample board data — illustrative, not a live capture (JEF-228). */
const BOARD_CARDS: Partial<Record<(typeof APPLICATION_STATUSES)[number], string[]>> = {
  draft: ['Arden Health'],
  applied: ['Northwind Labs', 'Halcyon Data', 'Fernbridge'],
  interviewing: ['Verdant Systems', 'Solace Group'],
  offered: ['Mosaic & Co'],
  rejected: ['Ashgrove Retail'],
};

function BoardMockup() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg shadow-gray-900/5 dark:border-gray-800 dark:bg-gray-800/50">
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3.5 dark:border-gray-800">
        <span className="text-base font-bold text-gray-900 dark:text-gray-100">Board</span>
        <span className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white">
          + Add application
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
                <span className={`text-[11px] font-bold capitalize ${colors.columnHeading}`}>
                  {status}
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
  return (
    <FeaturePageLayout
      eyebrowIcon={LayoutDashboard}
      eyebrowLabel="Application tracking"
      title="Every application, one board"
      description="Stop losing track in spreadsheets and email threads. See your whole pipeline at a glance, and move things forward with a drag."
      heroVisual={<BoardMockup />}
      benefits={[
        {
          title: 'Add a job in seconds',
          description:
            'Paste a posting URL and the details fill themselves in, or add one manually in a few fields. Either way it lands on the board as a draft, ready to move.',
          visual: (
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-800/50">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                Job posting URL
              </div>
              <div className="mt-2 rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 dark:border-gray-600 dark:text-gray-300">
                northwindlabs.com/careers/senior-designer
              </div>
              <div className="mt-3.5 inline-block rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white">
                Add application
              </div>
            </div>
          ),
        },
        {
          title: 'Board or list — your call',
          description:
            "Drag a card between columns when you want the visual pipeline. Switch to a sortable, filterable list when you'd rather scan everything at once. Same data, either view.",
          visual: (
            <div className="flex gap-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-800/50">
              <div className="flex-1 rounded-lg bg-blue-50 px-2 py-2.5 text-center text-xs font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                Board
              </div>
              <div className="flex-1 rounded-lg px-2 py-2.5 text-center text-xs font-semibold text-gray-400">
                List
              </div>
            </div>
          ),
        },
        {
          title: 'Nothing slips through',
          description:
            'Every application carries its own notes, contacts, documents and activity log. Interview and follow-up reminders fire on their own, so a promising lead never just goes quiet on you.',
          visual: (
            <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:divide-gray-700 dark:border-gray-800 dark:bg-gray-800/50">
              <div className="flex items-center gap-2.5 py-2.5 text-sm text-gray-700 dark:text-gray-300">
                <CalendarDays className="size-4 shrink-0 text-blue-600" />
                Phone screen — tomorrow, 2:00 PM
              </div>
              <div className="flex items-center gap-2.5 py-2.5 text-sm text-gray-700 dark:text-gray-300">
                <Bell className="size-4 shrink-0 text-blue-600" />
                Follow up with Fernbridge — 14 days, no reply
              </div>
              <div className="flex items-center gap-2.5 py-2.5 text-sm text-gray-700 dark:text-gray-300">
                <FileText className="size-4 shrink-0 text-blue-600" />
                Resume_v3.pdf attached
              </div>
            </div>
          ),
        },
      ]}
      ctaHeadline="Put your search on one board"
    />
  );
}
