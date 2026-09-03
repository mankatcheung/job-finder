import React from 'react';
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
import { useConversations, useDeleteConversation } from '../hooks/useConversations';
import type { Conversation } from '../types';
import { getErrorMessage } from '../../../lib/errors';

export function ConversationsScreen() {
  const router = useRouter();
  const { data: conversations, isLoading, isError, error } = useConversations();
  const deleteConversation = useDeleteConversation();

  const onDelete = (conversation: Conversation) => {
    Alert.alert('Delete conversation', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          deleteConversation.mutate(conversation.id, {
            onError: (err) => Alert.alert('Could not delete', getErrorMessage(err)),
          }),
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" testID="conversations-loading" />
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
        ListEmptyComponent={<Text style={styles.emptyText}>No conversations yet.</Text>}
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => router.push(`/conversations/${item.id}`)}
            testID={`conversation-${item.id}`}
          >
            <View style={styles.textColumn}>
              <Text style={styles.title} numberOfLines={1}>
                {item.title ?? 'New conversation'}
              </Text>
              <Text style={styles.meta}>{new Date(item.updatedAt).toLocaleDateString()}</Text>
            </View>
            <Pressable
              onPress={() => onDelete(item)}
              hitSlop={8}
              testID={`delete-conversation-${item.id}`}
            >
              <Text style={styles.linkDanger}>Delete</Text>
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
        <Text style={styles.newButtonText}>New conversation</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  error: { fontSize: 14, color: '#b91c1c', textAlign: 'center' },
  list: { padding: 16, paddingBottom: 96 },
  separator: { height: 10 },
  emptyText: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginTop: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
  },
  textColumn: { flex: 1, gap: 2 },
  title: { fontSize: 14, fontWeight: '600', color: '#111827' },
  meta: { fontSize: 12, color: '#6b7280' },
  linkDanger: { color: '#b91c1c', fontSize: 13, fontWeight: '600' },
  newButton: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 20,
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
});
