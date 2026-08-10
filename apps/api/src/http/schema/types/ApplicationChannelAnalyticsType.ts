import { builder } from '#src/http/schema/builder.js';
import type {
  ApplicationChannelAnalytics,
  ApplicationGroupStat,
} from '#src/use-cases/application/GetApplicationChannelAnalyticsUseCase.js';

const ApplicationGroupStatRef = builder.objectRef<ApplicationGroupStat>('ApplicationGroupStat');
ApplicationGroupStatRef.implement({
  fields: (t) => ({
    label: t.exposeString('label'),
    applicationCount: t.exposeInt('applicationCount'),
    respondedCount: t.exposeInt('respondedCount'),
    responseRate: t.exposeInt('responseRate'),
    offerCount: t.exposeInt('offerCount'),
    offerRate: t.exposeInt('offerRate'),
  }),
});

export const ApplicationChannelAnalyticsRef = builder.objectRef<ApplicationChannelAnalytics>(
  'ApplicationChannelAnalytics',
);
ApplicationChannelAnalyticsRef.implement({
  fields: (t) => ({
    bySource: t.expose('bySource', { type: [ApplicationGroupStatRef] }),
    byTag: t.expose('byTag', { type: [ApplicationGroupStatRef] }),
  }),
});
