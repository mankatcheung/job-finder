# Build context is the monorepo root (not apps/api) — pnpm workspaces need
# the root lockfile/pnpm-workspace.yaml to resolve correctly. On Zeabur, set
# the Dockerfile path to apps/api/Dockerfile with the build context at the
# repository root.
#
# NOTE: `pnpm deploy` (the usual way to produce a pruned, minimal-size
# production bundle from a pnpm workspace) was tried here and rejected: in
# this pnpm version (9.15.4), `pnpm deploy`'s pruned output breaks Node's
# ESM/CJS interop specifically for @prisma/client — verified locally, the
# exact same build boots fine from a normal `pnpm install`, but throws
# "Named export 'PrismaClient' not found" after `pnpm deploy`'s prune/clone.
# A full workspace install trades a larger image for guaranteed-correct boot
# behavior. Don't reintroduce `pnpm deploy` here without re-verifying this.

FROM node:22-slim AS build
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /repo

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @job-finder/api db:generate
RUN pnpm --filter @job-finder/api build

FROM node:22-slim AS runtime
WORKDIR /repo
ENV NODE_ENV=production
COPY --from=build /repo .

WORKDIR /repo/apps/api
EXPOSE 3001
CMD ["node", "dist/index.js"]
