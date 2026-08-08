import { UnlinkIcon, CheckIcon, LogOutIcon, BanIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { gqlClient } from '#/graphql/client';
import {
  REQUEST_EMAIL_CHANGE,
  UPDATE_PASSWORD,
  LINKED_OAUTH_ACCOUNTS_QUERY,
  UNLINK_OAUTH_ACCOUNT,
  TOTP_ENABLED_QUERY,
  BEGIN_TOTP_SETUP,
  CONFIRM_TOTP_SETUP,
  DISABLE_TOTP,
  SESSIONS_QUERY,
  REVOKE_SESSION,
  REVOKE_OTHER_SESSIONS,
  SECURITY_ACTIVITY,
  emailSchema,
  passwordSchema,
  totpBeginSchema,
  totpConfirmSchema,
  totpDisableSchema,
  type EmailForm,
  type PasswordForm,
  type TotpBeginForm,
  type TotpConfirmForm,
  type TotpDisableForm,
  type TotpSetup,
  type LinkedOAuthAccount,
  type Session,
  type SecurityActivityItem,
  OAUTH_PROVIDER_LABEL,
  SECURITY_EVENT_LABEL,
  describeDevice,
  inputCls,
  labelCls,
  extractGqlError,
} from './shared';
import { useStepUpReauth, STEP_UP_CANCELLED } from './useStepUpReauth';

export function SettingsSecurityPage() {
  const qc = useQueryClient();
  const { withStepUp, dialog: stepUpDialog } = useStepUpReauth();

  // Email form
  const emailForm = useForm<EmailForm>({ resolver: zodResolver(emailSchema) });
  const onUpdateEmail = async (data: EmailForm) => {
    try {
      await withStepUp(() => gqlClient.request(REQUEST_EMAIL_CHANGE, data));
      emailForm.reset();
      emailForm.setError('root', { message: '' });
    } catch (err) {
      if (err instanceof Error && err.message === STEP_UP_CANCELLED) return;
      emailForm.setError('root', { message: extractGqlError(err) ?? 'Failed to update email.' });
    }
  };

  // Password form
  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });
  const onUpdatePassword = async ({ currentPassword, newPassword }: PasswordForm) => {
    try {
      await withStepUp(() => gqlClient.request(UPDATE_PASSWORD, { currentPassword, newPassword }));
      passwordForm.reset();
    } catch (err) {
      if (err instanceof Error && err.message === STEP_UP_CANCELLED) return;
      passwordForm.setError('root', {
        message: extractGqlError(err) ?? 'Failed to update password.',
      });
    }
  };

  // Linked OAuth accounts
  const { data: linkedAccountsData } = useQuery({
    queryKey: ['linkedOAuthAccounts'],
    queryFn: () =>
      gqlClient.request<{ linkedOAuthAccounts: LinkedOAuthAccount[] }>(LINKED_OAUTH_ACCOUNTS_QUERY),
  });
  const linkedAccounts = linkedAccountsData?.linkedOAuthAccounts ?? [];
  const [unlinkError, setUnlinkError] = useState<string | null>(null);
  const onUnlink = async (provider: LinkedOAuthAccount['provider']) => {
    setUnlinkError(null);
    try {
      await gqlClient.request(UNLINK_OAUTH_ACCOUNT, { provider });
      await qc.invalidateQueries({ queryKey: ['linkedOAuthAccounts'] });
    } catch (err) {
      setUnlinkError(extractGqlError(err) ?? 'Failed to unlink account.');
    }
  };

  // Two-factor authentication
  const { data: totpData } = useQuery({
    queryKey: ['totpEnabled'],
    queryFn: () => gqlClient.request<{ totpEnabled: boolean }>(TOTP_ENABLED_QUERY),
  });
  const totpEnabled = totpData?.totpEnabled ?? false;
  const [totpSetup, setTotpSetup] = useState<TotpSetup | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);

  const totpBeginForm = useForm<TotpBeginForm>({ resolver: zodResolver(totpBeginSchema) });
  const onBeginTotpSetup = async (data: TotpBeginForm) => {
    try {
      const res = await gqlClient.request<{ beginTotpSetup: TotpSetup }>(BEGIN_TOTP_SETUP, data);
      setTotpSetup(res.beginTotpSetup);
      totpBeginForm.reset();
    } catch (err) {
      totpBeginForm.setError('root', {
        message: extractGqlError(err) ?? 'Failed to start two-factor setup.',
      });
    }
  };

  const totpConfirmForm = useForm<TotpConfirmForm>({ resolver: zodResolver(totpConfirmSchema) });
  const onConfirmTotpSetup = async (data: TotpConfirmForm) => {
    try {
      const res = await gqlClient.request<{ confirmTotpSetup: { backupCodes: string[] } }>(
        CONFIRM_TOTP_SETUP,
        data,
      );
      setTotpSetup(null);
      setBackupCodes(res.confirmTotpSetup.backupCodes);
      totpConfirmForm.reset();
      await qc.invalidateQueries({ queryKey: ['totpEnabled'] });
    } catch (err) {
      totpConfirmForm.setError('root', {
        message: extractGqlError(err) ?? 'Invalid code. Please try again.',
      });
    }
  };

  const totpDisableForm = useForm<TotpDisableForm>({ resolver: zodResolver(totpDisableSchema) });
  const onDisableTotp = async (data: TotpDisableForm) => {
    try {
      await gqlClient.request(DISABLE_TOTP, data);
      totpDisableForm.reset();
      setBackupCodes(null);
      await qc.invalidateQueries({ queryKey: ['totpEnabled'] });
    } catch (err) {
      totpDisableForm.setError('root', {
        message: extractGqlError(err) ?? 'Failed to disable two-factor authentication.',
      });
    }
  };

  // Active sessions
  const { data: sessionsData } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => gqlClient.request<{ sessions: Session[] }>(SESSIONS_QUERY),
  });
  const sessions = sessionsData?.sessions ?? [];

  const onRevokeSession = async (id: string) => {
    await gqlClient.request(REVOKE_SESSION, { id });
    await qc.invalidateQueries({ queryKey: ['sessions'] });
  };

  const onRevokeOtherSessions = async () => {
    await gqlClient.request(REVOKE_OTHER_SESSIONS);
    await qc.invalidateQueries({ queryKey: ['sessions'] });
  };

  // Security activity (logins, password/email changes, 2FA toggles, session revocations)
  const [securityActivity, setSecurityActivity] = useState<SecurityActivityItem[] | null>(null);
  const [securityActivityError, setSecurityActivityError] = useState<string | null>(null);
  useEffect(() => {
    gqlClient
      .request<{ securityActivity: SecurityActivityItem[] }>(SECURITY_ACTIVITY)
      .then((res) => setSecurityActivity(res.securityActivity))
      .catch((err) =>
        setSecurityActivityError(extractGqlError(err) ?? 'Failed to load security activity.'),
      );
  }, []);

  return (
    <div className="space-y-10">
      {stepUpDialog}
      {/* ── Email ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Email address
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Update the email you sign in with. We&apos;ll send a confirmation link to the new
            address before the change takes effect.
          </p>
        </div>
        <form onSubmit={emailForm.handleSubmit(onUpdateEmail)} className="space-y-3">
          <div>
            <label className={labelCls}>Current password</label>
            <input
              type="password"
              {...emailForm.register('currentPassword')}
              className={inputCls}
              placeholder="••••••••"
            />
            {emailForm.formState.errors.currentPassword && (
              <p className="mt-1 text-xs text-red-600">
                {emailForm.formState.errors.currentPassword.message}
              </p>
            )}
          </div>
          <div>
            <label className={labelCls}>New email</label>
            <input
              type="email"
              {...emailForm.register('newEmail')}
              className={inputCls}
              placeholder="you@example.com"
            />
            {emailForm.formState.errors.newEmail && (
              <p className="mt-1 text-xs text-red-600">
                {emailForm.formState.errors.newEmail.message}
              </p>
            )}
          </div>
          {emailForm.formState.errors.root?.message && (
            <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
              {emailForm.formState.errors.root.message}
            </p>
          )}
          {emailForm.formState.isSubmitSuccessful && !emailForm.formState.errors.root?.message && (
            <p className="text-sm text-green-600">
              Confirmation link sent. Check the new address&apos;s inbox to complete the change.
            </p>
          )}
          <button
            type="submit"
            disabled={emailForm.formState.isSubmitting}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {emailForm.formState.isSubmitting ? 'Sending…' : 'Update email'}
          </button>
        </form>
      </section>

      <hr className="border-gray-200 dark:border-gray-700" />

      {/* ── Password ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Password</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Choose a strong password of at least 8 characters.
          </p>
        </div>
        <form onSubmit={passwordForm.handleSubmit(onUpdatePassword)} className="space-y-3">
          <div>
            <label className={labelCls}>Current password</label>
            <input
              type="password"
              {...passwordForm.register('currentPassword')}
              className={inputCls}
              placeholder="••••••••"
            />
            {passwordForm.formState.errors.currentPassword && (
              <p className="mt-1 text-xs text-red-600">
                {passwordForm.formState.errors.currentPassword.message}
              </p>
            )}
          </div>
          <div>
            <label className={labelCls}>New password</label>
            <input
              type="password"
              {...passwordForm.register('newPassword')}
              className={inputCls}
              placeholder="••••••••"
            />
            {passwordForm.formState.errors.newPassword && (
              <p className="mt-1 text-xs text-red-600">
                {passwordForm.formState.errors.newPassword.message}
              </p>
            )}
          </div>
          <div>
            <label className={labelCls}>Confirm new password</label>
            <input
              type="password"
              {...passwordForm.register('confirmPassword')}
              className={inputCls}
              placeholder="••••••••"
            />
            {passwordForm.formState.errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-600">
                {passwordForm.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>
          {passwordForm.formState.errors.root && (
            <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
              {passwordForm.formState.errors.root.message}
            </p>
          )}
          {passwordForm.formState.isSubmitSuccessful && !passwordForm.formState.errors.root && (
            <p className="text-sm text-green-600">Password updated successfully.</p>
          )}
          <button
            type="submit"
            disabled={passwordForm.formState.isSubmitting}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {passwordForm.formState.isSubmitting ? 'Saving…' : 'Update password'}
          </button>
        </form>
      </section>

      <hr className="border-gray-200 dark:border-gray-700" />

      {/* ── Linked accounts ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Linked accounts
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Sign in faster by linking a provider to your account.
          </p>
        </div>
        {unlinkError && (
          <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
            {unlinkError}
          </p>
        )}
        <div className="space-y-2">
          {(['google', 'github'] as const).map((provider) => {
            const linked = linkedAccounts.find((a) => a.provider === provider);
            return (
              <div
                key={provider}
                className="flex items-center justify-between px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {OAUTH_PROVIDER_LABEL[provider]}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {linked ? (linked.email ?? 'Linked') : 'Not linked'}
                  </p>
                </div>
                {linked ? (
                  <button
                    type="button"
                    onClick={() => onUnlink(provider)}
                    aria-label={`Unlink ${OAUTH_PROVIDER_LABEL[provider]}`}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                  >
                    <UnlinkIcon size={14} /> <span className="hidden sm:inline">Unlink</span>
                  </button>
                ) : (
                  <a
                    href={`/auth/oauth/${provider}/start?mode=link`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Link
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <hr className="border-gray-200 dark:border-gray-700" />

      {/* ── Two-factor authentication ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Two-factor authentication
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Require a code from an authenticator app in addition to your password.
          </p>
        </div>

        {backupCodes ? (
          <div className="space-y-3">
            <p className="text-sm text-green-600">Two-factor authentication is enabled.</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Save these backup codes somewhere safe. Each one can be used once to sign in if you
              lose access to your authenticator app — they won&apos;t be shown again.
            </p>
            <ul className="grid grid-cols-2 gap-2 font-mono text-sm bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              {backupCodes.map((code) => (
                <li key={code}>{code}</li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setBackupCodes(null)}
              aria-label="I've saved these codes"
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <CheckIcon size={14} />{' '}
              <span className="hidden sm:inline">I&apos;ve saved these codes</span>
            </button>
          </div>
        ) : totpEnabled ? (
          <form onSubmit={totpDisableForm.handleSubmit(onDisableTotp)} className="space-y-3">
            <p className="text-sm text-green-600">Two-factor authentication is enabled.</p>
            <div>
              <label className={labelCls}>Confirm your password to disable</label>
              <input
                type="password"
                {...totpDisableForm.register('password')}
                className={inputCls}
                placeholder="••••••••"
              />
              {totpDisableForm.formState.errors.password && (
                <p className="mt-1 text-xs text-red-600">
                  {totpDisableForm.formState.errors.password.message}
                </p>
              )}
            </div>
            {totpDisableForm.formState.errors.root && (
              <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                {totpDisableForm.formState.errors.root.message}
              </p>
            )}
            <button
              type="submit"
              disabled={totpDisableForm.formState.isSubmitting}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {totpDisableForm.formState.isSubmitting ? 'Disabling…' : 'Disable 2FA'}
            </button>
          </form>
        ) : totpSetup ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Scan this QR code with your authenticator app, or enter the key manually.
            </p>
            <img
              src={totpSetup.qrCodeDataUrl}
              alt="Two-factor authentication QR code"
              className="w-40 h-40 rounded-lg border border-gray-200 dark:border-gray-700"
            />
            <p className="text-xs font-mono text-gray-500 dark:text-gray-400 break-all">
              {totpSetup.secret}
            </p>
            <form onSubmit={totpConfirmForm.handleSubmit(onConfirmTotpSetup)} className="space-y-3">
              <div>
                <label className={labelCls}>Enter the code from your app</label>
                <input
                  type="text"
                  inputMode="numeric"
                  {...totpConfirmForm.register('code')}
                  className={inputCls}
                  placeholder="123456"
                />
                {totpConfirmForm.formState.errors.code && (
                  <p className="mt-1 text-xs text-red-600">
                    {totpConfirmForm.formState.errors.code.message}
                  </p>
                )}
              </div>
              {totpConfirmForm.formState.errors.root && (
                <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                  {totpConfirmForm.formState.errors.root.message}
                </p>
              )}
              <button
                type="submit"
                disabled={totpConfirmForm.formState.isSubmitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {totpConfirmForm.formState.isSubmitting ? 'Confirming…' : 'Confirm'}
              </button>
            </form>
          </div>
        ) : (
          <form onSubmit={totpBeginForm.handleSubmit(onBeginTotpSetup)} className="space-y-3">
            <div>
              <label className={labelCls}>Confirm your password to enable 2FA</label>
              <input
                type="password"
                {...totpBeginForm.register('password')}
                className={inputCls}
                placeholder="••••••••"
              />
              {totpBeginForm.formState.errors.password && (
                <p className="mt-1 text-xs text-red-600">
                  {totpBeginForm.formState.errors.password.message}
                </p>
              )}
            </div>
            {totpBeginForm.formState.errors.root && (
              <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                {totpBeginForm.formState.errors.root.message}
              </p>
            )}
            <button
              type="submit"
              disabled={totpBeginForm.formState.isSubmitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {totpBeginForm.formState.isSubmitting ? 'Starting…' : 'Enable 2FA'}
            </button>
          </form>
        )}
      </section>

      <hr className="border-gray-200 dark:border-gray-700" />

      {/* ── Active sessions ── */}
      <section className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Active sessions
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Devices currently signed in to your account.
            </p>
          </div>
          {sessions.length > 1 && (
            <button
              type="button"
              onClick={onRevokeOtherSessions}
              aria-label="Sign out other sessions"
              className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 text-xs font-medium rounded-lg transition-colors"
            >
              <LogOutIcon size={14} />{' '}
              <span className="hidden sm:inline">Sign out other sessions</span>
            </button>
          )}
        </div>
        <ul className="space-y-2">
          {sessions.map((session) => (
            <li
              key={session.id}
              className="flex items-center justify-between gap-4 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div className="min-w-0">
                <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
                  {session.deviceLabel ?? session.userAgent ?? 'Unknown device'}
                  {session.current && (
                    <span className="ml-2 text-xs text-green-600 font-medium">This device</span>
                  )}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {session.location ? `${session.location} · ` : ''}
                  {session.ipAddress ?? 'Unknown IP'} · Last active{' '}
                  {new Date(session.lastUsedAt).toLocaleString()}
                </p>
              </div>
              {!session.current && (
                <button
                  type="button"
                  onClick={() => onRevokeSession(session.id)}
                  aria-label="Revoke session"
                  className="shrink-0 flex items-center gap-1 text-xs text-red-600 hover:underline"
                >
                  <BanIcon size={14} /> <span className="hidden sm:inline">Revoke</span>
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      <hr className="border-gray-200 dark:border-gray-700" />

      {/* ── Security activity ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Security activity
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            A record of sign-ins and account security changes: password and email updates,
            two-factor authentication, and session revocations.
          </p>
        </div>
        {securityActivityError && (
          <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
            {securityActivityError}
          </p>
        )}
        {!securityActivityError && securityActivity === null && (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
        )}
        {!securityActivityError && securityActivity?.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">No security activity yet.</p>
        )}
        {!securityActivityError && securityActivity && securityActivity.length > 0 && (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700 rounded-lg border border-gray-200 dark:border-gray-700">
            {securityActivity.map((event) => (
              <li key={event.id} className="px-3 py-2 text-sm">
                <p className="text-gray-900 dark:text-gray-100">
                  {SECURITY_EVENT_LABEL[event.eventType] ?? event.eventType}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {describeDevice(event.userAgent)}
                  {event.ipAddress ? ` · ${event.ipAddress}` : ''}
                  {' · '}
                  {new Date(event.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
