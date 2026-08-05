import type { PipelineStageCategory } from '#src/domain/pipelineStage/PipelineStage.js';
import { PipelineStageMapper } from '#src/interface-adapters/mappers/PipelineStageMapper.js';
import { CreatePipelineStageUseCase } from '#src/use-cases/pipelineStages/CreatePipelineStageUseCase.js';
import { DeletePipelineStageUseCase } from '#src/use-cases/pipelineStages/DeletePipelineStageUseCase.js';
import { GetPipelineStagesUseCase } from '#src/use-cases/pipelineStages/GetPipelineStagesUseCase.js';
import { UpdatePipelineStageUseCase } from '#src/use-cases/pipelineStages/UpdatePipelineStageUseCase.js';

export class PipelineStageResolver {
  constructor(
    private readonly deps: {
      getPipelineStagesUseCase: GetPipelineStagesUseCase;
      createPipelineStageUseCase: CreatePipelineStageUseCase;
      updatePipelineStageUseCase: UpdatePipelineStageUseCase;
      deletePipelineStageUseCase: DeletePipelineStageUseCase;
      pipelineStageMapper: PipelineStageMapper;
    },
  ) {}

  async getStages(userId: string) {
    const stages = await this.deps.getPipelineStagesUseCase.execute(userId);
    return stages.map((stage) => this.deps.pipelineStageMapper.toDTO(stage));
  }

  async createStage(
    userId: string,
    input: Omit<Parameters<CreatePipelineStageUseCase['execute']>[0], 'userId'>,
  ) {
    const stage = await this.deps.createPipelineStageUseCase.execute({ userId, ...input });
    return this.deps.pipelineStageMapper.toDTO(stage);
  }

  async updateStage(
    userId: string,
    input: {
      id: string;
      name?: string;
      color?: string;
      position?: number;
      category?: PipelineStageCategory;
    },
  ) {
    const stage = await this.deps.updatePipelineStageUseCase.execute({ userId, ...input });
    return this.deps.pipelineStageMapper.toDTO(stage);
  }

  async deleteStage(userId: string, id: string) {
    await this.deps.deletePipelineStageUseCase.execute({ userId, id });
    return true;
  }
}
