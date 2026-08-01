import type { IConversationRepository } from '#src/use-cases/ports/IConversationRepository.js';
import type { ILlmApiKeyRepository } from '#src/use-cases/ports/ILlmApiKeyRepository.js';
import type { Conversation } from '#src/domain/conversation/Conversation.js';
import type {
  ICreateConversationUseCase,
  CreateConversationInput,
} from '#src/use-cases/conversations/ICreateConversationUseCase.js';
import { ERROR_CODES } from '#src/constants.js';

interface Deps {
  conversationRepository: IConversationRepository;
  llmApiKeyRepository: ILlmApiKeyRepository;
  generateId: () => string;
}

export class CreateConversationUseCase implements ICreateConversationUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: CreateConversationInput): Promise<Conversation> {
    if (input.provider) {
      const key = await this.deps.llmApiKeyRepository.findByUserIdAndProvider(
        input.userId,
        input.provider,
      );
      if (!key) {
        throw Object.assign(new Error('Add an API key for this provider first'), {
          code: ERROR_CODES.VALIDATION,
        });
      }
    }

    return this.deps.conversationRepository.create({
      id: this.deps.generateId(),
      userId: input.userId,
      llmProvider: input.provider ?? null,
      llmModel: input.model ?? null,
    });
  }
}
