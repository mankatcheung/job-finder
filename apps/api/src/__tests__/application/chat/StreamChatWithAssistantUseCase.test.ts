import { describe, it, expect, vi } from 'vitest';
import { CHAT_TOOLS, toLlmToolDefinitions } from '#src/interface-adapters/llm/toolCatalogue.js';
import { StreamChatWithAssistantUseCase } from '#src/use-cases/chat/StreamChatWithAssistantUseCase.js';
import {
  makeConversation,
  makeConversationRepository,
  makeMessageRepository,
} from '#src/__tests__/helpers/mocks/chat.js';
import { makeRateLimiter } from '#src/__tests__/helpers/mocks/infrastructure.js';
import { makeLLMProviderFactory } from '#src/__tests__/helpers/mocks/llm.js';
import { makeUser, makeUserRepository } from '#src/__tests__/helpers/mocks/user.js';
import type {
  ILLMProvider,
  LLMStreamEvent,
  LLMToolCall,
} from '#src/use-cases/ports/ILLMProvider.js';

function stubUseCase(result: unknown = []) {
  return { execute: vi.fn().mockResolvedValue(result) };
}

function makeDeps(overrides?: Record<string, unknown>) {
  return {
    llmProviderFactory: makeLLMProviderFactory(),
    chatTools: toLlmToolDefinitions(CHAT_TOOLS),
    getApplicationsPageUseCase: stubUseCase({ items: [], hasNextPage: false, nextCursor: null }),
    getApplicationUseCase: stubUseCase({ id: 'app-1' }),
    getNotesUseCase: stubUseCase([]),
    getContactsUseCase: stubUseCase([]),
    getInterviewRoundsUseCase: stubUseCase([]),
    getDocumentsUseCase: stubUseCase([]),
    getOffersUseCase: stubUseCase([]),
    getActivityLogsUseCase: stubUseCase([]),
    getCalendarEventsUseCase: stubUseCase([]),
    getResponseTimeAnalyticsUseCase: stubUseCase({}),
    getApplicationChannelAnalyticsUseCase: stubUseCase({}),
    getInterviewRoundAnalyticsUseCase: stubUseCase({}),
    getOfferAnalyticsUseCase: stubUseCase({}),
    chatRateLimiter: makeRateLimiter(),
    messageRepository: makeMessageRepository(),
    conversationRepository: makeConversationRepository({
      findById: vi.fn().mockResolvedValue(makeConversation({ id: 'conv-1', userId: 'user-1' })),
    }),
    userRepository: makeUserRepository({
      findById: vi.fn().mockResolvedValue(makeUser({ defaultLlmProvider: null })),
    }),
    generateId: vi.fn().mockReturnValue('generated-id'),
    ...overrides,
  };
}

/** Each argument is one round's worth of events for `completeWithToolsStream`. */
function makeStreamingProvider(
  ...rounds: { deltas?: string[]; content: string | null; toolCalls: LLMToolCall[] }[]
): ILLMProvider {
  let call = 0;
  return {
    complete: vi.fn(),
    completeWithToolsStream: vi.fn(function (): AsyncGenerator<LLMStreamEvent> {
      const round = rounds[call++];
      async function* gen() {
        for (const text of round.deltas ?? []) yield { type: 'text_delta' as const, text };
        yield {
          type: 'done' as const,
          content: round.content,
          toolCalls: round.toolCalls,
          usage: null,
        };
      }
      return gen();
    }),
  };
}

async function collect(
  useCase: StreamChatWithAssistantUseCase,
  input: Parameters<StreamChatWithAssistantUseCase['execute']>[0],
) {
  const events = [];
  for await (const event of useCase.execute(input)) events.push(event);
  return events;
}

const baseInput = { userId: 'user-1', conversationId: 'conv-1' };

describe('StreamChatWithAssistantUseCase', () => {
  it('throws RATE_LIMITED when the rate limiter rejects the request', async () => {
    const deps = makeDeps({
      chatRateLimiter: makeRateLimiter({ consume: vi.fn().mockReturnValue(false) }),
    });

    await expect(
      collect(new StreamChatWithAssistantUseCase(deps as never), { ...baseInput, message: 'hi' }),
    ).rejects.toMatchObject({ code: 'RATE_LIMITED' });
  });

  it('throws NOT_FOUND when the conversation does not exist', async () => {
    const deps = makeDeps({
      conversationRepository: makeConversationRepository({
        findById: vi.fn().mockResolvedValue(null),
      }),
    });

    await expect(
      collect(new StreamChatWithAssistantUseCase(deps as never), { ...baseInput, message: 'hi' }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('throws FORBIDDEN when the conversation belongs to another user', async () => {
    const deps = makeDeps({
      conversationRepository: makeConversationRepository({
        findById: vi
          .fn()
          .mockResolvedValue(makeConversation({ id: 'conv-1', userId: 'someone-else' })),
      }),
    });

    await expect(
      collect(new StreamChatWithAssistantUseCase(deps as never), { ...baseInput, message: 'hi' }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('throws AI_NOT_CONFIGURED when no provider is available', async () => {
    const deps = makeDeps({
      llmProviderFactory: makeLLMProviderFactory({ forUser: vi.fn().mockResolvedValue(null) }),
    });

    await expect(
      collect(new StreamChatWithAssistantUseCase(deps as never), { ...baseInput, message: 'hi' }),
    ).rejects.toMatchObject({ code: 'AI_NOT_CONFIGURED' });
  });

  it('yields a delta per text chunk, then done, for a plain-text reply with no tool calls', async () => {
    const llmProvider = makeStreamingProvider({
      deltas: ['Hello', ' there!'],
      content: 'Hello there!',
      toolCalls: [],
    });
    const deps = makeDeps({
      llmProviderFactory: makeLLMProviderFactory({
        forUser: vi.fn().mockResolvedValue(llmProvider),
      }),
    });

    const events = await collect(new StreamChatWithAssistantUseCase(deps as never), {
      ...baseInput,
      message: 'hi',
    });

    expect(events).toEqual([
      { type: 'delta', text: 'Hello' },
      { type: 'delta', text: ' there!' },
      { type: 'done' },
    ]);
  });

  it('forwards the caller-supplied abort signal into the streaming LLM call', async () => {
    const llmProvider = makeStreamingProvider({ deltas: ['ok'], content: 'ok', toolCalls: [] });
    const deps = makeDeps({
      llmProviderFactory: makeLLMProviderFactory({
        forUser: vi.fn().mockResolvedValue(llmProvider),
      }),
    });
    const controller = new AbortController();

    await collect(new StreamChatWithAssistantUseCase(deps as never), {
      ...baseInput,
      message: 'hi',
      signal: controller.signal,
    });

    const [, , , signal] = vi.mocked(llmProvider.completeWithToolsStream).mock.calls[0];
    expect(signal).toBe(controller.signal);
  });

  it('persists the final reply and the user message once streaming finishes', async () => {
    const llmProvider = makeStreamingProvider({ deltas: ['ok'], content: 'ok', toolCalls: [] });
    const messageRepository = makeMessageRepository();
    const deps = makeDeps({
      llmProviderFactory: makeLLMProviderFactory({
        forUser: vi.fn().mockResolvedValue(llmProvider),
      }),
      messageRepository,
    });

    await collect(new StreamChatWithAssistantUseCase(deps as never), {
      ...baseInput,
      message: 'hi there',
    });

    expect(messageRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'user', content: 'hi there' }),
    );
    expect(messageRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'assistant', content: 'ok' }),
    );
  });

  it('runs a tool round-trip: dispatches the call, streams the follow-up reply, and only persists the final text', async () => {
    const llmProvider = makeStreamingProvider(
      {
        deltas: ['Let me check.'],
        content: 'Let me check.',
        toolCalls: [{ id: 'call_1', name: 'list_applications', arguments: {} }],
      },
      {
        deltas: ['You have 2 active applications.'],
        content: 'You have 2 active applications.',
        toolCalls: [],
      },
    );
    const messageRepository = makeMessageRepository();
    const deps = makeDeps({
      llmProviderFactory: makeLLMProviderFactory({
        forUser: vi.fn().mockResolvedValue(llmProvider),
      }),
      messageRepository,
    });

    const events = await collect(new StreamChatWithAssistantUseCase(deps as never), {
      ...baseInput,
      message: 'how many applications?',
    });

    expect(events).toEqual([
      { type: 'delta', text: 'Let me check.' },
      { type: 'delta', text: 'You have 2 active applications.' },
      { type: 'done' },
    ]);
    expect(llmProvider.completeWithToolsStream).toHaveBeenCalledTimes(2);
    expect(messageRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'assistant', content: 'You have 2 active applications.' }),
    );
  });

  it('gives up with a clear message after exceeding the max tool-call iterations', async () => {
    const alwaysCallsTool = {
      deltas: [],
      content: null,
      toolCalls: [{ id: 'call_x', name: 'list_applications', arguments: {} }],
    };
    const llmProvider = makeStreamingProvider(
      alwaysCallsTool,
      alwaysCallsTool,
      alwaysCallsTool,
      alwaysCallsTool,
      alwaysCallsTool,
    );
    const messageRepository = makeMessageRepository();
    const deps = makeDeps({
      llmProviderFactory: makeLLMProviderFactory({
        forUser: vi.fn().mockResolvedValue(llmProvider),
      }),
      messageRepository,
    });

    await collect(new StreamChatWithAssistantUseCase(deps as never), {
      ...baseInput,
      message: 'hi',
    });

    expect(messageRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'assistant',
        content: 'That took more steps than I could complete — try asking something more specific.',
      }),
    );
  });

  it('derives and stores a title from the first message in a new conversation', async () => {
    const llmProvider = makeStreamingProvider({ deltas: ['ok'], content: 'ok', toolCalls: [] });
    const conversationRepository = makeConversationRepository({
      findById: vi.fn().mockResolvedValue(makeConversation({ id: 'conv-1', userId: 'user-1' })),
    });
    const deps = makeDeps({
      llmProviderFactory: makeLLMProviderFactory({
        forUser: vi.fn().mockResolvedValue(llmProvider),
      }),
      conversationRepository,
      messageRepository: makeMessageRepository({
        findAllByConversationId: vi.fn().mockResolvedValue([]),
      }),
    });

    await collect(new StreamChatWithAssistantUseCase(deps as never), {
      ...baseInput,
      message: 'What jobs have I applied to?',
    });

    expect(conversationRepository.updateTitle).toHaveBeenCalledWith(
      'conv-1',
      'What jobs have I applied to?',
    );
  });
});
