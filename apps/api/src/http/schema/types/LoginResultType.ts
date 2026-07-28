import { builder } from '#src/http/schema/builder.js';

export interface LoginResultDTO {
  success: boolean;
  totpRequired: boolean;
  /**
   * Null when `totpRequired` is true — login isn't complete yet, so no
   * session/tokens exist. The web app can't rely on the HttpOnly cookie
   * alone (API and web are deployed on separate domains), so this is the
   * primary way it learns the access token; it also attaches it via an
   * `Authorization: Bearer` header on subsequent requests.
   */
  accessToken: string | null;
}

export const LoginResultRef = builder.objectRef<LoginResultDTO>('LoginResult');
LoginResultRef.implement({
  fields: (t) => ({
    success: t.exposeBoolean('success'),
    totpRequired: t.exposeBoolean('totpRequired'),
    accessToken: t.exposeString('accessToken', { nullable: true }),
  }),
});
