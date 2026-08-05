import { StarIcon, Trash2Icon, CopyIcon, CheckIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { gqlClient } from '#/graphql/client';
import {
  LLM_API_KEYS_QUERY,
  SAVE_LLM_API_KEY,
  DELETE_LLM_API_KEY,
  SET_DEFAULT_LLM_PROVIDER,
  UPDATE_PROFILE,
  API_TOKENS_QUERY,
  CREATE_API_TOKEN,
  DELETE_API_TOKEN,
  llmApiKeySchema,
  customAiPromptSchema,
  CUSTOM_LLM_PROVIDER,
  type LlmApiKeyForm,
  type CustomAiPromptForm,
  type LlmApiKey,
  type ApiToken,
  type CreateApiTokenPayload,
  LLM_PROVIDER_OPTIONS,
  LLM_PROVIDER_LABEL,
  inputCls,
  labelCls,
  extractGqlError,
} from './-components/shared';

export const Route = createFileRoute('/_authenticated/settings/integrations')({
  component: SettingsIntegrationsPage,
});

export function SettingsIntegrationsPage() {
  const qc = useQueryClient();

  // AI API keys
  const { data: llmData } = useQuery({
    queryKey: ['llmApiKeys'],
    queryFn: () =>
      gqlClient.request<{
        llmApiKeys: LlmApiKey[];
        me: { defaultLlmProvider: string | null; customAiPrompt: string | null };
      }>(LLM_API_KEYS_QUERY),
  });
  const llmApiKeys = llmData?.llmApiKeys ?? [];
  const defaultLlmProvider = llmData?.me.defaultLlmProvider ?? null;
  const configuredProviders = new Set(llmApiKeys.map((k) => k.provider));
  const availableProviderOptions = LLM_PROVIDER_OPTIONS.filter(
    (o) => !configuredProviders.has(o.value),
  );
  const availableProviderValues = availableProviderOptions.map((o) => o.value).join(',');

  const llmApiKeyForm = useForm<LlmApiKeyForm>({
    resolver: zodResolver(llmApiKeySchema),
    defaultValues: { provider: 'openrouter', apiKey: '', model: '', baseUrl: '' },
  });
  const llmApiKeyProvider = llmApiKeyForm.watch('provider');
  const isCustomLlmProvider = llmApiKeyProvider === CUSTOM_LLM_PROVIDER;

  useEffect(() => {
    if (
      availableProviderOptions.length > 0 &&
      !availableProviderOptions.some((o) => o.value === llmApiKeyProvider)
    ) {
      llmApiKeyForm.setValue(
        'provider',
        availableProviderOptions[0].value as LlmApiKeyForm['provider'],
      );
    }
  }, [availableProviderValues, llmApiKeyForm, llmApiKeyProvider, availableProviderOptions]);

  const onSaveLlmApiKey = async (data: LlmApiKeyForm) => {
    try {
      await gqlClient.request(SAVE_LLM_API_KEY, {
        provider: data.provider,
        apiKey: data.apiKey,
        model: data.model?.trim() || undefined,
        baseUrl: data.baseUrl?.trim() || undefined,
      });
      llmApiKeyForm.reset({ provider: data.provider, apiKey: '', model: '', baseUrl: '' });
      await qc.invalidateQueries({ queryKey: ['llmApiKeys'] });
    } catch (err) {
      llmApiKeyForm.setError('root', {
        message: extractGqlError(err) ?? 'Failed to save API key.',
      });
    }
  };

  const [removingProvider, setRemovingProvider] = useState<string | null>(null);
  const [llmKeyListError, setLlmKeyListError] = useState<string | null>(null);
  const onRemoveLlmApiKey = async (provider: string) => {
    setRemovingProvider(provider);
    setLlmKeyListError(null);
    try {
      await gqlClient.request(DELETE_LLM_API_KEY, { provider });
      await qc.invalidateQueries({ queryKey: ['llmApiKeys'] });
    } catch (err) {
      setLlmKeyListError(extractGqlError(err) ?? 'Failed to remove API key.');
    } finally {
      setRemovingProvider(null);
    }
  };

  const [settingDefaultProvider, setSettingDefaultProvider] = useState<string | null>(null);
  const onSetDefaultProvider = async (provider: string) => {
    setSettingDefaultProvider(provider);
    setLlmKeyListError(null);
    try {
      await gqlClient.request(SET_DEFAULT_LLM_PROVIDER, { provider });
      await qc.invalidateQueries({ queryKey: ['llmApiKeys'] });
    } catch (err) {
      setLlmKeyListError(extractGqlError(err) ?? 'Failed to set default provider.');
    } finally {
      setSettingDefaultProvider(null);
    }
  };

  // Custom AI prompt
  const customAiPromptForm = useForm<CustomAiPromptForm>({
    resolver: zodResolver(customAiPromptSchema),
    values: { customAiPrompt: llmData?.me.customAiPrompt ?? '' },
  });
  const onUpdateCustomAiPrompt = async (data: CustomAiPromptForm) => {
    try {
      await gqlClient.request(UPDATE_PROFILE, {
        customAiPrompt: data.customAiPrompt.trim() || null,
      });
      await qc.invalidateQueries({ queryKey: ['llmApiKeys'] });
    } catch (err) {
      customAiPromptForm.setError('root', {
        message: extractGqlError(err) ?? 'Failed to update custom instructions.',
      });
    }
  };

  // API tokens
  const { data: apiTokensData } = useQuery({
    queryKey: ['apiTokens'],
    queryFn: () => gqlClient.request<{ apiTokens: ApiToken[] }>(API_TOKENS_QUERY),
  });
  const apiTokens = apiTokensData?.apiTokens ?? [];
  const [newApiToken, setNewApiToken] = useState<CreateApiTokenPayload | null>(null);
  const [apiTokenName, setApiTokenName] = useState('');
  const [creatingApiToken, setCreatingApiToken] = useState(false);
  const [apiTokenError, setApiTokenError] = useState<string | null>(null);

  const onCreateApiToken = async () => {
    if (!apiTokenName.trim()) return;
    setCreatingApiToken(true);
    setApiTokenError(null);
    try {
      const res = await gqlClient.request<{ createApiToken: CreateApiTokenPayload }>(
        CREATE_API_TOKEN,
        {
          name: apiTokenName.trim(),
        },
      );
      setNewApiToken(res.createApiToken);
      setApiTokenName('');
      await qc.invalidateQueries({ queryKey: ['apiTokens'] });
    } catch (err) {
      setApiTokenError(extractGqlError(err) ?? 'Failed to create token.');
    } finally {
      setCreatingApiToken(false);
    }
  };

  const [deletingApiTokenId, setDeletingApiTokenId] = useState<string | null>(null);
  const onDeleteApiToken = async (id: string) => {
    setDeletingApiTokenId(id);
    try {
      await gqlClient.request(DELETE_API_TOKEN, { id });
      await qc.invalidateQueries({ queryKey: ['apiTokens'] });
    } catch (err) {
      setApiTokenError(extractGqlError(err) ?? 'Failed to delete token.');
    } finally {
      setDeletingApiTokenId(null);
    }
  };

  return (
    <div className="space-y-10">
      {/* ── AI features ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">AI features</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Add your own API key from one or more providers to enable the assistant chatbot, cover
            letter generation, and job description auto-fill. job-finder doesn&apos;t provide a
            shared key — these features stay off until you add one. Automatic features (cover
            letters, job description parsing, resume match) use your default provider below; the
            assistant chatbot lets you choose the provider and model per conversation.
          </p>
        </div>

        {llmKeyListError && (
          <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
            {llmKeyListError}
          </p>
        )}

        {llmApiKeys.length > 0 && (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700 rounded-lg border border-gray-200 dark:border-gray-700">
            {llmApiKeys.map((key) => {
              const isDefault = key.provider === defaultLlmProvider;
              return (
                <li
                  key={key.provider}
                  className="flex items-center justify-between gap-4 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {LLM_PROVIDER_LABEL[key.provider] ?? key.provider}
                      {isDefault && (
                        <span className="ml-2 text-xs font-normal text-green-600">Default</span>
                      )}
                    </p>
                    {(key.model || key.baseUrl) && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 break-all">
                        {[key.model, key.baseUrl].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {!isDefault && (
                      <button
                        type="button"
                        onClick={() => onSetDefaultProvider(key.provider)}
                        disabled={settingDefaultProvider === key.provider}
                        aria-label="Make default"
                        className="flex items-center gap-1 text-xs text-blue-600 hover:underline disabled:opacity-60"
                      >
                        <StarIcon size={14} />{' '}
                        <span className="hidden sm:inline">
                          {settingDefaultProvider === key.provider ? 'Setting…' : 'Make default'}
                        </span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onRemoveLlmApiKey(key.provider)}
                      disabled={removingProvider === key.provider}
                      aria-label="Remove"
                      className="flex items-center gap-1 text-xs text-red-600 hover:underline disabled:opacity-60"
                    >
                      <Trash2Icon size={14} />{' '}
                      <span className="hidden sm:inline">
                        {removingProvider === key.provider ? 'Removing…' : 'Remove'}
                      </span>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {availableProviderOptions.length > 0 ? (
          <form onSubmit={llmApiKeyForm.handleSubmit(onSaveLlmApiKey)} className="space-y-3">
            <div>
              <label className={labelCls}>Provider</label>
              <select {...llmApiKeyForm.register('provider')} className={inputCls}>
                {availableProviderOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>API key</label>
              <input
                type="password"
                {...llmApiKeyForm.register('apiKey')}
                className={inputCls}
                placeholder="sk-…"
              />
              {llmApiKeyForm.formState.errors.apiKey && (
                <p className="mt-1 text-xs text-red-600">
                  {llmApiKeyForm.formState.errors.apiKey.message}
                </p>
              )}
            </div>
            {isCustomLlmProvider ? (
              <>
                <div>
                  <label className={labelCls}>Base URL</label>
                  <input
                    type="url"
                    {...llmApiKeyForm.register('baseUrl')}
                    className={inputCls}
                    placeholder="https://your-endpoint.example.com/v1/chat/completions"
                  />
                  {llmApiKeyForm.formState.errors.baseUrl && (
                    <p className="mt-1 text-xs text-red-600">
                      {llmApiKeyForm.formState.errors.baseUrl.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelCls}>Model</label>
                  <input
                    type="text"
                    {...llmApiKeyForm.register('model')}
                    className={inputCls}
                    placeholder="e.g. gpt-4o-mini"
                  />
                  {llmApiKeyForm.formState.errors.model && (
                    <p className="mt-1 text-xs text-red-600">
                      {llmApiKeyForm.formState.errors.model.message}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div>
                <label className={labelCls}>
                  Model{' '}
                  <span className="font-normal text-gray-400">
                    (optional — leave blank to use the provider default)
                  </span>
                </label>
                <input
                  type="text"
                  {...llmApiKeyForm.register('model')}
                  className={inputCls}
                  placeholder="Provider default"
                />
              </div>
            )}
            {llmApiKeyForm.formState.errors.root && (
              <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                {llmApiKeyForm.formState.errors.root.message}
              </p>
            )}
            <button
              type="submit"
              disabled={llmApiKeyForm.formState.isSubmitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {llmApiKeyForm.formState.isSubmitting ? 'Saving…' : 'Add key'}
            </button>
          </form>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            You&apos;ve configured every available provider.
          </p>
        )}

        <form
          onSubmit={customAiPromptForm.handleSubmit(onUpdateCustomAiPrompt)}
          className="space-y-3"
        >
          <div>
            <label className={labelCls}>Custom instructions</label>
            <textarea
              {...customAiPromptForm.register('customAiPrompt')}
              className={inputCls}
              rows={3}
              placeholder="e.g. Keep cover letters under 200 words and write in a casual tone."
            />
            <p className="mt-1 text-xs text-gray-400">
              Added to the prompt for AI-generated text (cover letters, the assistant chatbot).
            </p>
            {customAiPromptForm.formState.errors.customAiPrompt && (
              <p className="mt-1 text-xs text-red-600">
                {customAiPromptForm.formState.errors.customAiPrompt.message}
              </p>
            )}
          </div>
          {customAiPromptForm.formState.errors.root?.message && (
            <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
              {customAiPromptForm.formState.errors.root.message}
            </p>
          )}
          {customAiPromptForm.formState.isSubmitSuccessful &&
            !customAiPromptForm.formState.errors.root?.message && (
              <p className="text-sm text-green-600">Custom instructions updated successfully.</p>
            )}
          <button
            type="submit"
            disabled={customAiPromptForm.formState.isSubmitting}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {customAiPromptForm.formState.isSubmitting ? 'Saving…' : 'Save instructions'}
          </button>
        </form>
      </section>

      <hr className="border-gray-200 dark:border-gray-700" />

      {/* ── API tokens ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">API tokens</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Generate tokens to access the API programmatically. Keep your tokens secret — they grant
            full access to your account.
          </p>
        </div>

        {newApiToken && (
          <div className="space-y-3">
            <p className="text-sm text-green-600">
              Token created successfully. Copy it now — it won&apos;t be shown again.
            </p>
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <code className="flex-1 text-sm font-mono text-gray-900 dark:text-gray-100 break-all">
                {newApiToken.token}
              </code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(newApiToken.token);
                }}
                aria-label="Copy token"
                className="shrink-0 flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:underline"
              >
                <CopyIcon size={14} /> <span className="hidden sm:inline">Copy</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setNewApiToken(null)}
              aria-label="Done"
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <CheckIcon size={14} /> <span className="hidden sm:inline">Done</span>
            </button>
          </div>
        )}

        {!newApiToken && (
          <>
            {apiTokenError && (
              <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                {apiTokenError}
              </p>
            )}
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className={labelCls}>Token name</label>
                <input
                  type="text"
                  value={apiTokenName}
                  onChange={(e) => setApiTokenName(e.target.value)}
                  className={inputCls}
                  placeholder="e.g. CI pipeline"
                />
              </div>
              <button
                type="button"
                onClick={onCreateApiToken}
                disabled={creatingApiToken || !apiTokenName.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {creatingApiToken ? 'Creating…' : 'Create token'}
              </button>
            </div>
          </>
        )}

        {apiTokens.length > 0 && (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700 rounded-lg border border-gray-200 dark:border-gray-700">
            {apiTokens.map((token) => (
              <li key={token.id} className="flex items-center justify-between gap-4 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {token.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Created {new Date(token.createdAt).toLocaleDateString()}
                    {token.lastUsedAt &&
                      ` · Last used ${new Date(token.lastUsedAt).toLocaleDateString()}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteApiToken(token.id)}
                  disabled={deletingApiTokenId === token.id}
                  aria-label="Revoke token"
                  className="shrink-0 flex items-center gap-1 text-xs text-red-600 hover:underline disabled:opacity-60"
                >
                  <Trash2Icon size={14} />{' '}
                  <span className="hidden sm:inline">
                    {deletingApiTokenId === token.id ? 'Deleting…' : 'Revoke'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
