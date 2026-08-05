import { describe, expect, it, vi } from 'vitest';
import type { IPipelineStageRepository } from '#src/use-cases/ports/IPipelineStageRepository.js';
import { GetPipelineStagesUseCase } from '#src/use-cases/pipelineStages/GetPipelineStagesUseCase.js';

const repository = (): IPipelineStageRepository => ({
  findAllByUserId: vi.fn().mockResolvedValue([]),
  findById: vi.fn(),
  findByKey: vi.fn(),
  create: vi.fn().mockImplementation(async (input) => ({
    ...input,
    createdAt: new Date(),
    updatedAt: new Date(),
  })),
  update: vi.fn(),
  delete: vi.fn(),
});

describe('GetPipelineStagesUseCase', () => {
  it('creates the default stages on first access', async () => {
    const pipelineStageRepository = repository();
    const result = await new GetPipelineStagesUseCase({
      pipelineStageRepository,
      generateId: vi.fn().mockReturnValue('stage-id'),
    }).execute('user-1');

    expect(result).toHaveLength(7);
    expect(result[0].key).toBe('draft');
    expect(pipelineStageRepository.create).toHaveBeenCalledTimes(7);
  });

  it('returns existing custom stages without recreating defaults', async () => {
    const existing = [
      {
        id: 'stage-1',
        userId: 'user-1',
        key: 'phone-screen',
        name: 'Phone Screen',
        color: 'blue',
        position: 0,
        category: 'active' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    const pipelineStageRepository = repository();
    vi.mocked(pipelineStageRepository.findAllByUserId).mockResolvedValue(existing);

    await expect(
      new GetPipelineStagesUseCase({
        pipelineStageRepository,
        generateId: vi.fn(),
      }).execute('user-1'),
    ).resolves.toEqual(existing);
    expect(pipelineStageRepository.create).not.toHaveBeenCalled();
  });
});
