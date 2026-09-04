import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../../../auth/AuthContext';
import { getErrorMessage } from '../../../lib/errors';
import { useDeleteAccount } from '../hooks/useDeleteAccount';
import { STEP_UP_CANCELLED, useStepUpReauth } from '../hooks/useStepUpReauth';

/**
 * Account deletion, on its own screen rather than bundled with Export/Import
 * (JEF-204's reasoning, ported from apps/web) — irreversible and
 * password-gated, so it shouldn't be reachable by accident.
 */
export function DangerZoneScreen() {
  const { logout } = useAuth();
  const deleteAccount = useDeleteAccount();
  const { withStepUp, dialog } = useStepUpReauth();

  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onDeleteAccount = async () => {
    setError(null);
    try {
      await withStepUp(() => deleteAccount.mutateAsync(password));
      await logout();
    } catch (err) {
      if (err instanceof Error && err.message === STEP_UP_CANCELLED) return;
      setError(getErrorMessage(err));
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>Danger zone</Text>
        <Text style={styles.description}>
          Deleting your account is permanent. All your applications, notes, and documents will be
          removed.
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Confirm your password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          testID="delete-account-password-input"
        />

        <Pressable
          style={[styles.deleteButton, deleteAccount.isPending && styles.deleteButtonDisabled]}
          onPress={onDeleteAccount}
          disabled={deleteAccount.isPending || !password}
          testID="delete-account-button"
        >
          {deleteAccount.isPending ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.deleteButtonText}>Delete my account</Text>
          )}
        </Pressable>
      </View>

      {dialog}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 20 },
  card: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 16,
    gap: 12,
  },
  title: { fontSize: 15, fontWeight: '700', color: '#b91c1c' },
  description: { fontSize: 13, color: '#b91c1c' },
  input: {
    maxWidth: 320,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#ffffff',
  },
  error: {
    color: '#b91c1c',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
  },
  deleteButton: {
    alignSelf: 'flex-start',
    minHeight: 40,
    borderRadius: 8,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  deleteButtonDisabled: { opacity: 0.6 },
  deleteButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
});
