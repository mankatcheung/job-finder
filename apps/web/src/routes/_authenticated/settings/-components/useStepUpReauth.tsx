import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { gqlClient } from '#/graphql/client';
import { useLocale } from '#/lib/i18n';
import { Alert, Button, FormLabel, Input, Modal } from '@trakwyn/ui';
import {
  REAUTHENTICATE,
  reauthSchema,
  type ReauthForm,
  type ReauthenticateResult,
  extractGqlError,
  extractGqlErrorCode,
} from './shared';

/** Thrown to the caller of `withStepUp` when the user dismisses the reauth dialog instead of completing it. */
export const STEP_UP_CANCELLED = 'step-up-cancelled';

interface PendingStepUp {
  retry: () => void;
  reject: (err: unknown) => void;
}

/**
 * Wraps a mutation call so a STEP_UP_REQUIRED error — thrown when a
 * TOTP-enabled account's session is stale (JEF-44) — transparently opens a
 * "confirm it's you" dialog and retries the original call once reauth
 * succeeds, instead of surfacing a raw GraphQL error to the caller.
 */
export function useStepUpReauth(): {
  withStepUp: <T>(fn: () => Promise<T>) => Promise<T>;
  dialog: React.ReactNode;
} {
  const [pending, setPending] = useState<PendingStepUp | null>(null);

  function withStepUp<T>(fn: () => Promise<T>): Promise<T> {
    return fn().catch((err: unknown) => {
      if (extractGqlErrorCode(err) !== 'STEP_UP_REQUIRED') throw err;
      return new Promise<T>((resolve, reject) => {
        setPending({
          retry: () => {
            setPending(null);
            fn().then(resolve, reject);
          },
          reject: (cancelErr) => {
            setPending(null);
            reject(cancelErr);
          },
        });
      });
    });
  }

  const dialog = pending ? (
    <StepUpReauthDialog
      onSuccess={pending.retry}
      onCancel={() => pending.reject(new Error(STEP_UP_CANCELLED))}
    />
  ) : null;

  return { withStepUp, dialog };
}

function StepUpReauthDialog({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { t } = useLocale();
  const form = useForm<ReauthForm>({ resolver: zodResolver(reauthSchema) });
  const [totpRequired, setTotpRequired] = useState(false);

  const onSubmit = async (data: ReauthForm) => {
    try {
      const res = await gqlClient.request<{ reauthenticate: ReauthenticateResult }>(
        REAUTHENTICATE,
        { password: data.password, code: data.code || undefined },
      );
      if (res.reauthenticate.totpRequired) {
        setTotpRequired(true);
        return;
      }
      onSuccess();
    } catch (err) {
      form.setError('root', {
        message: extractGqlError(err) ?? t('stepUpReauth.verificationFailed'),
      });
    }
  };

  return (
    <Modal open onClose={onCancel} size="sm">
      <div className="space-y-4 p-6">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {t('stepUpReauth.title')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('stepUpReauth.description')}
          </p>
        </div>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <FormLabel>{t('auth.password')}</FormLabel>
            <Input
              type="password"
              {...form.register('password')}
              invalid={!!form.formState.errors.password}
              placeholder="••••••••"
              autoFocus
            />
            {form.formState.errors.password && (
              <p className="mt-1 text-xs text-red-600">{form.formState.errors.password.message}</p>
            )}
          </div>
          {totpRequired && (
            <div>
              <FormLabel>{t('stepUpReauth.twoFactorCodeLabel')}</FormLabel>
              <Input
                type="text"
                inputMode="numeric"
                {...form.register('code')}
                invalid={!!form.formState.errors.code}
                placeholder="123456"
                autoFocus
              />
              {form.formState.errors.code && (
                <p className="mt-1 text-xs text-red-600">{form.formState.errors.code.message}</p>
              )}
            </div>
          )}
          {form.formState.errors.root && <Alert>{form.formState.errors.root.message}</Alert>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="link" onClick={onCancel}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting
                ? t('auth.verifying')
                : totpRequired
                  ? t('stepUpReauth.verifyCode')
                  : t('security.confirm')}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
