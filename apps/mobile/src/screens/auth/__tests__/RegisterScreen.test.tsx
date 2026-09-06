import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

jest.mock('../../../auth/AuthContext', () => ({
  useAuth: jest.fn(),
}));
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

import { useRouter } from 'expo-router';
import { useAuth } from '../../../auth/AuthContext';
import { RegisterScreen } from '../RegisterScreen';

const mockedUseAuth = jest.mocked(useAuth);
const mockedUseRouter = jest.mocked(useRouter);

function renderScreen(push = jest.fn()) {
  mockedUseRouter.mockReturnValue({ push } as never);
  return render(<RegisterScreen />);
}

describe('RegisterScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('submits email and password to register when passwords match', async () => {
    const register = jest.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue({
      login: jest.fn(),
      loginWithTotp: jest.fn(),
      loginWithOAuth: jest.fn(),
      register,
      logout: jest.fn(),
      isLoading: false,
      isAuthenticated: false,
      sessionExpired: false,
      reauthenticate: jest.fn(),
    });

    const { getByTestId } = await renderScreen();

    await fireEvent.changeText(getByTestId('register-email-input'), 'user@example.com');
    await fireEvent.changeText(getByTestId('register-password-input'), 'password123');
    await fireEvent.changeText(getByTestId('register-confirm-password-input'), 'password123');
    await fireEvent.press(getByTestId('register-submit-button'));

    await waitFor(() => expect(register).toHaveBeenCalledWith('user@example.com', 'password123'));
  });

  it('shows a validation error instead of calling register when passwords do not match', async () => {
    const register = jest.fn();
    mockedUseAuth.mockReturnValue({
      login: jest.fn(),
      loginWithTotp: jest.fn(),
      loginWithOAuth: jest.fn(),
      register,
      logout: jest.fn(),
      isLoading: false,
      isAuthenticated: false,
      sessionExpired: false,
      reauthenticate: jest.fn(),
    });

    const { getByTestId, findByText } = await renderScreen();

    await fireEvent.changeText(getByTestId('register-email-input'), 'user@example.com');
    await fireEvent.changeText(getByTestId('register-password-input'), 'password123');
    await fireEvent.changeText(getByTestId('register-confirm-password-input'), 'password456');
    await fireEvent.press(getByTestId('register-submit-button'));

    await findByText('Passwords do not match');
    expect(register).not.toHaveBeenCalled();
  });

  it('shows a validation error instead of calling register when the email is invalid', async () => {
    const register = jest.fn();
    mockedUseAuth.mockReturnValue({
      login: jest.fn(),
      loginWithTotp: jest.fn(),
      loginWithOAuth: jest.fn(),
      register,
      logout: jest.fn(),
      isLoading: false,
      isAuthenticated: false,
      sessionExpired: false,
      reauthenticate: jest.fn(),
    });

    const { getByTestId, findByText } = await renderScreen();

    await fireEvent.changeText(getByTestId('register-email-input'), 'not-an-email');
    await fireEvent.changeText(getByTestId('register-password-input'), 'password123');
    await fireEvent.changeText(getByTestId('register-confirm-password-input'), 'password123');
    await fireEvent.press(getByTestId('register-submit-button'));

    await findByText('Enter a valid email address');
    expect(register).not.toHaveBeenCalled();
  });

  it('navigates to login when the sign in link is pressed', async () => {
    const push = jest.fn();
    mockedUseAuth.mockReturnValue({
      login: jest.fn(),
      loginWithTotp: jest.fn(),
      loginWithOAuth: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
      isAuthenticated: false,
      sessionExpired: false,
      reauthenticate: jest.fn(),
    });

    const { getByText } = await renderScreen(push);

    await fireEvent.press(getByText('Already have an account? Sign in'));

    expect(push).toHaveBeenCalledWith('/login');
  });
});
