import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

jest.mock('../../../../auth/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

import { useRouter } from 'expo-router';
import { useAuth } from '../../../../auth/AuthContext';
import { SettingsScreen } from '../SettingsScreen';

const mockedUseAuth = jest.mocked(useAuth);
const mockedUseRouter = jest.mocked(useRouter);

describe('SettingsScreen', () => {
  it('navigates to each settings section', async () => {
    const push = jest.fn();
    mockedUseRouter.mockReturnValue({ push } as never);
    mockedUseAuth.mockReturnValue({ logout: jest.fn() } as never);

    const { getByTestId } = await render(<SettingsScreen />);

    await fireEvent.press(getByTestId('settings-profile-row'));
    expect(push).toHaveBeenCalledWith('/settings/profile');

    await fireEvent.press(getByTestId('settings-security-row'));
    expect(push).toHaveBeenCalledWith('/settings/security');

    await fireEvent.press(getByTestId('settings-ai-row'));
    expect(push).toHaveBeenCalledWith('/settings/ai');
  });

  it('navigates to the new settings sections', async () => {
    const push = jest.fn();
    mockedUseRouter.mockReturnValue({ push } as never);
    mockedUseAuth.mockReturnValue({ logout: jest.fn() } as never);

    const { getByTestId } = await render(<SettingsScreen />);

    await fireEvent.press(getByTestId('settings-experience-row'));
    expect(push).toHaveBeenCalledWith('/settings/experience');

    await fireEvent.press(getByTestId('settings-integrations-row'));
    expect(push).toHaveBeenCalledWith('/settings/integrations');

    await fireEvent.press(getByTestId('settings-data-row'));
    expect(push).toHaveBeenCalledWith('/settings/data');

    await fireEvent.press(getByTestId('settings-danger-zone-row'));
    expect(push).toHaveBeenCalledWith('/settings/danger-zone');
  });

  it('signs out when the sign-out row is pressed', async () => {
    const logout = jest.fn();
    mockedUseRouter.mockReturnValue({ push: jest.fn() } as never);
    mockedUseAuth.mockReturnValue({ logout } as never);

    const { getByTestId } = await render(<SettingsScreen />);

    await fireEvent.press(getByTestId('settings-signout-button'));

    expect(logout).toHaveBeenCalled();
  });
});
