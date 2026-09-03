import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

jest.mock('../../hooks/useSessions', () => ({
  useSessions: jest.fn(),
  useRevokeSession: jest.fn(),
  useRevokeOtherSessions: jest.fn(),
  useUpdatePassword: jest.fn(),
}));

import {
  useRevokeOtherSessions,
  useRevokeSession,
  useSessions,
  useUpdatePassword,
} from '../../hooks/useSessions';
import { SecurityScreen } from '../SecurityScreen';
import type { Session } from '../../types';

const mockedUseSessions = jest.mocked(useSessions);
const mockedUseRevokeSession = jest.mocked(useRevokeSession);
const mockedUseRevokeOtherSessions = jest.mocked(useRevokeOtherSessions);
const mockedUseUpdatePassword = jest.mocked(useUpdatePassword);

const currentSession: Session = {
  id: '1',
  userAgent: 'iOS App',
  ipAddress: '1.2.3.4',
  deviceLabel: "Jeff's iPhone",
  location: 'London, UK',
  lastUsedAt: '2026-01-01T00:00:00.000Z',
  current: true,
};
const otherSession: Session = {
  ...currentSession,
  id: '2',
  current: false,
  deviceLabel: 'Chrome on Mac',
};

describe('SecurityScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseRevokeOtherSessions.mockReturnValue({ mutate: jest.fn(), isPending: false } as never);
    mockedUseUpdatePassword.mockReturnValue({ mutate: jest.fn(), isPending: false } as never);
  });

  it('lists sessions and revokes a non-current one', async () => {
    const revoke = jest.fn();
    mockedUseSessions.mockReturnValue({
      data: [currentSession, otherSession],
      isLoading: false,
      isError: false,
      error: null,
    } as never);
    mockedUseRevokeSession.mockReturnValue({ mutate: revoke, isPending: false } as never);

    const { getByTestId, queryByTestId, getByText } = await render(<SecurityScreen />);

    await waitFor(() => expect(getByText('Chrome on Mac')).toBeTruthy());
    expect(queryByTestId('revoke-session-1')).toBeNull();

    await fireEvent.press(getByTestId('revoke-session-2'));

    expect(revoke).toHaveBeenCalledWith('2', expect.any(Object));
  });

  it('updates the password', async () => {
    const mutate = jest.fn();
    mockedUseSessions.mockReturnValue({
      data: [currentSession],
      isLoading: false,
      isError: false,
      error: null,
    } as never);
    mockedUseRevokeSession.mockReturnValue({ mutate: jest.fn(), isPending: false } as never);
    mockedUseUpdatePassword.mockReturnValue({ mutate, isPending: false } as never);

    const { getByTestId } = await render(<SecurityScreen />);

    await fireEvent.changeText(getByTestId('current-password-input'), 'old-password');
    await fireEvent.changeText(getByTestId('new-password-input'), 'new-password-1');
    await fireEvent.press(getByTestId('change-password-button'));

    expect(mutate).toHaveBeenCalledWith(
      { currentPassword: 'old-password', newPassword: 'new-password-1' },
      expect.any(Object),
    );
  });
});
