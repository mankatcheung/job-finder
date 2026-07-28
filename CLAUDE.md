# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from the monorepo root via Turborepo unless noted.

```bash
# Development (runs both apps concurrently)
pnpm dev

# Build all packages
pnpm build

# Type-check all packages
pnpm typecheck

# Run all tests
pnpm test

# Run tests for a single app
pnpm --filter @job-finder/api test
pnpm --filter @job-finder/web test

# Run a single test file (from the app directory)
cd apps/api && pnpm test -- src/__tests__/application/auth/LoginUseCase.test.ts

# Lint / format
pnpm lint
pnpm format

# Database (runs against apps/api)
pnpm db:generate   # re-generate Prisma client after schema changes
pnpm db:migrate    # run migrations (dev only)
cd apps/api && pnpm db:studio  # open Prisma Studio

# Provisioning a new (empty) production database — see "Production database" below
cd apps/api && pnpm db:schema-sql    # regenerate prisma/init.sql from schema.prisma
cd apps/api && pnpm db:apply-schema --env-file .env.production

# GraphQL codegen (requires API server running at localhost:3001)
cd apps/web && pnpm codegen
```

## Architecture

**Monorepo layout:** `apps/api` (backend), `apps/web` (frontend), `packages/shared` (constants/utilities — currently minimal; API types flow through codegen instead).

### API (`apps/api`) — Clean Architecture + GraphQL

The API is a **Fastify + Mercurius + Pothos** GraphQL server following Clean Architecture layers:

```
domain/           Pure domain entities (no dependencies)
use-cases/        Business logic + repository/storage port interfaces
  ports/          IApplicationRepository, IUserRepository, IStorageProvider, etc.
interface-adapters/
  resolvers/      GraphQL resolvers — call use cases via DI container
  mappers/        Convert Prisma models → domain entities
infrastructure/
  db/             PrismaClient setup; Prisma repository implementations
  storage/        LocalStorageProvider (dev) / VercelBlobStorageProvider (prod)
http/
  schema/         Pothos schema builder, types, queries, mutations
  plugins/        Fastify plugins (auth/JWT, CORS)
  container.ts    Awilix DI container wiring — all dependencies registered here
  context.ts      GraphQL context shape (user, diScope, request, reply)
```

**Dependency injection:** Awilix (`@fastify/awilix`) wires everything. Repositories and resolvers are `SINGLETON`; use cases are `TRANSIENT`. The `container.ts` file is the single place that connects all layers.

**Auth:** JWT access token in `jf_access_token` HttpOnly cookie. Refresh token flow is handled by the `refreshToken` mutation. The GraphQL context extracts and verifies the access token on every request; resolvers enforce authorization.

**Storage:** Toggled by `STORAGE_PROVIDER` env var (`local` | `vercel-blob`). `LocalStorageProvider` writes to disk for dev; `VercelBlobStorageProvider` uses Vercel Blob for prod. Document upload flow: `requestUploadUrl` → client uploads directly to storage (a Vercel Blob client token, used via `@vercel/blob/client`'s `put()`) → `confirmDocument`.

**Database:** Prisma with libSQL adapter. Dev uses a local SQLite file (`local.db`). Prod targets Turso (`DATABASE_URL` + `DATABASE_AUTH_TOKEN`). Schema: `User → JobApplication → [Note, Document]` (all cascade-delete).

**Production database (Turso):** The Prisma CLI cannot reach Turso — Prisma 7 removed the CLI-side driver-adapter hook, so `migrate deploy` / `db push` fail with `P1013` against a `libsql://` URL (see the note in `prisma.config.ts`). Schema changes therefore go out in two steps: generate SQL locally, then apply it over the libSQL driver.

To stand up a **new, empty** database:

1. `pnpm db:schema-sql` — regenerates `apps/api/prisma/init.sql` (a from-empty snapshot of `schema.prisma`, committed to the repo). This is also the only reliable way to create the full schema, because migration history can't rebuild a fresh database: no migration ever `CREATE TABLE`s `Document`, only `ALTER`s it.
2. `pnpm db:apply-schema --env-file .env.production` — applies it via `@libsql/client`. Refuses to run if the target already has tables (`--force` overrides).
3. Set `DATABASE_URL` / `DATABASE_AUTH_TOKEN` as Vercel project env vars — the deploy workflow ships code only, never runtime secrets.

For a schema change to an **existing** production database, generate the delta instead and apply it the same way:

```bash
cd apps/api
pnpm exec prisma migrate diff --from-url "file:$PWD/prisma/local.db" --to-schema prisma/schema.prisma --script
```

`_prisma_migrations` is unused in production — since the CLI can never connect, there is nothing to baseline.

**Testing:** Vitest. Infrastructure tests use `createTestDb()` (creates a real in-memory SQLite DB per test, no mocks). Use-case tests use repository mocks from `__tests__/helpers/mocks.ts`. GraphQL resolver tests exist under `__tests__/interface-adapters/resolvers/`.

### Web (`apps/web`) — TanStack Start + React Query + GraphQL

**Framework:** TanStack Start (SSR-capable React). Routes live under `src/routes/` using file-based routing via `@tanstack/react-router`.

**Route layout:**

- `/` → index (redirects)
- `/login`, `/register` → public auth routes
- `/_authenticated/*` → protected layout route; `beforeLoad` redirects unauthenticated users to `/login`
- `/_authenticated/dashboard` → dashboard
- `/_authenticated/applications/*` → CRUD for job applications

**Data fetching:** `graphql-request` (`gqlClient`) with TanStack Query. The client in `src/graphql/client.ts` intercepts `UNAUTHORIZED` GraphQL errors, attempts a token refresh, and redirects to `/login` on failure.

**GraphQL types:** Generated by `graphql-codegen` into `src/graphql/generated/`. Run `pnpm codegen` after changing `.graphql` files or the API schema. **Never edit the `generated/` directory manually.**

**Styling:** Tailwind CSS v4 (via `@tailwindcss/vite`).

**Dev proxy:** Vite proxies `/graphql` → `http://localhost:3001` in development, so `VITE_API_URL` defaults to `/graphql`.

**Path alias:** `#/*` → `./src/*` (configured in `package.json` `imports` and `tsconfig`).

## Environment Setup

Copy and fill in both env files before running:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Key API env vars: `DATABASE_URL` must be an absolute path for local SQLite (e.g. `file:/absolute/path/to/job-finder/apps/api/local.db`). `JWT_SECRET` and `JWT_REFRESH_SECRET` must be set.

## Key Conventions

- **IDs** are `nanoid()` strings, not auto-increment integers.
- **Domain entities** are plain TypeScript objects/classes with no Prisma or framework imports. Mappers bridge Prisma ↔ domain.
- **Adding a new feature** follows the layer order: domain entity → port interface → use case → Prisma repository implementation → Pothos type/resolver → GraphQL mutation/query → register in `container.ts` → add `.graphql` file in web → run codegen → build UI.
- **Pothos schema:** Each resource has its type file (`http/schema/types/`), query file (`queries/`), and mutation file (`mutations/`). All are imported and composed in `http/schema/index.ts`.
