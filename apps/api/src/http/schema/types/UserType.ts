import { builder } from '@/http/schema/builder.js';

export interface UserDTO {
  id: string;
  email: string;
  name: string | null;
  timezone: string | null;
  targetRole: string | null;
}

export const UserRef = builder.objectRef<UserDTO>('User');
UserRef.implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    email: t.exposeString('email'),
    name: t.exposeString('name', { nullable: true }),
    timezone: t.exposeString('timezone', { nullable: true }),
    targetRole: t.exposeString('targetRole', { nullable: true }),
  }),
});
