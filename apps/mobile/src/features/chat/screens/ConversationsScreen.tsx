import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  useConversations,
  useCreateConversation,
  useDeleteConversation,
} from '../hooks/useConversations';
import type { Conversation } from '../types';
import { getErrorMessage } from '../../../lib/errors';
import { useTheme } from '../../../theme/ThemeContext';
import type { ThemeColors } from '../../../theme/colors';

export function ConversationsScreen() {
  const { t } = useTranslation('chat');
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { data: conversations, isLoading, isError, error } = useConversations();
  const deleteConversation = useDeleteConversation();
  const createConversation = useCreateConversation();

  const [composerText, setComposerText] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const onStartConversation = async () => {
    const trimmed = composerText.trim();
    if (!trimmed || isStarting) return;
    setStartError(null);
    setIsStarting(true);
    try {
      const created = await createConversation.mutateAsync({});
      setComposerText('');
      router.replace({
        pathname: './[id]',
        params: { id: created.id, initialMessage: trimmed },
      });
    } catch (err) {
      setStartError(getErrorMessage(err));
    } finally {
      setIsStarting(false);
    }
  };

  const onDelete = (conversation: Conversation) => {
    Alert.alert(t('conversations.deleteTitle'), t('conversations.deleteMessage'), [
      { text: t('conversations.cancel'), style: 'cancel' },
      {
        text: t('conversations.delete'),
        style: 'destructive',
        onPress: () =>
          deleteConversation.mutate(conversation.id, {
            onError: (err) =>
              Alert.alert(t('conversations.couldNotDeleteTitle'), getErrorMessage(err)),
          }),
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} testID="conversations-loading" />
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FlatList
        data={conversations ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>{t('conversations.empty')}</Text>}
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => router.push(`./${item.id}`)}
            testID={`conversation-${item.id}`}
          >
            <View style={styles.textColumn}>
              <Text style={styles.title} numberOfLines={1}>
                {item.title ?? t('conversations.newConversation')}
              </Text>
              <Text style={styles.meta}>{new Date(item.updatedAt).toLocaleDateString()}</Text>
            </View>
            <Pressable
              onPress={() => onDelete(item)}
              hitSlop={8}
              testID={`delete-conversation-${item.id}`}
            >
              <Text style={styles.linkDanger}>{t('conversations.delete')}</Text>
            </Pressable>
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {startError ? <Text style={styles.error}>{startError}</Text> : null}

      <View style={styles.composer}>
        <TextInput
          style={styles.composerInput}
          placeholder={t('inputPlaceholder')}
          value={composerText}
          onChangeText={setComposerText}
          multiline
          testID="assistant-composer-input"
        />
        <Pressable
          style={[
            styles.composerSendButton,
            (isStarting || !composerText.trim()) && styles.composerSendButtonDisabled,
          ]}
          onPress={() => void onStartConversation()}
          disabled={isStarting || !composerText.trim()}
          testID="assistant-composer-send-button"
        >
          <Text style={styles.composerSendButtonText}>{t('send')}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    error: { fontSize: 14, color: colors.danger, textAlign: 'center' },
    list: { padding: 16, paddingBottom: 96 },
    separator: { height: 10 },
    emptyText: { fontSize: 14, color: colors.textSubtle, textAlign: 'center', marginTop: 20 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
    },
    textColumn: { flex: 1, gap: 2 },
    title: { fontSize: 14, fontWeight: '600', color: colors.text },
    meta: { fontSize: 12, color: colors.textSubtle },
    linkDanger: { color: colors.danger, fontSize: 13, fontWeight: '600' },
    composer: {
      flexDirection: 'row',
      gap: 8,
      padding: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
      alignItems: 'flex-end',
    },
    composerInput: {
      flex: 1,
      minHeight: 44,
      maxHeight: 100,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      backgroundColor: colors.surface,
    },
    composerSendButton: {
      minHeight: 44,
      paddingHorizontal: 18,
      borderRadius: 8,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    composerSendButtonDisabled: { opacity: 0.5 },
    composerSendButtonText: { color: colors.surface, fontSize: 14, fontWeight: '600' },
  });
}
