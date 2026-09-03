import React, { useEffect, useState } from 'react';
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
import { useProfile, useUpdateProfile } from '../hooks/useProfile';
import { getErrorMessage } from '../../../lib/errors';

export function ProfileScreen() {
  const { data: profile, isLoading, isError, error } = useProfile();
  const updateProfile = useUpdateProfile();

  const [name, setName] = useState('');
  const [timezone, setTimezone] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setName(profile.name ?? '');
    setTimezone(profile.timezone ?? '');
    setTargetRole(profile.targetRole ?? '');
  }, [profile]);

  const onSave = () => {
    setSaveError(null);
    setSaved(false);
    updateProfile.mutate(
      { name, timezone, targetRole },
      {
        onSuccess: () => setSaved(true),
        onError: (err) => setSaveError(getErrorMessage(err)),
      },
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" testID="profile-loading" />
      </View>
    );
  }

  if (isError || !profile) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>
          {error ? getErrorMessage(error) : 'Could not load profile'}
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {saveError ? <Text style={styles.error}>{saveError}</Text> : null}
        {saved ? <Text style={styles.success}>Saved.</Text> : null}

        <Text style={styles.label}>Email</Text>
        <Text style={styles.readOnly}>{profile.email}</Text>

        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          testID="profile-name-input"
        />

        <Text style={styles.label}>Timezone</Text>
        <TextInput
          style={styles.input}
          value={timezone}
          onChangeText={setTimezone}
          placeholder="e.g. Europe/London"
          testID="profile-timezone-input"
        />

        <Text style={styles.label}>Target role</Text>
        <TextInput
          style={styles.input}
          value={targetRole}
          onChangeText={setTargetRole}
          testID="profile-target-role-input"
        />

        <Pressable
          style={[styles.saveButton, updateProfile.isPending && styles.saveButtonDisabled]}
          onPress={onSave}
          disabled={updateProfile.isPending}
          testID="profile-save-button"
        >
          <Text style={styles.saveButtonText}>
            {updateProfile.isPending ? 'Saving...' : 'Save'}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  content: { padding: 20, gap: 6 },
  error: {
    color: '#b91c1c',
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    marginBottom: 8,
  },
  success: {
    color: '#047857',
    backgroundColor: '#d1fae5',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    marginBottom: 8,
  },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 10 },
  readOnly: { fontSize: 15, color: '#6b7280', paddingVertical: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#ffffff',
  },
  saveButton: {
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
});
