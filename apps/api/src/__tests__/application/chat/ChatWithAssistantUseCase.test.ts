import { describe, it, expect, vi } from 'vitest';
import { ChatWithAssistantUseCase } from '#src/use-cases/chat/ChatWithAssistantUseCase.js';
import {
  makeRateLimiter,
  makeLLMProviderFactory,
  makeMessageRepository,
  makeMessage,
  makeConversationRepository,
  makeConversation,
  makeUserRepository,
  makeUser,
} from '#src/__tests__/helpers/mocks.js';
import type { ILLMProvider, LLMCompletionResult } from '#src/use-cases/ports/ILLMProvider.js';

function stubUseCase(result: unknown = []) {
  return { execute: vi.fn().mockResolvedValue(result) };
}

function makeDeps(overrides?: Record<string, unknown>) {
  return {
    llmProviderFactory: makeLLMProviderFactory(),
    getApplicationsUseCase: stubUseCase([]),
    getApplicationUseCase: stubUseCase({ id: 'app-1' }),
    getNotesUseCase: stubUseCase([]),
    getContactsUseCase: stubUseCase([]),
    getInterviewRoundsUseCase: stubUseCase([]),
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

function makeToolCallingProvider(...results: LLMCompletionResult[]): ILLMProvider {
  const completeWithTools = vi.fn();
  for (const result of results) completeWithTools.mockResolvedValueOnce(result);
  return { complete: vi.fn(), completeWithTools };
}

const baseInput = { userId: 'user-1', conversationId: 'conv-1' };

describe('ChatWithAssistantUseCase', () => {
  it('throws RATE_LIMITED when the rate limiter rejects the request', async () => {
    const deps = makeDeps({
      chatRateLimiter: makeRateLimiter({ consume: vi.fn().mockReturnValue(false) }),
    });

    const err = await new ChatWithAssistantUseCase(deps as never)
      .execute({ ...baseInput, message: 'hi' })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('RATE_LIMITED');
  });

  it('throws NOT_FOUND when the conversation does not exist', async () => {
    const deps = makeDeps({
      conversationRepository: makeConversationRepository({
        findById: vi.fn().mockResolvedValue(null),
      }),
    });

    const err = await new ChatWithAssistantUseCase(deps as never)
      .execute({ ...baseInput, message: 'hi' })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('NOT_FOUND');
  });

  it('throws FORBIDDEN when the conversation belongs to another user', async () => {
    const deps = makeDeps({
      conversationRepository: makeConversationRepository({
        findById: vi
          .fn()
          .mockResolvedValue(makeConversation({ id: 'conv-1', userId: 'someone-else' })),
      }),
    });

    const err = await new ChatWithAssistantUseCase(deps as never)
      .execute({ ...baseInput, message: 'hi' })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('FORBIDDEN');
  });

  it('throws AI_NOT_CONFIGURED when the user has no LLM API key set up', async () => {
    const deps = makeDeps({
      llmProviderFactory: makeLLMProviderFactory({ forUser: vi.fn().mockResolvedValue(null) }),
    });

    const err = await new ChatWithAssistantUseCase(deps as never)
      .execute({ ...baseInput, message: 'hi' })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('AI_NOT_CONFIGURED');
  });

  it('returns the content directly when the LLM makes no tool calls', async () => {
    const llmProvider = makeToolCallingProvider({ content: 'Hello there!', toolCalls: [] });
    const deps = makeDeps({
      llmProviderFactory: makeLLMProviderFactory({
        forUser: vi.fn().mockResolvedValue(llmProvider),
      }),
    });

    const result = await new ChatWithAssistantUseCase(deps as never).execute({
      ...baseInput,
      message: 'hi',
    });

    expect(result).toBe('Hello there!');
  });

  it('falls back to a generic message when content is blank and there are no tool calls', async () => {
    const llmProvider = makeToolCallingProvider({ content: '   ', toolCalls: [] });
    const deps = makeDeps({
      llmProviderFactory: makeLLMProviderFactory({
        forUser: vi.fn().mockResolvedValue(llmProvider),
      }),
    });

    const result = await new ChatWithAssistantUseCase(deps as never).execute({
      ...baseInput,
      message: 'hi',
    });

    expect(result).toBe("I don't have a response for that.");
  });

  it('includes the system prompt, stored history, and the new message in the first LLM call', async () => {
    const llmProvider = makeToolCallingProvider({ content: 'ok', toolCalls: [] });
    const deps = makeDeps({
      llmProviderFactory: makeLLMProviderFactory({
        forUser: vi.fn().mockResolvedValue(llmProvider),
      }),
      messageRepository: makeMessageRepository({
        findAllByConversationId: vi
          .fn()
          .mockResolvedValue([
            makeMessage({ id: 'm1', role: 'user', content: 'earlier question' }),
            makeMessage({ id: 'm2', role: 'assistant', content: 'earlier answer' }),
          ]),
      }),
    });

    await new ChatWithAssistantUseCase(deps as never).execute({
      ...baseInput,
      message: 'new question',
    });

    const [messages] = vi.mocked(llmProvider.completeWithTools).mock.calls[0];
    expect(messages[0].role).toBe('system');
    expect(messages[1]).toEqual({ role: 'user', content: 'earlier question' });
    expect(messages[2]).toEqual({ role: 'assistant', content: 'earlier answer' });
    expect(messages[3]).toEqual({ role: 'user', content: 'new question' });
  });

  it('marks the system prompt and the last tool definition as a cache breakpoint', async () => {
    const llmProvider = makeToolCallingProvider({ content: 'ok', toolCalls: [] });
    const deps = makeDeps({
      llmProviderFactory: makeLLMProviderFactory({
        forUser: vi.fn().mockResolvedValue(llmProvider),
      }),
    });

    await new ChatWithAssistantUseCase(deps as never).execute({ ...baseInput, message: 'hi' });

    const [messages, tools] = vi.mocked(llmProvider.completeWithTools).mock.calls[0];
    expect(messages[0]).toMatchObject({ role: 'system', cacheBreakpoint: true });
    expect(tools.slice(0, -1).every((t) => !t.cacheBreakpoint)).toBe(true);
    expect(tools[tools.length - 1]).toMatchObject({ cacheBreakpoint: true });
  });

  it("splices the user's custom AI prompt in as a second system message when set", async () => {
    const llmProvider = makeToolCallingProvider({ content: 'ok', toolCalls: [] });
    const deps = makeDeps({
      llmProviderFactory: makeLLMProviderFactory({
        forUser: vi.fn().mockResolvedValue(llmProvider),
      }),
      userRepository: makeUserRepository({
        findById: vi
          .fn()
          .mockResolvedValue(makeUser({ customAiPrompt: 'Always sign off with "Best, Jeff".' })),
      }),
    });

    await new ChatWithAssistantUseCase(deps as never).execute({
      ...baseInput,
      message: 'hi',
    });

    const [messages] = vi.mocked(llmProvider.completeWithTools).mock.calls[0];
    expect(messages[0].role).toBe('system');
    expect(messages[1]).toEqual({
      role: 'system',
      content: 'Always sign off with "Best, Jeff".',
    });
    expect(messages[2]).toEqual({ role: 'user', content: 'hi' });
  });

  it('omits the custom AI prompt system message when the user has none set', async () => {
    const llmProvider = makeToolCallingProvider({ content: 'ok', toolCalls: [] });
    const deps = makeDeps({
      llmProviderFactory: makeLLMProviderFactory({
        forUser: vi.fn().mockResolvedValue(llmProvider),
      }),
    });

    await new ChatWithAssistantUseCase(deps as never).execute({
      ...baseInput,
      message: 'hi',
    });

    const [messages] = vi.mocked(llmProvider.completeWithTools).mock.calls[0];
    expect(messages.filter((m) => m.role === 'system')).toHaveLength(1);
  });

  it("persists the user's message and the assistant's reply after a successful response", async () => {
    const llmProvider = makeToolCallingProvider({ content: 'Hello there!', toolCalls: [] });
    const messageRepository = makeMessageRepository();
    const generateId = vi.fn().mockReturnValueOnce('user-msg-id').mockReturnValueOnce('ai-msg-id');
    const deps = makeDeps({
      llmProviderFactory: makeLLMProviderFactory({
        forUser: vi.fn().mockResolvedValue(llmProvider),
      }),
      messageRepository,
      generateId,
    });

    await new ChatWithAssistantUseCase(deps as never).execute({
      ...baseInput,
      message: 'hi',
    });

    expect(messageRepository.create).toHaveBeenNthCalledWith(1, {
      id: 'user-msg-id',
      conversationId: 'conv-1',
      role: 'user',
      content: 'hi',
    });
    expect(messageRepository.create).toHaveBeenNthCalledWith(2, {
      id: 'ai-msg-id',
      conversationId: 'conv-1',
      role: 'assistant',
      content: 'Hello there!',
    });
  });

  it('does not persist anything when rate-limited', async () => {
    const messageRepository = makeMessageRepository();
    const deps = makeDeps({
      chatRateLimiter: makeRateLimiter({ consume: vi.fn().mockReturnValue(false) }),
      messageRepository,
    });

    await new ChatWithAssistantUseCase(deps as never)
      .execute({ ...baseInput, message: 'hi' })
      .catch(() => {});

    expect(messageRepository.create).not.toHaveBeenCalled();
  });

  it('derives and persists a conversation title from the first message when history is empty', async () => {
    const llmProvider = makeToolCallingProvider({ content: 'ok', toolCalls: [] });
    const conversationRepository = makeConversationRepository({
      findById: vi.fn().mockResolvedValue(makeConversation({ id: 'conv-1', userId: 'user-1' })),
    });
    const deps = makeDeps({
      llmProviderFactory: makeLLMProviderFactory({
        forUser: vi.fn().mockResolvedValue(llmProvider),
      }),
      conversationRepository,
    });

    await new ChatWithAssistantUseCase(deps as never).execute({
      ...baseInput,
      message: 'Which applications have I applied to?',
    });

    expect(conversationRepository.updateTitle).toHaveBeenCalledWith(
      'conv-1',
      'Which applications have I applied to?',
    );
  });

  it('truncates a long first message when deriving the conversation title', async () => {
    const llmProvider = makeToolCallingProvider({ content: 'ok', toolCalls: [] });
    const conversationRepository = makeConversationRepository({
      findById: vi.fn().mockResolvedValue(makeConversation({ id: 'conv-1', userId: 'user-1' })),
    });
    const deps = makeDeps({
      llmProviderFactory: makeLLMProviderFactory({
        forUser: vi.fn().mockResolvedValue(llmProvider),
      }),
      conversationRepository,
    });
    const longMessage = 'a'.repeat(80);

    await new ChatWithAssistantUseCase(deps as never).execute({
      ...baseInput,
      message: longMessage,
    });

    const [, title] = vi.mocked(conversationRepository.updateTitle).mock.calls[0];
    expect(title.length).toBe(51); // 50 chars + ellipsis
    expect(title.endsWith('…')).toBe(true);
  });

  it('does not update the title when the conversation already has history', async () => {
    const llmProvider = makeToolCallingProvider({ content: 'ok', toolCalls: [] });
    const conversationRepository = makeConversationRepository({
      findById: vi.fn().mockResolvedValue(makeConversation({ id: 'conv-1', userId: 'user-1' })),
    });
    const deps = makeDeps({
      llmProviderFactory: makeLLMProviderFactory({
        forUser: vi.fn().mockResolvedValue(llmProvider),
      }),
      conversationRepository,
      messageRepository: makeMessageRepository({
        findAllByConversationId: vi
          .fn()
          .mockResolvedValue([makeMessage({ id: 'm1', role: 'user', content: 'earlier' })]),
      }),
    });

    await new ChatWithAssistantUseCase(deps as never).execute({
      ...baseInput,
      message: 'follow-up question',
    });

    expect(conversationRepository.updateTitle).not.toHaveBeenCalled();
  });

  it('dispatches a list_applications tool call and feeds the result back to the LLM', async () => {
    const applications = [{ id: 'app-1', company: 'Acme' }];
    const llmProvider = makeToolCallingProvider(
      {
        content: null,
        toolCalls: [{ id: 'call_1', name: 'list_applications', arguments: { status: 'applied' } }],
      },
      { content: 'You have 1 application at Acme.', toolCalls: [] },
    );
    const getApplicationsUseCase = stubUseCase(applications);
    const deps = makeDeps({
      llmProviderFactory: makeLLMProviderFactory({
        forUser: vi.fn().mockResolvedValue(llmProvider),
      }),
      getApplicationsUseCase,
    });

    const result = await new ChatWithAssistantUseCase(deps as never).execute({
      ...baseInput,
      message: 'which applications have I applied to?',
    });

    expect(result).toBe('You have 1 application at Acme.');
    expect(getApplicationsUseCase.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      status: 'applied',
    });

    const [secondCallMessages] = vi.mocked(llmProvider.completeWithTools).mock.calls[1];
    const toolResultMessage = secondCallMessages.find((m) => m.role === 'tool');
    expect(toolResultMessage).toEqual({
      role: 'tool',
      content: JSON.stringify(applications),
      toolCallId: 'call_1',
    });
  });

  it.each([
    ['get_application', 'getApplicationUseCase', { applicationId: 'app-1' }],
    ['list_notes', 'getNotesUseCase', { applicationId: 'app-1' }],
    ['list_contacts', 'getContactsUseCase', { applicationId: 'app-1' }],
    ['list_interview_rounds', 'getInterviewRoundsUseCase', { applicationId: 'app-1' }],
  ] as const)(
    'dispatches %s to %s with the userId and applicationId',
    async (toolName, depKey, args) => {
      const llmProvider = makeToolCallingProvider(
        { content: null, toolCalls: [{ id: 'call_1', name: toolName, arguments: args }] },
        { content: 'done', toolCalls: [] },
      );
      const targetUseCase = stubUseCase({ ok: true });
      const deps = makeDeps({
        llmProviderFactory: makeLLMProviderFactory({
          forUser: vi.fn().mockResolvedValue(llmProvider),
        }),
        [depKey]: targetUseCase,
      });

      await new ChatWithAssistantUseCase(deps as never).execute({
        ...baseInput,
        message: 'question',
      });

      expect(targetUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-1',
        applicationId: 'app-1',
      });
    },
  );

  it('returns an error tool result for an unknown tool name instead of throwing', async () => {
    const llmProvider = makeToolCallingProvider(
      { content: null, toolCalls: [{ id: 'call_1', name: 'delete_everything', arguments: {} }] },
      { content: "I can't do that.", toolCalls: [] },
    );
    const deps = makeDeps({
      llmProviderFactory: makeLLMProviderFactory({
        forUser: vi.fn().mockResolvedValue(llmProvider),
      }),
    });

    const result = await new ChatWithAssistantUseCase(deps as never).execute({
      ...baseInput,
      message: 'question',
    });

    expect(result).toBe("I can't do that.");
    const [secondCallMessages] = vi.mocked(llmProvider.completeWithTools).mock.calls[1];
    const toolResultMessage = secondCallMessages.find((m) => m.role === 'tool');
    expect(JSON.parse(toolResultMessage!.content)).toEqual({
      error: 'Unknown tool: delete_everything',
    });
  });

  it('catches a tool-execution error and feeds it back as a tool result instead of throwing', async () => {
    const llmProvider = makeToolCallingProvider(
      {
        content: null,
        toolCalls: [
          { id: 'call_1', name: 'get_application', arguments: { applicationId: 'missing' } },
        ],
      },
      { content: "I couldn't find that application.", toolCalls: [] },
    );
    const getApplicationUseCase = {
      execute: vi
        .fn()
        .mockRejectedValue(
          Object.assign(new Error('Application not found'), { code: 'NOT_FOUND' }),
        ),
    };
    const deps = makeDeps({
      llmProviderFactory: makeLLMProviderFactory({
        forUser: vi.fn().mockResolvedValue(llmProvider),
      }),
      getApplicationUseCase,
    });

    const result = await new ChatWithAssistantUseCase(deps as never).execute({
      ...baseInput,
      message: 'tell me about app missing',
    });

    expect(result).toBe("I couldn't find that application.");
    const [secondCallMessages] = vi.mocked(llmProvider.completeWithTools).mock.calls[1];
    const toolResultMessage = secondCallMessages.find((m) => m.role === 'tool');
    expect(JSON.parse(toolResultMessage!.content)).toEqual({ error: 'Application not found' });
  });

  it('dispatches multiple tool calls from the same turn concurrently and matches results to the right call id', async () => {
    const applications = [{ id: 'app-1', company: 'Acme' }];
    const application = { id: 'app-1', company: 'Acme', role: 'Engineer' };
    const llmProvider = makeToolCallingProvider(
      {
        content: null,
        toolCalls: [
          { id: 'call_1', name: 'list_applications', arguments: {} },
          { id: 'call_2', name: 'get_application', arguments: { applicationId: 'app-1' } },
        ],
      },
      { content: 'Summary.', toolCalls: [] },
    );
    // Resolve the second tool call before the first to prove the results are
    // matched back up by call id/order, not by completion order.
    const getApplicationsUseCase = {
      execute: vi.fn(() => new Promise((resolve) => setTimeout(() => resolve(applications), 10))),
    };
    const getApplicationUseCase = { execute: vi.fn().mockResolvedValue(application) };
    const deps = makeDeps({
      llmProviderFactory: makeLLMProviderFactory({
        forUser: vi.fn().mockResolvedValue(llmProvider),
      }),
      getApplicationsUseCase,
      getApplicationUseCase,
    });

    const result = await new ChatWithAssistantUseCase(deps as never).execute({
      ...baseInput,
      message: 'summarize my applications',
    });

    expect(result).toBe('Summary.');
    expect(getApplicationsUseCase.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      status: undefined,
    });
    expect(getApplicationUseCase.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      applicationId: 'app-1',
    });

    const [secondCallMessages] = vi.mocked(llmProvider.completeWithTools).mock.calls[1];
    const toolResultMessages = secondCallMessages.filter((m) => m.role === 'tool');
    expect(toolResultMessages).toEqual([
      { role: 'tool', content: JSON.stringify(applications), toolCallId: 'call_1' },
      { role: 'tool', content: JSON.stringify(application), toolCallId: 'call_2' },
    ]);
  });

  it('supports multiple tool-call round trips before a final answer', async () => {
    const llmProvider = makeToolCallingProvider(
      { content: null, toolCalls: [{ id: 'call_1', name: 'list_applications', arguments: {} }] },
      {
        content: null,
        toolCalls: [{ id: 'call_2', name: 'list_notes', arguments: { applicationId: 'app-1' } }],
      },
      { content: 'Here is a summary.', toolCalls: [] },
    );
    const deps = makeDeps({
      llmProviderFactory: makeLLMProviderFactory({
        forUser: vi.fn().mockResolvedValue(llmProvider),
      }),
      getApplicationsUseCase: stubUseCase([{ id: 'app-1' }]),
    });

    const result = await new ChatWithAssistantUseCase(deps as never).execute({
      ...baseInput,
      message: 'summarize my notes',
    });

    expect(result).toBe('Here is a summary.');
    expect(llmProvider.completeWithTools).toHaveBeenCalledTimes(3);
  });

  it('gives up with a clear message after exceeding the max tool-call iterations', async () => {
    const alwaysCallsTool: LLMCompletionResult = {
      content: null,
      toolCalls: [{ id: 'call_x', name: 'list_applications', arguments: {} }],
    };
    const completeWithTools = vi.fn().mockResolvedValue(alwaysCallsTool);
    const llmProvider: ILLMProvider = { complete: vi.fn(), completeWithTools };
    const deps = makeDeps({
      llmProviderFactory: makeLLMProviderFactory({
        forUser: vi.fn().mockResolvedValue(llmProvider),
      }),
    });

    const result = await new ChatWithAssistantUseCase(deps as never).execute({
      ...baseInput,
      message: 'loop forever',
    });

    expect(result).toBe(
      'That took more steps than I could complete — try asking something more specific.',
    );
    expect(completeWithTools).toHaveBeenCalledTimes(5);
  });

  it('uses the conversation-locked provider/model without consulting the user default', async () => {
    const llmProvider = makeToolCallingProvider({ content: 'ok', toolCalls: [] });
    const llmProviderFactory = makeLLMProviderFactory({
      forUser: vi.fn().mockResolvedValue(llmProvider),
    });
    const userRepository = makeUserRepository({
      findById: vi.fn().mockResolvedValue(makeUser({ defaultLlmProvider: 'openai' })),
    });
    const conversationRepository = makeConversationRepository({
      findById: vi.fn().mockResolvedValue(
        makeConversation({
          id: 'conv-1',
          userId: 'user-1',
          llmProvider: 'anthropic',
          llmModel: 'claude',
        }),
      ),
    });
    const deps = makeDeps({ llmProviderFactory, userRepository, conversationRepository });

    await new ChatWithAssistantUseCase(deps as never).execute({ ...baseInput, message: 'hi' });

    // The user is still fetched (needed for customAiPrompt), but the conversation's
    // locked provider wins over the user's defaultLlmProvider ('openai').
    expect(llmProviderFactory.forUser).toHaveBeenCalledWith('user-1', 'anthropic', 'claude');
    expect(conversationRepository.updateLlmSettings).not.toHaveBeenCalled();
  });

  it("falls back to and locks in the user's default provider on the first message", async () => {
    const llmProvider = makeToolCallingProvider({ content: 'ok', toolCalls: [] });
    const llmProviderFactory = makeLLMProviderFactory({
      forUser: vi.fn().mockResolvedValue(llmProvider),
    });
    const userRepository = makeUserRepository({
      findById: vi.fn().mockResolvedValue(makeUser({ defaultLlmProvider: 'openai' })),
    });
    const conversationRepository = makeConversationRepository({
      findById: vi
        .fn()
        .mockResolvedValue(
          makeConversation({ id: 'conv-1', userId: 'user-1', llmProvider: null, llmModel: null }),
        ),
    });
    const deps = makeDeps({ llmProviderFactory, userRepository, conversationRepository });

    await new ChatWithAssistantUseCase(deps as never).execute({ ...baseInput, message: 'hi' });

    expect(llmProviderFactory.forUser).toHaveBeenCalledWith('user-1', 'openai', null);
    expect(conversationRepository.updateLlmSettings).toHaveBeenCalledWith('conv-1', 'openai', null);
  });

  it('does not lock anything when neither the conversation nor the user has a provider', async () => {
    const deps = makeDeps({
      llmProviderFactory: makeLLMProviderFactory({ forUser: vi.fn().mockResolvedValue(null) }),
    });

    const err = await new ChatWithAssistantUseCase(deps as never)
      .execute({ ...baseInput, message: 'hi' })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('AI_NOT_CONFIGURED');
    expect(deps.conversationRepository.updateLlmSettings).not.toHaveBeenCalled();
  });
});
