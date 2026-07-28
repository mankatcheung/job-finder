import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import type { ITransactionManager } from '#src/use-cases/ports/ITransactionManager.js';
import { txStorage } from './transactionContext.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DrizzleDb = BaseSQLiteDatabase<any, any>;

export class DrizzleTransactionManager implements ITransactionManager {
  private readonly db: DrizzleDb;

  constructor({ db }: { db: DrizzleDb }) {
    this.db = db;
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    if (txStorage.getStore()) return fn();
    return this.db.transaction(async (tx) => txStorage.run(tx, fn));
  }
}
