import { builder } from '@/http/schema/builder.js';
import type { ActivityLogDTO } from '@/interface-adapters/mappers/ActivityLogMapper.js';

export const ActivityLogRef = builder.objectRef<ActivityLogDTO>('ActivityLog');

builder.objectType(ActivityLogRef, {
  fields: (t) => ({
    id: t.exposeString('id'),
    applicationId: t.exposeString('applicationId'),
    actorId: t.exposeString('actorId'),
    eventType: t.exposeString('eventType'),
    payload: t.exposeString('payload'),
    createdAt: t.exposeString('createdAt'),
  }),
});
