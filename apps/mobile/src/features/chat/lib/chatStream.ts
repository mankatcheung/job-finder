import fetch from './expoFetch';
import { CHAT_STREAM_URL } from '../../../constants';
import { getAccessToken } from '../../../graphql/client';

export class ChatStreamError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'ChatStreamError';
  }
}

export interface StreamChatMessageParams {
  conversationId: string;
  message: string;
  /** Called once per incremental chunk of assistant text, in arrival order. */
  onDelta: (text: string) => void;
  /** The key this turn would have used was paused at its monthly limit and the user's opt-in fallback picked another. Arrives before any text. */
  onFallback?: (fallback: { from: string; to: string }) => void;
  signal?: AbortSignal;
}

interface SSEFrame {
  event: string;
  data: string;
}

function parseFrame(raw: string): SSEFrame | null {
  const eventLine = raw.split('\n').find((l) => l.startsWith('event:'));
  const dataLine = raw.split('\n').find((l) => l.startsWith('data:'));
  if (!eventLine || !dataLine) return null;
  return { event: eventLine.slice(6).trim(), data: dataLine.slice(5).trim() };
}

/**
 * Consumes the `/chat/stream` SSE endpoint, ported from apps/web's
 * lib/chatStream.ts. React Native's stock global `fetch` buffers the whole
 * response before resolving — it cannot expose `response.body` as an
 * incrementally-readable stream — so this uses `expo/fetch` (SDK 50+),
 * which is backed by native URL loading (NSURLSession/OkHttp) and does
 * support streaming reads. Bearer auth replaces web's `credentials:
 * 'include'`, since there's no cookie jar on the API's domain to send.
 */
export async function streamChatMessage({
  conversationId,
  message,
  onDelta,
  onFallback,
  signal,
}: StreamChatMessageParams): Promise<void> {
  const accessToken = getAccessToken();
  const response = await fetch(CHAT_STREAM_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ conversationId, message }),
    signal,
  });

  if (!response.ok || !response.body) {
    throw new Error(`Chat stream request failed with status ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return;

      buffer += decoder.decode(value, { stream: true });
      buffer = buffer.replace(/\r\n/g, '\n');

      let sepIndex: number;
      while ((sepIndex = buffer.indexOf('\n\n')) !== -1) {
        const raw = buffer.slice(0, sepIndex);
        buffer = buffer.slice(sepIndex + 2);
        const frame = parseFrame(raw);
        if (!frame) continue;

        if (frame.event === 'delta') {
          const { text } = JSON.parse(frame.data) as { text: string };
          onDelta(text);
        } else if (frame.event === 'fallback') {
          onFallback?.(JSON.parse(frame.data) as { from: string; to: string });
        } else if (frame.event === 'error') {
          const err = JSON.parse(frame.data) as { code: string; message: string };
          throw new ChatStreamError(err.message, err.code);
        } else if (frame.event === 'done') {
          return;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
