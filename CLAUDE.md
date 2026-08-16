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
pnpm --filter @trakwyn/api test
pnpm --filter @trakwyn/web test

# Run a single test file (from the app directory)
cd apps/api && pnpm test -- src/__tests__/application/auth/LoginUseCase.test.ts

# Lint / format
pnpm lint
pnpm format

# Database (runs against apps/api)
pnpm db:generate   # generate a migration SQL file after schema.ts changes
pnpm db:migrate    # apply pending migrations
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
  mappers/        Convert Drizzle rows → domain entities
infrastructure/
  db/             Drizzle client + schema.ts; Drizzle repository implementations
  storage/        LocalStorageProvider (dev) / VercelBlobStorageProvider (prod)
http/
  schema/         Pothos schema builder, types, queries, mutations
  plugins/        Fastify plugins (auth/JWT, CORS)
  container.ts    Awilix DI container — re-exports buildContainer()/Cradle
  di/             DI registrations split by layer/domain (see container.ts)
  context.ts      GraphQL context shape (user, diScope, request, reply)
```

**Dependency injection:** Awilix (`@fastify/awilix`) wires everything. Repositories and resolvers are `SINGLETON`; use cases are `TRANSIENT`. `container.ts` is a thin re-export; `http/di/index.ts` (`buildContainer`) composes typed registration modules split across `http/di/*.ts` (infrastructure, repositories, rate-limiters, mappers, resolvers) and `http/di/use-cases/*.ts` (one file per domain). The `Cradle` interface lives in `http/di/types.ts`.

**Auth:** The API and web app are deployed on separate domains, so a cookie set by the API can never be read by the web app's own page or server (`document.cookie` and the web server both only ever see cookies scoped to their own domain). Two delivery mechanisms exist side by side:

- **Cookie** (`trakwyn_access_token`, HttpOnly) — works when a client shares the API's domain (e.g. the browser extension, which reads it directly via `chrome.cookies.get()`, unaffected by same-origin restrictions).
- **`Authorization: Bearer <token>` header** — what the web app uses. `login`/`register`/`loginWithTotp`/`refreshToken` return the access token directly in the GraphQL response body; the web app holds it in memory only (`apps/web/src/graphql/client.ts`, never localStorage — bounds XSS exposure to the token's 15-minute lifetime) and attaches it via `requestMiddleware` on every request.

The GraphQL context (`buildGraphQLContext.ts`) falls back from cookie to bearer header, so both paths hit the same verification code.

The long-lived refresh token stays in its HttpOnly cookie (never exposed to JS either way) but is `SameSite=None; Secure` in production so the browser still attaches it cross-site on the `credentials:'include'` fetch the web app makes to `refreshToken` — this is what lets a page reload silently re-authenticate. **Deploy prerequisite:** the API's `CORS_ORIGIN` env var must contain the web app's exact deployed origin — `corsPlugin.ts` validates `credentials:true` requests against it, and a mismatch silently breaks the refresh cookie regardless of anything else being correct.

Because there is no cookie the web server can ever see, protected/auth-gated routes (`/`, `/login`, `/_authenticated`) set `ssr: false` and resolve auth entirely client-side via `hydrateSession()` — TanStack Start does not re-run `beforeLoad` on initial hydration unless a route opts out of SSR this way.

**Storage:** Toggled by `STORAGE_PROVIDER` env var (`local` | `vercel-blob`). `LocalStorageProvider` writes to disk for dev; `VercelBlobStorageProvider` uses Vercel Blob for prod. Document upload flow: `requestUploadUrl` → client uploads directly to storage (a Vercel Blob client token, used via `@vercel/blob/client`'s `put()`) → `confirmDocument`.

**Database:** Drizzle ORM (`drizzle-orm/libsql`) via `@libsql/client`. Dev uses a local SQLite file (`local.db`). Prod targets Turso (`DATABASE_URL` + `DATABASE_AUTH_TOKEN`) — unlike Prisma 7's CLI, `drizzle-kit migrate` connects through the same libsql client used at runtime, so it can apply migrations to a remote Turso URL directly. Schema lives in `src/infrastructure/db/schema.ts`; migrations are generated into `drizzle/` via `pnpm db:generate` and applied via `pnpm db:migrate`. Schema: `User → JobApplication → [Note, Document]` (all cascade-delete). libsql does not enforce foreign keys by default — `client.ts` and `createTestDb.ts` both run `PRAGMA foreign_keys = ON` explicitly; without it, `ON DELETE CASCADE` silently no-ops.

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
- **Domain entities** are plain TypeScript objects/classes with no Drizzle or framework imports. Mappers bridge Drizzle rows ↔ domain.
- **Adding a new feature** follows the layer order: domain entity → port interface → use case → Drizzle repository implementation → Pothos type/resolver → GraphQL mutation/query → register in the matching `http/di/` module → add `.graphql` file in web → run codegen → build UI.
- **Pothos schema:** Each resource has its type file (`http/schema/types/`), query file (`queries/`), and mutation file (`mutations/`). All are imported and composed in `http/schema/index.ts`.

## Workflow

- **Linear issue lifecycle:** Before an agent starts implementation for a Linear issue, set its status to **In Progress**. Do not begin coding while it remains in Backlog, Planned, Todo, or another status. After implementation is complete, the branch is pushed, and a PR is created, set the issue status to **In Review**. Only move it to **Done** after the PR is merged or the user explicitly asks for completion.
- **Branch name:** `<feat/fix/chore/...>/<linear-id>-<brief name>` — the Linear ID segment (lowercase, e.g. `jef-67`) is included only when the work maps to a Linear ticket; omit it otherwise.
  - With a ticket: `feat/jef-67-multi-provider-llm`
  - Without a ticket: `feat/animated-page-transitions`
- **Worktrees:** Always create feature worktrees in `.claude/worktrees/`, named the same as the branch with `/` replaced by `-` (e.g. `.claude/worktrees/feat-jef-67-multi-provider-llm`, `.claude/worktrees/feat-animated-page-transitions`). Use `git worktree add .claude/worktrees/<worktree-name> -b <branch-name> main`. A fresh worktree has no `.env` files and an unseeded local database (both gitignored) — run `pnpm setup:worktree` from inside it right after creation to copy env files from the main checkout, install dependencies, apply migrations, and seed the local database (see `scripts/setup-worktree.sh`).
- **Tests are mandatory, not a follow-up:** Every new or changed use case, resolver, repository, React component/page, or utility function ships with matching tests in the _same_ PR — mirror the existing convention for that layer (use-case tests with `helpers/mocks.ts` repository mocks, `createTestDb()` for Drizzle repositories, mocked-use-case-deps tests under `__tests__/interface-adapters/resolvers/`, `gqlClient`/router-mocked tests under `apps/web/src/__tests__/components/`). A Linear issue's implementation checklist is not done while a "tests" line item is unchecked, and a PR that adds behavior without matching tests should not be opened.
- **PRs:** After completing work, push the branch and create a PR. The user reviews PRs directly rather than merging from the CLI.
