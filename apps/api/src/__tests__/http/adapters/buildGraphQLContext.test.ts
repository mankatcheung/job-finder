import { EventEmitter } from 'node:events';
import { describe, it, expect } from 'vitest';
import type { FastifyReply } from 'fastify';
import { abortSignalFor } from '#src/http/adapters/fastify/buildGraphQLContext.js';

function fakeReply(writableEnded: boolean): { reply: FastifyReply; raw: EventEmitter } {
  const raw = new EventEmitter() as EventEmitter & { writableEnded: boolean };
  raw.writableEnded = writableEnded;
  return { reply: { raw } as unknown as FastifyReply, raw };
}

describe('abortSignalFor', () => {
  it('aborts when the connection closes before the response finished writing (client disconnected)', () => {
    const { reply, raw } = fakeReply(false);
    const signal = abortSignalFor(reply);

    expect(signal.aborted).toBe(false);
    raw.emit('close');

    expect(signal.aborted).toBe(true);
  });

  it('does not abort when the connection closes after the response already finished normally', () => {
    const { reply, raw } = fakeReply(true);
    const signal = abortSignalFor(reply);

    raw.emit('close');

    expect(signal.aborted).toBe(false);
  });
});
