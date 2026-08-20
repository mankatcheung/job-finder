import { Link } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { gqlClient } from '#/graphql/client';
import { getErrorMessage } from '#/lib/errors';
import { ErrorState } from '#/components/ErrorState';
import { useLocale } from '#/lib/i18n';
import { Card, Skeleton } from '@trakwyn/ui';
import { RotateCcwIcon, Trash2Icon, TrashIcon } from 'lucide-react';
import { StatusBadge } from '../../-components/StatusBadge';
import {
  PERMANENTLY_DELETE_APPLICATION,
  RESTORE_APPLICATION,
  daysUntilPurge,
  trashedApplicationsQueryOptions,
  type TrashedApplication,
} from '../-trash-queries';

function CountdownLabel({ application }: { application: TrashedApplication }) {
  const { t } = useLocale();
  const days = daysUntilPurge(application.purgeAt);
  if (days === null) return null;
  return (
    <span className={days <= 3 ? 'text-red-600 dark:text-red-400' : undefined}>
      {days === 0 ? t('trash.deletesToday') : t('trash.deletesInDays', { count: days })}
    </span>
  );
}

export function TrashPage() {
  const { t } = useLocale();
  const qc = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useQuery(trashedApplicationsQueryOptions());

  // Both actions change what the applications list and the trash list contain,
  // so they invalidate the whole 'applications' prefix rather than trying to
  // patch two caches by hand.
  const invalidate = () => qc.invalidateQueries({ queryKey: ['applications'] });

  const restore = useMutation({
    mutationFn: (id: string) => gqlClient.request(RESTORE_APPLICATION, { id }),
    onSuccess: () => {
      invalidate();
      toast.success(t('trash.restoredToast'));
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const purge = useMutation({
    mutationFn: (id: string) => gqlClient.request(PERMANENTLY_DELETE_APPLICATION, { id }),
    onSuccess: () => {
      invalidate();
      toast.success(t('trash.permanentlyDeletedToast'));
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const applications = data?.trashedApplications ?? [];

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto">
      <div className="mb-4">
        <Link
          to="/applications"
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          {t('applicationForm.backToApplications')}
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('trash.title')}</h1>
      <p className="mt-1 mb-6 text-sm text-gray-500 dark:text-gray-400">{t('trash.description')}</p>

      {isError && <ErrorState error={error} onRetry={() => refetch()} />}

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
      )}

      {!isLoading && !isError && applications.length === 0 && (
        <div className="text-center py-12">
          <TrashIcon size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400">{t('trash.empty')}</p>
        </div>
      )}

      <ul className="space-y-3">
        {applications.map((app) => (
          <li key={app.id}>
            <Card className="p-4">
              <div className="flex items-start justify-between gap-x-3 gap-y-2 flex-wrap">
                <div className="min-w-0">
                  <Link
                    to="/applications/$applicationId"
                    params={{ applicationId: app.id }}
                    className="font-semibold text-gray-900 dark:text-gray-100 hover:underline"
                  >
                    {app.company}
                  </Link>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{app.role}</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <CountdownLabel application={app} />
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={app.status} />
                  <button
                    type="button"
                    onClick={() => restore.mutate(app.id)}
                    disabled={restore.isPending || purge.isPending}
                    aria-label={t('trash.restoreAria', { company: app.company })}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                  >
                    <RotateCcwIcon size={14} />
                    <span className="hidden sm:inline">{t('trash.restore')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // No undo path exists past this point, so unlike the
                      // soft delete on the list page this asks up front.
                      if (!confirm(t('trash.deleteForeverConfirm', { company: app.company })))
                        return;
                      purge.mutate(app.id);
                    }}
                    disabled={restore.isPending || purge.isPending}
                    aria-label={t('trash.deleteForeverAria', { company: app.company })}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors"
                  >
                    <Trash2Icon size={14} />
                    <span className="hidden sm:inline">{t('trash.deleteForever')}</span>
                  </button>
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
