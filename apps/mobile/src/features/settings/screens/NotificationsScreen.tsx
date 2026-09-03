import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '../hooks/useNotificationPreferences';
import { useEnablePushNotifications } from '../../push/hooks/usePushToken';
import { PushRegistrationError } from '../../push/lib/registerForPushNotifications';
import type { DigestFrequency } from '../types';
import { getErrorMessage } from '../../../lib/errors';

const DIGEST_OPTIONS: Array<{ value: DigestFrequency; label: string }> = [
  { value: 'OFF', label: 'Off' },
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
];

export function NotificationsScreen() {
  const { data: preferences, isLoading, isError, error } = useNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();
  const enablePush = useEnablePushNotifications();

  const [digestFrequency, setDigestFrequency] = useState<DigestFrequency>('OFF');
  const [followUpRemindersEnabled, setFollowUpRemindersEnabled] = useState(false);
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(false);
  const [weeklyGoal, setWeeklyGoal] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!preferences) return;
    setDigestFrequency(preferences.digestFrequency);
    setFollowUpRemindersEnabled(preferences.followUpRemindersEnabled);
    setPushNotificationsEnabled(preferences.pushNotificationsEnabled);
    setWeeklyGoal(preferences.weeklyApplicationGoal?.toString() ?? '');
  }, [preferences]);

  const save = (overrides: Partial<Record<string, unknown>> = {}) => {
    setSaveError(null);
    const goal = parseInt(weeklyGoal, 10);
    updatePreferences.mutate(
      {
        digestFrequency,
        followUpRemindersEnabled,
        pushNotificationsEnabled,
        ...(Number.isFinite(goal) ? { weeklyApplicationGoal: goal } : {}),
        ...overrides,
      },
      { onError: (err) => setSaveError(getErrorMessage(err)) },
    );
  };

  const onTogglePush = (value: boolean) => {
    setSaveError(null);
    if (!value) {
      setPushNotificationsEnabled(false);
      save({ pushNotificationsEnabled: false });
      return;
    }

    enablePush.mutate(undefined, {
      onSuccess: () => {
        setPushNotificationsEnabled(true);
        save({ pushNotificationsEnabled: true });
      },
      onError: (err) =>
        setSaveError(err instanceof PushRegistrationError ? err.message : getErrorMessage(err)),
    });
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" testID="notifications-loading" />
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {saveError ? <Text style={styles.error}>{saveError}</Text> : null}

      <Text style={styles.label}>Digest emails</Text>
      <View style={styles.chipRow}>
        {DIGEST_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            style={[styles.chip, digestFrequency === option.value && styles.chipActive]}
            onPress={() => {
              setDigestFrequency(option.value);
              save({ digestFrequency: option.value });
            }}
            testID={`digest-${option.value.toLowerCase()}`}
          >
            <Text
              style={[styles.chipText, digestFrequency === option.value && styles.chipTextActive]}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.label}>Follow-up reminders</Text>
        <Switch
          value={followUpRemindersEnabled}
          onValueChange={(value) => {
            setFollowUpRemindersEnabled(value);
            save({ followUpRemindersEnabled: value });
          }}
          testID="follow-up-reminders-switch"
        />
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.label}>Push notifications</Text>
        <Switch
          value={pushNotificationsEnabled}
          onValueChange={onTogglePush}
          disabled={enablePush.isPending}
          testID="push-notifications-switch"
        />
      </View>

      <Text style={styles.label}>Weekly application goal</Text>
      <TextInput
        style={styles.input}
        value={weeklyGoal}
        onChangeText={setWeeklyGoal}
        onEndEditing={() => save()}
        keyboardType="number-pad"
        testID="weekly-goal-input"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  content: { padding: 20, gap: 10 },
  error: {
    color: '#b91c1c',
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  label: { fontSize: 14, fontWeight: '600', color: '#111827' },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  chip: {
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#ffffff',
  },
  chipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  chipText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  chipTextActive: { color: '#ffffff' },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#ffffff',
  },
});
