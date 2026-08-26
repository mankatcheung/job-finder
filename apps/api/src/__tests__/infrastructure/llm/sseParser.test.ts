import { describe, it, expect } from 'vitest';
import { parseSSE } from '#src/infrastructure/llm/sseParser.js';

function streamOf(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let i = 0;
  return new ReadableStream({
    pull(controller) {
      if (i >= chunks.length) {
        controller.close();
        return;
      }
      controller.enqueue(encoder.encode(chunks[i]));
      i++;
    },
  });
}

async function collect(stream: ReadableStream<Uint8Array>) {
  const frames = [];
  for await (const frame of parseSSE(stream)) frames.push(frame);
  return frames;
}

describe('parseSSE', () => {
  it('parses a frame with both an event and a data line (Anthropic shape)', async () => {
    const frames = await collect(streamOf(['event: message_start\ndata: {"type":"a"}\n\n']));

    expect(frames).toEqual([{ event: 'message_start', data: '{"type":"a"}' }]);
  });

  it('parses a data-only frame with no event line (OpenAI shape)', async () => {
    const frames = await collect(streamOf(['data: {"choices":[]}\n\n']));

    expect(frames).toEqual([{ event: null, data: '{"choices":[]}' }]);
  });

  it('parses multiple frames delivered in a single chunk', async () => {
    const frames = await collect(streamOf(['data: one\n\ndata: two\n\ndata: three\n\n']));

    expect(frames.map((f) => f.data)).toEqual(['one', 'two', 'three']);
  });

  it('reassembles a frame split mid-line across two reads', async () => {
    const frames = await collect(streamOf(['data: {"tex', 't":"hi"}\n\n']));

    expect(frames).toEqual([{ event: null, data: '{"text":"hi"}' }]);
  });

  it('reassembles a frame whose blank-line separator is split across two reads', async () => {
    const frames = await collect(streamOf(['data: hello\n', '\ndata: world\n\n']));

    expect(frames.map((f) => f.data)).toEqual(['hello', 'world']);
  });

  it('normalizes CRLF line endings', async () => {
    const frames = await collect(streamOf(['event: ping\r\ndata: {}\r\n\r\n']));

    expect(frames).toEqual([{ event: 'ping', data: '{}' }]);
  });

  it('drops a trailing partial frame that never receives its terminating blank line', async () => {
    const frames = await collect(streamOf(['data: complete\n\ndata: incomplete']));

    expect(frames.map((f) => f.data)).toEqual(['complete']);
  });

  it('skips a frame with no data line at all', async () => {
    const frames = await collect(streamOf(['event: ping\n\ndata: real\n\n']));

    expect(frames).toEqual([{ event: null, data: 'real' }]);
  });
});
