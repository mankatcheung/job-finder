import { Link } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { gqlClient } from '#/graphql/client';
import { Alert, Button, FormLabel, Input } from '@trakwyn/ui';

const schema = z.object({
  email: z.string().email('Invalid email'),
});
type FormValues = z.infer<typeof schema>;

const REQUEST_PASSWORD_RESET_MUTATION = `
  mutation RequestPasswordReset($email: String!) {
    requestPasswordReset(email: $email)
  }
`;

const REQUEST_BACKUP_EMAIL_RECOVERY_MUTATION = `
  mutation RequestBackupEmailRecovery($backupEmail: String!) {
    requestBackupEmailRecovery(backupEmail: $backupEmail)
  }
`;

export function ForgotPasswordPage() {
  const [recoveryMode, setRecoveryMode] = useState<'primary' | 'backup'>('primary');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormValues) => {
    // Always resolves — the backend responds identically for known and unknown
    // emails so this form can't be used to enumerate accounts.
    if (recoveryMode === 'backup') {
      await gqlClient.request(REQUEST_BACKUP_EMAIL_RECOVERY_MUTATION, { backupEmail: data.email });
    } else {
      await gqlClient.request(REQUEST_PASSWORD_RESET_MUTATION, data);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Forgot your password?
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {recoveryMode === 'backup'
              ? 'Use your verified backup email to recover access.'
              : 'Enter your email and we&apos;ll send you a link to reset it.'}
          </p>
        </div>

        {isSubmitSuccessful ? (
          <Alert tone="success">
            If an account exists for that email, we&apos;ve sent a recovery link. Check your inbox.
          </Alert>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <FormLabel htmlFor="email">Email</FormLabel>
              <Input
                id="email"
                type="email"
                {...register('email')}
                invalid={!!errors.email}
                placeholder="you@example.com"
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>

            <Button type="submit" disabled={isSubmitting} fullWidth>
              {isSubmitting
                ? 'Sending…'
                : recoveryMode === 'backup'
                  ? 'Send recovery link'
                  : 'Send reset link'}
            </Button>
          </form>
        )}

        <Button
          variant="link"
          onClick={() => setRecoveryMode((mode) => (mode === 'primary' ? 'backup' : 'primary'))}
        >
          {recoveryMode === 'primary'
            ? 'Lost access to your primary email? Use a backup email.'
            : 'Use your primary email instead'}
        </Button>

        <p className="text-sm text-gray-500 dark:text-gray-400">
          <Link to="/login" className="text-blue-600 hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
