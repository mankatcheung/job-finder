import { builder } from '#src/http/schema/builder.js';
import type { NotificationPreferences } from '#src/use-cases/user/IGetNotificationPreferencesUseCase.js';

export const NotificationPreferencesRef =
  builder.objectRef<NotificationPreferences>('NotificationPreferences');
NotificationPreferencesRef.implement({
  fields: (t) => ({
    weeklyDigestEnabled: t.exposeBoolean('weeklyDigestEnabled'),
    digestFrequency: t.exposeString('digestFrequency'),
    followUpRemindersEnabled: t.exposeBoolean('followUpRemindersEnabled'),
    pushNotificationsEnabled: t.exposeBoolean('pushNotificationsEnabled'),
  }),
});
