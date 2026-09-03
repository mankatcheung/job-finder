import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('../../hooks/useChatHistory', () => ({
  useChatHistory: jest.fn(),
  useAppendOptimisticMessage: jest.fn(),
  chatHistoryQueryKey: (id: string) => ['chatHistory', id],
}));
jest.mock('../../hooks/useConversations', () => ({
  useCreateConversation: jest.fn(),
  conversationsQueryKey: ['conversations'],
}));
jest.mock('../../lib/chatStream', () => ({
  streamChatMessage: jest.fn(),
  ChatStreamError: class ChatStreamError extends Error {},
}));
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
}));

import { useLocalSearchParams } from 'expo-router';
import { useAppendOptimisticMessage, useChatHistory } from '../../hooks/useChatHistory';
import { useCreateConversation } from '../../hooks/useConversations';
import { streamChatMessage } from '../../lib/chatStream';
import { ChatScreen } from '../ChatScreen';
import type { ChatMessage } from '../../types';

const mockedUseChatHistory = jest.mocked(useChatHistory);
const mockedUseAppendOptimisticMessage = jest.mocked(useAppendOptimisticMessage);
const mockedUseCreateConversation = jest.mocked(useCreateConversation);
const mockedStreamChatMessage = jest.mocked(streamChatMessage);
const mockedUseLocalSearchParams = jest.mocked(useLocalSearchParams);

const message: ChatMessage = {
  id: '1',
  role: 'assistant',
  content: 'Hello!',
  createdAt: '2026-01-01T00:00:00.000Z',
};

function renderScreen(conversationId: string | null) {
  mockedUseLocalSearchParams.mockReturnValue({ id: conversationId ?? 'new' } as never);
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ChatScreen />
    </QueryClientProvider>,
  );
}

describe('ChatScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAppendOptimisticMessage.mockReturnValue(jest.fn());
  });

  it('renders existing messages', async () => {
    mockedUseChatHistory.mockReturnValue({ data: [message], isLoading: false } as never);
    mockedUseCreateConversation.mockReturnValue({ mutateAsync: jest.fn() } as never);

    const { getByText } = await renderScreen('conv-1');

    await waitFor(() => expect(getByText('Hello!')).toBeTruthy());
  });

  it('sends a message and streams the reply', async () => {
    mockedUseChatHistory.mockReturnValue({ data: [], isLoading: false } as never);
    mockedUseCreateConversation.mockReturnValue({ mutateAsync: jest.fn() } as never);
    mockedStreamChatMessage.mockResolvedValueOnce(undefined);

    const { getByTestId } = await renderScreen('conv-1');

    await fireEvent.changeText(getByTestId('chat-input'), 'What should I ask in my interview?');
    await fireEvent.press(getByTestId('chat-send-button'));

    await waitFor(() =>
      expect(mockedStreamChatMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          conversationId: 'conv-1',
          message: 'What should I ask in my interview?',
        }),
      ),
    );
  });

  it('lazily creates a conversation on first send when none exists yet', async () => {
    mockedUseChatHistory.mockReturnValue({ data: [], isLoading: false } as never);
    const mutateAsync = jest.fn().mockResolvedValue({ id: 'new-conv' });
    mockedUseCreateConversation.mockReturnValue({ mutateAsync } as never);
    mockedStreamChatMessage.mockResolvedValueOnce(undefined);

    const { getByTestId } = await renderScreen(null);

    await fireEvent.changeText(getByTestId('chat-input'), 'Hi');
    await fireEvent.press(getByTestId('chat-send-button'));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
    await waitFor(() =>
      expect(mockedStreamChatMessage).toHaveBeenCalledWith(
        expect.objectContaining({ conversationId: 'new-conv' }),
      ),
    );
  });
});
