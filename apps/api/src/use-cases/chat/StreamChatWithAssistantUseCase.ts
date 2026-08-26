import {
  AiNotConfiguredError,
  ForbiddenError,
  NotFoundError,
  RateLimitedError,
} from '#src/use-cases/errors/DomainError.js';
import type { LLMToolCall } from '#src/use-cases/ports/ILLMProvider.js';
import { CHAT } from '#src/constants.js';
import {
  buildChatMessages,
  deriveChatTitle,
  executeChatTool,
} from '#src/use-cases/chat/chatAssembly.js';
import type {
  ChatWithAssistantDeps,
  ChatWithAssistantInput,
} from '#src/use-cases/chat/ChatWithAssistantUseCase.js';

/**
 * `delta` carries incremental assistant text as it arrives — including
 * narration ahead of a tool call, since real streaming naturally surfaces
 * that. `done` always terminates the stream. Only text from the *final*
 * round (the one with no further tool calls) is persisted as the assistant
 * message, same as `ChatWithAssistantUseCase` — mid-conversation narration
 * is real-time UI only, discarded on reload, matching what the non-streaming
 * path already does with intermediate rounds' content.
 */
export type ChatStreamEvent = { type: 'delta'; text: string } | { type: 'done' };

/**
 * Streaming counterpart to `ChatWithAssistantUseCase` (JEF-239) — same rate
 * limiting, conversation/user lookup, message assembly, tool-calling loop,
 * and persistence, but yields text as the provider streams it instead of
 * waiting for a fully-assembled reply. Kept as a separate class rather than
 * a `stream?: boolean` flag on the existing use case: the control flow is
 * genuinely different (an async generator yielding across potentially
 * several tool round-trips vs. a single `Promise<string>`), and the shared
 * parts (message assembly, tool dispatch, title derivation) already live in
 * `chatAssembly.ts` so this isn't a wholesale duplication.
 */
export class StreamChatWithAssistantUseCase {
  constructor(private readonly deps: ChatWithAssistantDeps) {}

  async *execute(input: ChatWithAssistantInput): AsyncGenerator<ChatStreamEvent> {
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

    const user = await this.deps.userRepository.findById(input.userId);
    const history = await this.deps.messageRepository.findAllByConversationId(input.conversationId);
    // Only the most recent CHAT.MAX_HISTORY_MESSAGES go to the model — see
    // that constant's doc comment (JEF-237). `history` itself stays the full,
    // uncapped list: `history.length === 0` below needs to know whether this
    // is truly the conversation's first message, not just the first one
    // still within the cap.
    const historyForPrompt = history.slice(-CHAT.MAX_HISTORY_MESSAGES);
    const messages = buildChatMessages(historyForPrompt, input.message, user);

    const providerName = conversation.llmProvider ?? user?.defaultLlmProvider ?? null;
    const llmProvider = await this.deps.llmProviderFactory.forUser(
      input.userId,
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

    let finalReply =
      'That took more steps than I could complete — try asking something more specific.';

    for (let i = 0; i < CHAT.MAX_TOOL_ITERATIONS; i++) {
      let content = '';
      let toolCalls: LLMToolCall[] = [];

      for await (const event of llmProvider.completeWithToolsStream(
        messages,
        this.deps.chatTools,
      )) {
        if (event.type === 'text_delta') {
          yield { type: 'delta', text: event.text };
        } else {
          content = event.content ?? '';
          toolCalls = event.toolCalls;
        }
      }

      if (toolCalls.length === 0) {
        finalReply = content.trim() || "I don't have a response for that.";
        break;
      }

      messages.push({ role: 'assistant', content, toolCalls });
      const toolResults = await Promise.all(
        toolCalls.map((call) => executeChatTool(call, input.userId, this.deps)),
      );
      toolCalls.forEach((call, idx) => {
        messages.push({
          role: 'tool',
          content: JSON.stringify(toolResults[idx]),
          toolCallId: call.id,
        });
      });
    }

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
      content: finalReply,
    });

    if (history.length === 0) {
      await this.deps.conversationRepository.updateTitle(
        input.conversationId,
        deriveChatTitle(input.message),
      );
    }

    yield { type: 'done' };
  }
}
