import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname, type Href } from 'expo-router';
import { useAuth } from '../../auth/AuthContext';
import { useProfile } from '../../features/settings/hooks/useProfile';
import { useUnreadNotificationCount } from '../../features/notifications/hooks/useNotificationQueries';
import { useSidebar } from './SidebarContext';
import {
  AnalyticsIcon,
  ApplicationsIcon,
  AssistantIcon,
  BoardIcon,
  CalendarIcon,
  CloseIcon,
  DashboardIcon,
  NotificationsIcon,
  SettingsIcon,
  SignOutIcon,
  TrashIcon,
  type NavIconProps,
} from './NavIcons';

interface NavItem {
  key: string;
  label: string;
  href: Href;
  testID: string;
  Icon: React.ComponentType<NavIconProps>;
  isActive: (pathname: string) => boolean;
}

const PRIMARY_NAV: NavItem[] = [
  {
    key: 'applications',
    label: 'Applications',
    href: '/',
    testID: 'sidebar-applications',
    Icon: ApplicationsIcon,
    isActive: (pathname) => pathname === '/',
  },
  {
    key: 'board',
    label: 'Board',
    href: '/applications/board',
    testID: 'sidebar-board',
    Icon: BoardIcon,
    isActive: (pathname) => pathname.startsWith('/applications/board'),
  },
  {
    key: 'calendar',
    label: 'Calendar',
    href: '/calendar',
    testID: 'sidebar-calendar',
    Icon: CalendarIcon,
    isActive: (pathname) => pathname.startsWith('/calendar'),
  },
  {
    key: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    testID: 'sidebar-dashboard',
    Icon: DashboardIcon,
    isActive: (pathname) => pathname.startsWith('/dashboard'),
  },
  {
    key: 'analytics',
    label: 'Analytics',
    href: '/analytics',
    testID: 'sidebar-analytics',
    Icon: AnalyticsIcon,
    isActive: (pathname) => pathname.startsWith('/analytics'),
  },
  {
    key: 'assistant',
    label: 'Assistant',
    href: '/conversations',
    testID: 'sidebar-assistant',
    Icon: AssistantIcon,
    isActive: (pathname) => pathname.startsWith('/conversations'),
  },
  {
    key: 'notifications',
    label: 'Notifications',
    href: '/notifications',
    testID: 'sidebar-notifications',
    Icon: NotificationsIcon,
    isActive: (pathname) => pathname.startsWith('/notifications'),
  },
];

const SECONDARY_NAV: NavItem[] = [
  {
    key: 'settings',
    label: 'Settings',
    href: '/settings',
    testID: 'sidebar-settings',
    Icon: SettingsIcon,
    isActive: (pathname) => pathname.startsWith('/settings'),
  },
  {
    key: 'trash',
    label: 'Trash',
    href: '/applications/trash',
    testID: 'sidebar-trash',
    Icon: TrashIcon,
    isActive: (pathname) => pathname.startsWith('/applications/trash'),
  },
];

function initials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }
  return email[0]?.toUpperCase() ?? '?';
}

function NavRow({
  item,
  pathname,
  onPress,
}: {
  item: NavItem;
  pathname: string;
  onPress: () => void;
}) {
  const active = item.isActive(pathname);
  const color = active ? '#2563eb' : '#374151';

  return (
    <Pressable
      style={[styles.navRow, active && styles.navRowActive]}
      onPress={onPress}
      testID={item.testID}
    >
      <item.Icon color={color} />
      <Text style={[styles.navLabel, { color, fontWeight: active ? '700' : '500' }]}>
        {item.label}
      </Text>
      {item.key === 'notifications' && <NotificationsBadge />}
    </Pressable>
  );
}

function NotificationsBadge() {
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  if (unreadCount === 0) return null;
  return (
    <View style={styles.badge} testID="sidebar-notifications-badge">
      <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
    </View>
  );
}

export function AppSidebar() {
  const { isOpen, close } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();
  const { data: profile } = useProfile();
  const insets = useSafeAreaInsets();

  const navigate = (href: Href) => {
    close();
    router.push(href);
  };

  const signOut = () => {
    close();
    void logout();
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={close}
      testID="app-sidebar"
    >
      <View style={styles.container}>
        <Pressable style={styles.scrim} onPress={close} testID="sidebar-scrim" />

        <View style={styles.panel}>
          <View
            style={[styles.profileSection, { paddingTop: insets.top + 16 }]}
            testID="sidebar-profile-section"
          >
            <View style={styles.profileRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {initials(profile?.name ?? null, profile?.email ?? '')}
                </Text>
              </View>
              <Pressable onPress={close} testID="sidebar-close" hitSlop={8}>
                <CloseIcon color="#6b7280" />
              </Pressable>
            </View>
            {profile && (
              <View>
                <Text style={styles.profileName}>{profile.name ?? profile.email}</Text>
                <Text style={styles.profileEmail}>{profile.email}</Text>
              </View>
            )}
          </View>

          <View style={styles.primaryNav}>
            {PRIMARY_NAV.map((item) => (
              <NavRow
                key={item.key}
                item={item}
                pathname={pathname}
                onPress={() => navigate(item.href)}
              />
            ))}
          </View>

          <View
            style={[styles.secondaryNav, { paddingBottom: insets.bottom + 12 }]}
            testID="sidebar-secondary-nav"
          >
            {SECONDARY_NAV.map((item) => (
              <NavRow
                key={item.key}
                item={item}
                pathname={pathname}
                onPress={() => navigate(item.href)}
              />
            ))}

            <Pressable style={styles.navRow} onPress={signOut} testID="sidebar-sign-out">
              <SignOutIcon color="#b91c1c" />
              <Text style={[styles.navLabel, { color: '#b91c1c', fontWeight: '600' }]}>
                Sign out
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row' },
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(17, 24, 39, 0.5)',
  },
  panel: {
    width: 300,
    maxWidth: '80%',
    backgroundColor: '#ffffff',
    height: '100%',
  },
  profileSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  profileRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 17, fontWeight: '700', color: '#2563eb' },
  profileName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  profileEmail: { fontSize: 12, color: '#6b7280' },
  primaryNav: { flex: 1, padding: 12, gap: 2 },
  secondaryNav: {
    padding: 12,
    gap: 2,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    height: 48,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  navRowActive: { backgroundColor: '#eff6ff' },
  navLabel: { fontSize: 14, flex: 1 },
  badge: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#ffffff' },
});
