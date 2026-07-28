import { AsyncLocalStorage } from 'node:async_hooks';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const txStorage = new AsyncLocalStorage<BaseSQLiteDatabase<any, any>>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getDb(db: BaseSQLiteDatabase<any, any>): BaseSQLiteDatabase<any, any> {
  return txStorage.getStore() ?? db;
}
