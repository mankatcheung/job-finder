import type { PipelineStage } from '#src/domain/pipelineStage/PipelineStage.js';
import {
  DEFAULT_PIPELINE_STAGES,
  type PipelineStageCategory,
} from '#src/domain/pipelineStage/PipelineStage.js';
import type { IPipelineStageRepository } from '#src/use-cases/ports/IPipelineStageRepository.js';

export interface IGetPipelineStagesUseCase {
  execute(userId: string): Promise<PipelineStage[]>;
}

export class GetPipelineStagesUseCase implements IGetPipelineStagesUseCase {
  constructor(
    private readonly deps: {
      pipelineStageRepository: IPipelineStageRepository;
      generateId: () => string;
    },
  ) {}

  async execute(userId: string): Promise<PipelineStage[]> {
    const existing = await this.deps.pipelineStageRepository.findAllByUserId(userId);
    if (existing.length > 0) return existing;

    const stages = await Promise.all(
      DEFAULT_PIPELINE_STAGES.map((stage) =>
        this.deps.pipelineStageRepository.create({
          ...stage,
          id: this.deps.generateId(),
          userId,
          category: stage.category as PipelineStageCategory,
        }),
      ),
    );
    return stages.sort((a, b) => a.position - b.position);
  }
}
