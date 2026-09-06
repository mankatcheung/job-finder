import { describe, it, expect } from 'vitest';
import { buildChatMessages, CHAT_SYSTEM_PROMPT } from '#src/use-cases/chat/chatAssembly.js';
import { makeMessage } from '#src/__tests__/helpers/mocks/chat.js';
import { makeUser } from '#src/__tests__/helpers/mocks/user.js';

describe('buildChatMessages cache breakpoints (T2)', () => {
  it('marks the last system block, so tools + system + custom prompt cache as one prefix', () => {
    const messages = buildChatMessages([], 'hi', makeUser({ customAiPrompt: 'be terse' }));

    expect(messages.slice(0, 2)).toEqual([
      { role: 'system', content: CHAT_SYSTEM_PROMPT },
      { role: 'system', content: 'be terse', cacheBreakpoint: true },
    ]);
  });

  it('marks the fixed prompt itself when there is no custom prompt', () => {
    const messages = buildChatMessages([], 'hi', makeUser({ customAiPrompt: null }));

    expect(messages[0]).toEqual({
      role: 'system',
      content: CHAT_SYSTEM_PROMPT,
      cacheBreakpoint: true,
    });
  });

  it('marks the last stored message and leaves the new one unmarked', () => {
    const history = [
      makeMessage({ role: 'user', content: 'q1' }),
      makeMessage({ role: 'assistant', content: 'a1' }),
    ];

    const messages = buildChatMessages(history, 'q2', null);

    expect(messages.slice(1)).toEqual([
      { role: 'user', content: 'q1' },
      { role: 'assistant', content: 'a1', cacheBreakpoint: true },
      { role: 'user', content: 'q2' },
    ]);
  });

  it("uses at most two markers, leaving room for the tool loop's moving one", () => {
    const history = Array.from({ length: 10 }, (_, i) =>
      makeMessage({ role: i % 2 ? 'assistant' : 'user', content: `m${i}` }),
    );
    const messages = buildChatMessages(history, 'q', makeUser({ customAiPrompt: 'x' }));

    expect(messages.filter((m) => m.cacheBreakpoint)).toHaveLength(2);
  });
});
