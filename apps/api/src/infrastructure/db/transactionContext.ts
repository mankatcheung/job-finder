import { AsyncLocalStorage } from 'node:async_hooks';
import type { DrizzleDb, DrizzleTransaction, DrizzleClient } from './client.js';

export const txStorage = new AsyncLocalStorage<DrizzleTransaction>();

export function getClient(db: DrizzleDb): DrizzleClient {
  return txStorage.getStore() ?? db;
}
