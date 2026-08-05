import { describe, expect, it, vi } from 'vitest';
import type { IPipelineStageRepository } from '#src/use-cases/ports/IPipelineStageRepository.js';
import { CreatePipelineStageUseCase } from '#src/use-cases/pipelineStages/CreatePipelineStageUseCase.js';

const repository: IPipelineStageRepository = {
  findAllByUserId: vi.fn(),
  findById: vi.fn(),
  findByKey: vi.fn().mockResolvedValue(null),
  create: vi.fn().mockResolvedValue({}),
  update: vi.fn(),
  delete: vi.fn(),
};

describe('CreatePipelineStageUseCase', () => {
  it('normalizes custom keys before persisting', async () => {
    await new CreatePipelineStageUseCase({
      pipelineStageRepository: repository,
      generateId: () => 'stage-1',
    }).execute({
      userId: 'user-1',
      key: 'Phone Screen',
      name: 'Phone Screen',
      color: 'blue',
      position: 7,
      category: 'active',
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'phone-screen' }),
    );
  });
});
