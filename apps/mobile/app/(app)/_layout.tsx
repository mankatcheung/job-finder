import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppSidebar } from '../../src/components/navigation/AppSidebar';
import { MenuButton } from '../../src/components/navigation/MenuButton';
import { SidebarProvider } from '../../src/components/navigation/SidebarContext';

const menuButtonHeader = { headerLeft: () => <MenuButton /> };

export default function AppLayout() {
  const { t } = useTranslation('navigation');

  return (
    <SidebarProvider>
      <Stack>
        <Stack.Screen
          name="index"
          options={{ title: t('screenTitles.dashboard'), ...menuButtonHeader }}
        />
        <Stack.Screen
          name="calendar"
          options={{ title: t('screenTitles.calendar'), ...menuButtonHeader }}
        />
        <Stack.Screen
          name="notifications"
          options={{ title: t('screenTitles.notifications'), ...menuButtonHeader }}
        />
        <Stack.Screen
          name="applications/index"
          options={{ title: t('screenTitles.applications'), ...menuButtonHeader }}
        />
        <Stack.Screen
          name="applications/new"
          options={{ title: t('screenTitles.newApplication') }}
        />
        <Stack.Screen
          name="analytics"
          options={{ title: t('screenTitles.analytics'), ...menuButtonHeader }}
        />
        <Stack.Screen
          name="applications/board"
          options={{ title: t('screenTitles.board'), ...menuButtonHeader }}
        />
        <Stack.Screen
          name="applications/trash"
          options={{ title: t('screenTitles.trash'), ...menuButtonHeader }}
        />
        <Stack.Screen
          name="applications/[id]/index"
          options={{ title: t('screenTitles.application') }}
        />
        <Stack.Screen
          name="applications/[id]/edit"
          options={{ title: t('screenTitles.editApplication') }}
        />
        <Stack.Screen name="applications/[id]/notes" options={{ title: t('screenTitles.notes') }} />
        <Stack.Screen
          name="applications/[id]/documents"
          options={{ title: t('screenTitles.documents') }}
        />
        <Stack.Screen
          name="applications/[id]/offers/index"
          options={{ title: t('screenTitles.offers') }}
        />
        <Stack.Screen
          name="applications/[id]/offers/compare"
          options={{ title: t('screenTitles.compareOffers') }}
        />
        <Stack.Screen
          name="conversations/index"
          options={{ title: t('screenTitles.assistant'), ...menuButtonHeader }}
        />
        <Stack.Screen name="conversations/[id]" options={{ title: t('screenTitles.assistant') }} />
        <Stack.Screen
          name="settings/index"
          options={{ title: t('screenTitles.settings'), ...menuButtonHeader }}
        />
        <Stack.Screen name="settings/profile" options={{ title: t('screenTitles.profile') }} />
        <Stack.Screen name="settings/security" options={{ title: t('screenTitles.security') }} />
        <Stack.Screen
          name="settings/notifications"
          options={{ title: t('screenTitles.notifications') }}
        />
        <Stack.Screen name="settings/ai" options={{ title: t('screenTitles.ai') }} />
        <Stack.Screen
          name="settings/experience"
          options={{ title: t('screenTitles.experience') }}
        />
        <Stack.Screen
          name="settings/integrations"
          options={{ title: t('screenTitles.integrations') }}
        />
        <Stack.Screen name="settings/data" options={{ title: t('screenTitles.data') }} />
        <Stack.Screen
          name="settings/danger-zone"
          options={{ title: t('screenTitles.dangerZone') }}
        />
        <Stack.Screen name="settings/language" options={{ title: t('screenTitles.language') }} />
      </Stack>
      <AppSidebar />
    </SidebarProvider>
  );
}
