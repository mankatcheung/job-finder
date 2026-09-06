import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

jest.mock('../../hooks/useConversations', () => ({
  useConversations: jest.fn(),
  useDeleteConversation: jest.fn(),
}));
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../../../../theme/ThemeContext', () => ({ useTheme: jest.fn() }));
import { useRouter } from 'expo-router';
import { useConversations, useDeleteConversation } from '../../hooks/useConversations';
import { ConversationsScreen } from '../ConversationsScreen';
import type { Conversation } from '../../types';
import { useTheme } from '../../../../theme/ThemeContext';
import { lightColors } from '../../../../theme/colors';

const mockedUseConversations = jest.mocked(useConversations);
const mockedUseDeleteConversation = jest.mocked(useDeleteConversation);
const mockedUseRouter = jest.mocked(useRouter);
const mockedUseTheme = jest.mocked(useTheme);

const conversation: Conversation = {
  id: '1',
  title: 'Stripe interview prep',
  llmProvider: 'openai',
  llmModel: 'gpt-4o-mini',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function renderScreen(push = jest.fn()) {
  mockedUseRouter.mockReturnValue({ push } as never);
  return render(<ConversationsScreen />);
}

describe('ConversationsScreen', () => {
  beforeEach(() => {
    mockedUseTheme.mockReturnValue({
      mode: 'light',
      resolvedScheme: 'light',
      colors: lightColors,
      setMode: jest.fn(),
    } as never);
    jest.clearAllMocks();
    mockedUseDeleteConversation.mockReturnValue({ mutate: jest.fn(), isPending: false } as never);
  });

  it('renders conversations and navigates to Chat on press', async () => {
    const push = jest.fn();
    mockedUseConversations.mockReturnValue({
      data: [conversation],
      isLoading: false,
      isError: false,
      error: null,
    } as never);

    const { getByTestId, getByText } = await renderScreen(push);

    await waitFor(() => expect(getByText('Stripe interview prep')).toBeTruthy());
    await fireEvent.press(getByTestId('conversation-1'));

    expect(push).toHaveBeenCalledWith('/conversations/1');
  });

  it('starts a new conversation with a null id', async () => {
    const push = jest.fn();
    mockedUseConversations.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    } as never);

    const { getByTestId } = await renderScreen(push);

    await fireEvent.press(getByTestId('new-conversation-button'));

    expect(push).toHaveBeenCalledWith('/conversations/new');
  });
});
