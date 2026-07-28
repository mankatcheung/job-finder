import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { ENV } from '#src/constants.js';
import * as schema from './schema.js';

const client = createClient({
  url: process.env[ENV.DATABASE_URL]!,
  authToken: process.env[ENV.DATABASE_AUTH_TOKEN] ?? undefined,
});

export const db = drizzle(client, { schema });

export type DrizzleDb = typeof db;
