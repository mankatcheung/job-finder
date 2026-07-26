import { describe, it, expect, vi } from 'vitest';
import { NoteResolver } from '#src/interface-adapters/resolvers/NoteResolver.js';
import { NoteMapper } from '#src/interface-adapters/mappers/NoteMapper.js';
import { makeNote } from '#src/__tests__/helpers/mocks.js';
import type { ICreateNoteUseCase } from '#src/use-cases/notes/ICreateNoteUseCase.js';
import type { IGetNotesUseCase } from '#src/use-cases/notes/IGetNotesUseCase.js';
import type { IUpdateNoteUseCase } from '#src/use-cases/notes/IUpdateNoteUseCase.js';
import type { IDeleteNoteUseCase } from '#src/use-cases/notes/IDeleteNoteUseCase.js';

const stub = <T>(methods: Partial<T>): T => methods as T;

const makeDeps = (overrides?: object) => ({
  createNoteUseCase: stub<ICreateNoteUseCase>({ execute: vi.fn() }),
  getNotesUseCase: stub<IGetNotesUseCase>({ execute: vi.fn() }),
  updateNoteUseCase: stub<IUpdateNoteUseCase>({ execute: vi.fn() }),
  deleteNoteUseCase: stub<IDeleteNoteUseCase>({ execute: vi.fn() }),
  noteMapper: new NoteMapper(),
  ...overrides,
});

describe('NoteResolver', () => {
  it('getNotes: returns mapped DTOs for all notes in an application', async () => {
    const notes = [makeNote({ id: 'note-1' }), makeNote({ id: 'note-2' })];
    const deps = makeDeps({
      getNotesUseCase: stub<IGetNotesUseCase>({ execute: vi.fn().mockResolvedValue(notes) }),
    });

    const resolver = new NoteResolver(deps);
    const result = await resolver.getNotes('user-1', 'app-1');

    expect(deps.getNotesUseCase.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      applicationId: 'app-1',
    });
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('note-1');
    expect(typeof result[0].createdAt).toBe('string');
  });

  it('createNote: creates and returns the mapped DTO', async () => {
    const note = makeNote({ content: 'Good culture fit.' });
    const deps = makeDeps({
      createNoteUseCase: stub<ICreateNoteUseCase>({ execute: vi.fn().mockResolvedValue(note) }),
    });

    const resolver = new NoteResolver(deps);
    const result = await resolver.createNote('user-1', 'app-1', 'Good culture fit.');

    expect(deps.createNoteUseCase.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      applicationId: 'app-1',
      content: 'Good culture fit.',
    });
    expect(result.content).toBe('Good culture fit.');
  });

  it('updateNote: updates and returns the mapped DTO', async () => {
    const note = makeNote({ content: 'Revised thoughts.' });
    const deps = makeDeps({
      updateNoteUseCase: stub<IUpdateNoteUseCase>({ execute: vi.fn().mockResolvedValue(note) }),
    });

    const resolver = new NoteResolver(deps);
    const result = await resolver.updateNote('user-1', 'note-1', 'Revised thoughts.');

    expect(deps.updateNoteUseCase.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      noteId: 'note-1',
      content: 'Revised thoughts.',
    });
    expect(result.content).toBe('Revised thoughts.');
  });

  it('deleteNote: calls delete use case and returns true', async () => {
    const deps = makeDeps({
      deleteNoteUseCase: stub<IDeleteNoteUseCase>({
        execute: vi.fn().mockResolvedValue(undefined),
      }),
    });

    const resolver = new NoteResolver(deps);
    const result = await resolver.deleteNote('user-1', 'note-1');

    expect(deps.deleteNoteUseCase.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      noteId: 'note-1',
    });
    expect(result).toBe(true);
  });
});
