import { Link, useSearch } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { gqlClient } from '#/graphql/client';
import { useLocale } from '#/lib/i18n';
import { Alert, Button, FormLabel, Input } from '@trakwyn/ui';

const schema = z
  .object({
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
type FormValues = z.infer<typeof schema>;

const RESET_PASSWORD_MUTATION = `
  mutation ResetPassword($token: String!, $newPassword: String!) {
    resetPassword(token: $token, newPassword: $newPassword)
  }
`;

function extractGqlError(err: unknown): string | null {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const r = (err as { response?: { errors?: Array<{ message?: string }> } }).response;
    return r?.errors?.[0]?.message ?? null;
  }
  return null;
}

export function ResetPasswordPage() {
  const { t } = useLocale();
  const { token } = useSearch({ from: '/reset-password' });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
    setError,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormValues) => {
    if (!token) return;
    try {
      await gqlClient.request(RESET_PASSWORD_MUTATION, { token, newPassword: data.newPassword });
    } catch (err: unknown) {
      const msg = extractGqlError(err) ?? t('resetPassword.resetFailed');
      setError('root', { message: msg });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t('resetPassword.title')}
          </h1>
        </div>

        {!token ? (
          <Alert>{t('resetPassword.invalidLink')}</Alert>
        ) : isSubmitSuccessful ? (
          <Alert tone="success">{t('resetPassword.success')}</Alert>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <FormLabel>{t('security.newPasswordLabel')}</FormLabel>
              <Input
                type="password"
                {...register('newPassword')}
                invalid={!!errors.newPassword}
                placeholder="••••••••"
              />
              {errors.newPassword && (
                <p className="mt-1 text-xs text-red-600">{errors.newPassword.message}</p>
              )}
            </div>

            <div>
              <FormLabel>{t('security.confirmNewPasswordLabel')}</FormLabel>
              <Input
                type="password"
                {...register('confirmPassword')}
                invalid={!!errors.confirmPassword}
                placeholder="••••••••"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            {errors.root && <Alert>{errors.root.message}</Alert>}

            <Button type="submit" disabled={isSubmitting} fullWidth>
              {isSubmitting ? t('resetPassword.resetting') : t('resetPassword.resetPassword')}
            </Button>
          </form>
        )}

        <p className="text-sm text-gray-500 dark:text-gray-400">
          <Link to="/login" className="text-blue-600 hover:underline">
            {t('auth.backToSignIn')}
          </Link>
        </p>
      </div>
    </div>
  );
}
