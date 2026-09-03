import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

jest.mock('../../hooks/useNotificationPreferences', () => ({
  useNotificationPreferences: jest.fn(),
  useUpdateNotificationPreferences: jest.fn(),
}));

import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '../../hooks/useNotificationPreferences';
import { NotificationsScreen } from '../NotificationsScreen';
import type { NotificationPreferences } from '../../types';

const mockedUsePreferences = jest.mocked(useNotificationPreferences);
const mockedUseUpdatePreferences = jest.mocked(useUpdateNotificationPreferences);

const preferences: NotificationPreferences = {
  digestFrequency: 'WEEKLY',
  followUpRemindersEnabled: true,
  pushNotificationsEnabled: false,
  weeklyApplicationGoal: 5,
};

describe('NotificationsScreen', () => {
  it('saves the new digest frequency when a chip is pressed', async () => {
    const mutate = jest.fn();
    mockedUsePreferences.mockReturnValue({
      data: preferences,
      isLoading: false,
      isError: false,
      error: null,
    } as never);
    mockedUseUpdatePreferences.mockReturnValue({ mutate, isPending: false } as never);

    const { getByTestId } = await render(<NotificationsScreen />);

    await waitFor(() => expect(getByTestId('digest-off')).toBeTruthy());
    await fireEvent.press(getByTestId('digest-off'));

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({ digestFrequency: 'OFF' }),
      expect.any(Object),
    );
  });

  it('toggles follow-up reminders', async () => {
    const mutate = jest.fn();
    mockedUsePreferences.mockReturnValue({
      data: preferences,
      isLoading: false,
      isError: false,
      error: null,
    } as never);
    mockedUseUpdatePreferences.mockReturnValue({ mutate, isPending: false } as never);

    const { getByTestId } = await render(<NotificationsScreen />);

    await fireEvent(getByTestId('follow-up-reminders-switch'), 'valueChange', false);

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({ followUpRemindersEnabled: false }),
      expect.any(Object),
    );
  });
});
