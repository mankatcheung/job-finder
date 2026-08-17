import { DownloadIcon, UploadIcon } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { gqlClient } from '#/graphql/client';
import { queryClient } from '#/lib/queryClient';
import { useLocale } from '#/lib/i18n';
import { Alert, Button, FormLabel, Input } from '@trakwyn/ui';
import {
  EXPORT_USER_DATA,
  IMPORT_USER_DATA,
  DELETE_ACCOUNT,
  deleteSchema,
  type DeleteForm,
  type ImportSummary,
  extractGqlError,
} from './shared';
import { useStepUpReauth, STEP_UP_CANCELLED } from './useStepUpReauth';

export function SettingsDataPage() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const { withStepUp, dialog: stepUpDialog } = useStepUpReauth();

  // Export
  const onExport = async () => {
    try {
      const res = await gqlClient.request<{ exportUserData: string }>(EXPORT_USER_DATA);
      const blob = new Blob([res.exportUserData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trakwyn-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silent — export errors are non-critical
    }
  };

  // Import
  const [importResult, setImportResult] = useState<ImportSummary | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const onImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setImporting(true);
    setImportResult(null);
    setImportError(null);
    try {
      const text = await file.text();
      const res = await gqlClient.request<{ importUserData: ImportSummary }>(IMPORT_USER_DATA, {
        data: text,
      });
      setImportResult(res.importUserData);
    } catch (err) {
      setImportError(extractGqlError(err) ?? t('data.importFailed'));
    } finally {
      setImporting(false);
    }
  };

  // Delete form
  const deleteForm = useForm<DeleteForm>({ resolver: zodResolver(deleteSchema) });
  const onDeleteAccount = async (data: DeleteForm) => {
    try {
      await withStepUp(() => gqlClient.request(DELETE_ACCOUNT, data));
      queryClient.clear();
      await navigate({ to: '/login' });
    } catch (err) {
      if (err instanceof Error && err.message === STEP_UP_CANCELLED) return;
      deleteForm.setError('root', {
        message: extractGqlError(err) ?? t('data.deleteAccountFailed'),
      });
    }
  };

  return (
    <div className="space-y-10">
      {stepUpDialog}
      {/* ── Export ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {t('data.exportTitle')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('data.exportDescription')}</p>
        </div>
        <button
          type="button"
          onClick={onExport}
          aria-label={t('data.downloadExport')}
          className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 text-sm font-medium rounded-lg transition-colors"
        >
          <DownloadIcon size={14} />{' '}
          <span className="hidden sm:inline">{t('data.downloadExport')}</span>
        </button>
      </section>

      <hr className="border-gray-200 dark:border-gray-700" />

      {/* ── Import ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {t('data.importTitle')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('data.importDescription')}</p>
        </div>
        <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 text-sm font-medium rounded-lg transition-colors cursor-pointer">
          <UploadIcon size={14} />{' '}
          <span className="hidden sm:inline">
            {importing ? t('data.importing') : t('data.chooseFileToImport')}
          </span>
          <input
            type="file"
            accept="application/json"
            onChange={onImport}
            disabled={importing}
            className="hidden"
          />
        </label>
        {importError && <Alert>{importError}</Alert>}
        {importResult && (
          <p className="text-sm text-green-600">
            {t('data.importedApplications', { count: importResult.applicationsImported })}{' '}
            {t('data.andNotes', { count: importResult.notesImported })}
            {importResult.applicationsSkipped > 0 &&
              ` ${t('data.skippedApplications', { count: importResult.applicationsSkipped })}`}
            {importResult.documentsSkipped > 0 &&
              ` ${t('data.skippedDocuments', { count: importResult.documentsSkipped })}`}
          </p>
        )}
      </section>

      <hr className="border-gray-200 dark:border-gray-700" />

      {/* ── Danger zone ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-red-600">{t('data.dangerZoneTitle')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('data.dangerZoneDescription')}
          </p>
        </div>
        <form onSubmit={deleteForm.handleSubmit(onDeleteAccount)} className="space-y-3">
          <div>
            <FormLabel>{t('data.confirmPasswordLabel')}</FormLabel>
            <Input
              type="password"
              {...deleteForm.register('password')}
              invalid={!!deleteForm.formState.errors.password}
              placeholder="••••••••"
            />
            {deleteForm.formState.errors.password && (
              <p className="mt-1 text-xs text-red-600">
                {deleteForm.formState.errors.password.message}
              </p>
            )}
          </div>
          {deleteForm.formState.errors.root && (
            <Alert>{deleteForm.formState.errors.root.message}</Alert>
          )}
          <Button type="submit" variant="destructive" disabled={deleteForm.formState.isSubmitting}>
            {deleteForm.formState.isSubmitting ? t('data.deleting') : t('data.deleteMyAccount')}
          </Button>
        </form>
      </section>
    </div>
  );
}
