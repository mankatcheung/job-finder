import { builder } from '#src/http/schema/builder.js';
import type { UserDTO } from '#src/interface-adapters/mappers/UserMapper.js';

export const UserRef = builder.objectRef<UserDTO>('User');
UserRef.implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    email: t.exposeString('email'),
    name: t.exposeString('name', { nullable: true }),
    timezone: t.exposeString('timezone', { nullable: true }),
    targetRole: t.exposeString('targetRole', { nullable: true }),
    avatarUrl: t.exposeString('avatarUrl', { nullable: true }),
    defaultLlmProvider: t.exposeString('defaultLlmProvider', { nullable: true }),
    customAiPrompt: t.exposeString('customAiPrompt', { nullable: true }),
  }),
});
