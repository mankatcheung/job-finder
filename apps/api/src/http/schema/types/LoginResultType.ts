import { builder } from '#src/http/schema/builder.js';

export interface LoginResultDTO {
  success: boolean;
  totpRequired: boolean;
}

export const LoginResultRef = builder.objectRef<LoginResultDTO>('LoginResult');
LoginResultRef.implement({
  fields: (t) => ({
    success: t.exposeBoolean('success'),
    totpRequired: t.exposeBoolean('totpRequired'),
  }),
});
