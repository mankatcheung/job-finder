import { DownloadIcon, UploadIcon } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { gqlClient } from '#/graphql/client';
import { queryClient } from '#/lib/queryClient';
import { Alert, Button, FormLabel, Input } from '@job-finder/ui';
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
      a.download = `job-finder-export-${new Date().toISOString().slice(0, 10)}.json`;
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
      setImportError(extractGqlError(err) ?? 'Failed to import data.');
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
        message: extractGqlError(err) ?? 'Failed to delete account.',
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
            Export your data
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Download all your applications, notes, and document metadata as a JSON file.
          </p>
        </div>
        <button
          type="button"
          onClick={onExport}
          aria-label="Download export"
          className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 text-sm font-medium rounded-lg transition-colors"
        >
          <DownloadIcon size={14} /> <span className="hidden sm:inline">Download export</span>
        </button>
      </section>

      <hr className="border-gray-200 dark:border-gray-700" />

      {/* ── Import ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Import your data
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Upload a JSON export file to recreate your applications and notes. Documents can&apos;t
            be restored from an export and will be skipped.
          </p>
        </div>
        <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 text-sm font-medium rounded-lg transition-colors cursor-pointer">
          <UploadIcon size={14} />{' '}
          <span className="hidden sm:inline">
            {importing ? 'Importing…' : 'Choose file to import'}
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
            Imported {importResult.applicationsImported} application
            {importResult.applicationsImported === 1 ? '' : 's'} and {importResult.notesImported}{' '}
            note{importResult.notesImported === 1 ? '' : 's'}.
            {importResult.applicationsSkipped > 0 &&
              ` Skipped ${importResult.applicationsSkipped} invalid application${importResult.applicationsSkipped === 1 ? '' : 's'}.`}
            {importResult.documentsSkipped > 0 &&
              ` Skipped ${importResult.documentsSkipped} document${importResult.documentsSkipped === 1 ? '' : 's'} (not supported).`}
          </p>
        )}
      </section>

      <hr className="border-gray-200 dark:border-gray-700" />

      {/* ── Danger zone ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-red-600">Danger zone</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Permanently delete your account and all associated data. This cannot be undone.
          </p>
        </div>
        <form onSubmit={deleteForm.handleSubmit(onDeleteAccount)} className="space-y-3">
          <div>
            <FormLabel>Confirm your password</FormLabel>
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
            {deleteForm.formState.isSubmitting ? 'Deleting…' : 'Delete my account'}
          </Button>
        </form>
      </section>
    </div>
  );
}
