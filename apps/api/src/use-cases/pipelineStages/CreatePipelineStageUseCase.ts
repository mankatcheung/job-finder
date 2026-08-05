import type {
  PipelineStage,
  PipelineStageCategory,
} from '#src/domain/pipelineStage/PipelineStage.js';
import type { IPipelineStageRepository } from '#src/use-cases/ports/IPipelineStageRepository.js';
import { ConflictError } from '#src/http/errors/AppError.js';

export class CreatePipelineStageUseCase {
  constructor(
    private readonly deps: {
      pipelineStageRepository: IPipelineStageRepository;
      generateId: () => string;
    },
  ) {}

  async execute(input: {
    userId: string;
    key: string;
    name: string;
    color: string;
    position: number;
    category: PipelineStageCategory;
  }): Promise<PipelineStage> {
    const key = input.key
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-');
    if (!key) throw new ConflictError('Stage key is required');
    if (await this.deps.pipelineStageRepository.findByKey(input.userId, key)) {
      throw new ConflictError('A stage with this key already exists');
    }
    return this.deps.pipelineStageRepository.create({ ...input, id: this.deps.generateId(), key });
  }
}
