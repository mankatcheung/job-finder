import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Test doubles are split by domain, and stay split.
 *
 * `helpers/mocks.ts` was one 816-line module holding all 67 factories and
 * imported by 157 test files — the second-highest fan-in in the package
 * (JEF-254). A change to one factory's shape could reach every test that
 * imported any factory, and every test pulled in all 67 declarations to use
 * one of them.
 *
 * It is now one module per domain under `helpers/mocks/`, mirroring the names
 * `http/di/use-cases/` already uses. Nothing enforces that shape at runtime —
 * a single re-added barrel would undo it silently and every test would still
 * pass — so it is asserted here.
 */

const TESTS = join(process.cwd(), 'src', '__tests__');
const MOCKS = join(TESTS, 'helpers', 'mocks');

const mockModules = (): string[] =>
  readdirSync(MOCKS)
    .filter((entry) => entry.endsWith('.ts'))
    .sort();

function testFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry.endsWith('.ts')) out.push(full);
    }
  };
  walk(TESTS);
  return out;
}

const factoriesIn = (file: string): string[] =>
  [...readFileSync(join(MOCKS, file), 'utf8').matchAll(/^export const (\w+)/gm)].map(
    (match) => match[1] as string,
  );

describe('mock placement', () => {
  /**
   * The barrel is the failure mode, not just the old file: re-adding one puts
   * every factory back behind a single import and the split stops meaning
   * anything, with the suite still green.
   */
  it('has no barrel re-exporting every mock', () => {
    expect(existsSync(join(TESTS, 'helpers', 'mocks.ts'))).toBe(false);

    const barrels = mockModules().filter((file) =>
      /export\s+\*\s+from/.test(readFileSync(join(MOCKS, file), 'utf8')),
    );

    expect(barrels).toEqual([]);
  });

  it('declares each factory in exactly one module', () => {
    const seen = new Map<string, string>();
    const duplicates: string[] = [];

    for (const file of mockModules()) {
      for (const factory of factoriesIn(file)) {
        const previous = seen.get(factory);
        if (previous) duplicates.push(`${factory}: ${previous} and ${file}`);
        else seen.set(factory, file);
      }
    }

    expect(duplicates).toEqual([]);
    // A wrong directory would find nothing and pass everything above.
    expect(seen.size).toBeGreaterThan(50);
  });

  /**
   * A domain module nothing imports is a helper kept alive by its own
   * existence. Splitting a file into twenty makes that easy to miss.
   */
  it('has no mock module that nothing imports', () => {
    const sources = testFiles()
      .filter((file) => !file.startsWith(MOCKS + sep))
      .map((file) => readFileSync(file, 'utf8'));

    const orphans = mockModules().filter((file) => {
      const specifier = `helpers/mocks/${file.replace(/\.ts$/, '.js')}`;
      return !sources.some((contents) => contents.includes(specifier));
    });

    expect(orphans).toEqual([]);
  });

  /**
   * The split is only worth having while the modules stay small enough that a
   * test importing one is not importing everything again. This is a smoke
   * alarm rather than a design rule — raise it if a domain genuinely grows,
   * but not to avoid making a new module.
   */
  it('keeps each module far smaller than the file it replaced', () => {
    const oversized = mockModules()
      .map((file) => ({ file, factories: factoriesIn(file).length }))
      .filter(({ factories }) => factories > 15);

    expect(oversized).toEqual([]);
  });

  it('mirrors a directory name used by http/di/use-cases', () => {
    const diDomains = new Set(
      readdirSync(join(process.cwd(), 'src', 'http', 'di', 'use-cases'))
        .filter((entry) => entry.endsWith('.ts'))
        .map((entry) => entry.replace(/\.ts$/, '')),
    );

    // `infrastructure` is the one deliberate addition: the cross-cutting
    // doubles (logger, rate limiter, transaction manager) belong to no domain,
    // and `http/di/infrastructure.ts` is where their real registrations live.
    const unknown = mockModules()
      .map((file) => relative('', file).replace(/\.ts$/, ''))
      .filter((domain) => domain !== 'infrastructure' && !diDomains.has(domain));

    expect(unknown).toEqual([]);
  });
});
