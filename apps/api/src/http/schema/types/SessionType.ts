import { builder } from '@/http/schema/builder.js';
import type { SessionDTO } from '@/interface-adapters/mappers/SessionMapper.js';

export const SessionRef = builder.objectRef<SessionDTO>('Session');
SessionRef.implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    userAgent: t.exposeString('userAgent', { nullable: true }),
    ipAddress: t.exposeString('ipAddress', { nullable: true }),
    lastUsedAt: t.exposeString('lastUsedAt'),
    createdAt: t.exposeString('createdAt'),
    current: t.exposeBoolean('current'),
  }),
});
