import { describe, it, expect } from 'vitest';
import { NoteMapper } from '#src/interface-adapters/mappers/NoteMapper.js';
import { makeNote } from '#src/__tests__/helpers/mocks/notes.js';

describe('NoteMapper', () => {
  const mapper = new NoteMapper();

  it('converts createdAt and updatedAt to ISO strings', () => {
    const note = makeNote({
      createdAt: new Date('2024-03-10T08:00:00.000Z'),
      updatedAt: new Date('2024-04-01T15:30:00.000Z'),
    });

    const dto = mapper.toDTO(note);

    expect(dto.createdAt).toBe('2024-03-10T08:00:00.000Z');
    expect(dto.updatedAt).toBe('2024-04-01T15:30:00.000Z');
  });

  it('passes all scalar fields through unchanged', () => {
    const note = makeNote({
      id: 'note-xyz',
      applicationId: 'app-abc',
      content: 'Strong candidate, move to final round.',
    });

    const dto = mapper.toDTO(note);

    expect(dto.id).toBe('note-xyz');
    expect(dto.applicationId).toBe('app-abc');
    expect(dto.content).toBe('Strong candidate, move to final round.');
  });
});
