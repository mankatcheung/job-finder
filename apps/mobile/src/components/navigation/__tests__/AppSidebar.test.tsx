import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

jest.mock('../../../auth/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../../../features/settings/hooks/useProfile', () => ({ useProfile: jest.fn() }));
jest.mock('../../../features/notifications/hooks/useNotificationQueries', () => ({
  useUnreadNotificationCount: jest.fn(),
}));
jest.mock('../SidebarContext', () => ({ useSidebar: jest.fn() }));
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(),
}));

import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../auth/AuthContext';
import { useProfile } from '../../../features/settings/hooks/useProfile';
import { useUnreadNotificationCount } from '../../../features/notifications/hooks/useNotificationQueries';
import { AppSidebar } from '../AppSidebar';
import { useSidebar } from '../SidebarContext';

const mockedUseRouter = jest.mocked(useRouter);
const mockedUsePathname = jest.mocked(usePathname);
const mockedUseAuth = jest.mocked(useAuth);
const mockedUseProfile = jest.mocked(useProfile);
const mockedUseUnreadCount = jest.mocked(useUnreadNotificationCount);
const mockedUseSidebar = jest.mocked(useSidebar);
const mockedUseSafeAreaInsets = jest.mocked(useSafeAreaInsets);

describe('AppSidebar', () => {
  beforeEach(() => {
    mockedUsePathname.mockReturnValue('/');
    mockedUseSidebar.mockReturnValue({ isOpen: true, open: jest.fn(), close: jest.fn() });
    mockedUseSafeAreaInsets.mockReturnValue({ top: 44, right: 0, bottom: 34, left: 0 });
    mockedUseProfile.mockReturnValue({
      data: {
        id: '1',
        email: 'jane@example.com',
        name: 'Jane Doe',
        timezone: null,
        targetRole: null,
      },
    } as never);
    mockedUseUnreadCount.mockReturnValue({ data: 0 } as never);
  });

  it('navigates to the pressed item and closes the sidebar', async () => {
    const push = jest.fn();
    const close = jest.fn();
    mockedUseRouter.mockReturnValue({ push } as never);
    mockedUseSidebar.mockReturnValue({ isOpen: true, open: jest.fn(), close });
    mockedUseAuth.mockReturnValue({ logout: jest.fn() } as never);

    const { getByTestId } = await render(<AppSidebar />);

    fireEvent.press(getByTestId('sidebar-applications'));

    expect(push).toHaveBeenCalledWith('/applications');
    expect(close).toHaveBeenCalled();
  });

  it('highlights the active nav item for the current route', async () => {
    mockedUsePathname.mockReturnValue('/');
    mockedUseRouter.mockReturnValue({ push: jest.fn() } as never);
    mockedUseAuth.mockReturnValue({ logout: jest.fn() } as never);

    const { getByTestId } = await render(<AppSidebar />);

    const dashboardStyle = getByTestId('sidebar-dashboard').props.style;
    const flattened = Array.isArray(dashboardStyle)
      ? Object.assign({}, ...dashboardStyle)
      : dashboardStyle;
    expect(flattened.backgroundColor).toBe('#eff6ff');
  });

  it('closes when the scrim is pressed', async () => {
    const close = jest.fn();
    mockedUseRouter.mockReturnValue({ push: jest.fn() } as never);
    mockedUseSidebar.mockReturnValue({ isOpen: true, open: jest.fn(), close });
    mockedUseAuth.mockReturnValue({ logout: jest.fn() } as never);

    const { getByTestId } = await render(<AppSidebar />);

    fireEvent.press(getByTestId('sidebar-scrim'));

    expect(close).toHaveBeenCalled();
  });

  it('signs out and closes when sign out is pressed', async () => {
    const logout = jest.fn();
    const close = jest.fn();
    mockedUseRouter.mockReturnValue({ push: jest.fn() } as never);
    mockedUseSidebar.mockReturnValue({ isOpen: true, open: jest.fn(), close });
    mockedUseAuth.mockReturnValue({ logout } as never);

    const { getByTestId } = await render(<AppSidebar />);

    fireEvent.press(getByTestId('sidebar-sign-out'));

    expect(logout).toHaveBeenCalled();
    expect(close).toHaveBeenCalled();
  });

  it('shows the unread notifications badge', async () => {
    mockedUseRouter.mockReturnValue({ push: jest.fn() } as never);
    mockedUseAuth.mockReturnValue({ logout: jest.fn() } as never);
    mockedUseUnreadCount.mockReturnValue({ data: 3 } as never);

    const { getByTestId, getByText } = await render(<AppSidebar />);

    expect(getByTestId('sidebar-notifications-badge')).toBeTruthy();
    expect(getByText('3')).toBeTruthy();
  });

  it('hides the notifications badge when there are no unread notifications', async () => {
    mockedUseRouter.mockReturnValue({ push: jest.fn() } as never);
    mockedUseAuth.mockReturnValue({ logout: jest.fn() } as never);

    const { queryByTestId } = await render(<AppSidebar />);

    expect(queryByTestId('sidebar-notifications-badge')).toBeNull();
  });

  it('shows the profile name and email', async () => {
    mockedUseRouter.mockReturnValue({ push: jest.fn() } as never);
    mockedUseAuth.mockReturnValue({ logout: jest.fn() } as never);

    const { getByText } = await render(<AppSidebar />);

    expect(getByText('Jane Doe')).toBeTruthy();
    expect(getByText('jane@example.com')).toBeTruthy();
  });

  it('pads the profile section and secondary nav by the safe-area insets', async () => {
    mockedUseRouter.mockReturnValue({ push: jest.fn() } as never);
    mockedUseAuth.mockReturnValue({ logout: jest.fn() } as never);
    mockedUseSafeAreaInsets.mockReturnValue({ top: 44, right: 0, bottom: 34, left: 0 });

    const { getByTestId } = await render(<AppSidebar />);

    const profileSectionStyle = getByTestId('sidebar-profile-section').props.style;
    const flattenedProfile = Array.isArray(profileSectionStyle)
      ? Object.assign({}, ...profileSectionStyle)
      : profileSectionStyle;
    expect(flattenedProfile.paddingTop).toBe(44 + 16);

    const secondaryNavStyle = getByTestId('sidebar-secondary-nav').props.style;
    const flattenedSecondary = Array.isArray(secondaryNavStyle)
      ? Object.assign({}, ...secondaryNavStyle)
      : secondaryNavStyle;
    expect(flattenedSecondary.paddingBottom).toBe(34 + 12);
  });
});
