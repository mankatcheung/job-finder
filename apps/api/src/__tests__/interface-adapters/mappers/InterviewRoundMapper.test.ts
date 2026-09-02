import { describe, it, expect } from 'vitest';
import { InterviewRoundMapper } from '#src/interface-adapters/mappers/InterviewRoundMapper.js';
import { makeInterviewRound } from '#src/__tests__/helpers/mocks/interviews.js';

describe('InterviewRoundMapper', () => {
  const mapper = new InterviewRoundMapper();

  it('converts scheduledAt, completedAt, createdAt and updatedAt to ISO strings', () => {
    const round = makeInterviewRound({
      scheduledAt: new Date('2024-06-01T10:00:00.000Z'),
      completedAt: new Date('2024-06-01T11:00:00.000Z'),
      createdAt: new Date('2024-05-01T00:00:00.000Z'),
      updatedAt: new Date('2024-05-02T00:00:00.000Z'),
    });

    const dto = mapper.toDTO(round);

    expect(dto.scheduledAt).toBe('2024-06-01T10:00:00.000Z');
    expect(dto.completedAt).toBe('2024-06-01T11:00:00.000Z');
    expect(dto.createdAt).toBe('2024-05-01T00:00:00.000Z');
    expect(dto.updatedAt).toBe('2024-05-02T00:00:00.000Z');
  });

  it('maps null scheduledAt and completedAt to null instead of throwing', () => {
    const round = makeInterviewRound({ scheduledAt: null, completedAt: null });

    const dto = mapper.toDTO(round);

    expect(dto.scheduledAt).toBeNull();
    expect(dto.completedAt).toBeNull();
  });

  it('passes scalar fields through unchanged', () => {
    const round = makeInterviewRound({
      id: 'round-xyz',
      applicationId: 'app-abc',
      type: 'onsite',
      interviewerName: 'Jane Doe',
      notes: 'Went well.',
      outcome: 'passed',
    });

    const dto = mapper.toDTO(round);

    expect(dto.id).toBe('round-xyz');
    expect(dto.applicationId).toBe('app-abc');
    expect(dto.type).toBe('onsite');
    expect(dto.interviewerName).toBe('Jane Doe');
    expect(dto.notes).toBe('Went well.');
    expect(dto.outcome).toBe('passed');
  });
});
