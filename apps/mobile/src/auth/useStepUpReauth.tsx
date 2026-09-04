import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from './AuthContext';
import { ERROR_CODES } from '../constants';
import { getErrorCode, getErrorMessage } from '../lib/errors';

/** Thrown to the caller of `withStepUp` when the user dismisses the prompt instead of completing it — "nothing happened", not a failure to report. */
export class StepUpCancelledError extends Error {
  constructor() {
    super('Step-up re-authentication was cancelled');
    this.name = 'StepUpCancelledError';
  }
}

interface PendingStepUp {
  retry: () => void;
  cancel: () => void;
}

/**
 * Wraps a mutation call so a STEP_UP_REQUIRED error — thrown when a
 * TOTP-enabled account's session is stale (JEF-44) — opens a "confirm it's
 * you" prompt and retries the original call once reauthentication succeeds,
 * instead of surfacing the raw error. Ported from apps/web's useStepUpReauth.
 */
export function useStepUpReauth(): {
  withStepUp: <T>(fn: () => Promise<T>) => Promise<T>;
  dialog: React.ReactNode;
} {
  const [pending, setPending] = useState<PendingStepUp | null>(null);

  function withStepUp<T>(fn: () => Promise<T>): Promise<T> {
    return fn().catch((err: unknown) => {
      if (getErrorCode(err) !== ERROR_CODES.STEP_UP_REQUIRED) throw err;
      return new Promise<T>((resolve, reject) => {
        setPending({
          retry: () => {
            setPending(null);
            fn().then(resolve, reject);
          },
          cancel: () => {
            setPending(null);
            reject(new StepUpCancelledError());
          },
        });
      });
    });
  }

  const dialog = pending ? (
    <StepUpReauthPrompt onSuccess={pending.retry} onCancel={pending.cancel} />
  ) : null;

  return { withStepUp, dialog };
}

function StepUpReauthPrompt({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { reauthenticate } = useAuth();
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [totpRequired, setTotpRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async () => {
    setError(null);
    if (!password) {
      setError('Enter your password');
      return;
    }
    if (totpRequired && !code.trim()) {
      setError('Enter your 6-digit code or a backup code');
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await reauthenticate(password, totpRequired ? code.trim() : undefined);
      if (result.totpRequired) {
        setTotpRequired(true);
        return;
      }
      onSuccess();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.sheet} testID="step-up-reauth">
          <Text style={styles.title}>Confirm it&apos;s you</Text>
          <Text style={styles.subtitle}>
            This change needs a recent sign-in. Enter your password
            {totpRequired ? ' and your authenticator code' : ''} to continue.
          </Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            autoComplete="password"
            value={password}
            onChangeText={setPassword}
            autoFocus={!totpRequired}
            testID="step-up-password-input"
          />
          {totpRequired ? (
            <TextInput
              style={styles.input}
              placeholder="123456"
              keyboardType="number-pad"
              value={code}
              onChangeText={setCode}
              autoFocus
              testID="step-up-code-input"
            />
          ) : null}

          <View style={styles.actions}>
            <Pressable onPress={onCancel} disabled={isSubmitting} testID="step-up-cancel-button">
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.confirmButton, isSubmitting && styles.disabled]}
              onPress={() => void onSubmit()}
              disabled={isSubmitting}
              testID="step-up-confirm-button"
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.confirmText}>{totpRequired ? 'Verify code' : 'Confirm'}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 20,
    gap: 12,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6b7280' },
  error: {
    color: '#b91c1c',
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
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
  actions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 20 },
  cancelText: { color: '#6b7280', fontSize: 14, fontWeight: '600' },
  confirmButton: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.6 },
  confirmText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
});
