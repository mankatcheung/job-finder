import { builder } from '@/http/schema/builder.js';
import type { LinkedOAuthAccountDTO } from '@/interface-adapters/mappers/OAuthAccountMapper.js';
import { OAuthProviderEnum } from '@/http/schema/types/enums/OAuthProviderEnum.js';

export const LinkedOAuthAccountRef = builder.objectRef<LinkedOAuthAccountDTO>('LinkedOAuthAccount');
LinkedOAuthAccountRef.implement({
  fields: (t) => ({
    provider: t.expose('provider', { type: OAuthProviderEnum }),
    email: t.exposeString('email', { nullable: true }),
    createdAt: t.exposeString('createdAt'),
  }),
});
