import { SparklesIcon, StarIcon, Trash2Icon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from '@tanstack/react-router';
import { gqlClient } from '#/graphql/client';
import { useLocale } from '#/lib/i18n';
import { Alert, Button, FormLabel, Input, Select, Textarea } from '@trakwyn/ui';
import {
  LLM_API_KEYS_QUERY,
  SAVE_LLM_API_KEY,
  DELETE_LLM_API_KEY,
  SET_DEFAULT_LLM_PROVIDER,
  UPDATE_PROFILE,
  llmApiKeySchema,
  customAiPromptSchema,
  CUSTOM_LLM_PROVIDER,
  type LlmApiKeyForm,
  type CustomAiPromptForm,
  type LlmApiKey,
  LLM_PROVIDER_OPTIONS,
  LLM_PROVIDER_LABEL,
  extractGqlError,
} from './shared';

/**
 * Bring-your-own-key AI settings: provider keys, which provider is the
 * default, and the custom instructions appended to every prompt. The
 * target for every "add your API key" prompt scattered through the app.
 */
export function SettingsAiPage() {
  const { t } = useLocale();
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
        message: extractGqlError(err) ?? t('integrations.saveApiKeyFailed'),
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
      setLlmKeyListError(extractGqlError(err) ?? t('integrations.removeApiKeyFailed'));
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
      setLlmKeyListError(extractGqlError(err) ?? t('integrations.setDefaultProviderFailed'));
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
        message: extractGqlError(err) ?? t('integrations.updateCustomInstructionsFailed'),
      });
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between gap-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-900 dark:bg-blue-900/20">
        <div className="flex items-center gap-3">
          <SparklesIcon className="size-4.5 shrink-0 text-blue-700 dark:text-blue-400" />
          <p className="text-sm text-blue-900 dark:text-blue-300">
            {t('guides.aiMcpSetup.bannerAiText')}
          </p>
        </div>
        <Link
          to="/ai-mcp-setup"
          className="shrink-0 text-sm font-semibold text-blue-700 hover:underline dark:text-blue-400"
        >
          {t('guides.aiMcpSetup.bannerLink')}
        </Link>
      </div>

      {/* ── AI features ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {t('integrations.aiFeaturesTitle')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('integrations.aiFeaturesDescription')}
          </p>
        </div>

        {llmKeyListError && <Alert>{llmKeyListError}</Alert>}

        {llmApiKeys.length > 0 && (
          <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 dark:divide-gray-700 dark:border-gray-700">
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
                        <span className="ml-2 text-xs font-normal text-green-600">
                          {t('integrations.default')}
                        </span>
                      )}
                    </p>
                    {(key.model || key.baseUrl) && (
                      <p className="text-xs break-all text-gray-500 dark:text-gray-400">
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
                        aria-label={t('integrations.makeDefault')}
                      >
                        <span className="flex items-center gap-1">
                          <StarIcon size={14} />{' '}
                          <span className="hidden sm:inline">
                            {settingDefaultProvider === key.provider
                              ? t('integrations.settingDefault')
                              : t('integrations.makeDefault')}
                          </span>
                        </span>
                      </Button>
                    )}
                    <button
                      type="button"
                      onClick={() => onRemoveLlmApiKey(key.provider)}
                      disabled={removingProvider === key.provider}
                      aria-label={t('integrations.remove')}
                      className="flex items-center gap-1 text-xs text-red-600 hover:underline disabled:opacity-60"
                    >
                      <Trash2Icon size={14} />{' '}
                      <span className="hidden sm:inline">
                        {removingProvider === key.provider
                          ? t('integrations.removing')
                          : t('integrations.remove')}
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
              <FormLabel>{t('integrations.providerLabel')}</FormLabel>
              <Select {...llmApiKeyForm.register('provider')}>
                {availableProviderOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <FormLabel>{t('integrations.apiKeyLabel')}</FormLabel>
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
                  <FormLabel>{t('integrations.baseUrlLabel')}</FormLabel>
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
                  <FormLabel>{t('integrations.modelLabel')}</FormLabel>
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
                  {t('integrations.modelLabel')}{' '}
                  <span className="font-normal text-gray-400">
                    ({t('integrations.modelOptionalNote')})
                  </span>
                </FormLabel>
                <Input
                  type="text"
                  {...llmApiKeyForm.register('model')}
                  placeholder={t('integrations.providerDefaultPlaceholder')}
                />
              </div>
            )}
            {llmApiKeyForm.formState.errors.root && (
              <Alert>{llmApiKeyForm.formState.errors.root.message}</Alert>
            )}
            <Button type="submit" disabled={llmApiKeyForm.formState.isSubmitting}>
              {llmApiKeyForm.formState.isSubmitting
                ? t('applicationForm.saving')
                : t('integrations.addKey')}
            </Button>
          </form>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('integrations.allProvidersConfigured')}
          </p>
        )}

        <form
          onSubmit={customAiPromptForm.handleSubmit(onUpdateCustomAiPrompt)}
          className="space-y-3"
        >
          <div>
            <FormLabel>{t('integrations.customInstructionsLabel')}</FormLabel>
            <Textarea
              {...customAiPromptForm.register('customAiPrompt')}
              invalid={!!customAiPromptForm.formState.errors.customAiPrompt}
              rows={3}
              placeholder="e.g. Keep cover letters under 200 words and write in a casual tone."
            />
            <p className="mt-1 text-xs text-gray-400">{t('integrations.customInstructionsHelp')}</p>
            {customAiPromptForm.formState.errors.customAiPrompt && (
              <p className="mt-1 text-xs text-red-600">
                {customAiPromptForm.formState.errors.customAiPrompt.message}
              </p>
            )}
          </div>
          {customAiPromptForm.formState.errors.root?.message && (
            <Alert>{customAiPromptForm.formState.errors.root.message}</Alert>
          )}
          {customAiPromptForm.formState.isSubmitSuccessful &&
            !customAiPromptForm.formState.errors.root?.message && (
              <p className="text-sm text-green-600">
                {t('integrations.customInstructionsUpdated')}
              </p>
            )}
          <Button type="submit" disabled={customAiPromptForm.formState.isSubmitting}>
            {customAiPromptForm.formState.isSubmitting
              ? t('applicationForm.saving')
              : t('integrations.saveInstructions')}
          </Button>
        </form>
      </section>
    </div>
  );
}
