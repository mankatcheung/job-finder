import { builder } from '#src/http/schema/builder.js';
import { OAUTH_PROVIDER } from '#src/constants.js';

export const OAuthProviderEnum = builder.enumType('OAuthProvider', {
  values: {
    [OAUTH_PROVIDER.GOOGLE]: { value: OAUTH_PROVIDER.GOOGLE },
    [OAUTH_PROVIDER.GITHUB]: { value: OAUTH_PROVIDER.GITHUB },
  },
});
