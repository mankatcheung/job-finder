import { useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { gqlClient } from '#/graphql/client';
import { Alert } from '@trakwyn/ui';

const searchSchema = z.object({ token: z.string().optional() });

const CONFIRM_EMAIL_CHANGE_MUTATION = `
  mutation ConfirmEmailChange($token: String!) {
    confirmEmailChange(token: $token)
  }
`;

export const Route = createFileRoute('/confirm-email-change')({
  validateSearch: searchSchema,
  component: ConfirmEmailChangePage,
});

type Status = 'confirming' | 'success' | 'error';

function ConfirmEmailChangePage() {
  const { token } = Route.useSearch();
  const [status, setStatus] = useState<Status>(token ? 'confirming' : 'error');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    gqlClient
      .request(CONFIRM_EMAIL_CHANGE_MUTATION, { token })
      .then(() => {
        if (!cancelled) setStatus('success');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setErrorMessage(extractGqlError(err) ?? 'Failed to confirm email change.');
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Confirm email change
          </h1>
        </div>

        {status === 'confirming' && (
          <p className="text-sm text-gray-500 dark:text-gray-400">Confirming your new email…</p>
        )}

        {status === 'success' && (
          <Alert tone="success">
            Your email address has been updated. Sign in again with your new email.
          </Alert>
        )}

        {status === 'error' && (
          <Alert>{token ? errorMessage : 'This confirmation link is invalid.'}</Alert>
        )}

        <p className="text-sm text-gray-500 dark:text-gray-400">
          <a href="/login" className="text-blue-600 hover:underline">
            Back to sign in
          </a>
        </p>
      </div>
    </div>
  );
}

function extractGqlError(err: unknown): string | null {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const r = (err as { response?: { errors?: Array<{ message?: string }> } }).response;
    return r?.errors?.[0]?.message ?? null;
  }
  return null;
}
