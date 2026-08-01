import { z } from 'zod';

// ── GraphQL queries & mutations ────────────────────────────────────────────

export const ME_QUERY = `
  query Me {
    me {
      id
      email
      name
      timezone
      targetRole
      avatarUrl
    }
  }
`;

export const REQUEST_AVATAR_UPLOAD_URL = `
  mutation RequestAvatarUploadUrl($filename: String!, $mimeType: String!) {
    requestAvatarUploadUrl(filename: $filename, mimeType: $mimeType) {
      uploadUrl
      storageKey
    }
  }
`;

export const CONFIRM_AVATAR = `
  mutation ConfirmAvatar($storageKey: String!, $mimeType: String!, $sizeBytes: Int!) {
    confirmAvatar(storageKey: $storageKey, mimeType: $mimeType, sizeBytes: $sizeBytes)
  }
`;

export const REMOVE_AVATAR = `
  mutation RemoveAvatar {
    removeAvatar
  }
`;

export const UPDATE_PROFILE = `
  mutation UpdateProfile($name: String, $timezone: String, $targetRole: String) {
    updateProfile(name: $name, timezone: $timezone, targetRole: $targetRole)
  }
`;

export const REQUEST_EMAIL_CHANGE = `
  mutation RequestEmailChange($currentPassword: String!, $newEmail: String!) {
    requestEmailChange(currentPassword: $currentPassword, newEmail: $newEmail)
  }
`;

export const UPDATE_PASSWORD = `
  mutation UpdatePassword($currentPassword: String!, $newPassword: String!) {
    updatePassword(currentPassword: $currentPassword, newPassword: $newPassword)
  }
`;

export const DELETE_ACCOUNT = `
  mutation DeleteAccount($password: String!) {
    deleteAccount(password: $password)
  }
`;

export const EXPORT_USER_DATA = `
  query ExportUserData {
    exportUserData
  }
`;

export const LOGIN_HISTORY = `
  query LoginHistory {
    loginHistory {
      id
      ipAddress
      userAgent
      createdAt
    }
  }
`;

export const IMPORT_USER_DATA = `
  mutation ImportUserData($data: String!) {
    importUserData(data: $data) {
      applicationsImported
      applicationsSkipped
      notesImported
      documentsSkipped
    }
  }
`;

export const SESSIONS_QUERY = `
  query Sessions {
    sessions {
      id
      userAgent
      ipAddress
      deviceLabel
      location
      lastUsedAt
      current
    }
  }
`;

export const REVOKE_SESSION = `
  mutation RevokeSession($id: ID!) {
    revokeSession(id: $id)
  }
`;

export const REVOKE_OTHER_SESSIONS = `
  mutation RevokeOtherSessions {
    revokeOtherSessions
  }
`;

export const NOTIFICATION_PREFERENCES_QUERY = `
  query NotificationPreferences {
    notificationPreferences {
      weeklyDigestEnabled
      followUpRemindersEnabled
    }
  }
`;

export const UPDATE_NOTIFICATION_PREFERENCES = `
  mutation UpdateNotificationPreferences($weeklyDigestEnabled: Boolean, $followUpRemindersEnabled: Boolean) {
    updateNotificationPreferences(
      weeklyDigestEnabled: $weeklyDigestEnabled
      followUpRemindersEnabled: $followUpRemindersEnabled
    )
  }
`;

export const TOTP_ENABLED_QUERY = `
  query TotpEnabled {
    totpEnabled
  }
`;

export const BEGIN_TOTP_SETUP = `
  mutation BeginTotpSetup($password: String!) {
    beginTotpSetup(password: $password) {
      secret
      otpauthUrl
      qrCodeDataUrl
    }
  }
`;

export const CONFIRM_TOTP_SETUP = `
  mutation ConfirmTotpSetup($code: String!) {
    confirmTotpSetup(code: $code) {
      backupCodes
    }
  }
`;

export const DISABLE_TOTP = `
  mutation DisableTotp($password: String!) {
    disableTotp(password: $password)
  }
`;

export const LLM_KEY_STATUS_QUERY = `
  query LlmKeyStatus {
    llmKeyStatus {
      configured
      provider
      model
      baseUrl
    }
  }
`;

export const SAVE_LLM_API_KEY = `
  mutation SaveLlmApiKey($provider: String!, $apiKey: String!, $model: String, $baseUrl: String) {
    saveLlmApiKey(provider: $provider, apiKey: $apiKey, model: $model, baseUrl: $baseUrl)
  }
`;

export const CLEAR_LLM_API_KEY = `
  mutation ClearLlmApiKey {
    clearLlmApiKey
  }
`;

export const LINKED_OAUTH_ACCOUNTS_QUERY = `
  query LinkedOAuthAccounts {
    linkedOAuthAccounts {
      provider
      email
      createdAt
    }
  }
`;

export const UNLINK_OAUTH_ACCOUNT = `
  mutation UnlinkOAuthAccount($provider: OAuthProvider!) {
    unlinkOAuthAccount(provider: $provider)
  }
`;

export const API_TOKENS_QUERY = `
  query ApiTokens {
    apiTokens {
      id
      name
      scope
      lastUsedAt
      createdAt
    }
  }
`;

export const CREATE_API_TOKEN = `
  mutation CreateApiToken($name: String!, $scope: ApiTokenScope) {
    createApiToken(name: $name, scope: $scope) {
      id
      name
      token
      scope
      createdAt
    }
  }
`;

export const DELETE_API_TOKEN = `
  mutation DeleteApiToken($id: ID!) {
    deleteApiToken(id: $id)
  }
`;

// ── Schemas ────────────────────────────────────────────────────────────────

export const profileSchema = z.object({
  name: z.string().max(100, 'Name is too long'),
  timezone: z.string(),
  targetRole: z.string().max(100, 'Target role is too long'),
});

export const emailSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newEmail: z.string().email('Invalid email'),
});

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const deleteSchema = z.object({
  password: z.string().min(1, 'Required'),
});

export const totpBeginSchema = z.object({
  password: z.string().min(1, 'Required'),
});

export const totpConfirmSchema = z.object({
  code: z.string().min(6, 'Enter the 6-digit code').max(6, 'Enter the 6-digit code'),
});

export const totpDisableSchema = z.object({
  password: z.string().min(1, 'Required'),
});

export const CUSTOM_LLM_PROVIDER = 'custom';

export const llmApiKeySchema = z
  .object({
    provider: z.enum([
      'openai',
      'anthropic',
      'googleai',
      'openrouter',
      'mistral',
      'groq',
      'xai',
      'deepseek',
      'custom',
    ]),
    apiKey: z.string().min(1, 'Required'),
    model: z.string().optional(),
    baseUrl: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const isCustom = data.provider === CUSTOM_LLM_PROVIDER;
    if (isCustom && !data.model?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Required for a custom provider',
        path: ['model'],
      });
    }
    if (isCustom) {
      if (!data.baseUrl?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Required for a custom provider',
          path: ['baseUrl'],
        });
      } else if (!/^https?:\/\//.test(data.baseUrl.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Must start with http:// or https://',
          path: ['baseUrl'],
        });
      }
    } else if (data.baseUrl?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Only valid for a custom provider',
        path: ['baseUrl'],
      });
    }
  });

// ── Types ──────────────────────────────────────────────────────────────────

export type ProfileForm = z.infer<typeof profileSchema>;
export type EmailForm = z.infer<typeof emailSchema>;
export type PasswordForm = z.infer<typeof passwordSchema>;
export type DeleteForm = z.infer<typeof deleteSchema>;
export type TotpBeginForm = z.infer<typeof totpBeginSchema>;
export type TotpConfirmForm = z.infer<typeof totpConfirmSchema>;
export type TotpDisableForm = z.infer<typeof totpDisableSchema>;
export type LlmApiKeyForm = z.infer<typeof llmApiKeySchema>;

export type TotpSetup = { secret: string; otpauthUrl: string; qrCodeDataUrl: string };

export type LlmKeyStatus = {
  configured: boolean;
  provider: string | null;
  model: string | null;
  baseUrl: string | null;
};

export const LLM_PROVIDER_OPTIONS: { value: string; label: string }[] = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic (Claude)' },
  { value: 'googleai', label: 'Google AI' },
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'mistral', label: 'Mistral' },
  { value: 'groq', label: 'Groq' },
  { value: 'xai', label: 'xAI (Grok)' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: CUSTOM_LLM_PROVIDER, label: 'Custom (OpenAI-compatible)' },
];

export const LLM_PROVIDER_LABEL: Record<string, string> = Object.fromEntries(
  LLM_PROVIDER_OPTIONS.map((o) => [o.value, o.label]),
);

export interface LoginEvent {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export function describeDevice(userAgent: string | null): string {
  if (!userAgent) return 'Unknown device';
  if (/iPhone|iPad/.test(userAgent)) return 'iOS device';
  if (/Android/.test(userAgent)) return 'Android device';
  if (/Macintosh/.test(userAgent)) return 'Mac';
  if (/Windows/.test(userAgent)) return 'Windows PC';
  if (/Linux/.test(userAgent)) return 'Linux device';
  return 'Unknown device';
}

export interface ImportSummary {
  applicationsImported: number;
  applicationsSkipped: number;
  notesImported: number;
  documentsSkipped: number;
}

export type Session = {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  deviceLabel: string | null;
  location: string | null;
  lastUsedAt: string;
  current: boolean;
};

export type Me = {
  id: string;
  email: string;
  name: string | null;
  timezone: string | null;
  targetRole: string | null;
  avatarUrl: string | null;
};

export type NotificationPreferences = {
  weeklyDigestEnabled: boolean;
  followUpRemindersEnabled: boolean;
};

export type LinkedOAuthAccount = {
  provider: 'google' | 'github';
  email: string | null;
  createdAt: string;
};

export type ApiToken = {
  id: string;
  name: string;
  scope: string;
  lastUsedAt: string | null;
  createdAt: string;
};

export type CreateApiTokenPayload = {
  id: string;
  name: string;
  token: string;
  scope: string;
  createdAt: string;
};

export const OAUTH_PROVIDER_LABEL: Record<LinkedOAuthAccount['provider'], string> = {
  google: 'Google',
  github: 'GitHub',
};

// ── Shared styles ──────────────────────────────────────────────────────────

export const inputCls =
  'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500';

export const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

export function extractGqlError(err: unknown): string | null {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const r = (err as { response?: { errors?: Array<{ message?: string }> } }).response;
    return r?.errors?.[0]?.message ?? null;
  }
  return null;
}
