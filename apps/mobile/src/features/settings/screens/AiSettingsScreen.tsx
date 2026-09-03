import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  useDeleteLlmApiKey,
  useLlmApiKeys,
  useSaveLlmApiKey,
  useSetDefaultLlmProvider,
  useTestLlmApiKey,
} from '../hooks/useLlmApiKeys';
import { LLM_PROVIDER_LABEL, LLM_PROVIDERS, type LlmApiKey } from '../types';
import { getErrorMessage } from '../../../lib/errors';

function KeyRow({
  apiKey,
  isDefault,
  onSetDefault,
  onDelete,
}: {
  apiKey: LlmApiKey;
  isDefault: boolean;
  onSetDefault: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={styles.keyRow} testID={`llm-key-${apiKey.provider}`}>
      <View style={styles.textColumn}>
        <Text style={styles.keyProvider}>
          {LLM_PROVIDER_LABEL[apiKey.provider] ?? apiKey.provider}
          {isDefault ? ' · Default' : ''}
        </Text>
        {apiKey.model ? <Text style={styles.keyMeta}>{apiKey.model}</Text> : null}
      </View>
      <View style={styles.keyActions}>
        {!isDefault ? (
          <Pressable onPress={onSetDefault} testID={`set-default-${apiKey.provider}`}>
            <Text style={styles.link}>Make default</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={onDelete} testID={`delete-llm-key-${apiKey.provider}`}>
          <Text style={styles.linkDanger}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function AiSettingsScreen() {
  const { data, isLoading, isError, error } = useLlmApiKeys();
  const saveKey = useSaveLlmApiKey();
  const deleteKey = useDeleteLlmApiKey();
  const setDefault = useSetDefaultLlmProvider();
  const testKey = useTestLlmApiKey();

  const [provider, setProvider] = useState<string>(LLM_PROVIDERS[0]);
  const [apiKeyValue, setApiKeyValue] = useState('');
  const [model, setModel] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);

  const onTest = () => {
    setFormError(null);
    setTestResult(null);
    testKey.mutate(
      {
        provider,
        apiKey: apiKeyValue || undefined,
        model: model || undefined,
        baseUrl: baseUrl || undefined,
      },
      {
        onSuccess: (result) =>
          setTestResult(result.ok ? 'Key works.' : (result.error ?? 'Test failed')),
        onError: (err) => setFormError(getErrorMessage(err)),
      },
    );
  };

  const onSave = () => {
    setFormError(null);
    if (!apiKeyValue.trim()) {
      setFormError('API key is required');
      return;
    }
    saveKey.mutate(
      { provider, apiKey: apiKeyValue, model: model || undefined, baseUrl: baseUrl || undefined },
      {
        onSuccess: () => {
          setApiKeyValue('');
          setModel('');
          setBaseUrl('');
          setTestResult(null);
        },
        onError: (err) => setFormError(getErrorMessage(err)),
      },
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" testID="ai-settings-loading" />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{getErrorMessage(error)}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Configured providers</Text>
        {(data?.keys ?? []).length === 0 ? (
          <Text style={styles.emptyText}>No providers configured yet.</Text>
        ) : (
          data?.keys.map((key) => (
            <KeyRow
              key={key.provider}
              apiKey={key}
              isDefault={key.provider === data.defaultProvider}
              onSetDefault={() => setDefault.mutate(key.provider)}
              onDelete={() =>
                Alert.alert(
                  'Delete key',
                  `Remove your ${LLM_PROVIDER_LABEL[key.provider] ?? key.provider} key?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () =>
                        deleteKey.mutate(key.provider, {
                          onError: (err) => Alert.alert('Could not delete', getErrorMessage(err)),
                        }),
                    },
                  ],
                )
              }
            />
          ))
        )}

        <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Add a provider</Text>
        {formError ? <Text style={styles.error}>{formError}</Text> : null}
        {testResult ? <Text style={styles.testResult}>{testResult}</Text> : null}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {LLM_PROVIDERS.map((p) => (
            <Pressable
              key={p}
              style={[styles.chip, provider === p && styles.chipActive]}
              onPress={() => setProvider(p)}
              testID={`provider-${p}`}
            >
              <Text style={[styles.chipText, provider === p && styles.chipTextActive]}>
                {LLM_PROVIDER_LABEL[p]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <TextInput
          style={styles.input}
          placeholder="API key"
          value={apiKeyValue}
          onChangeText={setApiKeyValue}
          secureTextEntry
          autoCapitalize="none"
          testID="llm-api-key-input"
        />
        <TextInput
          style={styles.input}
          placeholder="Model (optional)"
          value={model}
          onChangeText={setModel}
          autoCapitalize="none"
          testID="llm-model-input"
        />
        {provider === 'custom' ? (
          <TextInput
            style={styles.input}
            placeholder="Base URL"
            value={baseUrl}
            onChangeText={setBaseUrl}
            autoCapitalize="none"
            testID="llm-base-url-input"
          />
        ) : null}

        <View style={styles.formActions}>
          <Pressable
            style={styles.testButton}
            onPress={onTest}
            disabled={testKey.isPending}
            testID="test-llm-key-button"
          >
            <Text style={styles.testButtonText}>{testKey.isPending ? 'Testing...' : 'Test'}</Text>
          </Pressable>
          <Pressable
            style={[styles.saveButton, saveKey.isPending && styles.saveButtonDisabled]}
            onPress={onSave}
            disabled={saveKey.isPending}
            testID="save-llm-key-button"
          >
            <Text style={styles.saveButtonText}>{saveKey.isPending ? 'Saving...' : 'Save'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  content: { padding: 20, gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  sectionSpacing: { marginTop: 24 },
  emptyText: { fontSize: 14, color: '#6b7280' },
  error: {
    color: '#b91c1c',
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  testResult: {
    color: '#374151',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  keyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
  },
  textColumn: { flex: 1, gap: 2 },
  keyProvider: { fontSize: 14, fontWeight: '600', color: '#111827' },
  keyMeta: { fontSize: 12, color: '#6b7280' },
  keyActions: { flexDirection: 'row', gap: 16 },
  link: { color: '#2563eb', fontSize: 13, fontWeight: '600' },
  linkDanger: { color: '#b91c1c', fontSize: 13, fontWeight: '600' },
  chipRow: { flexGrow: 0, marginTop: 4 },
  chip: {
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 8,
    backgroundColor: '#ffffff',
  },
  chipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  chipText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  chipTextActive: { color: '#ffffff' },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#ffffff',
  },
  formActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  testButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  testButtonText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  saveButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
});
