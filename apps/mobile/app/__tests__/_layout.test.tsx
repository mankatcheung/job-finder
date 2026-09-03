import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('../../src/auth/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: jest.fn(),
}));

jest.mock('expo-router', () => {
  const Stack = ({ children }: { children?: React.ReactNode }) => children;
  Stack.Screen = () => null;
  Stack.Protected = ({ guard, children }: { guard: boolean; children?: React.ReactNode }) =>
    guard ? children : null;
  return { Stack };
});

import { useAuth } from '../../src/auth/AuthContext';
import RootLayout from '../_layout';

const mockedUseAuth = jest.mocked(useAuth);

describe('RootLayout', () => {
  it('shows a loading indicator while auth state is being restored', async () => {
    mockedUseAuth.mockReturnValue({
      isLoading: true,
      isAuthenticated: false,
      login: jest.fn(),
      loginWithTotp: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
    });

    const { getByTestId } = await render(<RootLayout />);
    expect(getByTestId('root-loading')).toBeTruthy();
  });

  it('hides the loading indicator once auth state is known', async () => {
    mockedUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
      login: jest.fn(),
      loginWithTotp: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
    });

    const { queryByTestId } = await render(<RootLayout />);
    expect(queryByTestId('root-loading')).toBeNull();
  });

  it('hides the loading indicator once authenticated', async () => {
    mockedUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      login: jest.fn(),
      loginWithTotp: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
    });

    const { queryByTestId } = await render(<RootLayout />);
    expect(queryByTestId('root-loading')).toBeNull();
  });
});
