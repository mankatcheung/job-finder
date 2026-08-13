#!/usr/bin/env tsx
/**
 * Database seed script — populates a Turso (or local SQLite) database with
 * demo data so preview environments have something useful to explore.
 *
 * Usage:
 *   DATABASE_URL=libsql://... DATABASE_AUTH_TOKEN=... pnpm db:seed
 *
 * Safe to run multiple times — it deletes any existing demo user (cascading to
 * all related rows) before inserting fresh data, so re-seeding is clean.
 */
import { runSeed } from './seed/index.js';

await runSeed();
