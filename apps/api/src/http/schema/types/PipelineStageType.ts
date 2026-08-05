import { builder } from '#src/http/schema/builder.js';
import type { PipelineStageDTO } from '#src/interface-adapters/mappers/PipelineStageMapper.js';

export const PipelineStageCategoryEnum = builder.enumType('PipelineStageCategory', {
  values: {
    BACKLOG: { value: 'backlog' },
    ACTIVE: { value: 'active' },
    INTERVIEWING: { value: 'interviewing' },
    OFFERED: { value: 'offered' },
    ACCEPTED: { value: 'accepted' },
    REJECTED: { value: 'rejected' },
    WITHDRAWN: { value: 'withdrawn' },
  },
});

export const PipelineStageRef = builder.objectRef<PipelineStageDTO>('PipelineStage');

PipelineStageRef.implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    userId: t.exposeID('userId'),
    key: t.exposeString('key'),
    name: t.exposeString('name'),
    color: t.exposeString('color'),
    position: t.exposeInt('position'),
    category: t.expose('category', { type: PipelineStageCategoryEnum }),
    createdAt: t.exposeString('createdAt'),
    updatedAt: t.exposeString('updatedAt'),
  }),
});
