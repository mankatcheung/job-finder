// The mock fn is created fresh inside the factory (not referenced from an
// outer `const`) — ES module imports are hoisted above regular statements,
// so a factory that instead closed over an outer variable would run before
// that variable was assigned. `mockFetch` below is captured via the import
// itself, which by then correctly points at the mocked default export.
jest.mock('../expoFetch', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../../../../graphql/client', () => ({ getAccessToken: jest.fn(() => 'token-123') }));

import { ChatStreamError, streamChatMessage } from '../chatStream';
import expoFetch from '../expoFetch';

// Cast away expo/fetch's real (large, internal) FetchResponse type — these
// tests only need the ok/status/body.getReader() shape streamChatMessage
// actually reads.
const mockFetch = jest.mocked(expoFetch) as unknown as jest.Mock;

function encodedStreamResponse(frames: string[]) {
  const encoder = new TextEncoder();
  let index = 0;
  return {
    ok: true,
    status: 200,
    body: {
      getReader: () => ({
        read: async () => {
          if (index >= frames.length) return { done: true, value: undefined };
          const value = encoder.encode(frames[index]);
          index += 1;
          return { done: false, value };
        },
        releaseLock: jest.fn(),
      }),
    },
  };
}

describe('streamChatMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('attaches a bearer header and delivers delta chunks in order', async () => {
    mockFetch.mockResolvedValueOnce(
      encodedStreamResponse([
        'event: delta\ndata: {"text":"Hel"}\n\n',
        'event: delta\ndata: {"text":"lo"}\n\n',
        'event: done\ndata: {}\n\n',
      ]),
    );

    const deltas: string[] = [];
    await streamChatMessage({
      conversationId: 'conv-1',
      message: 'hi',
      onDelta: (text) => deltas.push(text),
    });

    expect(deltas.join('')).toBe('Hello');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ authorization: 'Bearer token-123' }),
        body: JSON.stringify({ conversationId: 'conv-1', message: 'hi' }),
      }),
    );
  });

  it('calls onFallback when the server reports a fallback frame', async () => {
    mockFetch.mockResolvedValueOnce(
      encodedStreamResponse([
        'event: fallback\ndata: {"from":"openai","to":"anthropic"}\n\n',
        'event: delta\ndata: {"text":"hi"}\n\n',
        'event: done\ndata: {}\n\n',
      ]),
    );

    const onFallback = jest.fn();
    await streamChatMessage({
      conversationId: 'conv-1',
      message: 'hi',
      onDelta: () => {},
      onFallback,
    });

    expect(onFallback).toHaveBeenCalledWith({ from: 'openai', to: 'anthropic' });
  });

  it('rejects with a ChatStreamError carrying the server error code', async () => {
    mockFetch.mockResolvedValueOnce(
      encodedStreamResponse([
        'event: error\ndata: {"code":"AI_NOT_CONFIGURED","message":"No key configured"}\n\n',
      ]),
    );

    await expect(
      streamChatMessage({ conversationId: 'conv-1', message: 'hi', onDelta: () => {} }),
    ).rejects.toThrow(ChatStreamError);
  });

  it('throws a plain error on a non-2xx response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500, body: null });

    await expect(
      streamChatMessage({ conversationId: 'conv-1', message: 'hi', onDelta: () => {} }),
    ).rejects.toThrow('status 500');
  });
});
