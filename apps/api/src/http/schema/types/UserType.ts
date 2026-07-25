import { builder } from '@/http/schema/builder.js';
import type { UserDTO } from '@/interface-adapters/mappers/UserMapper.js';

export const UserRef = builder.objectRef<UserDTO>('User');
UserRef.implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    email: t.exposeString('email'),
    name: t.exposeString('name', { nullable: true }),
    timezone: t.exposeString('timezone', { nullable: true }),
    targetRole: t.exposeString('targetRole', { nullable: true }),
    avatarUrl: t.exposeString('avatarUrl', { nullable: true }),
  }),
});
