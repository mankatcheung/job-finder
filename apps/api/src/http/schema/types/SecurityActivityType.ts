import { builder } from '#src/http/schema/builder.js';
import type { SecurityActivityDTO } from '#src/interface-adapters/mappers/SecurityActivityMapper.js';

export const SecurityActivityItemRef =
  builder.objectRef<SecurityActivityDTO>('SecurityActivityItem');

builder.objectType(SecurityActivityItemRef, {
  fields: (t) => ({
    id: t.exposeString('id'),
    eventType: t.exposeString('eventType'),
    ipAddress: t.exposeString('ipAddress', { nullable: true }),
    userAgent: t.exposeString('userAgent', { nullable: true }),
    createdAt: t.exposeString('createdAt'),
  }),
});
