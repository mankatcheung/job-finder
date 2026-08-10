# design-sync notes for job-finder

## Package shape, no Storybook

`packages/ui` has no `.storybook/` and no `*.stories.*` files — confirmed with the user, deliberately skipped for now (only 5 components as of this writing; revisit once the set grows past ~10-15).

## Two gotchas fixed to make this package sync-able

1. **No compiled `.d.ts` tree.** `packages/ui/package.json` points `main`/`types` at raw `./src/index.ts` (deliberate — lets `apps/web` consume live source via Vite with no rebuild step). The converter's prop-extraction (`.d.ts`-based `<Name>Props`) globs for real `.d.ts` files and finds none there, so it would either crash (`ZERO_MATCH`) or fall back to a much weaker synthesized contract.

   Fix: added a **declaration-only** build (`packages/ui/tsconfig.build.json`, `emitDeclarationOnly: true` → `dist/*.d.ts`) plus `"publishConfig": {"types": "./dist/index.d.ts"}` in `package.json`. `findTypesRoot()` in the converter's `lib/dts.mjs` checks `publishConfig.types` _before_ `types` — exactly for this workspace-package pattern (dev `types` points at src, publishConfig carries the built one). `main`/`types` themselves were left untouched, so `apps/web`'s live-source dev experience is unaffected. `buildCmd` in config.json runs `pnpm --filter @job-finder/ui build`, which also now compiles `dist/styles.css` (next point).

2. **No compiled CSS at all.** The whole package styles via bare Tailwind utility classes (`bg-blue-600`, `dark:bg-gray-700`, etc.) with zero design tokens or CSS-in-JS — nothing for `cfg.cssEntry` to point at out of the box. Without a real stylesheet, every preview (and every future design built with these components in claude.ai/design) would render completely unstyled.

   Fix: added `@tailwindcss/cli` + `tailwindcss` as devDependencies, a `packages/ui/src/styles.css` entry (`@import 'tailwindcss'; @source './';`), and a build step compiling it to `dist/styles.css`. `cfg.cssEntry` points there.

   **Important**: `packages/ui/src/styles.css` also repeats the app's `@custom-variant dark (&:where(.dark, .dark *));` from `apps/web/src/styles.css` — dark mode here is a `.dark` class toggle, not `prefers-color-scheme`. Without this line Tailwind v4's default `dark:` behavior (media-query based) would make the compiled CSS behave differently from the real app. **If `apps/web`'s dark-mode strategy ever changes, this line needs to change too** — it's currently hand-duplicated, not shared.

3. **`--node-modules` must point at `apps/web/node_modules`**, not `packages/ui/node_modules` or the repo root. `packages/ui` doesn't depend on itself (so it has no `@job-finder/ui` entry under its own `node_modules` for `join(NODE_MODULES, PKG)` to resolve), and pnpm doesn't hoist workspace packages to the repo root here — only `apps/web` (the sole consumer) has `@job-finder/ui` symlinked under its `node_modules`, which is also where `react`/`react-dom`/`@types/react` resolve for this package (all pinned at exactly `19.2.7` in `packages/ui/package.json` to avoid the "Incompatible React versions" crash pnpm's own resolver produced when left on caret ranges — see the `feat/design-system-ui-package` PR).

## Known render warns

- `[RENDER_THIN]` on `IconButton` — every export legitimately has no text (it's an icon-only button by design, `aria-label`/`title` carry the accessible name instead of visible text). Confirmed via the individual `actions__IconButton.png` screenshot: all icons (X, trash, external-link) render correctly at both sizes and both variants. Triaged as benign — re-syncs should not treat this as a new issue.

## Re-sync risks

- If a 6th+ component is added to `packages/ui` with its own new Tailwind class _pattern_ not already covered by the 5 synced components (e.g. a new color scale, an arbitrary-value class like `w-[42px]`), the compiled `dist/styles.css` picks it up automatically on rebuild — no action needed, `@source './'` scans the whole package.
- The `publishConfig.types` / declaration-build split is easy to silently break: if someone changes `packages/ui/package.json`'s real `main`/`types` fields to point at `dist/` directly (e.g. "preparing to publish it"), the converter's _bundle_ entry resolution (`resolveDistEntry`, which reads `main`, not `publishConfig`) would then need `dist/index.js` (a real JS bundle) to exist too — currently only `.d.ts` is emitted. Re-run the build and check for `[NO_DIST]` if that happens.
- The dark-mode `@custom-variant` duplication (point 2 above) is the main thing that can silently drift from the real app.
