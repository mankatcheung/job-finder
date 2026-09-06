import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import '../../../../i18n';

jest.mock('../../hooks/useConversations', () => ({
  useConversations: jest.fn(),
  useDeleteConversation: jest.fn(),
  useCreateConversation: jest.fn(),
}));
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../../../../theme/ThemeContext', () => ({ useTheme: jest.fn() }));
import { useRouter } from 'expo-router';
import {
  useConversations,
  useCreateConversation,
  useDeleteConversation,
} from '../../hooks/useConversations';
import { ConversationsScreen } from '../ConversationsScreen';
import type { Conversation } from '../../types';
import { useTheme } from '../../../../theme/ThemeContext';
import { lightColors } from '../../../../theme/colors';

const mockedUseConversations = jest.mocked(useConversations);
const mockedUseCreateConversation = jest.mocked(useCreateConversation);
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

function renderScreen(push = jest.fn(), replace = jest.fn()) {
  mockedUseRouter.mockReturnValue({ push, replace } as never);
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
    mockedUseCreateConversation.mockReturnValue({ mutateAsync: jest.fn() } as never);
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

    expect(push).toHaveBeenCalledWith('./1');
  });

  it('creates a conversation and transitions into it when the composer is sent', async () => {
    const replace = jest.fn();
    const mutateAsync = jest.fn().mockResolvedValue({ id: 'new-conv' });
    mockedUseConversations.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    } as never);
    mockedUseCreateConversation.mockReturnValue({ mutateAsync } as never);

    const { getByTestId } = await renderScreen(jest.fn(), replace);

    await fireEvent.changeText(getByTestId('assistant-composer-input'), 'Help me prep');
    await fireEvent.press(getByTestId('assistant-composer-send-button'));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith({
        pathname: './[id]',
        params: { id: 'new-conv', initialMessage: 'Help me prep' },
      }),
    );
  });

  it('does not start a conversation for a blank composer', async () => {
    const mutateAsync = jest.fn();
    mockedUseConversations.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    } as never);
    mockedUseCreateConversation.mockReturnValue({ mutateAsync } as never);

    const { getByTestId } = await renderScreen();

    await fireEvent.press(getByTestId('assistant-composer-send-button'));

    expect(mutateAsync).not.toHaveBeenCalled();
  });
});
