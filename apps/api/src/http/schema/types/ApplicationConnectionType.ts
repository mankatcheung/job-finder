import { builder } from '#src/http/schema/builder.js';
import { JobApplicationRef } from '#src/http/schema/types/ApplicationType.js';
import type { ApplicationConnectionDTO } from '#src/interface-adapters/mappers/ApplicationMapper.js';

export const ApplicationConnectionRef =
  builder.objectRef<ApplicationConnectionDTO>('ApplicationConnection');
ApplicationConnectionRef.implement({
  fields: (t) => ({
    items: t.expose('items', { type: [JobApplicationRef] }),
    nextCursor: t.exposeString('nextCursor', { nullable: true }),
    hasNextPage: t.exposeBoolean('hasNextPage'),
  }),
});
