import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const pointerRule = `button:not(:disabled),
  [role='button']:not([aria-disabled='true']) {
    cursor: pointer;
  }`;
const testDirectory = dirname(fileURLToPath(import.meta.url));

describe('base styles', () => {
  it('keeps enabled controls pointer-friendly in the app and UI stylesheets', () => {
    const webStyles = readFileSync(
      resolve(testDirectory, '../../../../apps/web/src/styles.css'),
      'utf8',
    );
    const uiStyles = readFileSync(resolve(testDirectory, '../styles.css'), 'utf8');

    expect(webStyles).toContain(pointerRule);
    expect(uiStyles).toContain(pointerRule);
  });
});
