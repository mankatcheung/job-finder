import { StarIcon, Trash2Icon, CopyIcon, CheckIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { gqlClient } from '#/graphql/client';
import { Button, FormLabel, Input, Select, Textarea } from '@job-finder/ui';
import {
  LLM_API_KEYS_QUERY,
  SAVE_LLM_API_KEY,
  DELETE_LLM_API_KEY,
  SET_DEFAULT_LLM_PROVIDER,
  UPDATE_PROFILE,
  API_TOKENS_QUERY,
  CREATE_API_TOKEN,
  DELETE_API_TOKEN,
  SHARE_LINKS_QUERY,
  CREATE_SHARE_LINK,
  DELETE_SHARE_LINK,
  llmApiKeySchema,
  customAiPromptSchema,
  CUSTOM_LLM_PROVIDER,
  type LlmApiKeyForm,
  type CustomAiPromptForm,
  type LlmApiKey,
  type ApiToken,
  type CreateApiTokenPayload,
  type ShareLink,
  type CreateShareLinkPayload,
  LLM_PROVIDER_OPTIONS,
  LLM_PROVIDER_LABEL,
  extractGqlError,
} from './shared';

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

  // Share links
  const { data: shareLinksData } = useQuery({
    queryKey: ['shareLinks'],
    queryFn: () => gqlClient.request<{ shareLinks: ShareLink[] }>(SHARE_LINKS_QUERY),
  });
  const shareLinks = shareLinksData?.shareLinks ?? [];
  const [newShareLink, setNewShareLink] = useState<CreateShareLinkPayload | null>(null);
  const [shareLinkName, setShareLinkName] = useState('');
  const [creatingShareLink, setCreatingShareLink] = useState(false);
  const [shareLinkError, setShareLinkError] = useState<string | null>(null);

  const shareUrl = (token: string) =>
    `${window.location.origin}/share?token=${encodeURIComponent(token)}`;

  const onCreateShareLink = async () => {
    if (!shareLinkName.trim()) return;
    setCreatingShareLink(true);
    setShareLinkError(null);
    try {
      const res = await gqlClient.request<{ createShareLink: CreateShareLinkPayload }>(
        CREATE_SHARE_LINK,
        {
          name: shareLinkName.trim(),
        },
      );
      setNewShareLink(res.createShareLink);
      setShareLinkName('');
      await qc.invalidateQueries({ queryKey: ['shareLinks'] });
    } catch (err) {
      setShareLinkError(extractGqlError(err) ?? 'Failed to create share link.');
    } finally {
      setCreatingShareLink(false);
    }
  };

  const [deletingShareLinkId, setDeletingShareLinkId] = useState<string | null>(null);
  const onDeleteShareLink = async (id: string) => {
    setDeletingShareLinkId(id);
    try {
      await gqlClient.request(DELETE_SHARE_LINK, { id });
      await qc.invalidateQueries({ queryKey: ['shareLinks'] });
    } catch (err) {
      setShareLinkError(extractGqlError(err) ?? 'Failed to delete share link.');
    } finally {
      setDeletingShareLinkId(null);
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
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => onSetDefaultProvider(key.provider)}
                        disabled={settingDefaultProvider === key.provider}
                        aria-label="Make default"
                      >
                        <span className="flex items-center gap-1">
                          <StarIcon size={14} />{' '}
                          <span className="hidden sm:inline">
                            {settingDefaultProvider === key.provider ? 'Setting…' : 'Make default'}
                          </span>
                        </span>
                      </Button>
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
              <FormLabel>Provider</FormLabel>
              <Select {...llmApiKeyForm.register('provider')}>
                {availableProviderOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <FormLabel>API key</FormLabel>
              <Input
                type="password"
                {...llmApiKeyForm.register('apiKey')}
                invalid={!!llmApiKeyForm.formState.errors.apiKey}
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
                  <FormLabel>Base URL</FormLabel>
                  <Input
                    type="url"
                    {...llmApiKeyForm.register('baseUrl')}
                    invalid={!!llmApiKeyForm.formState.errors.baseUrl}
                    placeholder="https://your-endpoint.example.com/v1/chat/completions"
                  />
                  {llmApiKeyForm.formState.errors.baseUrl && (
                    <p className="mt-1 text-xs text-red-600">
                      {llmApiKeyForm.formState.errors.baseUrl.message}
                    </p>
                  )}
                </div>
                <div>
                  <FormLabel>Model</FormLabel>
                  <Input
                    type="text"
                    {...llmApiKeyForm.register('model')}
                    invalid={!!llmApiKeyForm.formState.errors.model}
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
                <FormLabel>
                  Model{' '}
                  <span className="font-normal text-gray-400">
                    (optional — leave blank to use the provider default)
                  </span>
                </FormLabel>
                <Input
                  type="text"
                  {...llmApiKeyForm.register('model')}
                  placeholder="Provider default"
                />
              </div>
            )}
            {llmApiKeyForm.formState.errors.root && (
              <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                {llmApiKeyForm.formState.errors.root.message}
              </p>
            )}
            <Button type="submit" disabled={llmApiKeyForm.formState.isSubmitting}>
              {llmApiKeyForm.formState.isSubmitting ? 'Saving…' : 'Add key'}
            </Button>
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
            <FormLabel>Custom instructions</FormLabel>
            <Textarea
              {...customAiPromptForm.register('customAiPrompt')}
              invalid={!!customAiPromptForm.formState.errors.customAiPrompt}
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
          <Button type="submit" disabled={customAiPromptForm.formState.isSubmitting}>
            {customAiPromptForm.formState.isSubmitting ? 'Saving…' : 'Save instructions'}
          </Button>
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
              <Button
                variant="link"
                onClick={() => {
                  navigator.clipboard.writeText(newApiToken.token);
                }}
                aria-label="Copy token"
                className="shrink-0"
              >
                <span className="flex items-center gap-1">
                  <CopyIcon size={14} /> <span className="hidden sm:inline">Copy</span>
                </span>
              </Button>
            </div>
            <Button onClick={() => setNewApiToken(null)} aria-label="Done">
              <span className="flex items-center gap-1.5">
                <CheckIcon size={14} /> <span className="hidden sm:inline">Done</span>
              </span>
            </Button>
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
                <FormLabel>Token name</FormLabel>
                <Input
                  type="text"
                  value={apiTokenName}
                  onChange={(e) => setApiTokenName(e.target.value)}
                  placeholder="e.g. CI pipeline"
                />
              </div>
              <Button
                onClick={onCreateApiToken}
                disabled={creatingApiToken || !apiTokenName.trim()}
              >
                {creatingApiToken ? 'Creating…' : 'Create token'}
              </Button>
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

      <hr className="border-gray-200 dark:border-gray-700" />

      {/* ── Share links ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Share links</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Generate a read-only link to share a summary of your job search — status counts and
            recent activity only, never company names, notes, contacts, or documents. Useful for
            keeping a mentor or accountability partner in the loop without giving full account
            access.
          </p>
        </div>

        {newShareLink && (
          <div className="space-y-3">
            <p className="text-sm text-green-600">
              Share link created successfully. Copy it now — the link won&apos;t be shown again.
            </p>
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <code className="flex-1 text-sm font-mono text-gray-900 dark:text-gray-100 break-all">
                {shareUrl(newShareLink.token)}
              </code>
              <Button
                variant="link"
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl(newShareLink.token));
                }}
                aria-label="Copy link"
                className="shrink-0"
              >
                <span className="flex items-center gap-1">
                  <CopyIcon size={14} /> <span className="hidden sm:inline">Copy</span>
                </span>
              </Button>
            </div>
            <Button onClick={() => setNewShareLink(null)} aria-label="Done">
              <span className="flex items-center gap-1.5">
                <CheckIcon size={14} /> <span className="hidden sm:inline">Done</span>
              </span>
            </Button>
          </div>
        )}

        {!newShareLink && (
          <>
            {shareLinkError && (
              <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                {shareLinkError}
              </p>
            )}
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <FormLabel>Link name</FormLabel>
                <Input
                  type="text"
                  value={shareLinkName}
                  onChange={(e) => setShareLinkName(e.target.value)}
                  placeholder="e.g. For my mentor"
                />
              </div>
              <Button
                onClick={onCreateShareLink}
                disabled={creatingShareLink || !shareLinkName.trim()}
              >
                {creatingShareLink ? 'Creating…' : 'Create link'}
              </Button>
            </div>
          </>
        )}

        {shareLinks.length > 0 && (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700 rounded-lg border border-gray-200 dark:border-gray-700">
            {shareLinks.map((link) => (
              <li key={link.id} className="flex items-center justify-between gap-4 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {link.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Created {new Date(link.createdAt).toLocaleDateString()}
                    {link.lastUsedAt &&
                      ` · Last viewed ${new Date(link.lastUsedAt).toLocaleDateString()}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteShareLink(link.id)}
                  disabled={deletingShareLinkId === link.id}
                  aria-label="Revoke share link"
                  className="shrink-0 flex items-center gap-1 text-xs text-red-600 hover:underline disabled:opacity-60"
                >
                  <Trash2Icon size={14} />{' '}
                  <span className="hidden sm:inline">
                    {deletingShareLinkId === link.id ? 'Deleting…' : 'Revoke'}
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
