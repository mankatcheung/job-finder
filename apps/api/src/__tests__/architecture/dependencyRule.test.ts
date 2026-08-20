import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Clean Architecture's dependency rule, enforced rather than described.
 *
 * CLAUDE.md documents the layering; until this existed, one test guarded one
 * edge of it — the `use-cases` → `interface-adapters` check added with the
 * tool catalogue, written because that edge had just broken. Everything else
 * was on trust, and three violations accumulated.
 */

const SRC = join(process.cwd(), 'src');

/** Dependencies point inward. Each layer lists what it may not reach for. */
const FORBIDDEN: Array<{ layer: string; mayNotImport: string[] }> = [
  { layer: 'domain', mayNotImport: ['use-cases', 'interface-adapters', 'infrastructure', 'http'] },
  { layer: 'use-cases', mayNotImport: ['interface-adapters', 'infrastructure', 'http'] },
  { layer: 'interface-adapters', mayNotImport: ['infrastructure', 'http'] },
];

/**
 * Frameworks belong at the edges. A domain entity or a use case that imports
 * Drizzle or Fastify has stopped being testable without them, which is the
 * practical cost the rule exists to prevent.
 */
const FRAMEWORKS = ['drizzle-orm', 'fastify', 'graphql', '@pothos/', '@libsql/', 'web-push'];
const FRAMEWORK_FREE = ['domain', 'use-cases'];

/**
 * Violations that predate this test, each with the change that clears it.
 *
 * This list may only shrink. The test below fails if an entry stops being a
 * violation, so a fix cannot leave its exemption behind — which is how a list
 * like this usually turns permanent.
 */
const KNOWN_VIOLATIONS: Record<string, string> = {
  // JEF-181 — importing http/errors/AppError puts an HTTP status in a business rule
  'use-cases/documents/CreateDocumentDraftUseCase.ts': 'JEF-181',
  'use-cases/documents/DeleteDocumentDraftUseCase.ts': 'JEF-181',
  'use-cases/documents/ExportDocumentDraftToPdfUseCase.ts': 'JEF-181',
  'use-cases/documents/ExtractDocumentTextUseCase.ts': 'JEF-181',
  'use-cases/documents/GetDocumentDraftUseCase.ts': 'JEF-181',
  'use-cases/documents/GetDocumentDraftsUseCase.ts': 'JEF-181',
  'use-cases/documents/UpdateDocumentDraftContentUseCase.ts': 'JEF-181',
  'use-cases/offers/CompareOffersUseCase.ts': 'JEF-181',
  'use-cases/offers/CreateOfferUseCase.ts': 'JEF-181',
  'use-cases/offers/DeleteOfferUseCase.ts': 'JEF-181',
  'use-cases/offers/GetOffersUseCase.ts': 'JEF-181',
  'use-cases/offers/UpdateOfferUseCase.ts': 'JEF-181',
  // JEF-182 — depends on the concrete WebPushService instead of a port
  'use-cases/push/SendPushNotificationsUseCase.ts': 'JEF-182',
  // JEF-182 — takes a GraphQLContext, alone among twenty-one resolvers
  'interface-adapters/resolvers/ActivityLogResolver.ts': 'JEF-182',
};

function sourceFiles(layer: string): string[] {
  const root = join(SRC, layer);
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        if (entry !== '__tests__') walk(full);
      } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
        out.push(full);
      }
    }
  };
  walk(root);
  return out;
}

/** Layer-relative path with forward slashes, so the allow-list reads the same everywhere. */
const idOf = (file: string): string => relative(SRC, file).split(sep).join('/');

function offendersIn(layer: string, mayNotImport: string[]): string[] {
  return sourceFiles(layer)
    .filter((file) => {
      const contents = readFileSync(file, 'utf8');
      return mayNotImport.some((target) => contents.includes(`from '#src/${target}/`));
    })
    .map(idOf);
}

describe('the dependency rule', () => {
  it.each(FORBIDDEN)('$layer does not import $mayNotImport', ({ layer, mayNotImport }) => {
    const offenders = offendersIn(layer, mayNotImport).filter((id) => !(id in KNOWN_VIOLATIONS));

    expect(offenders).toEqual([]);
  });

  it.each(FRAMEWORK_FREE)('%s imports no framework', (layer) => {
    const offenders = sourceFiles(layer)
      .filter((file) => {
        const contents = readFileSync(file, 'utf8');
        return FRAMEWORKS.some((fw) => contents.includes(`from '${fw}`));
      })
      .map(idOf);

    expect(offenders).toEqual([]);
  });

  it('walked a realistic number of files', () => {
    // A wrong working directory would walk nothing and pass everything above.
    const counted = FORBIDDEN.reduce((n, { layer }) => n + sourceFiles(layer).length, 0);

    expect(counted).toBeGreaterThan(300);
  });

  it('has no stale entries in the known-violations list', () => {
    const stillViolating = new Set(
      FORBIDDEN.flatMap(({ layer, mayNotImport }) => offendersIn(layer, mayNotImport)),
    );

    // The point of this one: once a fix lands, its exemption has to go with
    // it. Without this the list only ever grows and quietly becomes the
    // architecture.
    const fixed = Object.keys(KNOWN_VIOLATIONS).filter((id) => !stillViolating.has(id));

    expect(fixed).toEqual([]);
  });
});
