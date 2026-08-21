import { describe, it, expect } from 'vitest';
import { proseToTiptapDoc } from '#src/use-cases/shared/proseToTiptapDoc.js';

const parse = (json: string) => JSON.parse(json) as { type: string; content: unknown[] };

describe('proseToTiptapDoc', () => {
  it('makes one paragraph per line', () => {
    const { contentJson } = proseToTiptapDoc('First line\nSecond line');

    expect(parse(contentJson)).toEqual({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'First line' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Second line' }] },
      ],
    });
  });

  it('emits a blank line as a paragraph with no content array', () => {
    // An empty ProseMirror text node is invalid and makes the editor throw on
    // load — and prose puts blank lines between every paragraph.
    const { contentJson } = proseToTiptapDoc('Dear hiring manager,\n\nI am writing to apply.');

    expect(parse(contentJson).content[1]).toEqual({ type: 'paragraph' });
  });

  it('never emits an empty text node anywhere', () => {
    const { contentJson } = proseToTiptapDoc('A\n\n\nB\n   \nC');

    expect(JSON.stringify(parse(contentJson))).not.toContain('"text":""');
  });

  it('keeps the plain text alongside, trimmed', () => {
    const { plainText } = proseToTiptapDoc('\n  Hello\nWorld  \n');

    expect(plainText).toBe('Hello\nWorld');
  });

  it('produces a valid empty document for empty input', () => {
    const { contentJson, plainText } = proseToTiptapDoc('   ');

    expect(plainText).toBe('');
    expect(parse(contentJson)).toEqual({ type: 'doc', content: [{ type: 'paragraph' }] });
  });
});
