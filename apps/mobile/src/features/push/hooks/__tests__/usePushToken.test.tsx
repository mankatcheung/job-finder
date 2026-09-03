import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('../../../../graphql/client', () => ({ gqlRequest: jest.fn() }));
jest.mock('../../lib/registerForPushNotifications', () => ({
  registerForPushNotifications: jest.fn(),
}));

import { gqlRequest } from '../../../../graphql/client';
import { registerForPushNotifications } from '../../lib/registerForPushNotifications';
import { useEnablePushNotifications, useUnregisterPushToken } from '../usePushToken';

const mockedGqlRequest = jest.mocked(gqlRequest);
const mockedRegisterForPushNotifications = jest.mocked(registerForPushNotifications);

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('usePushToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('obtains a token and registers it with the backend', async () => {
    mockedRegisterForPushNotifications.mockResolvedValueOnce('ExponentPushToken[abc123]');
    mockedGqlRequest.mockResolvedValueOnce({ registerExpoPushToken: true });

    const { result } = await renderHook(() => useEnablePushNotifications(), { wrapper });

    let token: string | undefined;
    await act(async () => {
      token = await result.current.mutateAsync();
    });

    expect(token).toBe('ExponentPushToken[abc123]');
    expect(mockedGqlRequest).toHaveBeenCalledWith(expect.any(String), {
      token: 'ExponentPushToken[abc123]',
    });
  });

  it('propagates a registration failure without calling gqlRequest', async () => {
    mockedRegisterForPushNotifications.mockRejectedValueOnce(new Error('no EAS project'));

    const { result } = await renderHook(() => useEnablePushNotifications(), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync()).rejects.toThrow('no EAS project');
    });

    expect(mockedGqlRequest).not.toHaveBeenCalled();
  });

  it('unregisters a push token', async () => {
    mockedGqlRequest.mockResolvedValueOnce({ unregisterPushSubscription: true });

    const { result } = await renderHook(() => useUnregisterPushToken(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('ExponentPushToken[abc123]');
    });

    expect(mockedGqlRequest).toHaveBeenCalledWith(expect.any(String), {
      token: 'ExponentPushToken[abc123]',
    });
  });
});
