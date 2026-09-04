import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

jest.mock('../../hooks/useSessions', () => ({
  useSessions: jest.fn(),
  useRevokeSession: jest.fn(),
  useRevokeOtherSessions: jest.fn(),
  useUpdatePassword: jest.fn(),
}));
jest.mock('../../../../auth/useStepUpReauth', () => {
  class StepUpCancelledError extends Error {}
  return { StepUpCancelledError, useStepUpReauth: jest.fn() };
});

import {
  useRevokeOtherSessions,
  useRevokeSession,
  useSessions,
  useUpdatePassword,
} from '../../hooks/useSessions';
import { StepUpCancelledError, useStepUpReauth } from '../../../../auth/useStepUpReauth';
import { SecurityScreen } from '../SecurityScreen';
import type { Session } from '../../types';

const mockedUseSessions = jest.mocked(useSessions);
const mockedUseRevokeSession = jest.mocked(useRevokeSession);
const mockedUseRevokeOtherSessions = jest.mocked(useRevokeOtherSessions);
const mockedUseUpdatePassword = jest.mocked(useUpdatePassword);
const mockedUseStepUpReauth = jest.mocked(useStepUpReauth);

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

const passThrough = <T,>(fn: () => Promise<T>) => fn();

describe('SecurityScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseSessions.mockReturnValue({
      data: [currentSession],
      isLoading: false,
      isError: false,
      error: null,
    } as never);
    mockedUseRevokeSession.mockReturnValue({ mutate: jest.fn(), isPending: false } as never);
    mockedUseRevokeOtherSessions.mockReturnValue({ mutate: jest.fn(), isPending: false } as never);
    mockedUseUpdatePassword.mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue(true),
      isPending: false,
    } as never);
    mockedUseStepUpReauth.mockReturnValue({ withStepUp: passThrough, dialog: null });
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

  it('updates the password through the step-up wrapper and confirms', async () => {
    const mutateAsync = jest.fn().mockResolvedValue(true);
    const withStepUp = jest.fn(passThrough);
    mockedUseUpdatePassword.mockReturnValue({ mutateAsync, isPending: false } as never);
    mockedUseStepUpReauth.mockReturnValue({ withStepUp, dialog: null } as never);

    const { getByTestId, getByText } = await render(<SecurityScreen />);

    await fireEvent.changeText(getByTestId('current-password-input'), 'old-password');
    await fireEvent.changeText(getByTestId('new-password-input'), 'new-password-1');
    await fireEvent.press(getByTestId('change-password-button'));

    await waitFor(() => expect(getByText('Password updated.')).toBeTruthy());
    expect(withStepUp).toHaveBeenCalledTimes(1);
    expect(mutateAsync).toHaveBeenCalledWith({
      currentPassword: 'old-password',
      newPassword: 'new-password-1',
    });
    expect(getByTestId('current-password-input').props.value).toBe('');
    expect(getByTestId('new-password-input').props.value).toBe('');
  });

  it('rejects a short new password before calling the API', async () => {
    const mutateAsync = jest.fn();
    mockedUseUpdatePassword.mockReturnValue({ mutateAsync, isPending: false } as never);

    const { getByTestId, getByText } = await render(<SecurityScreen />);

    await fireEvent.changeText(getByTestId('current-password-input'), 'old-password');
    await fireEvent.changeText(getByTestId('new-password-input'), 'short');
    await fireEvent.press(getByTestId('change-password-button'));

    await waitFor(() =>
      expect(getByText('New password must be at least 8 characters')).toBeTruthy(),
    );
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("shows the API's message when the update is rejected", async () => {
    mockedUseUpdatePassword.mockReturnValue({
      mutateAsync: jest
        .fn()
        .mockRejectedValue({ response: { errors: [{ message: 'Invalid password' }] } }),
      isPending: false,
    } as never);

    const { getByTestId, getByText, queryByText } = await render(<SecurityScreen />);

    await fireEvent.changeText(getByTestId('current-password-input'), 'wrong');
    await fireEvent.changeText(getByTestId('new-password-input'), 'new-password-1');
    await fireEvent.press(getByTestId('change-password-button'));

    await waitFor(() => expect(getByText('Invalid password')).toBeTruthy());
    expect(queryByText('Password updated.')).toBeNull();
  });

  it('reports nothing when the step-up prompt is dismissed', async () => {
    mockedUseStepUpReauth.mockReturnValue({
      withStepUp: () => Promise.reject(new StepUpCancelledError()),
      dialog: null,
    });

    const { getByTestId, queryByText } = await render(<SecurityScreen />);

    await fireEvent.changeText(getByTestId('current-password-input'), 'old-password');
    await fireEvent.changeText(getByTestId('new-password-input'), 'new-password-1');
    await fireEvent.press(getByTestId('change-password-button'));

    await waitFor(() => expect(getByTestId('change-password-button')).toBeTruthy());
    expect(queryByText('Password updated.')).toBeNull();
    expect(queryByText(/went wrong/)).toBeNull();
  });

  it('renders the step-up prompt the hook hands back', async () => {
    mockedUseStepUpReauth.mockReturnValue({
      withStepUp: passThrough,
      dialog: <Text>step-up-prompt</Text>,
    });

    const { getByText } = await render(<SecurityScreen />);

    expect(getByText('step-up-prompt')).toBeTruthy();
  });
});
