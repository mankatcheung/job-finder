import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { createLibSqlSchemaTarget } from '#src/infrastructure/db/LibSqlSchemaTarget.js';
import {
  bootstrapSchema,
  describeTarget,
  readDatabaseEnv,
  SchemaBootstrapError,
} from '#src/infrastructure/db/schemaBootstrap.js';

/**
 * Applies a generated schema SQL file to the database named by DATABASE_URL.
 *
 * Intended for standing up a fresh Turso database, which the Prisma CLI cannot
 * reach (P1013 — see `prisma.config.ts`). Generate the SQL first with
 * `pnpm db:schema-sql`.
 *
 *   pnpm db:apply-schema --env-file .env.production
 *   pnpm db:apply-schema --file prisma/init.sql --force
 */

/** `src/scripts/` and `dist/scripts/` are both one level below the package root. */
const PACKAGE_ROOT = path.join(import.meta.dirname, '..', '..');
const DEFAULT_SQL_FILE = path.join('prisma', 'init.sql');

const USAGE = `Usage: pnpm db:apply-schema [options]

Options:
  --file <path>      SQL file to apply (default: ${DEFAULT_SQL_FILE})
  --env-file <path>  Load environment variables from this file first
  --force            Apply even if the database already has tables
  --help             Show this message

Reads DATABASE_URL and DATABASE_AUTH_TOKEN from the environment.`;

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      file: { type: 'string', default: DEFAULT_SQL_FILE },
      'env-file': { type: 'string' },
      force: { type: 'boolean', default: false },
      help: { type: 'boolean', default: false },
    },
  });

  if (values.help) {
    console.log(USAGE);
    return;
  }

  // Loaded explicitly rather than via `--env-file` on the runtime, so the
  // production env file is opt-in and never picked up by accident.
  const envFile = values['env-file'];
  if (envFile) {
    process.loadEnvFile(path.resolve(envFile));
  }

  const sqlPath = path.resolve(PACKAGE_ROOT, values.file);
  const sql = await readFile(sqlPath, 'utf8').catch(() => {
    throw new SchemaBootstrapError(
      `Could not read ${sqlPath}. Generate it first with \`pnpm db:schema-sql\`.`,
    );
  });

  const credentials = readDatabaseEnv(process.env);
  console.log(`Target:  ${describeTarget(credentials.url)}`);
  console.log(`Source:  ${sqlPath}`);

  const target = createLibSqlSchemaTarget(credentials);
  try {
    const { tables } = await bootstrapSchema({
      target,
      sql,
      force: values.force,
      log: (message) => console.log(message),
    });
    console.log(tables.join(', '));
  } finally {
    target.close();
  }
}

try {
  await main();
} catch (error) {
  if (error instanceof SchemaBootstrapError) {
    console.error(`\n${error.message}`);
    process.exit(1);
  }
  throw error;
}
