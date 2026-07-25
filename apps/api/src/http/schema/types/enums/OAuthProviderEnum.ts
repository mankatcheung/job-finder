import { builder } from '@/http/schema/builder.js';
import { OAUTH_PROVIDER } from '@/constants.js';

export const OAuthProviderEnum = builder.enumType('OAuthProvider', {
  values: {
    [OAUTH_PROVIDER.GOOGLE]: { value: OAUTH_PROVIDER.GOOGLE },
    [OAUTH_PROVIDER.GITHUB]: { value: OAUTH_PROVIDER.GITHUB },
  },
});
