export interface Profile {
  id: string;
  email: string;
  name: string | null;
  timezone: string | null;
  targetRole: string | null;
}

export interface Session {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  deviceLabel: string | null;
  location: string | null;
  lastUsedAt: string;
  current: boolean;
}

export type DigestFrequency = 'DAILY' | 'WEEKLY' | 'OFF';

export interface NotificationPreferences {
  digestFrequency: DigestFrequency;
  followUpRemindersEnabled: boolean;
  pushNotificationsEnabled: boolean;
  weeklyApplicationGoal: number | null;
}

export interface LlmApiKey {
  provider: string;
  model: string | null;
  baseUrl: string | null;
}

export const LLM_PROVIDERS = ['openai', 'anthropic', 'googleai', 'openrouter', 'custom'] as const;

export const LLM_PROVIDER_LABEL: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  googleai: 'Google AI',
  openrouter: 'OpenRouter',
  mistral: 'Mistral',
  groq: 'Groq',
  xai: 'xAI',
  deepseek: 'DeepSeek',
  nvidia: 'NVIDIA',
  custom: 'Custom (OpenAI-compatible)',
};
