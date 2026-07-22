import { describe, it, expect, vi } from 'vitest';
import { InterviewRoundResolver } from '@/interface-adapters/resolvers/InterviewRoundResolver.js';
import { InterviewRoundMapper } from '@/interface-adapters/mappers/InterviewRoundMapper.js';
import { makeInterviewRound } from '@/__tests__/helpers/mocks.js';
import type { ICreateInterviewRoundUseCase } from '@/use-cases/interviewRounds/ICreateInterviewRoundUseCase.js';
import type { IGetInterviewRoundsUseCase } from '@/use-cases/interviewRounds/IGetInterviewRoundsUseCase.js';
import type { IUpdateInterviewRoundUseCase } from '@/use-cases/interviewRounds/IUpdateInterviewRoundUseCase.js';
import type { IDeleteInterviewRoundUseCase } from '@/use-cases/interviewRounds/IDeleteInterviewRoundUseCase.js';

const stub = <T>(methods: Partial<T>): T => methods as T;

const makeDeps = (overrides?: object) => ({
  createInterviewRoundUseCase: stub<ICreateInterviewRoundUseCase>({ execute: vi.fn() }),
  getInterviewRoundsUseCase: stub<IGetInterviewRoundsUseCase>({ execute: vi.fn() }),
  updateInterviewRoundUseCase: stub<IUpdateInterviewRoundUseCase>({ execute: vi.fn() }),
  deleteInterviewRoundUseCase: stub<IDeleteInterviewRoundUseCase>({ execute: vi.fn() }),
  interviewRoundMapper: new InterviewRoundMapper(),
  ...overrides,
});

describe('InterviewRoundResolver', () => {
  it('getInterviewRounds: delegates to the use case and maps each round to a DTO', async () => {
    const rounds = [makeInterviewRound({ id: 'round-1' }), makeInterviewRound({ id: 'round-2' })];
    const deps = makeDeps({
      getInterviewRoundsUseCase: stub<IGetInterviewRoundsUseCase>({
        execute: vi.fn().mockResolvedValue(rounds),
      }),
    });

    const resolver = new InterviewRoundResolver(deps);
    const result = await resolver.getInterviewRounds('user-1', 'app-1');

    expect(deps.getInterviewRoundsUseCase.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      applicationId: 'app-1',
    });
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('round-1');
    expect(result[1].id).toBe('round-2');
  });

  it('createInterviewRound: passes userId and input through and returns the mapped DTO', async () => {
    const round = makeInterviewRound({ id: 'round-1', type: 'technical' });
    const deps = makeDeps({
      createInterviewRoundUseCase: stub<ICreateInterviewRoundUseCase>({
        execute: vi.fn().mockResolvedValue(round),
      }),
    });

    const resolver = new InterviewRoundResolver(deps);
    const result = await resolver.createInterviewRound('user-1', {
      applicationId: 'app-1',
      type: 'technical',
    });

    expect(deps.createInterviewRoundUseCase.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      applicationId: 'app-1',
      type: 'technical',
    });
    expect(result.id).toBe('round-1');
    expect(result.type).toBe('technical');
  });

  it('updateInterviewRound: passes userId, roundId and input through and returns the mapped DTO', async () => {
    const round = makeInterviewRound({ id: 'round-1', outcome: 'passed' });
    const deps = makeDeps({
      updateInterviewRoundUseCase: stub<IUpdateInterviewRoundUseCase>({
        execute: vi.fn().mockResolvedValue(round),
      }),
    });

    const resolver = new InterviewRoundResolver(deps);
    const result = await resolver.updateInterviewRound('user-1', 'round-1', { outcome: 'passed' });

    expect(deps.updateInterviewRoundUseCase.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      roundId: 'round-1',
      outcome: 'passed',
    });
    expect(result.outcome).toBe('passed');
  });

  it('deleteInterviewRound: calls the use case and returns true', async () => {
    const deps = makeDeps({
      deleteInterviewRoundUseCase: stub<IDeleteInterviewRoundUseCase>({
        execute: vi.fn().mockResolvedValue(undefined),
      }),
    });

    const resolver = new InterviewRoundResolver(deps);
    const result = await resolver.deleteInterviewRound('user-1', 'round-1');

    expect(deps.deleteInterviewRoundUseCase.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      roundId: 'round-1',
    });
    expect(result).toBe(true);
  });
});
