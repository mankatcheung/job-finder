import { useMemo } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { gqlClient } from '#/graphql/client';
import { clearAuthIndicator } from '#/lib/auth';
import { queryClient } from '#/lib/queryClient';

export const Route = createFileRoute('/_authenticated/account')({
  component: AccountPage,
});

// ── GraphQL ────────────────────────────────────────────────────────────────

const ME_QUERY = `
  query Me {
    me {
      id
      email
      name
      timezone
      targetRole
    }
  }
`;

const UPDATE_PROFILE = `
  mutation UpdateProfile($name: String, $timezone: String, $targetRole: String) {
    updateProfile(name: $name, timezone: $timezone, targetRole: $targetRole)
  }
`;

const UPDATE_EMAIL = `
  mutation UpdateEmail($currentPassword: String!, $newEmail: String!) {
    updateEmail(currentPassword: $currentPassword, newEmail: $newEmail)
  }
`;

const UPDATE_PASSWORD = `
  mutation UpdatePassword($currentPassword: String!, $newPassword: String!) {
    updatePassword(currentPassword: $currentPassword, newPassword: $newPassword)
  }
`;

const DELETE_ACCOUNT = `
  mutation DeleteAccount($password: String!) {
    deleteAccount(password: $password)
  }
`;

const EXPORT_USER_DATA = `
  query ExportUserData {
    exportUserData
  }
`;

// ── Schemas ────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  name: z.string().max(100, 'Name is too long'),
  timezone: z.string(),
  targetRole: z.string().max(100, 'Target role is too long'),
});

const emailSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newEmail: z.string().email('Invalid email'),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const deleteSchema = z.object({
  password: z.string().min(1, 'Required'),
});

type ProfileForm = z.infer<typeof profileSchema>;
type EmailForm = z.infer<typeof emailSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;
type DeleteForm = z.infer<typeof deleteSchema>;

type Me = {
  id: string;
  email: string;
  name: string | null;
  timezone: string | null;
  targetRole: string | null;
};

// ── Input styles ───────────────────────────────────────────────────────────

const inputCls =
  'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500';

const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

// ── Component ──────────────────────────────────────────────────────────────

export function AccountPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const timezoneOptions = useMemo(() => {
    try {
      return Intl.supportedValuesOf('timeZone');
    } catch {
      return [];
    }
  }, []);

  // Profile form
  const { data: meData } = useQuery({
    queryKey: ['me'],
    queryFn: () => gqlClient.request<{ me: Me | null }>(ME_QUERY),
  });
  const me = meData?.me;
  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: {
      name: me?.name ?? '',
      timezone: me?.timezone ?? '',
      targetRole: me?.targetRole ?? '',
    },
  });
  const onUpdateProfile = async (data: ProfileForm) => {
    try {
      await gqlClient.request(UPDATE_PROFILE, {
        name: data.name.trim() || null,
        timezone: data.timezone.trim() || null,
        targetRole: data.targetRole.trim() || null,
      });
      await qc.invalidateQueries({ queryKey: ['me'] });
    } catch (err) {
      profileForm.setError('root', {
        message: extractGqlError(err) ?? 'Failed to update profile.',
      });
    }
  };

  // Email form
  const emailForm = useForm<EmailForm>({ resolver: zodResolver(emailSchema) });
  const onUpdateEmail = async (data: EmailForm) => {
    try {
      await gqlClient.request(UPDATE_EMAIL, data);
      emailForm.reset();
      emailForm.setError('root', { message: '' });
    } catch (err) {
      emailForm.setError('root', { message: extractGqlError(err) ?? 'Failed to update email.' });
    }
  };

  // Password form
  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });
  const onUpdatePassword = async ({ currentPassword, newPassword }: PasswordForm) => {
    try {
      await gqlClient.request(UPDATE_PASSWORD, { currentPassword, newPassword });
      passwordForm.reset();
    } catch (err) {
      passwordForm.setError('root', {
        message: extractGqlError(err) ?? 'Failed to update password.',
      });
    }
  };

  // Delete form
  const deleteForm = useForm<DeleteForm>({ resolver: zodResolver(deleteSchema) });
  const onDeleteAccount = async (data: DeleteForm) => {
    try {
      await gqlClient.request(DELETE_ACCOUNT, data);
      clearAuthIndicator();
      queryClient.clear();
      await navigate({ to: '/login' });
    } catch (err) {
      deleteForm.setError('root', {
        message: extractGqlError(err) ?? 'Failed to delete account.',
      });
    }
  };

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

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-10">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Account settings</h1>

      {/* ── Profile ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Profile</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Personalize your account and improve reminder timing and AI-generated content.
          </p>
        </div>
        <form onSubmit={profileForm.handleSubmit(onUpdateProfile)} className="space-y-3">
          <div>
            <label className={labelCls}>Name</label>
            <input
              type="text"
              {...profileForm.register('name')}
              className={inputCls}
              placeholder="Jane Doe"
            />
            {profileForm.formState.errors.name && (
              <p className="mt-1 text-xs text-red-600">
                {profileForm.formState.errors.name.message}
              </p>
            )}
          </div>
          <div>
            <label className={labelCls}>Timezone</label>
            <input
              type="text"
              list="timezone-options"
              {...profileForm.register('timezone')}
              className={inputCls}
              placeholder="America/Los_Angeles"
            />
            <datalist id="timezone-options">
              {timezoneOptions.map((tz) => (
                <option key={tz} value={tz} />
              ))}
            </datalist>
            {profileForm.formState.errors.timezone && (
              <p className="mt-1 text-xs text-red-600">
                {profileForm.formState.errors.timezone.message}
              </p>
            )}
          </div>
          <div>
            <label className={labelCls}>Target role</label>
            <input
              type="text"
              {...profileForm.register('targetRole')}
              className={inputCls}
              placeholder="Senior Product Designer"
            />
            {profileForm.formState.errors.targetRole && (
              <p className="mt-1 text-xs text-red-600">
                {profileForm.formState.errors.targetRole.message}
              </p>
            )}
          </div>
          {profileForm.formState.errors.root?.message && (
            <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
              {profileForm.formState.errors.root.message}
            </p>
          )}
          {profileForm.formState.isSubmitSuccessful &&
            !profileForm.formState.errors.root?.message && (
              <p className="text-sm text-green-600">Profile updated successfully.</p>
            )}
          <button
            type="submit"
            disabled={profileForm.formState.isSubmitting}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {profileForm.formState.isSubmitting ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </section>

      <hr className="border-gray-200 dark:border-gray-700" />

      {/* ── Email ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Email address
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Update the email you sign in with.
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
            <p className="text-sm text-green-600">Email updated successfully.</p>
          )}
          <button
            type="submit"
            disabled={emailForm.formState.isSubmitting}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {emailForm.formState.isSubmitting ? 'Saving…' : 'Update email'}
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
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 text-sm font-medium rounded-lg transition-colors"
        >
          Download export
        </button>
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
            <label className={labelCls}>Confirm your password</label>
            <input
              type="password"
              {...deleteForm.register('password')}
              className={inputCls}
              placeholder="••••••••"
            />
            {deleteForm.formState.errors.password && (
              <p className="mt-1 text-xs text-red-600">
                {deleteForm.formState.errors.password.message}
              </p>
            )}
          </div>
          {deleteForm.formState.errors.root && (
            <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
              {deleteForm.formState.errors.root.message}
            </p>
          )}
          <button
            type="submit"
            disabled={deleteForm.formState.isSubmitting}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {deleteForm.formState.isSubmitting ? 'Deleting…' : 'Delete my account'}
          </button>
        </form>
      </section>
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
