import type { PipelineStage } from '#src/domain/pipelineStage/PipelineStage.js';

export interface PipelineStageDTO extends Omit<PipelineStage, 'createdAt' | 'updatedAt'> {
  createdAt: string;
  updatedAt: string;
}

export class PipelineStageMapper {
  toDTO(stage: PipelineStage): PipelineStageDTO {
    return {
      ...stage,
      createdAt: stage.createdAt.toISOString(),
      updatedAt: stage.updatedAt.toISOString(),
    };
  }
}
