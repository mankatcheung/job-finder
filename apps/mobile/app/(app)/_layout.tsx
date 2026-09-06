import { Stack } from 'expo-router';
import { AppSidebar } from '../../src/components/navigation/AppSidebar';
import { MenuButton } from '../../src/components/navigation/MenuButton';
import { SidebarProvider } from '../../src/components/navigation/SidebarContext';

const menuButtonHeader = { headerLeft: () => <MenuButton /> };

export default function AppLayout() {
  return (
    <SidebarProvider>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Dashboard', ...menuButtonHeader }} />
        <Stack.Screen name="calendar" options={{ title: 'Calendar', ...menuButtonHeader }} />
        <Stack.Screen
          name="notifications"
          options={{ title: 'Notifications', ...menuButtonHeader }}
        />
        <Stack.Screen
          name="applications/index"
          options={{ title: 'Applications', ...menuButtonHeader }}
        />
        <Stack.Screen name="applications/new" options={{ title: 'New application' }} />
        <Stack.Screen name="analytics" options={{ title: 'Analytics', ...menuButtonHeader }} />
        <Stack.Screen name="applications/board" options={{ title: 'Board', ...menuButtonHeader }} />
        <Stack.Screen name="applications/trash" options={{ title: 'Trash', ...menuButtonHeader }} />
        <Stack.Screen name="applications/[id]/index" options={{ title: 'Application' }} />
        <Stack.Screen name="applications/[id]/edit" options={{ title: 'Edit application' }} />
        <Stack.Screen name="applications/[id]/notes" options={{ title: 'Notes' }} />
        <Stack.Screen name="applications/[id]/documents" options={{ title: 'Documents' }} />
        <Stack.Screen name="applications/[id]/offers/index" options={{ title: 'Offers' }} />
        <Stack.Screen
          name="applications/[id]/offers/compare"
          options={{ title: 'Compare offers' }}
        />
        <Stack.Screen
          name="conversations/index"
          options={{ title: 'Assistant', ...menuButtonHeader }}
        />
        <Stack.Screen name="conversations/[id]" options={{ title: 'Assistant' }} />
        <Stack.Screen name="settings/index" options={{ title: 'Settings', ...menuButtonHeader }} />
        <Stack.Screen name="settings/profile" options={{ title: 'Profile' }} />
        <Stack.Screen name="settings/security" options={{ title: 'Security' }} />
        <Stack.Screen name="settings/notifications" options={{ title: 'Notifications' }} />
        <Stack.Screen name="settings/ai" options={{ title: 'AI' }} />
        <Stack.Screen name="settings/experience" options={{ title: 'Experience' }} />
        <Stack.Screen name="settings/integrations" options={{ title: 'Integrations' }} />
        <Stack.Screen name="settings/data" options={{ title: 'Data' }} />
        <Stack.Screen name="settings/danger-zone" options={{ title: 'Danger zone' }} />
      </Stack>
      <AppSidebar />
    </SidebarProvider>
  );
}
