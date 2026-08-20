import { builder } from '#src/http/schema/builder.js';
import type { McpOAuthGrantDTO } from '#src/interface-adapters/mappers/McpOAuthGrantMapper.js';

export const McpOAuthGrantRef = builder.objectRef<McpOAuthGrantDTO>('McpOAuthGrant');
McpOAuthGrantRef.implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    clientName: t.exposeString('clientName'),
    scope: t.exposeString('scope'),
    authorizedAt: t.exposeString('authorizedAt'),
    lastUsedAt: t.exposeString('lastUsedAt', { nullable: true }),
  }),
});
