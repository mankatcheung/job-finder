import { builder } from '#src/http/schema/builder.js';
import { ApplicationStatusEnum } from '#src/http/schema/types/enums/ApplicationStatusEnum.js';
import type { ShareLinkDTO } from '#src/interface-adapters/mappers/ShareLinkMapper.js';
import type {
  CreateShareLinkResult,
  SharedSummaryResult,
} from '#src/interface-adapters/resolvers/ShareLinkResolver.js';
import type { StatusCount } from '#src/use-cases/shareLinks/GetSharedSummaryUseCase.js';

export const ShareLinkRef = builder.objectRef<ShareLinkDTO>('ShareLink');
ShareLinkRef.implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    lastUsedAt: t.exposeString('lastUsedAt', { nullable: true }),
    createdAt: t.exposeString('createdAt'),
  }),
});

export const CreateShareLinkPayloadRef =
  builder.objectRef<CreateShareLinkResult>('CreateShareLinkPayload');
CreateShareLinkPayloadRef.implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    token: t.exposeString('token'),
    createdAt: t.exposeString('createdAt'),
  }),
});

export const StatusCountRef = builder.objectRef<StatusCount>('StatusCount');
StatusCountRef.implement({
  fields: (t) => ({
    status: t.expose('status', { type: ApplicationStatusEnum }),
    count: t.exposeInt('count'),
  }),
});

export const SharedSummaryRef = builder.objectRef<SharedSummaryResult>('SharedSummary');
SharedSummaryRef.implement({
  fields: (t) => ({
    statusCounts: t.expose('statusCounts', { type: [StatusCountRef] }),
    totalApplications: t.exposeInt('totalApplications'),
    totalInterviews: t.exposeInt('totalInterviews'),
    upcomingInterviews: t.exposeInt('upcomingInterviews'),
    applicationsUpdatedLast7Days: t.exposeInt('applicationsUpdatedLast7Days'),
    generatedAt: t.exposeString('generatedAt'),
  }),
});
