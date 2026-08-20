import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ERROR_CODES } from '#src/constants.js';
import * as domainErrors from '#src/use-cases/errors/DomainError.js';
import { fromCodedError } from '#src/http/errors/AppError.js';

const USE_CASES = join(process.cwd(), 'src', 'use-cases');

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...sourceFiles(full));
    else if (entry.endsWith('.ts')) out.push(full);
  }
  return out;
}

describe('use cases signal failure one way', () => {
  it('no use case hand-rolls an error with Object.assign', () => {
    // The shape this replaced. It works — fromCodedError reads `.code` either
    // way — but it puts the code in as a loose string at 164 separate sites,
    // and it is how the codebase ended up with two conventions while CLAUDE.md
    // documented one.
    const offenders = sourceFiles(USE_CASES)
      .filter((file) => readFileSync(file, 'utf8').includes('Object.assign(new Error'))
      .map((file) => relative(USE_CASES, file).split(sep).join('/'));

    expect(offenders).toEqual([]);
  });

  it('no use case throws a bare Error for something the client should see', () => {
    // A bare Error carries no code, so fromCodedError can only call it an
    // internal failure: the client gets "Internal server error" and a 500, and
    // the server logs a fault that never happened. Six use cases did this
    // until JEF-181.
    const offenders = sourceFiles(USE_CASES)
      .filter((file) => /throw new Error\(/.test(readFileSync(file, 'utf8')))
      .map((file) => relative(USE_CASES, file).split(sep).join('/'));

    // RegisterMcpOAuthClientUseCase's validation is caught by its own caller
    // and turned into invalid_client_metadata; ExtractDocumentTextUseCase's
    // read failure genuinely is a 500.
    expect(offenders).toEqual([
      'documents/ExtractDocumentTextUseCase.ts',
      'mcpOAuth/RegisterMcpOAuthClientUseCase.ts',
    ]);
  });

  it('scanned a realistic number of use cases', () => {
    expect(sourceFiles(USE_CASES).length).toBeGreaterThan(200);
  });

  it('every DomainError maps to something other than a 500 at the boundary', () => {
    // The failure this catches is silent: a code with no `fromCodedError` case
    // falls through to the 500 default, so a deliberate, client-facing error
    // reaches the user as "Internal server error". USER_NOT_FOUND did exactly
    // that on the sign-in page.
    const subclasses = Object.values(domainErrors).filter(
      (value) => typeof value === 'function' && value.name !== 'DomainError',
    ) as Array<new (message?: string) => Error>;

    const unmapped = subclasses
      .map((Subclass) => new Subclass())
      .filter((error) => fromCodedError(error).code === ERROR_CODES.INTERNAL_ERROR)
      .map((error) => error.constructor.name);

    expect(unmapped).toEqual([]);
  });
});
