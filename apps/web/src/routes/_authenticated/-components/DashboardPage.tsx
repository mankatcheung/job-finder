import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ErrorState } from '#/components/ErrorState';
import { Card, Skeleton } from '@job-finder/ui';
import {
  AlertCircleIcon,
  BriefcaseIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  FileTextIcon,
  PlusIcon,
  StarIcon,
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import {
  applicationsQueryOptions,
  calendarEventsQueryOptions,
  weeklyApplicationGoalQueryOptions,
  type CalendarEventKind,
} from '../dashboard';

const UPCOMING_EVENT_ICON: Record<CalendarEventKind, React.ReactNode> = {
  interview: <CalendarIcon size={13} className="text-purple-500 shrink-0" />,
  followUp: <AlertCircleIcon size={13} className="text-amber-500 shrink-0" />,
  applied: <FileTextIcon size={13} className="text-blue-500 shrink-0" />,
};

const UPCOMING_EVENT_LABEL: Record<CalendarEventKind, string> = {
  interview: 'Interview',
  followUp: 'Follow up',
  applied: 'Applied',
};

export function DashboardPage() {
  const { data, isLoading, isError, error, refetch } = useQuery(applicationsQueryOptions);
  const { data: calendarData } = useQuery(calendarEventsQueryOptions);
  const { data: goalData } = useQuery(weeklyApplicationGoalQueryOptions);
  const goal = goalData?.weeklyApplicationGoal;

  const apps = data?.applications ?? [];
  const now = new Date();
  const counts = {
    total: apps.length,
    applied: apps.filter((a) => a.status === 'applied').length,
    interviewing: apps.filter((a) => a.status === 'interviewing').length,
    offered: apps.filter((a) => a.status === 'offered').length,
    overdue: apps.filter((a) => a.followUpAt && new Date(a.followUpAt) <= now).length,
  };

  const upcomingEvents = (calendarData?.calendarEvents ?? [])
    .filter((e) => e.type !== 'applied' && new Date(e.date) >= now)
    .slice(0, 5);

  const statItems = [
    { label: 'Total', value: counts.total, icon: <BriefcaseIcon size={20} />, color: 'blue' },
    { label: 'Applied', value: counts.applied, icon: <FileTextIcon size={20} />, color: 'indigo' },
    {
      label: 'Interviewing',
      value: counts.interviewing,
      icon: <ClockIcon size={20} />,
      color: 'yellow',
    },
    {
      label: 'Offered',
      value: counts.offered,
      icon: <CheckCircleIcon size={20} />,
      color: 'green',
    },
    {
      label: 'Follow-up due',
      value: counts.overdue,
      icon: <AlertCircleIcon size={20} />,
      color: 'orange',
    },
  ];

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <Link
          to="/applications/new"
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <PlusIcon size={15} />
          <span className="hidden sm:inline">New Application</span>
        </Link>
      </div>

      {/* Mobile: horizontal scrollable strip so 5 stats don't leave an orphaned card; sm+: grid */}
      <div className="flex sm:grid sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 overflow-x-auto sm:overflow-visible -mx-4 sm:mx-0 px-4 sm:px-0 pb-1 sm:pb-0 mb-8 sm:mb-10 snap-x snap-mandatory sm:snap-none">
        {statItems.map((item) => (
          <StatCard
            key={item.label}
            {...item}
            loading={isLoading}
            className="w-32 shrink-0 snap-start sm:w-auto sm:shrink sm:snap-align-none"
          />
        ))}
      </div>

      {goal && (
        <section className="mb-10 rounded-xl border border-blue-100 bg-blue-50 p-5 dark:border-blue-900/50 dark:bg-blue-900/20">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Weekly application goal
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                {goal.currentWeekCount} of {goal.weeklyApplicationGoal} applications this week
              </p>
            </div>
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
              {goal.streakWeeks} week{goal.streakWeeks === 1 ? '' : 's'} streak
            </p>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/80 dark:bg-gray-700">
            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{
                width: `${Math.min(100, (goal.currentWeekCount / goal.weeklyApplicationGoal) * 100)}%`,
              }}
            />
          </div>
        </section>
      )}

      {upcomingEvents.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Upcoming</h2>
            <Link to="/calendar" className="text-sm text-blue-600 hover:underline shrink-0">
              View calendar
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:overflow-x-auto sm:pb-1">
            {upcomingEvents.map((event) => (
              <Link
                key={event.id}
                to="/applications/$applicationId"
                params={{ applicationId: event.applicationId }}
                className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors sm:min-w-[220px] sm:flex-1"
              >
                {UPCOMING_EVENT_ICON[event.type]}
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {UPCOMING_EVENT_LABEL[event.type]} ·{' '}
                    {new Date(event.date).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {event.company}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{event.role}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Recent applications
        </h2>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : apps.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <BriefcaseIcon size={40} className="mx-auto mb-3 opacity-40" />
            <p>No applications yet.</p>
            <Link
              to="/applications/new"
              className="mt-2 inline-block text-blue-600 hover:underline text-sm"
            >
              Add your first one →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {apps.slice(0, 8).map((app) => {
              const isOverdue = app.followUpAt && new Date(app.followUpAt) <= now;
              return (
                <Link
                  key={app.id}
                  to="/applications/$applicationId"
                  params={{ applicationId: app.id }}
                  className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {app.starred && (
                      <StarIcon size={13} className="text-yellow-400 fill-yellow-400 shrink-0" />
                    )}
                    {isOverdue && (
                      <AlertCircleIcon size={13} className="text-orange-500 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                        {app.company}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{app.role}</p>
                    </div>
                  </div>
                  <StatusBadge status={app.status} />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  loading,
  className = '',
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  loading: boolean;
  className?: string;
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
    yellow: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  };
  return (
    <Card className={`p-4 ${className}`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${colors[color]}`}>
        {icon}
      </div>
      {loading ? (
        <div className="h-7 w-12 bg-gray-100 dark:bg-gray-700 rounded animate-pulse mb-1" />
      ) : (
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      )}
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
    </Card>
  );
}
