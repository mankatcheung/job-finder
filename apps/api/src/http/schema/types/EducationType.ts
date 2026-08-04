import { builder } from '#src/http/schema/builder.js';
import type { EducationDTO } from '#src/interface-adapters/mappers/EducationMapper.js';

export const EducationRef = builder.objectRef<EducationDTO>('Education');
EducationRef.implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    userId: t.exposeID('userId'),
    institution: t.exposeString('institution'),
    degree: t.exposeString('degree', { nullable: true }),
    field: t.exposeString('field', { nullable: true }),
    startDate: t.exposeString('startDate'),
    endDate: t.exposeString('endDate', { nullable: true }),
    description: t.exposeString('description', { nullable: true }),
    createdAt: t.exposeString('createdAt'),
    updatedAt: t.exposeString('updatedAt'),
  }),
});
