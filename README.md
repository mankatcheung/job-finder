# Trakwyn

Trakwyn is a job application tracker that helps you manage your job search end to end: log applications, track interview rounds and offers, keep notes and documents attached to each one, and get AI-assisted help drafting cover letters and filling in job descriptions.

The project is a monorepo with a GraphQL API, a web app, a browser extension for clipping job postings, and a CLI.

## Apps

| App       | Path             | Description                                                                                                                  |
| --------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| API       | `apps/api`       | Fastify + Mercurius + Pothos GraphQL server, following Clean Architecture. Owns auth, data, and all business logic.          |
| Web       | `apps/web`       | TanStack Start (SSR React) frontend — the main UI for managing applications.                                                 |
| Extension | `apps/extension` | Browser extension ("Trakwyn Clipper") that saves job postings from LinkedIn, Indeed, and Glassdoor straight to your account. |
| CLI       | `apps/cli`       | `tw` command-line tool for authenticating and managing applications from the terminal.                                       |

## Features

- **Applications** — track job applications through their lifecycle, with interview rounds, offers, and outcomes.
- **Notes & documents** — attach notes and versioned documents (resumes, cover letters) to each application; upload via local disk (dev) or Vercel Blob (prod).
- **Contacts & conversations** — keep track of recruiters/contacts and message threads per application.
- **AI assistance (bring-your-own-key)** — auto-fill job descriptions and generate cover letters using your own OpenRouter or Google AI key, plus a chat assistant and company briefings.
- **Calendar & reminders** — interview scheduling and follow-up reminders, with email (Brevo) and web push notifications.
- **Analytics** — dashboards for response times, application channels, interview rounds, and offer outcomes.
- **Auth** — email/password with TOTP two-factor, Google/GitHub OAuth, session management, security event log, and API tokens for CLI/extension access.
- **Share links** — share a read-only summary of your job search progress via a public link.
- **Weekly digest** — scheduled email summary of your job search activity.
- **Localization** — web app available in 5 locales (i18next).

## Prerequisites

- Node.js >= 24
- pnpm >= 9

## Local Setup

1. **Install dependencies** (from the repo root):

   ```bash
   pnpm install
   ```

2. **Configure environment variables** — copy both example env files and fill them in:

   ```bash
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env
   ```

   In `apps/api/.env`, at minimum set:
   - `DATABASE_URL` — an **absolute path** to a local SQLite file, e.g. `file:/absolute/path/to/trakwyn/apps/api/local.db`
   - `JWT_SECRET` and `JWT_REFRESH_SECRET` — any strong random values
   - `TOTP_ENCRYPTION_KEY` and `LLM_API_KEY_ENCRYPTION_KEY` — any strong random values

   Everything else in `apps/api/.env.example` (OAuth, email, push, Redis, observability) is optional for local dev and can be left blank — those features are simply disabled until configured.

3. **Apply database migrations:**

   ```bash
   pnpm db:migrate
   ```

4. **Run the app** (starts both the API and web app):

   ```bash
   pnpm dev
   ```

   The API runs at `http://localhost:3001` and the web app at `http://localhost:3000` (proxying `/graphql` to the API).

## Other Useful Commands

```bash
pnpm build       # Build all packages
pnpm typecheck   # Type-check all packages
pnpm test        # Run all tests
pnpm lint        # Lint
pnpm format      # Format with Prettier

cd apps/api && pnpm db:studio   # Open Drizzle Studio to inspect the local DB

# GraphQL codegen (requires the API running at localhost:3001)
cd apps/web && pnpm codegen
```

See [CLAUDE.md](./CLAUDE.md) for architecture details and development conventions.

## License

[AGPL-3.0](./LICENSE)
