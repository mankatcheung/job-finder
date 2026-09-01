import { createClient, type ResultSet } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import type { ExtractTablesWithRelations } from 'drizzle-orm';
import type { SQLiteTransaction } from 'drizzle-orm/sqlite-core';
import { ENV } from '#src/infrastructure/config/constants.js';
import * as schema from './schema.js';

const client = createClient({
  url: process.env[ENV.DATABASE_URL]!,
  authToken: process.env[ENV.DATABASE_AUTH_TOKEN] ?? undefined,
});

// libsql does not enforce foreign keys by default; ON DELETE CASCADE in the
// schema silently no-ops without this, leaving orphaned rows behind.
await client.execute('PRAGMA foreign_keys = ON');
console.log('Database connected');

export const db = drizzle(client, { schema });

export type DrizzleDb = typeof db;

// The object inside a db.transaction() callback is a different (structurally
// narrower — no .batch()) type than DrizzleDb itself, so repositories that
// need to work against either the top-level db or an ambient transaction
// (see transactionContext.ts) are typed against this union rather than
// DrizzleDb alone.
export type DrizzleTransaction = SQLiteTransaction<
  'async',
  ResultSet,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;
export type DrizzleClient = DrizzleDb | DrizzleTransaction;
