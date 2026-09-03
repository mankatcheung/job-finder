import { builder } from '#src/http/schema/builder.js';

/**
 * Mobile counterpart of AuthPayloadType's cookie helpers: React Native has
 * no cookie jar tied to the API's domain, so mobile auth mutations
 * (mobileAuthMutations.ts) return both tokens in the response body instead.
 */
export interface MobileAuthPayloadDTO {
  accessToken: string;
  refreshToken: string;
}

export const MobileAuthPayloadRef = builder.objectRef<MobileAuthPayloadDTO>('MobileAuthPayload');
MobileAuthPayloadRef.implement({
  fields: (t) => ({
    accessToken: t.exposeString('accessToken'),
    refreshToken: t.exposeString('refreshToken'),
  }),
});

export interface MobileLoginResultDTO {
  success: boolean;
  totpRequired: boolean;
  /** Null when `totpRequired` is true — login isn't complete yet, so no session/tokens exist. */
  accessToken: string | null;
  refreshToken: string | null;
}

export const MobileLoginResultRef = builder.objectRef<MobileLoginResultDTO>('MobileLoginResult');
MobileLoginResultRef.implement({
  fields: (t) => ({
    success: t.exposeBoolean('success'),
    totpRequired: t.exposeBoolean('totpRequired'),
    accessToken: t.exposeString('accessToken', { nullable: true }),
    refreshToken: t.exposeString('refreshToken', { nullable: true }),
  }),
});
