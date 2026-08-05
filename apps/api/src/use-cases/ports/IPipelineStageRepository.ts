import type {
  PipelineStage,
  PipelineStageCategory,
} from '#src/domain/pipelineStage/PipelineStage.js';

export interface CreatePipelineStageData {
  id: string;
  userId: string;
  key: string;
  name: string;
  color: string;
  position: number;
  category: PipelineStageCategory;
}

export interface UpdatePipelineStageData {
  name?: string;
  color?: string;
  position?: number;
  category?: PipelineStageCategory;
}

export interface IPipelineStageRepository {
  findAllByUserId(userId: string): Promise<PipelineStage[]>;
  findById(id: string): Promise<PipelineStage | null>;
  findByKey(userId: string, key: string): Promise<PipelineStage | null>;
  create(data: CreatePipelineStageData): Promise<PipelineStage>;
  update(id: string, data: UpdatePipelineStageData): Promise<PipelineStage>;
  delete(id: string): Promise<void>;
}
