import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import {
  useChatHistory,
  chatHistoryQueryKey,
  useAppendOptimisticMessage,
} from '../hooks/useChatHistory';
import { conversationsQueryKey, useCreateConversation } from '../hooks/useConversations';
import { ChatStreamError, streamChatMessage } from '../lib/chatStream';
import type { ChatMessage } from '../types';
import { getErrorMessage } from '../../../lib/errors';

function tempMessageId(): string {
  return `optimistic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [conversationId, setConversationId] = useState<string | null>(id === 'new' ? null : id);
  const queryClient = useQueryClient();
  const { data: history, isLoading } = useChatHistory(conversationId);
  const appendOptimistic = useAppendOptimisticMessage();
  const createConversation = useCreateConversation();

  const [input, setInput] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const messages = history ?? [];

  useEffect(() => {
    listRef.current?.scrollToEnd({ animated: true });
  }, [messages.length, streamingText]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;
    setInput('');
    setSendError(null);
    setIsSending(true);
    setStreamingText('');

    try {
      let targetConversationId = conversationId;
      if (!targetConversationId) {
        const created = await createConversation.mutateAsync({});
        targetConversationId = created.id;
        setConversationId(created.id);
      }

      appendOptimistic(targetConversationId, {
        id: tempMessageId(),
        role: 'user',
        content: trimmed,
        createdAt: new Date().toISOString(),
      });

      await streamChatMessage({
        conversationId: targetConversationId,
        message: trimmed,
        onDelta: (text) => setStreamingText((prev) => prev + text),
      });

      await queryClient.invalidateQueries({
        queryKey: chatHistoryQueryKey(targetConversationId),
      });
      void queryClient.invalidateQueries({ queryKey: conversationsQueryKey });
    } catch (err) {
      setSendError(err instanceof ChatStreamError ? err.message : getErrorMessage(err));
    } finally {
      setIsSending(false);
      setStreamingText('');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {isLoading ? (
        <ActivityIndicator
          style={styles.loading}
          size="large"
          color="#2563eb"
          testID="chat-loading"
        />
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              Ask about your applications, next steps, or anything else.
            </Text>
          }
          renderItem={({ item }) => (
            <View style={[styles.bubbleRow, item.role === 'user' && styles.bubbleRowUser]}>
              <View
                style={[
                  styles.bubble,
                  item.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant,
                ]}
              >
                <Text
                  style={item.role === 'user' ? styles.bubbleTextUser : styles.bubbleTextAssistant}
                >
                  {item.content}
                </Text>
              </View>
            </View>
          )}
        />
      )}

      {isSending ? (
        <View style={[styles.bubbleRow, { paddingHorizontal: 16 }]}>
          <View style={[styles.bubble, styles.bubbleAssistant]}>
            {streamingText ? (
              <Text style={styles.bubbleTextAssistant}>{streamingText}</Text>
            ) : (
              <ActivityIndicator size="small" color="#6b7280" testID="chat-sending-indicator" />
            )}
          </View>
        </View>
      ) : null}

      {sendError ? <Text style={styles.error}>{sendError}</Text> : null}

      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          placeholder="Message the assistant"
          value={input}
          onChangeText={setInput}
          multiline
          testID="chat-input"
        />
        <Pressable
          style={[styles.sendButton, (isSending || !input.trim()) && styles.sendButtonDisabled]}
          onPress={() => void handleSend()}
          disabled={isSending || !input.trim()}
          testID="chat-send-button"
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  loading: { marginTop: 40 },
  list: { padding: 16, gap: 8 },
  emptyText: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginTop: 20 },
  bubbleRow: { flexDirection: 'row', marginBottom: 8 },
  bubbleRowUser: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '80%', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleUser: { backgroundColor: '#2563eb', alignSelf: 'flex-end' },
  bubbleAssistant: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb' },
  bubbleTextUser: { color: '#ffffff', fontSize: 14 },
  bubbleTextAssistant: { color: '#111827', fontSize: 14 },
  error: {
    color: '#b91c1c',
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 16,
    fontSize: 13,
  },
  composer: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#ffffff',
  },
  sendButton: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
});
