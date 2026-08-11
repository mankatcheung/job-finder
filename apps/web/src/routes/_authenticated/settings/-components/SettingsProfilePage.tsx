import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserIcon, Trash2Icon } from 'lucide-react';
import { put as putBlob } from '@vercel/blob/client';
import { gqlClient } from '#/graphql/client';
import { Button, Input } from '@job-finder/ui';
import { useTheme, type Theme } from '#/lib/theme';
import { MonitorIcon, MoonIcon, SunIcon } from 'lucide-react';
import {
  ME_QUERY,
  REQUEST_AVATAR_UPLOAD_URL,
  CONFIRM_AVATAR,
  REMOVE_AVATAR,
  UPDATE_PROFILE,
  profileSchema,
  type ProfileForm,
  type Me,
  labelCls,
  extractGqlError,
} from './shared';

const THEME_OPTIONS: { value: Theme; label: string; icon: React.ReactNode }[] = [
  { value: 'light', label: 'Light', icon: <SunIcon size={16} /> },
  { value: 'dark', label: 'Dark', icon: <MoonIcon size={16} /> },
  { value: 'system', label: 'System', icon: <MonitorIcon size={16} /> },
];

export function SettingsProfilePage() {
  const qc = useQueryClient();
  const { theme, setTheme } = useTheme();

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

  // Avatar
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const onAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setAvatarUploading(true);
    setAvatarError(null);
    try {
      const { requestAvatarUploadUrl } = await gqlClient.request<{
        requestAvatarUploadUrl: { uploadUrl: string; storageKey: string };
      }>(REQUEST_AVATAR_UPLOAD_URL, { filename: file.name, mimeType: file.type });

      await putBlob(requestAvatarUploadUrl.storageKey, file, {
        access: 'public',
        token: requestAvatarUploadUrl.uploadUrl,
        contentType: file.type,
      });

      await gqlClient.request(CONFIRM_AVATAR, {
        storageKey: requestAvatarUploadUrl.storageKey,
        mimeType: file.type,
        sizeBytes: file.size,
      });
      await qc.invalidateQueries({ queryKey: ['me'] });
    } catch (err) {
      setAvatarError(extractGqlError(err) ?? 'Failed to upload photo.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const onRemoveAvatar = async () => {
    setAvatarUploading(true);
    setAvatarError(null);
    try {
      await gqlClient.request(REMOVE_AVATAR);
      await qc.invalidateQueries({ queryKey: ['me'] });
    } catch (err) {
      setAvatarError(extractGqlError(err) ?? 'Failed to remove photo.');
    } finally {
      setAvatarUploading(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* ── Appearance ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Appearance</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Choose how Job Finder looks on this device.
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-600 p-1 gap-1">
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setTheme(option.value)}
              aria-pressed={theme === option.value}
              aria-label={`Theme: ${option.label}`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                theme === option.value
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {option.icon}
              <span className="hidden sm:inline">{option.label}</span>
            </button>
          ))}
        </div>
      </section>

      <hr className="border-gray-200 dark:border-gray-700" />

      {/* ── Profile ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Profile</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Personalize your account and improve reminder timing and AI-generated content.
          </p>
        </div>

        <div className="flex items-center gap-4">
          {me?.avatarUrl ? (
            <img
              src={me.avatarUrl}
              alt="Profile photo"
              className="w-16 h-16 rounded-full object-cover border border-gray-200 dark:border-gray-600"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-600">
              <UserIcon size={28} />
            </div>
          )}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <label className="cursor-pointer px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline">
                {avatarUploading ? 'Uploading…' : me?.avatarUrl ? 'Change photo' : 'Upload photo'}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={onAvatarFileChange}
                  disabled={avatarUploading}
                />
              </label>
              {me?.avatarUrl && (
                <button
                  type="button"
                  onClick={onRemoveAvatar}
                  disabled={avatarUploading}
                  aria-label="Remove photo"
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 disabled:opacity-60"
                >
                  <Trash2Icon size={14} /> <span className="hidden sm:inline">Remove</span>
                </button>
              )}
            </div>
            {avatarError && <p className="text-xs text-red-600">{avatarError}</p>}
          </div>
        </div>

        <form onSubmit={profileForm.handleSubmit(onUpdateProfile)} className="space-y-3">
          <div>
            <label className={labelCls}>Name</label>
            <Input
              type="text"
              {...profileForm.register('name')}
              invalid={!!profileForm.formState.errors.name}
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
            <Input
              type="text"
              list="timezone-options"
              {...profileForm.register('timezone')}
              invalid={!!profileForm.formState.errors.timezone}
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
            <Input
              type="text"
              {...profileForm.register('targetRole')}
              invalid={!!profileForm.formState.errors.targetRole}
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
          <Button type="submit" disabled={profileForm.formState.isSubmitting}>
            {profileForm.formState.isSubmitting ? 'Saving…' : 'Save profile'}
          </Button>
        </form>
      </section>
    </div>
  );
}
