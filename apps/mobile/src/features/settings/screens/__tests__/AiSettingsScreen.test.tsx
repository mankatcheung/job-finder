import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import '../../../../i18n';

jest.mock('../../hooks/useLlmApiKeys', () => ({
  useLlmApiKeys: jest.fn(),
  useSaveLlmApiKey: jest.fn(),
  useDeleteLlmApiKey: jest.fn(),
  useSetDefaultLlmProvider: jest.fn(),
  useTestLlmApiKey: jest.fn(),
}));

import {
  useDeleteLlmApiKey,
  useLlmApiKeys,
  useSaveLlmApiKey,
  useSetDefaultLlmProvider,
  useTestLlmApiKey,
} from '../../hooks/useLlmApiKeys';
import { AiSettingsScreen } from '../AiSettingsScreen';
import type { LlmApiKey } from '../../types';

const mockedUseLlmApiKeys = jest.mocked(useLlmApiKeys);
const mockedUseSaveLlmApiKey = jest.mocked(useSaveLlmApiKey);
const mockedUseDeleteLlmApiKey = jest.mocked(useDeleteLlmApiKey);
const mockedUseSetDefaultLlmProvider = jest.mocked(useSetDefaultLlmProvider);
const mockedUseTestLlmApiKey = jest.mocked(useTestLlmApiKey);

const key: LlmApiKey = { provider: 'openai', model: 'gpt-4o-mini', baseUrl: null };

describe('AiSettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseDeleteLlmApiKey.mockReturnValue({ mutate: jest.fn(), isPending: false } as never);
    mockedUseSetDefaultLlmProvider.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    } as never);
    mockedUseTestLlmApiKey.mockReturnValue({ mutate: jest.fn(), isPending: false } as never);
  });

  it('lists configured providers, marking the default', async () => {
    mockedUseLlmApiKeys.mockReturnValue({
      data: { keys: [key], defaultProvider: 'openai' },
      isLoading: false,
      isError: false,
      error: null,
    } as never);
    mockedUseSaveLlmApiKey.mockReturnValue({ mutate: jest.fn(), isPending: false } as never);

    const { getByText } = await render(<AiSettingsScreen />);

    await waitFor(() => expect(getByText('OpenAI · Default')).toBeTruthy());
  });

  it('saves a new key with the selected provider', async () => {
    const mutate = jest.fn();
    mockedUseLlmApiKeys.mockReturnValue({
      data: { keys: [], defaultProvider: null },
      isLoading: false,
      isError: false,
      error: null,
    } as never);
    mockedUseSaveLlmApiKey.mockReturnValue({ mutate, isPending: false } as never);

    const { getByTestId } = await render(<AiSettingsScreen />);

    await fireEvent.press(getByTestId('provider-anthropic'));
    await fireEvent.changeText(getByTestId('llm-api-key-input'), 'sk-ant-test');
    await fireEvent.press(getByTestId('save-llm-key-button'));

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'anthropic', apiKey: 'sk-ant-test' }),
      expect.any(Object),
    );
  });
});
