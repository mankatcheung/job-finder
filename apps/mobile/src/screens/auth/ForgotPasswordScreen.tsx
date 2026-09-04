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
} from 'react-native';
import { useRouter } from 'expo-router';
import { gqlRequest } from '../../graphql/client';
import { getErrorMessage } from '../../lib/errors';
import { forgotPasswordSchema } from './forgotPasswordSchema';

const REQUEST_PASSWORD_RESET_MUTATION = `
  mutation RequestPasswordReset($email: String!) {
    requestPasswordReset(email: $email)
  }
`;

const REQUEST_BACKUP_EMAIL_RECOVERY_MUTATION = `
  mutation RequestBackupEmailRecovery($backupEmail: String!) {
    requestBackupEmailRecovery(backupEmail: $backupEmail)
  }
`;

type RecoveryMode = 'primary' | 'backup';

export function ForgotPasswordScreen() {
  const router = useRouter();

  const [recoveryMode, setRecoveryMode] = useState<RecoveryMode>('primary');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const onSubmit = async () => {
    setError(null);
    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid input');
      return;
    }

    setIsSubmitting(true);
    try {
      // Always resolves — the backend responds identically for known and
      // unknown emails so this form can't be used to enumerate accounts.
      if (recoveryMode === 'backup') {
        await gqlRequest(REQUEST_BACKUP_EMAIL_RECOVERY_MUTATION, {
          backupEmail: parsed.data.email,
        });
      } else {
        await gqlRequest(REQUEST_PASSWORD_RESET_MUTATION, { email: parsed.data.email });
      }
      setIsSubmitted(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Reset your password</Text>
        <Text style={styles.subtitle}>
          {recoveryMode === 'backup'
            ? 'Enter your backup email and we will send you a recovery link.'
            : 'Enter your email and we will send you a link to reset your password.'}
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {isSubmitted ? (
          <Text style={styles.success} testID="forgot-password-success">
            If an account exists for that email, we have sent a link to reset your password.
          </Text>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              testID="forgot-password-email-input"
            />

            <Pressable
              style={[styles.button, isSubmitting && styles.buttonDisabled]}
              onPress={onSubmit}
              disabled={isSubmitting}
              testID="forgot-password-submit-button"
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>
                  {recoveryMode === 'backup' ? 'Send recovery link' : 'Send reset link'}
                </Text>
              )}
            </Pressable>
          </>
        )}

        <Pressable
          onPress={() => setRecoveryMode((mode) => (mode === 'primary' ? 'backup' : 'primary'))}
        >
          <Text style={styles.link}>
            {recoveryMode === 'primary' ? 'Use backup email instead' : 'Use primary email instead'}
          </Text>
        </Pressable>

        <Pressable onPress={() => router.push('/login')}>
          <Text style={styles.link}>Back to sign in</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  button: {
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  link: { color: '#2563eb', textAlign: 'center', marginTop: 12 },
  error: {
    color: '#b91c1c',
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  success: {
    color: '#166534',
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
});
