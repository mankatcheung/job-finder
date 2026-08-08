import { Link, useSearch } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { gqlClient } from '#/graphql/client';

const CONFIRM_BACKUP_EMAIL = `
  mutation ConfirmBackupEmail($token: String!) {
    confirmBackupEmail(token: $token)
  }
`;

export function ConfirmBackupEmailPage() {
  const { token } = useSearch({ from: '/confirm-backup-email' });
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    token ? 'loading' : 'error',
  );

  useEffect(() => {
    if (!token) return;
    gqlClient
      .request(CONFIRM_BACKUP_EMAIL, { token })
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Verify backup email</h1>
        {status === 'loading' && <p className="text-sm text-gray-500">Verifying your email…</p>}
        {status === 'success' && (
          <p className="text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-3">
            Your backup email is verified and can now be used for account recovery.
          </p>
        )}
        {status === 'error' && (
          <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-3">
            This verification link is invalid or expired. Request a new one from Security settings.
          </p>
        )}
        <Link to="/login" className="text-sm text-blue-600 hover:underline">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
