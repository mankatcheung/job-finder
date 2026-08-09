import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { parseAiJson } from '#src/use-cases/shared/parseAiJson.js';

const schema = z.object({
  name: z.string(),
  count: z.number().optional().default(0),
});

describe('parseAiJson', () => {
  it('parses and returns data matching the schema', () => {
    const result = parseAiJson('{"name":"Acme","count":5}', schema);
    expect(result).toEqual({ name: 'Acme', count: 5 });
  });

  it('applies schema defaults for optional fields', () => {
    const result = parseAiJson('{"name":"Acme"}', schema);
    expect(result).toEqual({ name: 'Acme', count: 0 });
  });

  it('strips markdown code fences before parsing', () => {
    const result = parseAiJson('```json\n{"name":"Acme"}\n```', schema);
    expect(result.name).toBe('Acme');
  });

  it('throws an AI_RESPONSE_INVALID-coded error when the response is not valid JSON', () => {
    const err = (() => {
      try {
        parseAiJson('Sorry, I cannot help with that.', schema);
        return undefined;
      } catch (e) {
        return e;
      }
    })();

    expect((err as { code: string }).code).toBe('AI_RESPONSE_INVALID');
  });

  it('throws an AI_RESPONSE_INVALID-coded error when JSON is valid but does not match the schema', () => {
    // `name` is a number instead of a string — the malformed-but-truthy
    // field case called out in JEF-108.
    const err = (() => {
      try {
        parseAiJson('{"name":123}', schema);
        return undefined;
      } catch (e) {
        return e;
      }
    })();

    expect((err as { code: string }).code).toBe('AI_RESPONSE_INVALID');
  });

  it('throws an AI_RESPONSE_INVALID-coded error when a required field is missing', () => {
    const err = (() => {
      try {
        parseAiJson('{"count":5}', schema);
        return undefined;
      } catch (e) {
        return e;
      }
    })();

    expect((err as { code: string }).code).toBe('AI_RESPONSE_INVALID');
  });

  it('does not leak schema internals in the thrown error message', () => {
    const err = (() => {
      try {
        parseAiJson('not json at all', schema);
        return undefined;
      } catch (e) {
        return e;
      }
    })();

    expect((err as Error).message).toBe(
      "The AI's response couldn't be understood — please try again",
    );
  });
});
