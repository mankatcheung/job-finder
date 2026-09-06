import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

jest.mock('../SidebarContext', () => ({ useSidebar: jest.fn() }));

jest.mock('../../../theme/ThemeContext', () => ({ useTheme: jest.fn() }));
import { useSidebar } from '../SidebarContext';
import { MenuButton } from '../MenuButton';
import { useTheme } from '../../../theme/ThemeContext';
import { lightColors } from '../../../theme/colors';

const mockedUseSidebar = jest.mocked(useSidebar);
const mockedUseTheme = jest.mocked(useTheme);

describe('MenuButton', () => {
  beforeEach(() => {
    mockedUseTheme.mockReturnValue({
      mode: 'light',
      resolvedScheme: 'light',
      colors: lightColors,
      setMode: jest.fn(),
    } as never);
  });

  it('opens the sidebar when pressed', async () => {
    const open = jest.fn();
    mockedUseSidebar.mockReturnValue({ isOpen: false, open, close: jest.fn() });

    const { getByTestId } = await render(<MenuButton />);

    fireEvent.press(getByTestId('menu-button'));

    expect(open).toHaveBeenCalled();
  });
});
