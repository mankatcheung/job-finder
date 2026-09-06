import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

jest.mock('../SidebarContext', () => ({ useSidebar: jest.fn() }));

import { useSidebar } from '../SidebarContext';
import { MenuButton } from '../MenuButton';

const mockedUseSidebar = jest.mocked(useSidebar);

describe('MenuButton', () => {
  it('opens the sidebar when pressed', async () => {
    const open = jest.fn();
    mockedUseSidebar.mockReturnValue({ isOpen: false, open, close: jest.fn() });

    const { getByTestId } = await render(<MenuButton />);

    fireEvent.press(getByTestId('menu-button'));

    expect(open).toHaveBeenCalled();
  });
});
