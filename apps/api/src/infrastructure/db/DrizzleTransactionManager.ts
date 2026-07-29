import type { ITransactionManager } from '#src/use-cases/ports/ITransactionManager.js';
import type { DrizzleDb } from './client.js';
import { txStorage } from './transactionContext.js';

export class DrizzleTransactionManager implements ITransactionManager {
  private readonly db: DrizzleDb;

  constructor({ db }: { db: DrizzleDb }) {
    this.db = db;
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    if (txStorage.getStore()) return fn();
    return this.db.transaction((tx) => txStorage.run(tx, fn));
  }
}
