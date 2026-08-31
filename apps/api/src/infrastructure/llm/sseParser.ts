export interface SSEFrame {
  /** The `event:` line, if present — Anthropic sets this; OpenAI never does. */
  event: string | null;
  /** The `data:` line(s), joined by `\n` per the SSE spec (rare for these APIs, which send one `data:` line per frame). */
  data: string;
}

/**
 * Splits a fetch response body into complete SSE frames (JEF-239). A
 * `ReadableStream` `read()` call has no relationship to SSE event
 * boundaries — a single read can yield a partial line, several full events,
 * or an event split mid-line across two reads — so this buffers decoded
 * text and only yields once a full frame (terminated by a blank line) has
 * arrived, holding back any trailing partial frame for the next read.
 *
 * `onChunk`, if given, fires after every non-final `read()` — the provider
 * callers wire this to an idle-abort controller's `activity()` (JEF-239
 * follow-up) so a still-flowing stream resets its idle timeout instead of
 * being cut off by it.
 */
export async function* parseSSE(
  body: ReadableStream<Uint8Array>,
  onChunk?: () => void,
): AsyncGenerator<SSEFrame> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      onChunk?.();

      buffer += decoder.decode(value, { stream: true });
      // Normalizing over the whole buffer is safe to repeat: earlier text
      // already has no `\r\n` left to replace, so this only ever affects
      // the newly-appended tail (including a `\r` that arrived without its
      // `\n` yet, which simply gets picked up on the next iteration).
      buffer = buffer.replace(/\r\n/g, '\n');

      let sepIndex: number;
      while ((sepIndex = buffer.indexOf('\n\n')) !== -1) {
        const rawFrame = buffer.slice(0, sepIndex);
        buffer = buffer.slice(sepIndex + 2);
        const frame = parseFrame(rawFrame);
        if (frame) yield frame;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

function parseFrame(raw: string): SSEFrame | null {
  let event: string | null = null;
  const dataLines: string[] = [];

  for (const line of raw.split('\n')) {
    if (line.startsWith('event:')) event = line.slice(6).trim();
    else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
  }

  if (dataLines.length === 0) return null;
  return { event, data: dataLines.join('\n') };
}
