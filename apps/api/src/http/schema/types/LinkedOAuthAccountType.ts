import { builder } from '#src/http/schema/builder.js';
import type { LinkedOAuthAccountDTO } from '#src/interface-adapters/mappers/OAuthAccountMapper.js';
import { OAuthProviderEnum } from '#src/http/schema/types/enums/OAuthProviderEnum.js';

export const LinkedOAuthAccountRef = builder.objectRef<LinkedOAuthAccountDTO>('LinkedOAuthAccount');
LinkedOAuthAccountRef.implement({
  fields: (t) => ({
    provider: t.expose('provider', { type: OAuthProviderEnum }),
    email: t.exposeString('email', { nullable: true }),
    createdAt: t.exposeString('createdAt'),
  }),
});
