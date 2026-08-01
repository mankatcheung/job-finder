import { describe, it, expect, vi } from 'vitest';
import { GetChatHistoryUseCase } from '#src/use-cases/chat/GetChatHistoryUseCase.js';
import {
  makeMessageRepository,
  makeMessage,
  makeConversationRepository,
  makeConversation,
} from '#src/__tests__/helpers/mocks.js';

describe('GetChatHistoryUseCase', () => {
  it('returns the messages for the conversation when it belongs to the user', async () => {
    const messages = [makeMessage({ id: 'msg-1' }), makeMessage({ id: 'msg-2' })];
    const messageRepository = makeMessageRepository({
      findAllByConversationId: vi.fn().mockResolvedValue(messages),
    });
    const conversationRepository = makeConversationRepository({
      findById: vi.fn().mockResolvedValue(makeConversation({ id: 'conv-1', userId: 'user-1' })),
    });

    const useCase = new GetChatHistoryUseCase({ messageRepository, conversationRepository });
    const result = await useCase.execute({ userId: 'user-1', conversationId: 'conv-1' });

    expect(result).toEqual(messages);
    expect(messageRepository.findAllByConversationId).toHaveBeenCalledWith('conv-1');
  });

  it('returns an empty array when the conversation has no messages', async () => {
    const messageRepository = makeMessageRepository({
      findAllByConversationId: vi.fn().mockResolvedValue([]),
    });
    const conversationRepository = makeConversationRepository({
      findById: vi.fn().mockResolvedValue(makeConversation({ id: 'conv-1', userId: 'user-1' })),
    });

    const useCase = new GetChatHistoryUseCase({ messageRepository, conversationRepository });
    const result = await useCase.execute({ userId: 'user-1', conversationId: 'conv-1' });

    expect(result).toEqual([]);
  });

  it('throws NOT_FOUND when the conversation does not exist', async () => {
    const conversationRepository = makeConversationRepository({
      findById: vi.fn().mockResolvedValue(null),
    });

    const useCase = new GetChatHistoryUseCase({
      messageRepository: makeMessageRepository(),
      conversationRepository,
    });
    const err = await useCase
      .execute({ userId: 'user-1', conversationId: 'conv-1' })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('NOT_FOUND');
  });

  it('throws FORBIDDEN when the conversation belongs to another user', async () => {
    const conversationRepository = makeConversationRepository({
      findById: vi
        .fn()
        .mockResolvedValue(makeConversation({ id: 'conv-1', userId: 'someone-else' })),
    });

    const useCase = new GetChatHistoryUseCase({
      messageRepository: makeMessageRepository(),
      conversationRepository,
    });
    const err = await useCase
      .execute({ userId: 'user-1', conversationId: 'conv-1' })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('FORBIDDEN');
  });
});
