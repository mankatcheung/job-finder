import { builder } from '#src/http/schema/builder.js';
import type { SkillDTO } from '#src/interface-adapters/mappers/SkillMapper.js';

export const SkillRef = builder.objectRef<SkillDTO>('Skill');
SkillRef.implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    userId: t.exposeID('userId'),
    name: t.exposeString('name'),
    category: t.exposeString('category', { nullable: true }),
    proficiency: t.exposeString('proficiency', { nullable: true }),
    createdAt: t.exposeString('createdAt'),
  }),
});
