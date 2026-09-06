import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { NotificationBell } from '../../../../src/components/navigation/NotificationBell';

const bellHeader = { headerRight: () => <NotificationBell /> };

export default function AssistantStackLayout() {
  const { t } = useTranslation('navigation');

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: t('screenTitles.assistant'), ...bellHeader }} />
      <Stack.Screen name="[id]" options={{ title: t('screenTitles.assistant') }} />
    </Stack>
  );
}
