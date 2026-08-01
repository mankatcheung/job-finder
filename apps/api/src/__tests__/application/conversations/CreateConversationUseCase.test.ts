import { describe, it, expect, vi } from 'vitest';
import { CreateConversationUseCase } from '#src/use-cases/conversations/CreateConversationUseCase.js';
import { makeConversationRepository, makeConversation } from '#src/__tests__/helpers/mocks.js';

describe('CreateConversationUseCase', () => {
  it('creates a conversation for the user with a generated id', async () => {
    const created = makeConversation({ id: 'conv-1', userId: 'user-1' });
    const conversationRepository = makeConversationRepository({
      create: vi.fn().mockResolvedValue(created),
    });
    const generateId = vi.fn().mockReturnValue('conv-1');

    const useCase = new CreateConversationUseCase({ conversationRepository, generateId });
    const result = await useCase.execute('user-1');

    expect(result).toEqual(created);
    expect(conversationRepository.create).toHaveBeenCalledWith({
      id: 'conv-1',
      userId: 'user-1',
    });
  });
});
