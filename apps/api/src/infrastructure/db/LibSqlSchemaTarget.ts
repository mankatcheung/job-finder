import { createClient } from '@libsql/client';
import type { DatabaseCredentials, SchemaTarget } from '#src/infrastructure/db/schemaBootstrap.js';

const LIST_TABLES_SQL = "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name";

/**
 * A {@link SchemaTarget} backed by libSQL — the same driver the runtime
 * PrismaClient uses, which is what lets this reach Turso when the Prisma CLI
 * cannot. Bypassing Prisma is deliberate: the schema is being created here, so
 * there is no generated client to talk to yet.
 */
export function createLibSqlSchemaTarget({ url, authToken }: DatabaseCredentials): SchemaTarget {
  const client = createClient({ url, authToken });

  return {
    async listTableNames() {
      const result = await client.execute(LIST_TABLES_SQL);
      return result.rows.map((row) => String(row.name));
    },
    async executeMultiple(sql) {
      await client.executeMultiple(sql);
    },
    close() {
      client.close();
    },
  };
}
