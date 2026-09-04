import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Applications' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
      <Stack.Screen name="applications/new" options={{ title: 'New application' }} />
      <Stack.Screen name="applications/trash" options={{ title: 'Trash' }} />
      <Stack.Screen name="applications/[id]/index" options={{ title: 'Application' }} />
      <Stack.Screen name="applications/[id]/edit" options={{ title: 'Edit application' }} />
      <Stack.Screen name="applications/[id]/notes" options={{ title: 'Notes' }} />
      <Stack.Screen name="applications/[id]/documents" options={{ title: 'Documents' }} />
      <Stack.Screen name="conversations/index" options={{ title: 'Assistant' }} />
      <Stack.Screen name="conversations/[id]" options={{ title: 'Assistant' }} />
      <Stack.Screen name="settings/index" options={{ title: 'Settings' }} />
      <Stack.Screen name="settings/profile" options={{ title: 'Profile' }} />
      <Stack.Screen name="settings/security" options={{ title: 'Security' }} />
      <Stack.Screen name="settings/notifications" options={{ title: 'Notifications' }} />
      <Stack.Screen name="settings/ai" options={{ title: 'AI' }} />
    </Stack>
  );
}
