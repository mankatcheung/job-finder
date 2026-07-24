import { builder } from '@/http/schema/builder.js';
import { JobApplicationRef } from '@/http/schema/types/ApplicationType.js';
import type { ApplicationDTO } from '@/interface-adapters/mappers/ApplicationMapper.js';

export interface ApplicationConnectionDTO {
  items: ApplicationDTO[];
  nextCursor: string | null;
  hasNextPage: boolean;
}

export const ApplicationConnectionRef =
  builder.objectRef<ApplicationConnectionDTO>('ApplicationConnection');
ApplicationConnectionRef.implement({
  fields: (t) => ({
    items: t.expose('items', { type: [JobApplicationRef] }),
    nextCursor: t.exposeString('nextCursor', { nullable: true }),
    hasNextPage: t.exposeBoolean('hasNextPage'),
  }),
});
