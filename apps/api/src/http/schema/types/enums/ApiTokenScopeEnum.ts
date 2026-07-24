import { builder } from '@/http/schema/builder.js';
import { API_TOKEN_SCOPE } from '@/constants.js';

export const ApiTokenScopeEnum = builder.enumType('ApiTokenScope', {
  values: {
    [API_TOKEN_SCOPE.FULL]: { value: API_TOKEN_SCOPE.FULL },
    [API_TOKEN_SCOPE.READ]: { value: API_TOKEN_SCOPE.READ },
  },
});
