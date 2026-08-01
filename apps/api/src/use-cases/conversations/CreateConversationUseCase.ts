import type { IConversationRepository } from '#src/use-cases/ports/IConversationRepository.js';
import type { Conversation } from '#src/domain/conversation/Conversation.js';
import type { ICreateConversationUseCase } from '#src/use-cases/conversations/ICreateConversationUseCase.js';

interface Deps {
  conversationRepository: IConversationRepository;
  generateId: () => string;
}

export class CreateConversationUseCase implements ICreateConversationUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(userId: string): Promise<Conversation> {
    return this.deps.conversationRepository.create({ id: this.deps.generateId(), userId });
  }
}
