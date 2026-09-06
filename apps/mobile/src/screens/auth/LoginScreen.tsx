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
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth, type OAuthProviderName } from '../../auth/AuthContext';
import { getErrorMessage } from '../../lib/errors';
import { loginSchema, totpSchema } from './loginSchema';
import { OAuthProviderLogo } from './OAuthProviderLogo';
import { useTheme } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/colors';

export function LoginScreen() {
  const { t } = useTranslation(['auth', 'common']);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { login, loginWithTotp, loginWithOAuth } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [totpRequired, setTotpRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [oauthProvider, setOAuthProvider] = useState<OAuthProviderName | null>(null);

  const onPressOAuth = async (provider: OAuthProviderName) => {
    setError(null);
    setOAuthProvider(provider);
    try {
      await loginWithOAuth(provider);
    } catch (err) {
      // AuthContext.loginWithOAuth always throws a plain Error with an
      // already user-facing message (an oauthError slug's copy, or a fixed
      // fallback) — not the GraphQL/network shapes getErrorMessage handles.
      setError(err instanceof Error ? err.message : t('common:errorGeneric'));
    } finally {
      setOAuthProvider(null);
    }
  };

  const onSubmit = async () => {
    setError(null);
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('auth:validation.invalidInput'));
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(parsed.data.email, parsed.data.password);
      if (result.totpRequired) setTotpRequired(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitTotp = async () => {
    setError(null);
    const parsed = totpSchema.safeParse({ code });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('auth:validation.invalidCode'));
      return;
    }

    setIsSubmitting(true);
    try {
      await loginWithTotp(email, password, parsed.data.code);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (totpRequired) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{t('auth:totp.title')}</Text>
          <Text style={styles.subtitle}>{t('auth:totp.subtitle')}</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TextInput
            style={styles.input}
            placeholder={t('auth:totp.codePlaceholder')}
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            autoFocus
            testID="totp-code-input"
          />

          <Pressable
            style={[styles.button, isSubmitting && styles.buttonDisabled]}
            onPress={onSubmitTotp}
            disabled={isSubmitting}
            testID="totp-submit-button"
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.buttonText}>{t('auth:totp.verify')}</Text>
            )}
          </Pressable>

          <Pressable onPress={() => setTotpRequired(false)}>
            <Text style={styles.link}>{t('auth:totp.back')}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{t('auth:appName')}</Text>
        <Text style={styles.subtitle}>{t('auth:login.subtitle')}</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder={t('auth:login.emailPlaceholder')}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          testID="login-email-input"
        />
        <TextInput
          style={styles.input}
          placeholder={t('auth:login.passwordPlaceholder')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
          testID="login-password-input"
        />

        <Pressable
          style={[styles.button, isSubmitting && styles.buttonDisabled]}
          onPress={onSubmit}
          disabled={isSubmitting}
          testID="login-submit-button"
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={styles.buttonText}>{t('auth:login.submit')}</Text>
          )}
        </Pressable>

        <Pressable onPress={() => router.push('/register')}>
          <Text style={styles.link}>{t('auth:login.noAccount')}</Text>
        </Pressable>

        <Pressable onPress={() => router.push('/forgot-password')}>
          <Text style={styles.link}>{t('auth:login.forgotPassword')}</Text>
        </Pressable>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{t('auth:login.or')}</Text>
          <View style={styles.dividerLine} />
        </View>

        <Pressable
          style={[styles.oauthButton, oauthProvider !== null && styles.buttonDisabled]}
          onPress={() => onPressOAuth('google')}
          disabled={oauthProvider !== null}
          testID="oauth-google-button"
        >
          {oauthProvider === 'google' ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <>
              <OAuthProviderLogo provider="google" />
              <Text style={styles.oauthButtonText}>{t('auth:login.googleSignIn')}</Text>
            </>
          )}
        </Pressable>

        <Pressable
          style={[styles.oauthButton, oauthProvider !== null && styles.buttonDisabled]}
          onPress={() => onPressOAuth('github')}
          disabled={oauthProvider !== null}
          testID="oauth-github-button"
        >
          {oauthProvider === 'github' ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <>
              <OAuthProviderLogo provider="github" />
              <Text style={styles.oauthButtonText}>{t('auth:login.githubSignIn')}</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 12 },
    title: { fontSize: 28, fontWeight: '700', color: colors.text, textAlign: 'center' },
    subtitle: { fontSize: 14, color: colors.textSubtle, textAlign: 'center', marginBottom: 12 },
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
    dividerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
    dividerText: { color: colors.textSubtle, fontSize: 12 },
    oauthButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      minHeight: 44,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      backgroundColor: colors.surface,
    },
    oauthButtonText: { color: colors.textMuted, fontSize: 15, fontWeight: '600' },
  });
}
