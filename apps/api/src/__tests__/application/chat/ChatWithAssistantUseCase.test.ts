import { describe, it, expect, vi } from 'vitest';
import { ChatWithAssistantUseCase } from '#src/use-cases/chat/ChatWithAssistantUseCase.js';
import {
  makeRateLimiter,
  makeLLMProviderFactory,
  makeMessageRepository,
  makeMessage,
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
    generateId: vi.fn().mockReturnValue('generated-id'),
    ...overrides,
  };
}

function makeToolCallingProvider(...results: LLMCompletionResult[]): ILLMProvider {
  const completeWithTools = vi.fn();
  for (const result of results) completeWithTools.mockResolvedValueOnce(result);
  return { complete: vi.fn(), completeWithTools };
}

describe('ChatWithAssistantUseCase', () => {
  it('throws RATE_LIMITED when the rate limiter rejects the request', async () => {
    const deps = makeDeps({
      chatRateLimiter: makeRateLimiter({ consume: vi.fn().mockReturnValue(false) }),
    });

    const err = await new ChatWithAssistantUseCase(deps as never)
      .execute({ userId: 'user-1', message: 'hi' })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('RATE_LIMITED');
  });

  it('throws AI_NOT_CONFIGURED when the user has no LLM API key set up', async () => {
    const deps = makeDeps({
      llmProviderFactory: makeLLMProviderFactory({ forUser: vi.fn().mockResolvedValue(null) }),
    });

    const err = await new ChatWithAssistantUseCase(deps as never)
      .execute({ userId: 'user-1', message: 'hi' })
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
      userId: 'user-1',
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
      userId: 'user-1',
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
        findAllByUserId: vi
          .fn()
          .mockResolvedValue([
            makeMessage({ id: 'm1', role: 'user', content: 'earlier question' }),
            makeMessage({ id: 'm2', role: 'assistant', content: 'earlier answer' }),
          ]),
      }),
    });

    await new ChatWithAssistantUseCase(deps as never).execute({
      userId: 'user-1',
      message: 'new question',
    });

    const [messages] = vi.mocked(llmProvider.completeWithTools).mock.calls[0];
    expect(messages[0].role).toBe('system');
    expect(messages[1]).toEqual({ role: 'user', content: 'earlier question' });
    expect(messages[2]).toEqual({ role: 'assistant', content: 'earlier answer' });
    expect(messages[3]).toEqual({ role: 'user', content: 'new question' });
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
      userId: 'user-1',
      message: 'hi',
    });

    expect(messageRepository.create).toHaveBeenNthCalledWith(1, {
      id: 'user-msg-id',
      userId: 'user-1',
      role: 'user',
      content: 'hi',
    });
    expect(messageRepository.create).toHaveBeenNthCalledWith(2, {
      id: 'ai-msg-id',
      userId: 'user-1',
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
      .execute({ userId: 'user-1', message: 'hi' })
      .catch(() => {});

    expect(messageRepository.create).not.toHaveBeenCalled();
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
      userId: 'user-1',
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
        userId: 'user-1',
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
      userId: 'user-1',
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
      userId: 'user-1',
      message: 'tell me about app missing',
    });

    expect(result).toBe("I couldn't find that application.");
    const [secondCallMessages] = vi.mocked(llmProvider.completeWithTools).mock.calls[1];
    const toolResultMessage = secondCallMessages.find((m) => m.role === 'tool');
    expect(JSON.parse(toolResultMessage!.content)).toEqual({ error: 'Application not found' });
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
      userId: 'user-1',
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
      userId: 'user-1',
      message: 'loop forever',
    });

    expect(result).toBe(
      'That took more steps than I could complete — try asking something more specific.',
    );
    expect(completeWithTools).toHaveBeenCalledTimes(5);
  });
});
