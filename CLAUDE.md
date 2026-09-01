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

In production web and api are deployed on subdomains of the same purchased domain (e.g. `www.trakwyn.com` / `api.trakwyn.com`), which the browser treats as the same _site_ — cookies are still `SameSite=None; Secure` (harmless same-site, and avoids relying on same-site classification). **Deploy prerequisite:** `COOKIE_DOMAIN` must be set to the shared registrable domain with a leading dot (e.g. `.trakwyn.com`), or `setAuthCookies()`/`clearAuthCookies()` (`apps/api/src/http/schema/types/AuthPayloadType.ts`) default to host-only cookies scoped to the api subdomain alone — the HttpOnly tokens still work for direct API calls, but the non-HttpOnly `trakwyn_logged_in` hint cookie (below) becomes invisible to `document.cookie` on the web subdomain, breaking client-side session detection even though login "succeeds." (Historical note: when web/api lived on unrelated domains like distinct `*.vercel.app` subdomains — different _sites_ — `SameSite=None` was required just to get cookies attached cross-site at all, and was additionally at the mercy of browsers like Safari's ITP or Chrome's third-party-cookie phase-out blocking/partitioning them regardless of `SameSite` config.)

There's also a third, non-HttpOnly `trakwyn_logged_in` hint cookie (`COOKIES.LOGGED_IN`), set alongside the real ones with the refresh token's lifetime and sharing the same `COOKIE_DOMAIN`. Since the web app can never read the actual (HttpOnly) tokens, this is what protected/auth-gated routes (`/`, `/login`, `/_authenticated`) check client-side via `hasSessionCookie()` (`apps/web/src/graphql/client.ts`) — a synchronous `document.cookie` read, no network call. It only needs to be directionally correct: the real access-token cookie is attached automatically by the browser on every request, and `gqlClient`'s `responseMiddleware` silently refreshes and retries on an `UNAUTHORIZED` response regardless of what the hint said. Routes set `ssr: false` so this check runs client-side — TanStack Start does not re-run `beforeLoad` on initial hydration unless a route opts out of SSR this way. **Deploy prerequisite:** the API's `CORS_ORIGIN` env var must contain the web app's exact deployed origin — `corsPlugin.ts` validates `credentials:true` requests against it, and a mismatch silently breaks cookie delivery regardless of anything else being correct.

**Session revocation (JEF-164):** access-token verification is otherwise stateless (signature + expiry only), so a revoked session's already-issued access tokens would keep working until their own 15-minute expiry. Every revocation path therefore also writes the `sid` to a blocklist that `AuthenticateRequestUseCase` checks on each request. The write side is centralized in `BlocklistingSessionRepository` — a decorator over `DrizzleSessionRepository`, following the same inner/outer DI shape as the `Cached*Repository` family — so all four revocation paths (`RevokeSessionUseCase`, `RevokeOtherSessionsUseCase`, `ResetPasswordUseCase`, and `RotateRefreshTokenUseCase`'s reuse-detected branch) are covered without any call site having to remember. Backed by Redis in production and an in-process map in dev, selected by the same `CACHE_PROVIDER` toggle as the cache and rate limiter. **It fails open by design:** any backing-store error resolves to "not revoked" and the request proceeds, so a Redis outage degrades to the old up-to-15-minute revocation delay rather than unauthenticating the entire API — the DB `revokedAt` remains the source of truth and is still enforced at refresh time.

**MCP server:** `POST /mcp` (`http/routes/mcp.routes.ts`) exposes a read-only Model Context Protocol server — JSON-RPC 2.0, protocol `2024-11-05`, advertised as `trakwyn-mcp`. The route owns only transport and auth; all protocol logic (`initialize`, `tools/list`, `tools/call`, the `MCP_TOOLS` catalogue, JSON-RPC error shaping) lives in `interface-adapters/mcp/McpController.ts`. Auth is deliberately different from GraphQL's: `AuthenticateMcpRequestUseCase` accepts **API tokens of either scope** (`read` or `full`) and rejects JWTs outright, whereas `AuthenticateRequestUseCase` requires `full` — so a `read` token reaches MCP and nothing else, which is the pairing that makes the read-only tool surface meaningful. Every tool is scoped to the authenticated `userId`. **Tools carry an `access: 'read' | 'write'` tag** (JEF-176): `tools/list` hides write tools from a `read`-scoped token and `tools/call` refuses them outright — the refusal is the security boundary, the hiding is only a convenience for the model. The tag is internal and stripped before going over the wire. The catalogue lives in `interface-adapters/llm/toolCatalogue.ts` (JEF-177). It's a presentation contract — names, descriptions, JSON Schema — so it sits with the other outward-facing schemas rather than in `use-cases/`. Nothing in `use-cases/` imports it: `ChatWithAssistantUseCase` receives an injected `chatTools: LLMToolDefinition[]`, so it knows only the port type. **Which surface exposes which tools is a composition decision made in `http/di`** — `MCP_TOOLS` is the whole catalogue (writes gated per request by token scope), `chatTools` is built from `CHAT_TOOLS` (reads only, since chat is session-authenticated and has no scope to gate on). A test walks all of `use-cases/` and fails on any import from `interface-adapters/`, so the direction can't quietly regress. Note it's POST-only JSON-RPC with no `GET`/SSE endpoint or session handling, i.e. a subset of MCP's Streamable HTTP transport. **When adding a tool,** add it to `TOOL_CATALOGUE` _and_ the `tools/call` switch of every surface that exposes it — a tool advertised but unhandled fails at call time. Parity tests on both surfaces catch this.

**Storage:** Toggled by `STORAGE_PROVIDER` env var (`local` | `vercel-blob`). `LocalStorageProvider` writes to disk for dev; `VercelBlobStorageProvider` uses Vercel Blob for prod. Document upload flow: `requestUploadUrl` → client uploads directly to storage → `confirmDocument`. The upload step itself differs by provider: `VercelBlobStorageProvider` returns a Blob client token, uploaded via `@vercel/blob/client`'s `put()`; `LocalStorageProvider` returns a URL under its own `/uploads/_upload/*` path (registered directly on the Fastify instance in `buildApp.ts`, guarded by `STORAGE_PROVIDER === 'local'`), which the web app's `DocumentsTab` detects (`uploadUrl.includes('/_upload/')`) and `PUT`s the file to directly with `fetch` instead of calling `put()`. `corsPlugin.ts` lists `PUT` in `methods` explicitly for this — `@fastify/cors`'s default omits it, since every other route was GraphQL POST.

**Email:** Toggled by `EMAIL_PROVIDER` env var (`brevo` | `console`, defaults to `brevo`). `BrevoEmailService` calls the real Brevo API; `ConsoleEmailService` (dev/CI, when there's no `BREVO_API_KEY`) logs each email — including its confirmation/reset URL — instead of sending it. Every mail-sending flow (email change, backup email, password reset, new-device login alerts, digests) throws if `BrevoEmailService` runs with a blank key, so this isn't just a convenience: `RequestEmailChangeUseCase` and friends propagate that failure as a 500 rather than swallowing it (unlike `RegisterUseCase`'s best-effort verification send, since an account is usable without it).

**Database:** Drizzle ORM (`drizzle-orm/libsql`) via `@libsql/client`. Dev uses a local SQLite file (`local.db`). Prod targets Turso (`DATABASE_URL` + `DATABASE_AUTH_TOKEN`) — unlike Prisma 7's CLI, `drizzle-kit migrate` connects through the same libsql client used at runtime, so it can apply migrations to a remote Turso URL directly. Schema lives in `src/infrastructure/db/schema.ts`; migrations are generated into `drizzle/` via `pnpm db:generate` and applied via `pnpm db:migrate`. Schema: `User → JobApplication → [Note, Document]` (all cascade-delete). libsql does not enforce foreign keys by default — `client.ts` and `createTestDb.ts` both run `PRAGMA foreign_keys = ON` explicitly; without it, `ON DELETE CASCADE` silently no-ops.

**Observability (JEF-129):** traces, logs, and metrics go to Axiom via OTel (`infrastructure/observability/tracing.ts`); metrics additionally require `AXIOM_METRICS_DATASET`. Application counters are defined in `infrastructure/observability/metrics.ts` behind an injectable `IMetrics` port (inject `makeFakeMetrics()` from `__tests__/helpers/fakeMetrics.ts` to assert on them). Counters are created lazily on first use, since a meter obtained before `startObservability()` runs would be a no-op that never upgrades. Two things are measured: cache hit/miss, recorded by the `InstrumentedCache` decorator at the `ICache` boundary so `MemoryCache` and `RedisCache` are comparable (it infers hit vs. miss from whether the caller's `fetch` callback ran — `getOrSet` returns a value either way); and Redis fail-open events plus circuit-breaker transitions across all three guarded subsystems (cache, rate limiter, session blocklist). That second set matters most: those paths degrade silently by design, so without a counter an outage looks like normal operation while rate limiting and session revocation are quietly not working.

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

Key API env vars: `DATABASE_URL` must be an absolute path for local SQLite (e.g. `file:/absolute/path/to/trakwyn/apps/api/local.db`). `JWT_SECRET` and `JWT_REFRESH_SECRET` must be set.

## Key Conventions

- **IDs** are `nanoid()` strings, not auto-increment integers.
- **Domain entities** are plain TypeScript objects/classes with no Drizzle or framework imports. Mappers bridge Drizzle rows ↔ domain.
- **Adding a new feature** follows the layer order: domain entity → port interface → use case → Drizzle repository implementation → Pothos type/resolver → GraphQL mutation/query → register in the matching `http/di/` module → add `.graphql` file in web → run codegen → build UI.
- **Failing from a use case:** throw a `DomainError` subclass from `use-cases/errors/DomainError.ts` — `NotFoundError`, `ForbiddenError`, `ConflictError`, `UnauthorizedError`, `ValidationError`, `RateLimitedError`, `StepUpRequiredError`, `UserNotFoundError`, `AiNotConfiguredError`, `AiResponseInvalidError`, `ServiceUnavailableError`. They carry a `code` and no HTTP status; `http/errors/formatError.ts` turns the code into a status at the boundary via `fromCodedError`. **Do not** import `http/errors/AppError` from a use case (that puts `404` inside a business rule), **do not** `throw new Error(...)` for anything the client should see, and **do not** hand-roll `Object.assign(new Error(...), { code })` — a bare Error has no code, so it surfaces as `INTERNAL_ERROR`/500 and is logged as a server fault. A new subclass needs a matching `fromCodedError` case or it degrades to a 500 the same way. All three rules are enforced by `__tests__/architecture/domainErrors.test.ts`. `AppError` remains the vocabulary for HTTP routes and resolvers, which legitimately know about status codes.
- **Deletes are hard, with one exception, and `onDelete` is the retention policy.** The exception is `JobApplication.deletedAt` — deleting an application moves it to Trash and a nightly job (`/admin/trash/purge`) removes it thirty days later. The filter lives in `DrizzleApplicationRepository`, not in use cases, so every consumer is covered by construction: lists, search, analytics, the MCP tools, and the digest and reminder jobs that would otherwise email about something the user deleted. `findById` reports a trashed application as missing; `findByIdIncludingTrashed` is the deliberate opt-out, used only by the detail query and the Trash operations. Nothing else has a `deletedAt`, so for every other table a foreign key's on-delete action decides what survives. 31 of 33 keys cascade; the two exceptions are the mutual `Document` ↔ `DocumentDraft` link, which is `set null` because neither owns the other. The audit tables cascade **deliberately**, not by default: `SecurityEvent` and `LoginEvent` go with the `User` because they hold IP, device and location data that erasure should remove, and `ActivityLog` goes with its `JobApplication` because an application's history is part of the application. One consequence worth knowing: deleting an application leaves no record it ever existed. Every foreign key must be listed in `__tests__/architecture/onDeleteBehaviour.test.ts`, which fails on an unlisted one — so adding a table forces the decision rather than inheriting cascade by copying the table above it.
- **The layering is enforced, not just described:** `__tests__/architecture/dependencyRule.test.ts` fails if `domain/` reaches outward, if `use-cases/` imports `interface-adapters`/`infrastructure`/`http`, if `interface-adapters/` imports `infrastructure`/`http`, or if a framework (Drizzle, Fastify, GraphQL, Pothos, libsql, web-push) appears in `domain/` or `use-cases/`. It carries a short list of pre-existing violations, each tagged with the ticket that clears it — and fails if an entry stops violating, so a fix cannot leave its exemption behind.
- **Constants belong to a layer.** There is no shared module at the root of `src/` — `__tests__/architecture/constantsPlacement.test.ts` fails if one appears. Application policy (token lifetimes, quotas, TTLs, AI prompt budgets) goes in `use-cases/constants.ts`; `ERROR_CODES` sits with `DomainError` in `use-cases/errors/errorCodes.ts`; env names, provider selectors, vendor endpoints and cache internals in `infrastructure/config/constants.ts`; cookies, routes and rate limits in `http/constants.ts`; MCP identity and JSON-RPC framing in `interface-adapters/mcp/constants.ts`. That placement is what puts constants under the dependency rule at all — a use case importing `#src/http/constants.js` is an ordinary `use-cases -> http` violation. Before JEF-253 all of it lived in one root-level `src/constants.ts` that 23% of the package imported, invisible to the rule because a root module is in no layer. Values are stated once and derived, not restated: `COOKIE_MAX_AGE_S` is `TOKEN_LIFETIME_S`, and `ROUTES.OAUTH_FAKE_CONSENT` is `FAKE_OAUTH.CONSENT_PATH` (declared in infrastructure, since `FakeOAuthProvider` must not import `http/`).
- **Pothos schema:** Each resource has its type file (`http/schema/types/`), query file (`queries/`), and mutation file (`mutations/`). All are imported and composed in `http/schema/index.ts`.

## Workflow

- **Linear issue lifecycle:** Before an agent starts implementation for a Linear issue, set its status to **In Progress**. Do not begin coding while it remains in Backlog, Planned, Todo, or another status. After implementation is complete, the branch is pushed, and a PR is created, set the issue status to **In Review**. Only move it to **Done** after the PR is merged or the user explicitly asks for completion.
- **Branch name:** `<feat/fix/chore/...>/<linear-id>-<brief name>` — the Linear ID segment (lowercase, e.g. `jef-67`) is included only when the work maps to a Linear ticket; omit it otherwise.
  - With a ticket: `feat/jef-67-multi-provider-llm`
  - Without a ticket: `feat/animated-page-transitions`
- **Worktrees:** Always create feature worktrees in `.claude/worktrees/`, named the same as the branch with `/` replaced by `-` (e.g. `.claude/worktrees/feat-jef-67-multi-provider-llm`, `.claude/worktrees/feat-animated-page-transitions`). Use `git worktree add .claude/worktrees/<worktree-name> -b <branch-name> main`. A fresh worktree has no `.env` files and an unseeded local database (both gitignored) — run `pnpm setup:worktree` from inside it right after creation to copy env files from the main checkout, install dependencies, apply migrations, and seed the local database (see `scripts/setup-worktree.sh`).
- **Tests are mandatory, not a follow-up:** Every new or changed use case, resolver, repository, React component/page, or utility function ships with matching tests in the _same_ PR — mirror the existing convention for that layer (use-case tests with `helpers/mocks.ts` repository mocks, `createTestDb()` for Drizzle repositories, mocked-use-case-deps tests under `__tests__/interface-adapters/resolvers/`, `gqlClient`/router-mocked tests under `apps/web/src/__tests__/components/`). A Linear issue's implementation checklist is not done while a "tests" line item is unchecked, and a PR that adds behavior without matching tests should not be opened.
- **PRs:** After completing work, push the branch and create a PR. The user reviews PRs directly rather than merging from the CLI.
