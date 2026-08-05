export const PIPELINE_STAGE_CATEGORIES = [
  'backlog',
  'active',
  'interviewing',
  'offered',
  'accepted',
  'rejected',
  'withdrawn',
] as const;

export type PipelineStageCategory = (typeof PIPELINE_STAGE_CATEGORIES)[number];

export interface PipelineStage {
  id: string;
  userId: string;
  key: string;
  name: string;
  color: string;
  position: number;
  category: PipelineStageCategory;
  createdAt: Date;
  updatedAt: Date;
}

export const DEFAULT_PIPELINE_STAGES: ReadonlyArray<
  Omit<PipelineStage, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
> = [
  { key: 'draft', name: 'Draft', color: 'gray', position: 0, category: 'backlog' },
  { key: 'applied', name: 'Applied', color: 'blue', position: 1, category: 'active' },
  {
    key: 'interviewing',
    name: 'Interviewing',
    color: 'purple',
    position: 2,
    category: 'interviewing',
  },
  { key: 'offered', name: 'Offered', color: 'orange', position: 3, category: 'offered' },
  { key: 'accepted', name: 'Accepted', color: 'green', position: 4, category: 'accepted' },
  { key: 'rejected', name: 'Rejected', color: 'red', position: 5, category: 'rejected' },
  { key: 'withdrawn', name: 'Withdrawn', color: 'gray', position: 6, category: 'withdrawn' },
];
