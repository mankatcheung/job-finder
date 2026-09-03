import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

jest.mock('../../../../auth/AuthContext', () => ({ useAuth: jest.fn() }));

import { useAuth } from '../../../../auth/AuthContext';
import { SettingsScreen } from '../SettingsScreen';

const mockedUseAuth = jest.mocked(useAuth);

describe('SettingsScreen', () => {
  it('navigates to each settings section', async () => {
    const navigate = jest.fn();
    mockedUseAuth.mockReturnValue({ logout: jest.fn() } as never);

    const { getByTestId } = await render(
      <SettingsScreen navigation={{ navigate } as never} route={{} as never} />,
    );

    await fireEvent.press(getByTestId('settings-profile-row'));
    expect(navigate).toHaveBeenCalledWith('Profile');

    await fireEvent.press(getByTestId('settings-security-row'));
    expect(navigate).toHaveBeenCalledWith('Security');

    await fireEvent.press(getByTestId('settings-ai-row'));
    expect(navigate).toHaveBeenCalledWith('AiSettings');
  });

  it('signs out when the sign-out row is pressed', async () => {
    const logout = jest.fn();
    mockedUseAuth.mockReturnValue({ logout } as never);

    const { getByTestId } = await render(
      <SettingsScreen navigation={{ navigate: jest.fn() } as never} route={{} as never} />,
    );

    await fireEvent.press(getByTestId('settings-signout-button'));

    expect(logout).toHaveBeenCalled();
  });
});
