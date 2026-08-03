import { builder } from '#src/http/schema/builder.js';
import { NotificationRef } from '#src/http/schema/types/NotificationType.js';
import type { NotificationConnectionDTO } from '#src/interface-adapters/mappers/NotificationMapper.js';

export const NotificationConnectionRef =
  builder.objectRef<NotificationConnectionDTO>('NotificationConnection');
NotificationConnectionRef.implement({
  fields: (t) => ({
    items: t.expose('items', { type: [NotificationRef] }),
    nextCursor: t.exposeString('nextCursor', { nullable: true }),
    hasNextPage: t.exposeBoolean('hasNextPage'),
  }),
});
