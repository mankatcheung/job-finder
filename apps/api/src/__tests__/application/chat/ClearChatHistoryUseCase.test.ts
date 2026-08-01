import { describe, it, expect } from 'vitest';
import { ClearChatHistoryUseCase } from '#src/use-cases/chat/ClearChatHistoryUseCase.js';
import { makeMessageRepository } from '#src/__tests__/helpers/mocks.js';

describe('ClearChatHistoryUseCase', () => {
  it('deletes all messages for the user', async () => {
    const messageRepository = makeMessageRepository();

    const useCase = new ClearChatHistoryUseCase({ messageRepository });
    await useCase.execute('user-1');

    expect(messageRepository.deleteAllByUserId).toHaveBeenCalledWith('user-1');
  });
});
