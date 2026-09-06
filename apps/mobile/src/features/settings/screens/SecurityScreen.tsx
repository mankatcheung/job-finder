import React, { useState, useMemo } from 'react';
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
import { useLinkedOAuthAccounts, useUnlinkOAuthAccount } from '../hooks/useLinkedOAuthAccounts';
import type { LinkedOAuthAccount, OAuthProvider, Session } from '../types';
import { getErrorMessage } from '../../../lib/errors';
import { StepUpCancelledError, useStepUpReauth } from '../../../auth/useStepUpReauth';
import { OAuthProviderLogo } from '../../../screens/auth/OAuthProviderLogo';
import { useTheme } from '../../../theme/ThemeContext';
import type { ThemeColors } from '../../../theme/colors';

const OAUTH_PROVIDERS: OAuthProvider[] = ['google', 'github'];

const OAUTH_PROVIDER_LABEL: Record<OAuthProvider, string> = {
  google: 'Google',
  github: 'GitHub',
};

function LinkedAccountRow({
  provider,
  linked,
  onUnlink,
  isUnlinking,
}: {
  provider: OAuthProvider;
  linked: LinkedOAuthAccount | undefined;
  onUnlink: () => void;
  isUnlinking: boolean;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const providerLabel = OAUTH_PROVIDER_LABEL[provider];
  return (
    <View style={styles.oauthRow} testID={`linked-account-${provider}`}>
      <View style={styles.oauthRowMain}>
        <OAuthProviderLogo provider={provider} size={20} />
        <View style={styles.textColumn}>
          <Text style={styles.sessionTitle}>{providerLabel}</Text>
          <Text style={styles.sessionMeta}>
            {linked
              ? `${linked.email ?? 'Linked'} · since ${new Date(linked.createdAt).toLocaleDateString()}`
              : 'Not linked'}
          </Text>
        </View>
      </View>
      {linked ? (
        <Pressable onPress={onUnlink} disabled={isUnlinking} testID={`unlink-oauth-${provider}`}>
          <Text style={styles.linkDanger}>{isUnlinking ? 'Unlinking...' : 'Unlink'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function SessionRow({ session, onRevoke }: { session: Session; onRevoke: () => void }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data: sessions, isLoading, isError, error } = useSessions();
  const revokeSession = useRevokeSession();
  const revokeOthers = useRevokeOtherSessions();
  const updatePassword = useUpdatePassword();
  const { withStepUp, dialog: stepUpDialog } = useStepUpReauth();
  const {
    data: linkedAccounts,
    isLoading: linkedAccountsLoading,
    isError: linkedAccountsError,
    error: linkedAccountsErrorObj,
  } = useLinkedOAuthAccounts();
  const unlinkOAuthAccount = useUnlinkOAuthAccount();

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

  const onUnlink = (provider: OAuthProvider) => {
    const providerLabel = OAUTH_PROVIDER_LABEL[provider];
    Alert.alert(`Unlink ${providerLabel}`, `This will unlink your ${providerLabel} account.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unlink',
        style: 'destructive',
        onPress: () =>
          unlinkOAuthAccount.mutate(provider, {
            onError: (err) => Alert.alert('Could not unlink', getErrorMessage(err)),
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
          <ActivityIndicator color={colors.primary} testID="sessions-loading" />
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

        <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Linked accounts</Text>
        {linkedAccountsLoading ? (
          <ActivityIndicator color={colors.primary} testID="linked-accounts-loading" />
        ) : linkedAccountsError ? (
          <Text style={styles.error}>{getErrorMessage(linkedAccountsErrorObj)}</Text>
        ) : (
          OAUTH_PROVIDERS.map((provider) => (
            <LinkedAccountRow
              key={provider}
              provider={provider}
              linked={(linkedAccounts ?? []).find((a) => a.provider === provider)}
              onUnlink={() => onUnlink(provider)}
              isUnlinking={
                unlinkOAuthAccount.isPending && unlinkOAuthAccount.variables === provider
              }
            />
          ))
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

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, gap: 8 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
    sectionSpacing: { marginTop: 24 },
    error: {
      color: colors.danger,
      backgroundColor: colors.dangerSurface,
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
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      gap: 8,
    },
    textColumn: { flex: 1, gap: 2 },
    oauthRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      gap: 8,
    },
    oauthRowMain: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    sessionTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
    sessionMeta: { fontSize: 12, color: colors.textSubtle },
    linkDanger: { color: colors.danger, fontSize: 13, fontWeight: '600' },
    revokeOthersButton: {
      minHeight: 44,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.dangerBorder,
      backgroundColor: colors.dangerSurface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    revokeOthersText: { color: colors.danger, fontSize: 14, fontWeight: '600' },
    input: {
      borderWidth: 1,
      borderColor: colors.borderStrong,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 15,
      backgroundColor: colors.surface,
    },
    saveButton: {
      minHeight: 44,
      borderRadius: 8,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
    },
    saveButtonDisabled: { opacity: 0.6 },
    saveButtonText: { color: colors.surface, fontSize: 16, fontWeight: '600' },
  });
}
