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

**Auth:** All clients authenticate via the same HttpOnly cookies (`trakwyn_access_token`, `trakwyn_refresh_token`) — `setAuthCookies()`/`clearAuthCookies()` (`apps/api/src/http/schema/types/AuthPayloadType.ts`) are called from every auth entry point (`login`, `register`, `loginWithTotp`, `refreshToken`, `reauthenticate`, `logout`, the OAuth callback, delete-account). `buildGraphQLContext.ts` still falls back to an `Authorization: Bearer <token>` header if no cookie is present (`cookieToken ?? bearerToken`), kept for non-cookie clients (e.g. API tokens), but the web app relies solely on the cookie — `apps/web/src/graphql/client.ts`'s `gqlClient` sets `credentials: 'include'` and no longer tracks a token in JS memory. The browser extension reads the same access-token cookie directly via `chrome.cookies.get()`, unaffected by same-origin restrictions since it shares the API's domain.

The API and web app are currently deployed on separate, unrelated domains (e.g. distinct `*.vercel.app` subdomains, which the browser treats as different _sites_), so both cookies are `SameSite=None; Secure` in production — required for the browser to attach them cross-site at all. **Known interim limitation:** `SameSite=None` alone doesn't guarantee delivery — some browsers (Safari's ITP, Chrome's third-party-cookie phase-out) additionally block or partition cross-site cookies regardless of `SameSite` config. This resolves once web and api move to subdomains of the same purchased domain (planned), since same-site requests aren't subject to that restriction and `SameSite=None` continues to work unchanged either way — no code or cookie-attribute changes needed when that move happens.

There's also a third, non-HttpOnly `trakwyn_logged_in` hint cookie (`COOKIES.LOGGED_IN`), set alongside the real ones with the refresh token's lifetime. Since the web app can never read the actual (HttpOnly) tokens, this is what protected/auth-gated routes (`/`, `/login`, `/_authenticated`) check client-side via `hasSessionCookie()` (`apps/web/src/graphql/client.ts`) — a synchronous `document.cookie` read, no network call. It only needs to be directionally correct: the real access-token cookie is attached automatically by the browser on every request, and `gqlClient`'s `responseMiddleware` silently refreshes and retries on an `UNAUTHORIZED` response regardless of what the hint said. Routes set `ssr: false` so this check runs client-side — TanStack Start does not re-run `beforeLoad` on initial hydration unless a route opts out of SSR this way. **Deploy prerequisite:** the API's `CORS_ORIGIN` env var must contain the web app's exact deployed origin — `corsPlugin.ts` validates `credentials:true` requests against it, and a mismatch silently breaks cookie delivery regardless of anything else being correct.

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
