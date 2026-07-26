import { builder } from '#src/http/schema/builder.js';
import type { SessionDTO } from '#src/interface-adapters/mappers/SessionMapper.js';

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
