import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Pressable, Text, View } from 'react-native';
import { SidebarProvider, useSidebar } from '../SidebarContext';

function Probe() {
  const { isOpen, open, close } = useSidebar();
  return (
    <View>
      <Text testID="state">{isOpen ? 'open' : 'closed'}</Text>
      <Pressable testID="open-button" onPress={open} />
      <Pressable testID="close-button" onPress={close} />
    </View>
  );
}

describe('SidebarContext', () => {
  it('starts closed and toggles via open/close', async () => {
    const { getByTestId } = await render(
      <SidebarProvider>
        <Probe />
      </SidebarProvider>,
    );

    expect(getByTestId('state').props.children).toBe('closed');

    await fireEvent.press(getByTestId('open-button'));
    expect(getByTestId('state').props.children).toBe('open');

    await fireEvent.press(getByTestId('close-button'));
    expect(getByTestId('state').props.children).toBe('closed');
  });

  it('throws when used outside a provider', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(render(<Probe />)).rejects.toThrow(
      'useSidebar must be used within a SidebarProvider',
    );

    consoleError.mockRestore();
  });
});
