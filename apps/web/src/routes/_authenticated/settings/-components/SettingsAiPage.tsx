import {
  CircleAlertIcon,
  CircleCheckIcon,
  PlugZapIcon,
  PlusIcon,
  SparklesIcon,
  StarIcon,
  Trash2Icon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from '@tanstack/react-router';
import { gqlClient } from '#/graphql/client';
import { useLocale } from '#/lib/i18n';
import { Alert, Button, Card, Checkbox, FormLabel, Input, Select, Textarea } from '@trakwyn/ui';
import {
  LLM_API_KEYS_QUERY,
  SAVE_LLM_API_KEY,
  DELETE_LLM_API_KEY,
  SET_DEFAULT_LLM_PROVIDER,
  TEST_LLM_API_KEY,
  UPDATE_PROFILE,
  llmApiKeySchema,
  customAiPromptSchema,
  CUSTOM_LLM_PROVIDER,
  type LlmApiKeyForm,
  type CustomAiPromptForm,
  type LlmApiKey,
  type TestLlmApiKeyResult,
  LLM_PROVIDER_OPTIONS,
  LLM_PROVIDER_LABEL,
  LLM_PROVIDER_AVATAR,
  extractGqlError,
} from './shared';

function TestResultLine({ result }: { result: TestLlmApiKeyResult }) {
  const { t } = useLocale();
  return (
    <p
      className={`mt-1 flex items-center gap-1 text-xs ${
        result.ok ? 'text-green-600' : 'text-red-600'
      }`}
    >
      {result.ok ? <CircleCheckIcon size={13} /> : <CircleAlertIcon size={13} />}
      {result.ok
        ? t('integrations.testKeySuccess')
        : (result.error ?? t('integrations.testKeyFailed'))}
    </p>
  );
}

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
        me: {
          defaultLlmProvider: string | null;
          customAiPrompt: string | null;
          useCrossApplicationContext: boolean;
        };
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

  // Progressive disclosure (redesign): once at least one provider is
  // connected, the add-key form stays collapsed behind an "Add provider"
  // button rather than always sitting open — a manual toggle overrides the
  // "open when there's nothing configured yet" default in both directions.
  const [addProviderOverride, setAddProviderOverride] = useState<boolean | null>(null);
  const addProviderOpen = addProviderOverride ?? llmApiKeys.length === 0;

  const onSaveLlmApiKey = async (data: LlmApiKeyForm) => {
    try {
      await gqlClient.request(SAVE_LLM_API_KEY, {
        provider: data.provider,
        apiKey: data.apiKey,
        model: data.model?.trim() || undefined,
        baseUrl: data.baseUrl?.trim() || undefined,
      });
      llmApiKeyForm.reset({ provider: data.provider, apiKey: '', model: '', baseUrl: '' });
      setAddProviderOverride(false);
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

  // Testing a saved key (JEF-247) — separate pending/result state per
  // provider row, so testing one key doesn't disturb another's last result.
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [savedKeyTestResults, setSavedKeyTestResults] = useState<
    Record<string, TestLlmApiKeyResult>
  >({});
  const onTestSavedLlmApiKey = async (provider: string) => {
    setTestingProvider(provider);
    setSavedKeyTestResults((prev) => {
      const next = { ...prev };
      delete next[provider];
      return next;
    });
    try {
      const data = await gqlClient.request<{ testLlmApiKey: TestLlmApiKeyResult }>(
        TEST_LLM_API_KEY,
        { provider },
      );
      setSavedKeyTestResults((prev) => ({ ...prev, [provider]: data.testLlmApiKey }));
    } catch (err) {
      setSavedKeyTestResults((prev) => ({
        ...prev,
        [provider]: { ok: false, error: extractGqlError(err) ?? t('integrations.testKeyFailed') },
      }));
    } finally {
      setTestingProvider(null);
    }
  };

  // Testing the add-key form's unsaved values, before Save (JEF-247).
  const [testingFormKey, setTestingFormKey] = useState(false);
  const [formTestResult, setFormTestResult] = useState<TestLlmApiKeyResult | null>(null);
  const [watchedApiKey, watchedModel, watchedBaseUrl] = llmApiKeyForm.watch([
    'apiKey',
    'model',
    'baseUrl',
  ]);
  const canTestLlmApiKeyForm =
    !!watchedApiKey?.trim() &&
    (!isCustomLlmProvider || (!!watchedModel?.trim() && !!watchedBaseUrl?.trim()));
  // Editing the form after a test invalidates that result — don't leave a
  // stale "Connection works" showing against a key the user has since changed.
  useEffect(() => {
    setFormTestResult(null);
  }, [llmApiKeyProvider, watchedApiKey, watchedModel, watchedBaseUrl]);
  const onTestLlmApiKeyForm = async () => {
    setTestingFormKey(true);
    setFormTestResult(null);
    try {
      const data = await gqlClient.request<{ testLlmApiKey: TestLlmApiKeyResult }>(
        TEST_LLM_API_KEY,
        {
          provider: llmApiKeyProvider,
          apiKey: watchedApiKey,
          model: watchedModel?.trim() || undefined,
          baseUrl: watchedBaseUrl?.trim() || undefined,
        },
      );
      setFormTestResult(data.testLlmApiKey);
    } catch (err) {
      setFormTestResult({
        ok: false,
        error: extractGqlError(err) ?? t('integrations.testKeyFailed'),
      });
    } finally {
      setTestingFormKey(false);
    }
  };

  const closeAddProviderForm = () => {
    setAddProviderOverride(false);
    llmApiKeyForm.reset({ provider: llmApiKeyProvider, apiKey: '', model: '', baseUrl: '' });
    setFormTestResult(null);
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

  // Cross-application context (JEF-249)
  const [crossAppContextError, setCrossAppContextError] = useState<string | null>(null);
  const [updatingCrossAppContext, setUpdatingCrossAppContext] = useState(false);
  const onToggleCrossApplicationContext = async (checked: boolean) => {
    setUpdatingCrossAppContext(true);
    setCrossAppContextError(null);
    try {
      await gqlClient.request(UPDATE_PROFILE, { useCrossApplicationContext: checked });
      await qc.invalidateQueries({ queryKey: ['llmApiKeys'] });
    } catch (err) {
      setCrossAppContextError(
        extractGqlError(err) ?? t('integrations.crossApplicationContextUpdateFailed'),
      );
    } finally {
      setUpdatingCrossAppContext(false);
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
      <Card className="overflow-hidden">
        <div className="px-5 pt-5 pb-1">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {t('integrations.aiFeaturesTitle')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('integrations.aiFeaturesDescription')}
          </p>
        </div>

        {llmKeyListError && (
          <div className="px-5 pt-3">
            <Alert>{llmKeyListError}</Alert>
          </div>
        )}

        {llmApiKeys.length > 0 && (
          <div className="mt-4 border-t border-gray-100 dark:border-gray-700/60">
            {llmApiKeys.map((key) => {
              const isDefault = key.provider === defaultLlmProvider;
              const avatar = LLM_PROVIDER_AVATAR[key.provider];
              const testResult = savedKeyTestResults[key.provider];
              return (
                <div
                  key={key.provider}
                  data-testid={`llm-provider-row-${key.provider}`}
                  className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 last:border-b-0 dark:border-gray-700/60"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    {avatar && (
                      <div
                        className={`flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${avatar.className}`}
                      >
                        {avatar.initials}
                      </div>
                    )}
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
                      {testResult && <TestResultLine result={testResult} />}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => onTestSavedLlmApiKey(key.provider)}
                      disabled={testingProvider === key.provider}
                      aria-label={t('integrations.testKey')}
                    >
                      <span className="flex items-center gap-1">
                        <PlugZapIcon size={14} />{' '}
                        <span className="hidden sm:inline">
                          {testingProvider === key.provider
                            ? t('integrations.testingKey')
                            : t('integrations.testKey')}
                        </span>
                      </span>
                    </Button>
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
                </div>
              );
            })}
          </div>
        )}

        <div className="p-5">
          {availableProviderOptions.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('integrations.allProvidersConfigured')}
            </p>
          ) : addProviderOpen ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/40">
              {llmApiKeys.length > 0 && (
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {t('integrations.addProvider')}
                  </h3>
                  <button
                    type="button"
                    onClick={closeAddProviderForm}
                    className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              )}
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
                {formTestResult && <TestResultLine result={formTestResult} />}
                <div className="flex items-center gap-3">
                  <Button type="submit" disabled={llmApiKeyForm.formState.isSubmitting}>
                    {llmApiKeyForm.formState.isSubmitting
                      ? t('applicationForm.saving')
                      : t('integrations.addKey')}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={onTestLlmApiKeyForm}
                    disabled={!canTestLlmApiKeyForm || testingFormKey}
                  >
                    {testingFormKey ? t('integrations.testingKey') : t('integrations.testKey')}
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddProviderOverride(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <PlusIcon size={15} />
              {t('integrations.addProvider')}
            </button>
          )}
        </div>
      </Card>

      {/* ── Custom instructions ── */}
      <Card className="p-5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          {t('integrations.customInstructionsLabel')}
        </h2>
        <p className="mt-1 mb-3.5 text-sm text-gray-500 dark:text-gray-400">
          {t('integrations.customInstructionsHelp')}
        </p>
        <form onSubmit={customAiPromptForm.handleSubmit(onUpdateCustomAiPrompt)}>
          <Textarea
            {...customAiPromptForm.register('customAiPrompt')}
            invalid={!!customAiPromptForm.formState.errors.customAiPrompt}
            rows={3}
            placeholder="e.g. Keep cover letters under 200 words and write in a casual tone."
          />
          {customAiPromptForm.formState.errors.customAiPrompt && (
            <p className="mt-1 text-xs text-red-600">
              {customAiPromptForm.formState.errors.customAiPrompt.message}
            </p>
          )}
          {customAiPromptForm.formState.errors.root?.message && (
            <div className="mt-3">
              <Alert>{customAiPromptForm.formState.errors.root.message}</Alert>
            </div>
          )}
          {customAiPromptForm.formState.isSubmitSuccessful &&
            !customAiPromptForm.formState.errors.root?.message && (
              <p className="mt-3 text-sm text-green-600">
                {t('integrations.customInstructionsUpdated')}
              </p>
            )}
          <Button
            type="submit"
            disabled={customAiPromptForm.formState.isSubmitting}
            className="mt-3.5"
          >
            {customAiPromptForm.formState.isSubmitting
              ? t('applicationForm.saving')
              : t('integrations.saveInstructions')}
          </Button>
        </form>
      </Card>

      {/* ── Cross-application context (JEF-249) ── */}
      <Card className="p-5">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {t('integrations.crossApplicationContextLabel')}
            </h2>
            <p className="mt-1 max-w-xl text-sm text-gray-500 dark:text-gray-400">
              {t('integrations.crossApplicationContextHelp')}
            </p>
          </div>
          <Checkbox
            id="use-cross-application-context"
            aria-label={t('integrations.crossApplicationContextLabel')}
            checked={llmData?.me.useCrossApplicationContext ?? false}
            disabled={updatingCrossAppContext}
            onChange={(e) => onToggleCrossApplicationContext(e.target.checked)}
          />
        </div>
        {crossAppContextError && (
          <div className="mt-3">
            <Alert>{crossAppContextError}</Alert>
          </div>
        )}
      </Card>
    </div>
  );
}
