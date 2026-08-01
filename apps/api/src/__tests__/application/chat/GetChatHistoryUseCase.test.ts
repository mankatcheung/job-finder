import { describe, it, expect, vi } from 'vitest';
import { GetChatHistoryUseCase } from '#src/use-cases/chat/GetChatHistoryUseCase.js';
import { makeMessageRepository, makeMessage } from '#src/__tests__/helpers/mocks.js';

describe('GetChatHistoryUseCase', () => {
  it('returns the messages for the user', async () => {
    const messages = [makeMessage({ id: 'msg-1' }), makeMessage({ id: 'msg-2' })];
    const messageRepository = makeMessageRepository({
      findAllByUserId: vi.fn().mockResolvedValue(messages),
    });

    const useCase = new GetChatHistoryUseCase({ messageRepository });
    const result = await useCase.execute('user-1');

    expect(result).toEqual(messages);
    expect(messageRepository.findAllByUserId).toHaveBeenCalledWith('user-1');
  });

  it('returns an empty array when the user has no messages', async () => {
    const messageRepository = makeMessageRepository({
      findAllByUserId: vi.fn().mockResolvedValue([]),
    });

    const useCase = new GetChatHistoryUseCase({ messageRepository });
    const result = await useCase.execute('user-1');

    expect(result).toEqual([]);
  });
});
