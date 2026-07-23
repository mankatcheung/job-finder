import { useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { gqlClient } from '#/graphql/client';

const searchSchema = z.object({ token: z.string().optional() });

const VERIFY_EMAIL_MUTATION = `
  mutation VerifyEmail($token: String!) {
    verifyEmail(token: $token)
  }
`;

export const Route = createFileRoute('/verify-email')({
  validateSearch: searchSchema,
  component: VerifyEmailPage,
});

type Status = 'verifying' | 'success' | 'error';

export function VerifyEmailPage() {
  const { token } = Route.useSearch();
  const [status, setStatus] = useState<Status>(token ? 'verifying' : 'error');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    gqlClient
      .request(VERIFY_EMAIL_MUTATION, { token })
      .then(() => {
        if (!cancelled) setStatus('success');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setErrorMessage(extractGqlError(err) ?? 'Failed to verify email.');
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Verify your email</h1>
        </div>

        {status === 'verifying' && (
          <p className="text-sm text-gray-500 dark:text-gray-400">Verifying your email…</p>
        )}

        {status === 'success' && (
          <p className="text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-3">
            Your email has been verified.
          </p>
        )}

        {status === 'error' && (
          <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-3">
            {token ? errorMessage : 'This verification link is invalid.'}
          </p>
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
