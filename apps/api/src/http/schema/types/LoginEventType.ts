import { builder } from '#src/http/schema/builder.js';
import type { LoginEventDTO } from '#src/interface-adapters/mappers/LoginEventMapper.js';

export const LoginEventRef = builder.objectRef<LoginEventDTO>('LoginEvent');

builder.objectType(LoginEventRef, {
  fields: (t) => ({
    id: t.exposeString('id'),
    ipAddress: t.exposeString('ipAddress', { nullable: true }),
    userAgent: t.exposeString('userAgent', { nullable: true }),
    createdAt: t.exposeString('createdAt'),
  }),
});
