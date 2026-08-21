import { useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { gqlClient } from '#/graphql/client';
import { queryClient } from '#/lib/queryClient';
import { useLocale } from '#/lib/i18n';
import { Alert, Button, FormLabel, Input } from '@trakwyn/ui';
import { DELETE_ACCOUNT, deleteSchema, type DeleteForm, extractGqlError } from './shared';
import { useStepUpReauth, STEP_UP_CANCELLED } from './useStepUpReauth';

/**
 * Account deletion, on its own page rather than sitting under Export and
 * Import (JEF-204). It is irreversible and password-gated, and burying the
 * one destructive action in the same page as two routine ones made it easy to
 * reach by accident and hard to find on purpose.
 */
export function SettingsDangerZonePage() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const { withStepUp, dialog: stepUpDialog } = useStepUpReauth();

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
      {stepUpDialog}
    </div>
  );
}
