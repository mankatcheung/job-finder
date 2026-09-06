import React, { useState, useMemo } from 'react';
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
import { useTranslation } from 'react-i18next';
import { gqlRequest } from '../../graphql/client';
import { getErrorMessage } from '../../lib/errors';
import { forgotPasswordSchema } from './forgotPasswordSchema';
import { useTheme } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/colors';

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
  const { t } = useTranslation('auth');
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
      setError(parsed.error.issues[0]?.message ?? t('validation.invalidInput'));
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
        <Text style={styles.title}>{t('forgotPassword.title')}</Text>
        <Text style={styles.subtitle}>
          {recoveryMode === 'backup'
            ? t('forgotPassword.subtitleBackup')
            : t('forgotPassword.subtitlePrimary')}
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {isSubmitted ? (
          <Text style={styles.success} testID="forgot-password-success">
            {t('forgotPassword.successMessage')}
          </Text>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder={t('forgotPassword.emailPlaceholder')}
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
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={styles.buttonText}>
                  {recoveryMode === 'backup'
                    ? t('forgotPassword.sendRecoveryLink')
                    : t('forgotPassword.sendResetLink')}
                </Text>
              )}
            </Pressable>
          </>
        )}

        <Pressable
          onPress={() => setRecoveryMode((mode) => (mode === 'primary' ? 'backup' : 'primary'))}
        >
          <Text style={styles.link}>
            {recoveryMode === 'primary'
              ? t('forgotPassword.useBackupEmail')
              : t('forgotPassword.usePrimaryEmail')}
          </Text>
        </Pressable>

        <Pressable onPress={() => router.push('/login')}>
          <Text style={styles.link}>{t('forgotPassword.backToSignIn')}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 12 },
    title: { fontSize: 24, fontWeight: '700', color: colors.text, textAlign: 'center' },
    subtitle: { fontSize: 14, color: colors.textSubtle, textAlign: 'center', marginBottom: 4 },
    input: {
      borderWidth: 1,
      borderColor: colors.borderStrong,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      backgroundColor: colors.surface,
    },
    button: {
      minHeight: 44,
      borderRadius: 8,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
    },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: colors.surface, fontSize: 16, fontWeight: '600' },
    link: { color: colors.primary, textAlign: 'center', marginTop: 12 },
    error: {
      color: colors.danger,
      backgroundColor: colors.dangerSurface,
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
}
