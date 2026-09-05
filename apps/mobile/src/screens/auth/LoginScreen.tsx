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
import { useRouter } from 'expo-router';
import { useAuth, type OAuthProviderName } from '../../auth/AuthContext';
import { getErrorMessage } from '../../lib/errors';
import { loginSchema, totpSchema } from './loginSchema';
import { OAuthProviderLogo } from './OAuthProviderLogo';

export function LoginScreen() {
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
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setOAuthProvider(null);
    }
  };

  const onSubmit = async () => {
    setError(null);
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid input');
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
      setError(parsed.error.issues[0]?.message ?? 'Invalid code');
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
          <Text style={styles.title}>Two-factor authentication</Text>
          <Text style={styles.subtitle}>Enter the 6-digit code from your authenticator app.</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TextInput
            style={styles.input}
            placeholder="123456"
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
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Verify</Text>
            )}
          </Pressable>

          <Pressable onPress={() => setTotpRequired(false)}>
            <Text style={styles.link}>Back</Text>
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
        <Text style={styles.title}>Trakwyn</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          testID="login-email-input"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
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
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Sign in</Text>
          )}
        </Pressable>

        <Pressable onPress={() => router.push('/register')}>
          <Text style={styles.link}>Don&apos;t have an account? Sign up</Text>
        </Pressable>

        <Pressable onPress={() => router.push('/forgot-password')}>
          <Text style={styles.link}>Forgot your password?</Text>
        </Pressable>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <Pressable
          style={[styles.oauthButton, oauthProvider !== null && styles.buttonDisabled]}
          onPress={() => onPressOAuth('google')}
          disabled={oauthProvider !== null}
          testID="oauth-google-button"
        >
          {oauthProvider === 'google' ? (
            <ActivityIndicator color="#111827" />
          ) : (
            <>
              <OAuthProviderLogo provider="google" />
              <Text style={styles.oauthButtonText}>Sign in with Google</Text>
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
            <ActivityIndicator color="#111827" />
          ) : (
            <>
              <OAuthProviderLogo provider="github" />
              <Text style={styles.oauthButtonText}>Sign in with GitHub</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 28, fontWeight: '700', color: '#111827', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 12 },
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
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e5e7eb' },
  dividerText: { color: '#6b7280', fontSize: 12 },
  oauthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  oauthButtonText: { color: '#374151', fontSize: 15, fontWeight: '600' },
});
