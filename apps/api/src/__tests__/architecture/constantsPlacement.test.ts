import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { COOKIE_MAX_AGE_S } from '#src/http/constants.js';
import { TOKEN_LIFETIME_S } from '#src/use-cases/constants.js';

/**
 * Constants belong to a layer, like everything else.
 *
 * Until JEF-253 they did not: one root-level `src/constants.ts` held cookie
 * names, Fastify route paths, Axiom config and domain rules together, and 231
 * of 1005 files imported it — 55 of them use cases. Nothing caught that,
 * because `dependencyRule.test.ts` matches on `#src/<layer>/` prefixes and a
 * module at the root of `src/` is in no layer at all.
 *
 * Splitting the file into per-layer modules is what makes that existing guard
 * cover constants at all: a use case importing `#src/http/constants.js` is now
 * an ordinary `use-cases -> http` violation and fails there.
 *
 * The root of `src/` is kept empty by `dependencyRule.test.ts`, which owns
 * that rule for every module rather than constants specifically (JEF-256).
 * What is left here is what that rule cannot express: where each constant
 * belongs, and that the values stay derived rather than restated.
 */

const SRC = join(process.cwd(), 'src');

const CONSTANTS_MODULES = [
  'use-cases/constants.ts',
  'use-cases/errors/errorCodes.ts',
  'interface-adapters/mcp/constants.ts',
  'infrastructure/config/constants.ts',
  'http/constants.ts',
];

const exportedNames = (relative: string): string[] =>
  [...readFileSync(join(SRC, relative), 'utf8').matchAll(/^export const (\w+)/gm)].map(
    (match) => match[1] as string,
  );

describe('constants placement', () => {
  it.each(CONSTANTS_MODULES)('%s exists', (relative) => {
    expect(() => readFileSync(join(SRC, relative), 'utf8')).not.toThrow();
  });

  it('declares each constant in exactly one module', () => {
    const seen = new Map<string, string>();
    const duplicates: string[] = [];

    for (const relative of CONSTANTS_MODULES) {
      for (const name of exportedNames(relative)) {
        const previous = seen.get(name);
        if (previous) {
          duplicates.push(`${name}: ${previous} and ${relative}`);
        } else {
          seen.set(name, relative);
        }
      }
    }

    expect(duplicates).toEqual([]);
  });

  /**
   * The cookie carrying a token must not outlive the token. Deriving one from
   * the other is what keeps that true; restating 15 minutes and 7 days in the
   * HTTP layer is how they drift apart.
   */
  it('derives cookie lifetimes from the token policy rather than restating them', () => {
    expect(COOKIE_MAX_AGE_S).toBe(TOKEN_LIFETIME_S);
  });
});
