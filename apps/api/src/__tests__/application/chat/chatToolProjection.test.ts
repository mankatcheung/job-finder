import { describe, it, expect } from 'vitest';
import {
  clipForModel,
  compactForModel,
  formatDateForModel,
} from '#src/use-cases/chat/chatToolProjection.js';
import { CHAT } from '#src/use-cases/constants.js';

describe('compactForModel (T7)', () => {
  it('drops null and undefined fields, recursively', () => {
    expect(
      compactForModel({
        id: 'a',
        salaryRange: null,
        nested: { keep: 1, gone: undefined, deeper: { x: null } },
      }),
    ).toEqual({ id: 'a', nested: { keep: 1, deeper: {} } });
  });

  it('shortens dates: day precision at midnight, minute precision otherwise', () => {
    expect(compactForModel({ appliedAt: new Date('2026-09-06T00:00:00.000Z') })).toEqual({
      appliedAt: '2026-09-06',
    });
    expect(compactForModel({ scheduledAt: new Date('2026-09-06T14:30:15.123Z') })).toEqual({
      scheduledAt: '2026-09-06T14:30Z',
    });
  });

  it('clips long strings at the configured bound with an ellipsis', () => {
    const long = 'x'.repeat(CHAT.TOOL_RESULT_STRING_MAX_CHARS + 500);
    const out = compactForModel({ description: long }) as { description: string };
    expect(out.description.length).toBe(CHAT.TOOL_RESULT_STRING_MAX_CHARS + 1);
    expect(out.description.endsWith('…')).toBe(true);
  });

  it('walks arrays, keeping positions (a null element becomes JSON null, not a hole)', () => {
    expect(compactForModel([{ a: null, b: 1 }, null, 'x'])).toEqual([{ b: 1 }, null, 'x']);
  });

  it('passes primitives through untouched', () => {
    expect(compactForModel(42)).toBe(42);
    expect(compactForModel(true)).toBe(true);
    expect(compactForModel('short')).toBe('short');
  });

  it('is a no-op on a typical page result apart from the nulls and dates', () => {
    const page = {
      items: [
        {
          id: 'app-1',
          company: 'Acme',
          role: 'Engineer',
          location: null,
          appliedAt: new Date('2026-01-02T00:00:00.000Z'),
          tags: [],
        },
      ],
      hasNextPage: false,
      nextCursor: null,
    };
    expect(compactForModel(page)).toEqual({
      items: [
        { id: 'app-1', company: 'Acme', role: 'Engineer', appliedAt: '2026-01-02', tags: [] },
      ],
      hasNextPage: false,
    });
  });
});

describe('formatDateForModel', () => {
  it('formats a midnight UTC date as YYYY-MM-DD', () => {
    expect(formatDateForModel(new Date('2024-05-01T00:00:00.000Z'))).toBe('2024-05-01');
  });

  it('keeps hours and minutes for a moment in time', () => {
    expect(formatDateForModel(new Date('2024-05-01T09:05:59.999Z'))).toBe('2024-05-01T09:05Z');
  });
});

describe('clipForModel', () => {
  it('leaves short text alone and clips long text', () => {
    expect(clipForModel('hello', 10)).toBe('hello');
    expect(clipForModel('hello world', 5)).toBe('hello…');
    expect(clipForModel('hello world', 6)).toBe('hello…');
  });
});
