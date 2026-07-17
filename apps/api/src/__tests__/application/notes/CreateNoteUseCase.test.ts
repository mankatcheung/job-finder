import { describe, it, expect, vi } from 'vitest';
import { CreateNoteUseCase } from '@/use-cases/notes/CreateNoteUseCase.js';
import {
  makeApplicationRepository,
  makeNoteRepository,
  makeApplication,
  makeNote,
} from '@/__tests__/helpers/mocks.js';

describe('CreateNoteUseCase', () => {
  it('throws NOT_FOUND when the application does not exist', async () => {
    const applicationRepository = makeApplicationRepository({
      findById: vi.fn().mockResolvedValue(null),
    });

    const useCase = new CreateNoteUseCase({
      applicationRepository,
      noteRepository: makeNoteRepository(),
      generateId: vi.fn(),
    });
    const err = await useCase
      .execute({ userId: 'user-1', applicationId: 'app-missing', content: 'note' })
      .catch((e) => e);

    expect(err).toBeInstanceOf(Error);
    expect((err as { code: string }).code).toBe('NOT_FOUND');
  });

  it('throws FORBIDDEN when the application belongs to another user', async () => {
    const applicationRepository = makeApplicationRepository({
      findById: vi.fn().mockResolvedValue(makeApplication({ userId: 'other-user' })),
    });

    const useCase = new CreateNoteUseCase({
      applicationRepository,
      noteRepository: makeNoteRepository(),
      generateId: vi.fn(),
    });
    const err = await useCase
      .execute({ userId: 'user-1', applicationId: 'app-1', content: 'note' })
      .catch((e) => e);

    expect(err).toBeInstanceOf(Error);
    expect((err as { code: string }).code).toBe('FORBIDDEN');
  });

  it('creates a note with the correct data and generated id', async () => {
    const note = makeNote({ content: 'Great interview!' });
    const applicationRepository = makeApplicationRepository({
      findById: vi.fn().mockResolvedValue(makeApplication()),
    });
    const noteRepository = makeNoteRepository({
      create: vi.fn().mockResolvedValue(note),
    });
    const generateId = vi.fn().mockReturnValue('note-1');

    const useCase = new CreateNoteUseCase({ applicationRepository, noteRepository, generateId });
    const result = await useCase.execute({
      userId: 'user-1',
      applicationId: 'app-1',
      content: 'Great interview!',
    });

    expect(result).toEqual(note);
    expect(noteRepository.create).toHaveBeenCalledWith({
      id: 'note-1',
      applicationId: 'app-1',
      content: 'Great interview!',
    });
  });
});
