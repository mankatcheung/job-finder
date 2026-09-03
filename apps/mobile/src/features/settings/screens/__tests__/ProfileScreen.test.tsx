import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

jest.mock('../../hooks/useProfile', () => ({ useProfile: jest.fn(), useUpdateProfile: jest.fn() }));

import { useProfile, useUpdateProfile } from '../../hooks/useProfile';
import { ProfileScreen } from '../ProfileScreen';
import type { Profile } from '../../types';

const mockedUseProfile = jest.mocked(useProfile);
const mockedUseUpdateProfile = jest.mocked(useUpdateProfile);

const profile: Profile = {
  id: '1',
  email: 'demo@trakwyn.app',
  name: 'Demo User',
  timezone: null,
  targetRole: null,
};

describe('ProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows the profile and saves edits', async () => {
    const mutate = jest.fn();
    mockedUseProfile.mockReturnValue({
      data: profile,
      isLoading: false,
      isError: false,
      error: null,
    } as never);
    mockedUseUpdateProfile.mockReturnValue({ mutate, isPending: false } as never);

    const { getByTestId, getByText } = await render(<ProfileScreen />);

    await waitFor(() => expect(getByText('demo@trakwyn.app')).toBeTruthy());

    await fireEvent.changeText(getByTestId('profile-name-input'), 'New Name');
    await fireEvent.press(getByTestId('profile-save-button'));

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'New Name' }),
      expect.any(Object),
    );
  });
});
