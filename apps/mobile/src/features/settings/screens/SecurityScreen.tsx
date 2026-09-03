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
  useRevokeOtherSessions,
  useRevokeSession,
  useSessions,
  useUpdatePassword,
} from '../hooks/useSessions';
import type { Session } from '../types';
import { getErrorMessage } from '../../../lib/errors';
import { StepUpCancelledError, useStepUpReauth } from '../../../auth/useStepUpReauth';

function SessionRow({ session, onRevoke }: { session: Session; onRevoke: () => void }) {
  return (
    <View style={styles.sessionRow} testID={`session-${session.id}`}>
      <View style={styles.textColumn}>
        <Text style={styles.sessionTitle}>
          {session.deviceLabel ?? session.userAgent ?? 'Unknown device'}
          {session.current ? ' (this device)' : ''}
        </Text>
        <Text style={styles.sessionMeta}>
          {[session.location, session.ipAddress].filter(Boolean).join(' · ')}
        </Text>
        <Text style={styles.sessionMeta}>
          Last used {new Date(session.lastUsedAt).toLocaleString()}
        </Text>
      </View>
      {!session.current ? (
        <Pressable onPress={onRevoke} testID={`revoke-session-${session.id}`}>
          <Text style={styles.linkDanger}>Revoke</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function SecurityScreen() {
  const { data: sessions, isLoading, isError, error } = useSessions();
  const revokeSession = useRevokeSession();
  const revokeOthers = useRevokeOtherSessions();
  const updatePassword = useUpdatePassword();
  const { withStepUp, dialog: stepUpDialog } = useStepUpReauth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaved, setPasswordSaved] = useState(false);

  const onChangePassword = async () => {
    setPasswordError(null);
    setPasswordSaved(false);
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }
    try {
      // A TOTP-enabled account with a stale session gets STEP_UP_REQUIRED
      // here; withStepUp prompts for a fresh sign-in and retries.
      await withStepUp(() => updatePassword.mutateAsync({ currentPassword, newPassword }));
      setPasswordSaved(true);
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      if (err instanceof StepUpCancelledError) return;
      setPasswordError(getErrorMessage(err));
    }
  };

  const onRevokeOthers = () => {
    Alert.alert('Sign out other sessions', 'This will sign you out everywhere else.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out others',
        style: 'destructive',
        onPress: () =>
          revokeOthers.mutate(undefined, {
            onError: (err) =>
              Alert.alert('Could not sign out other sessions', getErrorMessage(err)),
          }),
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Sessions</Text>
        {isLoading ? (
          <ActivityIndicator color="#2563eb" testID="sessions-loading" />
        ) : isError ? (
          <Text style={styles.error}>{getErrorMessage(error)}</Text>
        ) : (
          <>
            {(sessions ?? []).map((session) => (
              <SessionRow
                key={session.id}
                session={session}
                onRevoke={() =>
                  revokeSession.mutate(session.id, {
                    onError: (err) => Alert.alert('Could not revoke', getErrorMessage(err)),
                  })
                }
              />
            ))}
            {(sessions ?? []).length > 1 ? (
              <Pressable
                style={styles.revokeOthersButton}
                onPress={onRevokeOthers}
                testID="revoke-other-sessions-button"
              >
                <Text style={styles.revokeOthersText}>Sign out other sessions</Text>
              </Pressable>
            ) : null}
          </>
        )}

        <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Change password</Text>
        {passwordError ? <Text style={styles.error}>{passwordError}</Text> : null}
        {passwordSaved ? <Text style={styles.success}>Password updated.</Text> : null}
        <TextInput
          style={styles.input}
          placeholder="Current password"
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrentPassword}
          testID="current-password-input"
        />
        <TextInput
          style={styles.input}
          placeholder="New password"
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
          testID="new-password-input"
        />
        <Pressable
          style={[styles.saveButton, updatePassword.isPending && styles.saveButtonDisabled]}
          onPress={() => void onChangePassword()}
          disabled={updatePassword.isPending}
          testID="change-password-button"
        >
          <Text style={styles.saveButtonText}>
            {updatePassword.isPending ? 'Saving...' : 'Update password'}
          </Text>
        </Pressable>
      </ScrollView>
      {stepUpDialog}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 20, gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  sectionSpacing: { marginTop: 24 },
  error: {
    color: '#b91c1c',
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  success: {
    color: '#047857',
    backgroundColor: '#d1fae5',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    gap: 8,
  },
  textColumn: { flex: 1, gap: 2 },
  sessionTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  sessionMeta: { fontSize: 12, color: '#6b7280' },
  linkDanger: { color: '#b91c1c', fontSize: 13, fontWeight: '600' },
  revokeOthersButton: {
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  revokeOthersText: { color: '#b91c1c', fontSize: 14, fontWeight: '600' },
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
    marginTop: 8,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
});
