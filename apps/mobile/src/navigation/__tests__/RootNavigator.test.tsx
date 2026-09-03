import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';

jest.mock('../../auth/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../AuthStack', () => ({ AuthStack: () => null }));
jest.mock('../AppStack', () => ({ AppStack: () => null }));

import { useAuth } from '../../auth/AuthContext';
import { RootNavigator } from '../RootNavigator';

const mockedUseAuth = jest.mocked(useAuth);

function renderNavigator() {
  return render(
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>,
  );
}

describe('RootNavigator', () => {
  it('shows a loading indicator while auth state is being restored', async () => {
    mockedUseAuth.mockReturnValue({
      isLoading: true,
      isAuthenticated: false,
      login: jest.fn(),
      loginWithTotp: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
    });

    const { getByTestId } = await renderNavigator();
    expect(getByTestId('root-loading')).toBeTruthy();
  });

  it('renders the auth stack when not authenticated', async () => {
    mockedUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
      login: jest.fn(),
      loginWithTotp: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
    });

    const { queryByTestId } = await renderNavigator();
    expect(queryByTestId('root-loading')).toBeNull();
  });

  it('renders the app stack when authenticated', async () => {
    mockedUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      login: jest.fn(),
      loginWithTotp: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
    });

    const { queryByTestId } = await renderNavigator();
    expect(queryByTestId('root-loading')).toBeNull();
  });
});
