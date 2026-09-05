import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApplication } from '../hooks/useApplicationQueries';
import { useCreateApplication, useUpdateApplication } from '../hooks/useApplicationMutations';
import { statusLabel } from '../components/StatusBadge';
import { APPLICATION_STATUSES, type ApplicationStatus } from '../types';
import { getErrorMessage } from '../../../lib/errors';
import {
  applicationFormSchema,
  EMPTY_APPLICATION_FORM_VALUES,
  type ApplicationFormValues,
} from './applicationFormSchema';

export function ApplicationFormScreen() {
  const router = useRouter();
  const { id: applicationId } = useLocalSearchParams<{ id?: string }>();
  const isEditing = Boolean(applicationId);

  const { data: existing, isLoading: isLoadingExisting } = useApplication(applicationId ?? '');
  const createApplication = useCreateApplication();
  const updateApplication = useUpdateApplication();

  const [values, setValues] = useState<ApplicationFormValues>(EMPTY_APPLICATION_FORM_VALUES);
  const [error, setError] = useState<string | null>(null);
  const [syncedExisting, setSyncedExisting] = useState<typeof existing>(undefined);

  if (existing && existing !== syncedExisting) {
    setSyncedExisting(existing);
    setValues({
      company: existing.company,
      role: existing.role,
      status: existing.status,
      jobUrl: existing.jobUrl ?? '',
      location: existing.location ?? '',
      salaryRange: existing.salaryRange ?? '',
      description: existing.description ?? '',
    });
  }

  const update = <K extends keyof ApplicationFormValues>(key: K, value: ApplicationFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const isSubmitting = createApplication.isPending || updateApplication.isPending;

  const onSubmit = () => {
    setError(null);
    const parsed = applicationFormSchema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid input');
      return;
    }

    const input = {
      company: parsed.data.company,
      role: parsed.data.role,
      status: parsed.data.status,
      jobUrl: parsed.data.jobUrl || undefined,
      location: parsed.data.location || undefined,
      salaryRange: parsed.data.salaryRange || undefined,
      description: parsed.data.description || undefined,
    };

    const onSuccess = () => router.back();
    const onMutationError = (err: unknown) => setError(getErrorMessage(err));

    if (isEditing && applicationId) {
      updateApplication.mutate(
        { id: applicationId, input },
        { onSuccess, onError: onMutationError },
      );
    } else {
      createApplication.mutate(input, { onSuccess, onError: onMutationError });
    }
  };

  if (isEditing && isLoadingExisting) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" testID="application-form-loading" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.label}>Company</Text>
        <TextInput
          style={styles.input}
          value={values.company}
          onChangeText={(v) => update('company', v)}
          testID="form-company-input"
        />

        <Text style={styles.label}>Role</Text>
        <TextInput
          style={styles.input}
          value={values.role}
          onChangeText={(v) => update('role', v)}
          testID="form-role-input"
        />

        <Text style={styles.label}>Status</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusRow}>
          {APPLICATION_STATUSES.map((status) => (
            <StatusChip
              key={status}
              status={status}
              active={values.status === status}
              onPress={() => update('status', status)}
            />
          ))}
        </ScrollView>

        <Text style={styles.label}>Job URL</Text>
        <TextInput
          style={styles.input}
          value={values.jobUrl}
          onChangeText={(v) => update('jobUrl', v)}
          autoCapitalize="none"
          keyboardType="url"
          testID="form-joburl-input"
        />

        <Text style={styles.label}>Location</Text>
        <TextInput
          style={styles.input}
          value={values.location}
          onChangeText={(v) => update('location', v)}
          testID="form-location-input"
        />

        <Text style={styles.label}>Salary range</Text>
        <TextInput
          style={styles.input}
          value={values.salaryRange}
          onChangeText={(v) => update('salaryRange', v)}
          testID="form-salary-input"
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={values.description}
          onChangeText={(v) => update('description', v)}
          multiline
          numberOfLines={4}
          testID="form-description-input"
        />

        <Pressable
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={onSubmit}
          disabled={isSubmitting}
          testID="form-submit-button"
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Saving...' : isEditing ? 'Save changes' : 'Create application'}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function StatusChip({
  status,
  active,
  onPress,
}: {
  status: ApplicationStatus;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
      testID={`form-status-${status}`}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{statusLabel(status)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 20, gap: 6 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#ffffff',
  },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  statusRow: { marginBottom: 4 },
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
  submitButton: {
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  error: {
    color: '#b91c1c',
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    marginBottom: 4,
  },
});
