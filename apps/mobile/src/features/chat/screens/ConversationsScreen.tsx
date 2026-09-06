import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useConversations, useDeleteConversation } from '../hooks/useConversations';
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
    <View style={styles.container}>
      <FlatList
        data={conversations ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>{t('conversations.empty')}</Text>}
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => router.push(`/conversations/${item.id}`)}
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

      <Pressable
        style={styles.newButton}
        onPress={() => router.push('/conversations/new')}
        testID="new-conversation-button"
      >
        <Text style={styles.newButtonText}>{t('conversations.newConversation')}</Text>
      </Pressable>
    </View>
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
    newButton: {
      position: 'absolute',
      left: 16,
      right: 16,
      bottom: 20,
      minHeight: 48,
      borderRadius: 10,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    newButtonText: { color: colors.surface, fontSize: 15, fontWeight: '600' },
  });
}
