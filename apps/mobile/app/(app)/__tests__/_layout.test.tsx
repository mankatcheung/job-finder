import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('expo-router', () => {
  const { View } = require('react-native');
  const Stack = ({ children }: { children?: React.ReactNode }) => <View>{children}</View>;
  Stack.Screen = ({ name, options }: { name: string; options?: { presentation?: string } }) => (
    <View
      testID={`screen-${name}`}
      {...(options?.presentation ? { accessibilityHint: options.presentation } : {})}
    />
  );
  return { Stack };
});

import AppLayout from '../_layout';

describe('AppLayout', () => {
  it('wraps the tab navigator and presents notifications as a modal outside any tab', async () => {
    const { getByTestId } = await render(<AppLayout />);

    expect(getByTestId('screen-(tabs)')).toBeTruthy();
    const notificationsScreen = getByTestId('screen-notifications');
    expect(notificationsScreen).toBeTruthy();
    expect(notificationsScreen.props.accessibilityHint).toBe('modal');
  });
});
