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
  /**
   * Aborted when the client disconnects before a reply arrives (JEF-240) —
   * threaded down to the LLM provider fetch so a cancelled generation stops
   * costing tokens server-side instead of running to completion for no one.
   * Tool execution itself isn't cancelled (cheap DB reads, not the expense
   * this exists to avoid) — only the LLM call.
   */
  signal?: AbortSignal;
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

    // Only the most recent CHAT.MAX_HISTORY_MESSAGES go to the model — see
    // that constant's doc comment (JEF-237). `history` itself stays the full,
    // uncapped list: `history.length === 0` below needs to know whether this
    // is truly the conversation's first message, not just the first one
    // still within the cap.
    const historyForPrompt = history.slice(-CHAT.MAX_HISTORY_MESSAGES);
    const messages = buildChatMessages(historyForPrompt, input.message, user);

    const reply = await this.complete(messages, input.userId, conversation, user, input.signal);

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
    signal?: AbortSignal,
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

    // Names only, in call order — just enough to tell the user what it was
    // doing if it never gets to an answer, without holding onto full
    // arguments/results (already in `messages` for that, and not needed here).
    const calledTools: string[] = [];

    for (let i = 0; i < CHAT.MAX_TOOL_ITERATIONS; i++) {
      const result = await llmProvider.completeWithTools(
        messages,
        this.deps.chatTools,
        undefined,
        signal,
      );

      if (result.toolCalls.length === 0) {
        return result.content?.trim() || "I don't have a response for that.";
      }

      calledTools.push(...result.toolCalls.map((call) => call.name));

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

    return this.iterationCapMessage(calledTools);
  }

  /**
   * Distinct tool names, in the order first called — enough for the user to
   * see what it was doing before giving up, without the noise of every
   * repeated call across iterations.
   */
  private iterationCapMessage(calledTools: string[]): string {
    const base = 'That took more steps than I could complete — try asking something more specific.';
    const distinct = [...new Set(calledTools)];
    if (distinct.length === 0) return base;
    return `${base} So far I looked at: ${distinct.join(', ')}.`;
  }
}
