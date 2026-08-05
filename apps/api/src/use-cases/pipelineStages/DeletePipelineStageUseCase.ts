import type { IPipelineStageRepository } from '#src/use-cases/ports/IPipelineStageRepository.js';
import { ForbiddenError, NotFoundError } from '#src/http/errors/AppError.js';

export class DeletePipelineStageUseCase {
  constructor(private readonly deps: { pipelineStageRepository: IPipelineStageRepository }) {}

  async execute(input: { userId: string; id: string }): Promise<void> {
    const stage = await this.deps.pipelineStageRepository.findById(input.id);
    if (!stage) throw new NotFoundError('Pipeline stage not found');
    if (stage.userId !== input.userId) throw new ForbiddenError('Not authorized');
    await this.deps.pipelineStageRepository.delete(input.id);
  }
}
