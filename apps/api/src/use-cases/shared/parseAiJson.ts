import type { ZodType } from 'zod';
import { ERROR_CODES } from '#src/constants.js';

/**
 * Parses an LLM's JSON response against a Zod schema, instead of a bare
 * `JSON.parse(...) as Partial<T>` type assertion with no runtime check.
 *
 * On any failure — the response isn't valid JSON, or it is but doesn't
 * match `schema` (wrong types, missing required fields) — throws a coded
 * AI_RESPONSE_INVALID error rather than silently falling back to a default.
 * A silent default is indistinguishable from a genuine model answer (e.g.
 * "the model scored this 0" vs. "we couldn't parse the response"), which is
 * exactly the gap this closes (JEF-108).
 */
export function parseAiJson<T>(raw: string, schema: ZodType<T>): T {
  const clean = raw
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/, '')
    .trim();

  let json: unknown;
  try {
    json = JSON.parse(clean);
  } catch {
    throw Object.assign(new Error("The AI's response couldn't be understood — please try again"), {
      code: ERROR_CODES.AI_RESPONSE_INVALID,
    });
  }

  const result = schema.safeParse(json);
  if (!result.success) {
    throw Object.assign(new Error("The AI's response couldn't be understood — please try again"), {
      code: ERROR_CODES.AI_RESPONSE_INVALID,
    });
  }

  return result.data;
}
