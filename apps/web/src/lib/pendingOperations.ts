import { gqlClient } from '#/graphql/client';

const STORAGE_KEY = 'trakwyn:pendingOperations';

export type PendingOperation = {
  id: string;
  document: string;
  variables?: Record<string, unknown>;
  createdAt: number;
};

/**
 * Deletes that are waiting out an undo window, written to localStorage so they
 * survive the page.
 *
 * `showUndoToast` holds the request in a `setTimeout`. That timer dies with the
 * tab, so a refresh inside the window used to drop the delete entirely — after
 * the UI had already removed the row and told the user it was gone (JEF-191).
 * Recording the operation up front and replaying whatever is left over on the
 * next load closes that, and covers a crash or a killed tab too, which a
 * `pagehide` flush would not.
 *
 * Every entry is removed on success, on undo, and on any answer from the
 * server — so the queue only retains work that never reached the API at all.
 */

function read(): PendingOperation[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(parsed) ? (parsed as PendingOperation[]) : [];
  } catch {
    // Corrupt or foreign data under our key: better to drop it than to let a
    // parse error take down every caller that schedules a delete.
    return [];
  }
}

function write(operations: PendingOperation[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(operations));
  } catch {
    // Private mode / quota. The in-memory timer still runs, so this degrades
    // to the old behaviour rather than breaking the delete.
  }
}

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function rememberPendingOperation(
  document: string,
  variables?: Record<string, unknown>,
): string {
  const id = newId();
  write([...read(), { id, document, variables, createdAt: Date.now() }]);
  return id;
}

export function forgetPendingOperation(id: string): void {
  write(read().filter((op) => op.id !== id));
}

/** The server answered — even with an error — so the operation reached it. */
function reachedServer(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'response' in error;
}

/**
 * Sends anything still recorded from a previous page.
 *
 * A GraphQL error counts as delivered and the entry is dropped: the usual one
 * is NOT_FOUND, meaning an earlier attempt did land and the row is already
 * gone. Only a transport failure keeps an entry, so being offline at startup
 * postpones the delete instead of losing it.
 */
export async function replayPendingOperations(): Promise<void> {
  const pending = read();
  if (pending.length === 0) return;

  // Cleared up front so a second call (React strict mode, a fast reload) does
  // not send the same delete twice; anything undelivered is written back.
  write([]);

  const undelivered: PendingOperation[] = [];
  for (const operation of pending) {
    try {
      await gqlClient.request(operation.document, operation.variables);
    } catch (error) {
      if (!reachedServer(error)) undelivered.push(operation);
    }
  }

  if (undelivered.length > 0) write([...undelivered, ...read()]);
}
