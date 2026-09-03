import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

jest.mock('../../../auth/AuthContext', () => ({
  useAuth: jest.fn(),
}));

import { useAuth } from '../../../auth/AuthContext';
import { LoginScreen } from '../LoginScreen';

const mockedUseAuth = jest.mocked(useAuth);

function renderScreen(navigate = jest.fn()) {
  return render(<LoginScreen navigation={{ navigate } as never} route={{} as never} />);
}

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('submits email and password to login', async () => {
    const login = jest.fn().mockResolvedValue({ totpRequired: false });
    mockedUseAuth.mockReturnValue({
      login,
      loginWithTotp: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
      isAuthenticated: false,
    });

    const { getByTestId } = await renderScreen();

    await fireEvent.changeText(getByTestId('login-email-input'), 'user@example.com');
    await fireEvent.changeText(getByTestId('login-password-input'), 'password123');
    await fireEvent.press(getByTestId('login-submit-button'));

    await waitFor(() => expect(login).toHaveBeenCalledWith('user@example.com', 'password123'));
  });

  it('shows a validation error instead of calling login when the email is invalid', async () => {
    const login = jest.fn();
    mockedUseAuth.mockReturnValue({
      login,
      loginWithTotp: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
      isAuthenticated: false,
    });

    const { getByTestId, findByText } = await renderScreen();

    await fireEvent.changeText(getByTestId('login-email-input'), 'not-an-email');
    await fireEvent.changeText(getByTestId('login-password-input'), 'password123');
    await fireEvent.press(getByTestId('login-submit-button'));

    await findByText('Enter a valid email address');
    expect(login).not.toHaveBeenCalled();
  });

  it('switches to the TOTP step when login reports totpRequired', async () => {
    const login = jest.fn().mockResolvedValue({ totpRequired: true });
    const loginWithTotp = jest.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue({
      login,
      loginWithTotp,
      register: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
      isAuthenticated: false,
    });

    const { getByTestId, findByTestId } = await renderScreen();

    await fireEvent.changeText(getByTestId('login-email-input'), 'user@example.com');
    await fireEvent.changeText(getByTestId('login-password-input'), 'password123');
    await fireEvent.press(getByTestId('login-submit-button'));

    const codeInput = await findByTestId('totp-code-input');
    await fireEvent.changeText(codeInput, '123456');
    await fireEvent.press(getByTestId('totp-submit-button'));

    await waitFor(() =>
      expect(loginWithTotp).toHaveBeenCalledWith('user@example.com', 'password123', '123456'),
    );
  });
});
