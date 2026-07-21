import { builder } from '@/http/schema/builder.js';
import type {
  HealthScore,
  HealthScoreCriterion,
} from '@/use-cases/application/ComputeHealthScoreUseCase.js';

const HealthScoreCriterionRef = builder.objectRef<HealthScoreCriterion>('HealthScoreCriterion');
HealthScoreCriterionRef.implement({
  fields: (t) => ({
    key: t.exposeString('key'),
    label: t.exposeString('label'),
    points: t.exposeInt('points'),
    earned: t.exposeInt('earned'),
    met: t.exposeBoolean('met'),
  }),
});

export const HealthScoreRef = builder.objectRef<HealthScore>('ApplicationHealthScore');
HealthScoreRef.implement({
  fields: (t) => ({
    score: t.exposeInt('score'),
    label: t.exposeString('label'),
    criteria: t.expose('criteria', { type: [HealthScoreCriterionRef] }),
  }),
});
