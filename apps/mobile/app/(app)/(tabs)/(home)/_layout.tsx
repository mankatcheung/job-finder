import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { NotificationBell } from '../../../../src/components/navigation/NotificationBell';
import { applicationDetailStackScreens } from '../../../../src/components/navigation/applicationDetailStackScreens';

const bellHeader = { headerRight: () => <NotificationBell /> };

export default function HomeStackLayout() {
  const { t } = useTranslation('navigation');

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: t('screenTitles.dashboard'), ...bellHeader }} />
      <Stack.Screen name="applications/new" options={{ title: t('screenTitles.newApplication') }} />
      {applicationDetailStackScreens(t, 'applications/')}
    </Stack>
  );
}
