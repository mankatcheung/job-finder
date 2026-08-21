import { builder } from '#src/http/schema/builder.js';
import type { CompanyBriefingDTO } from '#src/interface-adapters/mappers/CompanyBriefingMapper.js';

export const CompanyBriefingRef = builder.objectRef<CompanyBriefingDTO>('CompanyBriefing');
CompanyBriefingRef.implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    applicationId: t.exposeID('applicationId'),
    content: t.exposeString('content'),
    // Lets the tab say how old the briefing is, so a stale one is visibly
    // stale rather than silently presented as current.
    generatedAt: t.exposeString('generatedAt'),
  }),
});
