import {
  AiNotConfiguredError,
  ForbiddenError,
  NotFoundError,
  RateLimitedError,
} from '#src/use-cases/errors/DomainError.js';
import type { Conversation } from '#src/domain/conversation/Conversation.js';
import type { User } from '#src/domain/user/User.js';
import type { ILLMProviderFactory } from '#src/use-cases/ports/ILLMProviderFactory.js';
import type { IRateLimiter } from '#src/use-cases/ports/IRateLimiter.js';
import type { IMessageRepository } from '#src/use-cases/ports/IMessageRepository.js';
import type { IConversationRepository } from '#src/use-cases/ports/IConversationRepository.js';
import type { IUserRepository } from '#src/use-cases/ports/IUserRepository.js';
import type { LLMMessage, LLMToolDefinition } from '#src/use-cases/ports/ILLMProvider.js';
import { CHAT } from '#src/constants.js';
import {
  type ChatToolDeps,
  buildChatMessages,
  deriveChatTitle,
  executeChatTool,
} from '#src/use-cases/chat/chatAssembly.js';

export interface ChatWithAssistantInput {
  userId: string;
  conversationId: string;
  message: string;
}

export interface ChatWithAssistantDeps extends ChatToolDeps {
  /**
   * The tools this surface offers the model, injected rather than imported:
   * the catalogue is an adapter-layer contract, and which subset chat gets
   * is a composition decision (see `http/di`) — chat is session-authenticated
   * with no token scope, so it receives read tools only (JEF-177).
   */
  chatTools: LLMToolDefinition[];
  llmProviderFactory: ILLMProviderFactory;
  chatRateLimiter: IRateLimiter;
  messageRepository: IMessageRepository;
  conversationRepository: IConversationRepository;
  userRepository: IUserRepository;
  generateId: () => string;
}

export class ChatWithAssistantUseCase {
  constructor(private readonly deps: ChatWithAssistantDeps) {}

  async execute(input: ChatWithAssistantInput): Promise<string> {
    if (!(await this.deps.chatRateLimiter.consume(`chat:${input.userId}`))) {
      throw new RateLimitedError('Too many messages — please wait a moment and try again');
    }

    const conversation = await this.deps.conversationRepository.findById(input.conversationId);
    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }
    if (conversation.userId !== input.userId) {
      throw new ForbiddenError('Forbidden');
    }

    // Fetched once up front: needed both for the custom-AI-prompt system
    // message below and as the defaultLlmProvider fallback inside complete().
    const user = await this.deps.userRepository.findById(input.userId);

    // Stored history only ever contains 'user'/'assistant' turns we wrote
    // ourselves — the per-turn tool-call scratchpad below is rebuilt fresh
    // each time and never persisted.
    const history = await this.deps.messageRepository.findAllByConversationId(input.conversationId);

    const messages = buildChatMessages(history, input.message, user);

    const reply = await this.complete(messages, input.userId, conversation, user);

    await this.deps.messageRepository.create({
      id: this.deps.generateId(),
      conversationId: input.conversationId,
      role: 'user',
      content: input.message,
    });
    await this.deps.messageRepository.create({
      id: this.deps.generateId(),
      conversationId: input.conversationId,
      role: 'assistant',
      content: reply,
    });

    if (history.length === 0) {
      await this.deps.conversationRepository.updateTitle(
        input.conversationId,
        deriveChatTitle(input.message),
      );
    }

    return reply;
  }

  private async complete(
    messages: LLMMessage[],
    userId: string,
    conversation: Conversation,
    user: User | null,
  ): Promise<string> {
    const providerName = conversation.llmProvider ?? user?.defaultLlmProvider ?? null;

    const llmProvider = await this.deps.llmProviderFactory.forUser(
      userId,
      providerName ?? undefined,
      conversation.llmModel,
    );
    if (!llmProvider) {
      throw new AiNotConfiguredError('Add your AI API key in Settings to use this feature');
    }

    if (!conversation.llmProvider && providerName) {
      await this.deps.conversationRepository.updateLlmSettings(
        conversation.id,
        providerName,
        conversation.llmModel,
      );
    }

    for (let i = 0; i < CHAT.MAX_TOOL_ITERATIONS; i++) {
      const result = await llmProvider.completeWithTools(messages, this.deps.chatTools);

      if (result.toolCalls.length === 0) {
        return result.content?.trim() || "I don't have a response for that.";
      }

      messages.push({
        role: 'assistant',
        content: result.content ?? '',
        toolCalls: result.toolCalls,
      });

      const toolResults = await Promise.all(
        result.toolCalls.map((call) => executeChatTool(call, userId, this.deps)),
      );
      result.toolCalls.forEach((call, i) => {
        messages.push({
          role: 'tool',
          content: JSON.stringify(toolResults[i]),
          toolCallId: call.id,
        });
      });
    }

    return 'That took more steps than I could complete — try asking something more specific.';
  }
}
