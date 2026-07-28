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
pnpm db:generate   # generate Drizzle migration after schema changes
pnpm db:migrate    # run migrations (dev only)
cd apps/api && pnpm db:studio  # open Drizzle Studio

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
  mappers/        Convert Drizzle models → domain entities
infrastructure/
  db/
    drizzle/      Drizzle schema, client setup, migrations
    repositories/ Drizzle repository implementations
    transactionContext.ts  AsyncLocalStorage for transaction propagation
    DrizzleTransactionManager.ts
  storage/        LocalStorageProvider (dev) / VercelBlobStorageProvider (prod)
http/
  schema/         Pothos schema builder, types, queries, mutations
  plugins/        Fastify plugins (auth/JWT, CORS)
  container.ts    Awilix DI container wiring — all dependencies registered here
  context.ts      GraphQL context shape (user, diScope, request, reply)
```

**Dependency injection:** Awilix (`@fastify/awilix`) wires everything. Repositories and resolvers are `SINGLETON`; use cases are `TRANSIENT`. The `container.ts` file is the single place that connects all layers.

**Auth:** The API and web app are deployed on separate domains, so a cookie set by the API can never be read by the web app's own page or server (`document.cookie` and the web server both only ever see cookies scoped to their own domain). Two delivery mechanisms exist side by side:

- **Cookie** (`jf_access_token`, HttpOnly) — works when a client shares the API's domain (e.g. the browser extension, which reads it directly via `chrome.cookies.get()`, unaffected by same-origin restrictions).
- **`Authorization: Bearer <token>` header** — what the web app uses. `login`/`register`/`loginWithTotp`/`refreshToken` return the access token directly in the GraphQL response body; the web app holds it in memory only (`apps/web/src/graphql/client.ts`, never localStorage — bounds XSS exposure to the token's 15-minute lifetime) and attaches it via `requestMiddleware` on every request.

The GraphQL context (`buildGraphQLContext.ts`) falls back from cookie to bearer header, so both paths hit the same verification code.

The long-lived refresh token stays in its HttpOnly cookie (never exposed to JS either way) but is `SameSite=None; Secure` in production so the browser still attaches it cross-site on the `credentials:'include'` fetch the web app makes to `refreshToken` — this is what lets a page reload silently re-authenticate. **Deploy prerequisite:** the API's `CORS_ORIGIN` env var must contain the web app's exact deployed origin — `corsPlugin.ts` validates `credentials:true` requests against it, and a mismatch silently breaks the refresh cookie regardless of anything else being correct.

Because there is no cookie the web server can ever see, protected/auth-gated routes (`/`, `/login`, `/_authenticated`) set `ssr: false` and resolve auth entirely client-side via `hydrateSession()` — TanStack Start does not re-run `beforeLoad` on initial hydration unless a route opts out of SSR this way.

**Storage:** Toggled by `STORAGE_PROVIDER` env var (`local` | `vercel-blob`). `LocalStorageProvider` writes to disk for dev; `VercelBlobStorageProvider` uses Vercel Blob for prod. Document upload flow: `requestUploadUrl` → client uploads directly to storage (a Vercel Blob client token, used via `@vercel/blob/client`'s `put()`) → `confirmDocument`.

**Database:** Drizzle ORM with `@libsql/client` (Turso/libSQL). Dev uses a local SQLite file (`local.db`). Prod targets Turso (`DATABASE_URL` + `DATABASE_AUTH_TOKEN`). Schema defined in `infrastructure/db/drizzle/schema.ts`. Migrations in `drizzle/` directory. Transaction propagation via `AsyncLocalStorage` — repositories use `getDb()` to transparently access the ambient transaction client.

**Testing:** Vitest. Infrastructure tests use `createTestDb()` (creates a real SQLite DB per test using Drizzle migrations, no mocks). Use-case tests use repository mocks from `__tests__/helpers/mocks.ts`. GraphQL resolver tests exist under `__tests__/interface-adapters/resolvers/`.

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
- **Domain entities** are plain TypeScript objects/classes with no Drizzle or framework imports. Mappers bridge Drizzle ↔ domain.
- **Adding a new feature** follows the layer order: domain entity → port interface → use case → Drizzle repository implementation → Pothos type/resolver → GraphQL mutation/query → register in `container.ts` → add `.graphql` file in web → run codegen → build UI.
- **Pothos schema:** Each resource has its type file (`http/schema/types/`), query file (`queries/`), and mutation file (`mutations/`). All are imported and composed in `http/schema/index.ts`.
