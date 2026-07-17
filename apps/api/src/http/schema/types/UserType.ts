import { builder } from '@/http/schema/builder.js';

export interface UserDTO {
  id: string;
  email: string;
}

export const UserRef = builder.objectRef<UserDTO>('User');
UserRef.implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    email: t.exposeString('email'),
  }),
});
