// Loads apps/api/.env before any test file runs, so a test that genuinely
// needs a real env var (as opposed to createTestDb()'s self-contained
// in-memory SQLite, which most tests use and don't need this for) doesn't
// silently see `undefined`. A setupFiles entry, not a plain import in
// vitest.config.ts, because it needs to run inside each test worker's own
// process/context — config-file-level code runs in a separate parent
// process whose `process.env` mutations don't propagate to workers.
import 'dotenv/config';
