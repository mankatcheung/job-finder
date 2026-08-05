import { builder } from '#src/http/schema/builder.js';
import type { WorkExperienceDTO } from '#src/interface-adapters/mappers/WorkExperienceMapper.js';

export const WorkExperienceRef = builder.objectRef<WorkExperienceDTO>('WorkExperience');
WorkExperienceRef.implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    userId: t.exposeID('userId'),
    company: t.exposeString('company'),
    title: t.exposeString('title'),
    location: t.exposeString('location', { nullable: true }),
    startDate: t.exposeString('startDate'),
    endDate: t.exposeString('endDate', { nullable: true }),
    description: t.exposeString('description', { nullable: true }),
    createdAt: t.exposeString('createdAt'),
    updatedAt: t.exposeString('updatedAt'),
  }),
});
