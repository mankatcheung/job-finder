import type {
  PipelineStage,
  PipelineStageCategory,
} from '#src/domain/pipelineStage/PipelineStage.js';
import type { IPipelineStageRepository } from '#src/use-cases/ports/IPipelineStageRepository.js';
import { ForbiddenError, NotFoundError } from '#src/http/errors/AppError.js';

export class UpdatePipelineStageUseCase {
  constructor(private readonly deps: { pipelineStageRepository: IPipelineStageRepository }) {}

  async execute(input: {
    userId: string;
    id: string;
    name?: string;
    color?: string;
    position?: number;
    category?: PipelineStageCategory;
  }): Promise<PipelineStage> {
    const stage = await this.deps.pipelineStageRepository.findById(input.id);
    if (!stage) throw new NotFoundError('Pipeline stage not found');
    if (stage.userId !== input.userId) throw new ForbiddenError('Not authorized');
    return this.deps.pipelineStageRepository.update(input.id, {
      name: input.name,
      color: input.color,
      position: input.position,
      category: input.category,
    });
  }
}
