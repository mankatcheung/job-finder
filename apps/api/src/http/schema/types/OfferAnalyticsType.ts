import { builder } from '#src/http/schema/builder.js';
import type {
  OfferAnalytics,
  OfferTrendPoint,
  CurrencyGroupStat,
} from '#src/use-cases/offers/GetOfferAnalyticsUseCase.js';

const OfferTrendPointRef = builder.objectRef<OfferTrendPoint>('OfferTrendPoint');
OfferTrendPointRef.implement({
  fields: (t) => ({
    offerId: t.exposeID('offerId'),
    applicationId: t.exposeID('applicationId'),
    company: t.exposeString('company'),
    role: t.exposeString('role'),
    createdAt: t.exposeString('createdAt'),
    currency: t.exposeString('currency'),
    normalizedYearlySalary: t.exposeFloat('normalizedYearlySalary'),
  }),
});

const CurrencyGroupStatRef = builder.objectRef<CurrencyGroupStat>('CurrencyGroupStat');
CurrencyGroupStatRef.implement({
  fields: (t) => ({
    currency: t.exposeString('currency'),
    count: t.exposeInt('count'),
    minYearlySalary: t.exposeFloat('minYearlySalary'),
    maxYearlySalary: t.exposeFloat('maxYearlySalary'),
    medianYearlySalary: t.exposeFloat('medianYearlySalary'),
    averageYearlySalary: t.exposeFloat('averageYearlySalary'),
  }),
});

export const OfferAnalyticsRef = builder.objectRef<OfferAnalytics>('OfferAnalytics');
OfferAnalyticsRef.implement({
  fields: (t) => ({
    trend: t.expose('trend', { type: [OfferTrendPointRef] }),
    byCurrency: t.expose('byCurrency', { type: [CurrencyGroupStatRef] }),
  }),
});
