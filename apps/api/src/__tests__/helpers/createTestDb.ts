import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import * as schema from '#src/infrastructure/db/drizzle/schema.js';

export interface TestDb {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: ReturnType<typeof drizzle<any>>;
  cleanup: () => Promise<void>;
}

export async function createTestDb(): Promise<TestDb> {
  const filename = `test-${randomUUID()}.db`;
  const dbPath = join(process.cwd(), 'prisma', filename);
  const client = createClient({ url: `file:${dbPath}` });
  const db = drizzle(client, { schema });

  await migrate(db, { migrationsFolder: join(process.cwd(), 'drizzle') });

  return {
    db,
    cleanup: async () => {
      client.close();
      if (existsSync(dbPath)) unlinkSync(dbPath);
    },
  };
}
