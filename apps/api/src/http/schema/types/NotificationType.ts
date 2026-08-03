import { builder } from '#src/http/schema/builder.js';
import type { NotificationDTO } from '#src/interface-adapters/mappers/NotificationMapper.js';

export const NotificationRef = builder.objectRef<NotificationDTO>('Notification');
NotificationRef.implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    type: t.exposeString('type'),
    title: t.exposeString('title'),
    body: t.exposeString('body'),
    url: t.exposeString('url', { nullable: true }),
    read: t.exposeBoolean('read'),
    createdAt: t.exposeString('createdAt'),
  }),
});
