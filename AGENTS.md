# AGENTS.md — Yazi Quest

> Scanner-maintained instructions; last reviewed 2026-11-27.
> Future scanner updates require detected architectural changes and human confirmation.

## Stack Context

React 19 + TypeScript 6 + Vite 8 + Tailwind CSS 4 + Vitest 5, deployed as a
static browser game on GitHub Pages. The filesystem and security threats are simulated;
there is no application backend. Tailwind runs through the Vite plugin; `src/index.css`
declares its source paths. Write complete utility class names so the scanner finds them.

The product is **desktop, hardware-keyboard play at 1024 CSS px or wider** (ADR-0001).
That is scope, not a bug: a narrower window or a touch device gets a product notice
(`RequirementNotice`), and its wording names the real requirement.

## How to Read This File

- **Architecture or dependency work:** read `.claude/pipeline/project-doc.md` for the
  scanned module map, versions, persistence boundaries, and known verification limits.
- **Code exploration (Graphify):** query before searching when `graphify-out/` exists. Run
  `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"`
  before grepping or reading files. Baseline index lives at root `graphify-out/` and is
  symlinked into worktrees (`ln -s ../../graphify-out .worktrees/<lane-name>/graphify-out`).
  Run `npm run graphify:update` after structural changes; avoid concurrent rebuilds across
  worktrees. Exploration aid only (never an architectural authority or runtime dependency);
  keep `graphify-out/` uncommitted.
- **Domain terminology:** read `GLOSSARY.md` before naming episodes, levels, tasks, or cycles.
- **Level, narrative, or layout changes:** read the Narrative Design, Task Description
  Style Guide, Episode Color Scheme, and UI Layout Guidelines sections in
  `.github/copilot-instructions.md`.
- **File-manager controls or instructions:** verify keybindings and their behavior against
  [Yazi's Quick Start](https://yazi-rs.github.io/docs/quick-start/#keybindings) before changing
  handlers, objectives, hints, or walkthroughs.
- **E2E changes or debugging:** read that file's Anti-Failure Protocols and Development
  Environment sections. Its old `src/constants.tsx` references mean the current
  `src/constants/` modules.
- **Deployment changes:** read README's Deployment section and `.github/workflows/ci.yml`
  and `deploy.yml`; deployment calls CI.

## Architecture Guardrails

- Keep reducer-owned filesystem state immutable. Use `src/utils/fsHelpers.ts`, or
  clone the tree before applying existing level setup/mutation routines.
- Navigation paths contain node IDs, not filenames. Resolve them through filesystem
  helpers; `Level.allowedDeletePaths` is a separate, name-based policy.
- Keep input routing in `GlobalInputProvider` / `useGlobalInput` and the existing
  mode handlers. Preserve priority, event consumption, and input-focus behavior.
- Level definitions and task checks live in `src/constants/levels.ts`; filesystem
  seeds, prerequisites, and consequences live in `src/constants/filesystem/`.
- Keep active level separate from the current cycle's furthest unlocked level; Quest Map
  and keyboard navigation use the latter. `src/utils/progressionStorage.ts` persists the
  high-water mark on ordinary launches; starting a new cycle clears it.
- Directory counts follow ADR-0002 (`docs/adr/0002-file-metadata-cache.md`): show size
  linemode counts only for loaded folders; keep the parent pane blank and archives byte-sized.
- Set clipboard restrictions in `Level.clipboardPolicy`; keep mission copy independent
  of which commands the game allows.
- Player actions must satisfy objectives. Do not pre-solve them with level-specific
  filesystem injections.
- Preserve Yazi's three-pane layout: parent, current directory, preview. Keep mission
  navigation in the Quest Map; do not add a mission sidebar.
- Platform gating is one requirement with two halves. Primary input is proxied by
  `(hover: none) and (pointer: coarse)` and enforced in three places that must move
  together: the CSS gate in `index.html`, the mount guard in `src/index.tsx`, and
  `src/hooks/useViewportFloor.ts`. The width floor lives in React, not CSS, so
  cinematics stay reachable below 1024 px; both halves render `RequirementNotice`.
- Episode colours are literal tokens in `src/constants/palette.ts`; every Tailwind class
  an episode surface needs is written out in full there. When you need a new episode
  colour variant, add the finished class string to that record so the build scanner sees
  it. Classes assembled from fragments (`text-${hue}-400`) never reach the stylesheet.

## Code Style Rules

Use `.prettierrc`, `eslint.config.js`, and `tsconfig.json` as configuration authority.
Source code uses relative imports and both named and default exports; follow the
surrounding module. Preserve `Result<T, FsError>` handling for fallible filesystem
operations; use `src/utils/error.ts` for error reporting.

Dim text with a colour token (`text-zinc-400`), keeping element `opacity` for decoration.
Opacity multiplies contrast against the background and has pushed labels under 4.5:1 four
separate times across this codebase. Automated axe scans (`axe-core` against the running
dev server) are the check, and they currently report zero violations — keep it that way.

## Modularity Conventions

Keep keyboard mode behavior under `src/hooks/keyboard/`, reusable stateful behavior
under `src/hooks/`, and filesystem/view operations under `src/utils/`. Keep content
under `src/constants/` and UI under `src/components/`.

- `.fallowrc.json` enforces eight dependency zones and requires source files to match a
  zone. Check its rules when moving files or introducing cross-layer imports.

## Testing Requirements

- Run `npm run type-check` after code changes and the narrow check covering the behavior.
- Run Playwright with `--reporter=list`; use existing fixtures and keyboard helpers.
  The pre-push hook and CI start their own Vite on the next free port from 3100.
  To reuse the local dev server on port 3000, run Playwright with `env -u CI`.
- Preserve literal user-reported key sequences. Replicate the reported workflow before
  substituting another command sequence; capture a screenshot immediately after a UI failure.
- Verify relevant level/episode states using URL debug parameters from `src/App.tsx`.
- Run `npm run test:coverage` (`@vitest/coverage-v8`, configured in `vite.config.ts`) to
  measure Vitest unit and `fast-check` property coverage (`coverage/` is gitignored).
  Playwright E2E runs are not instrumented; test counts and passing runs are not coverage.
- `npm run audit:changed` (`fallow audit --base origin/main` then `knip`) gates commits.
  It fails only on _newly introduced_ findings; inherited ones are warnings.

## Security Rules

- Keep credentials out of source and commits. Environment variables substituted by Vite
  are public browser-bundle values, not a place for server-side secrets.
- Treat localStorage and player input as untrusted; preserve validation and storage error handling.
- Flag authentication/session changes explicitly: adding them changes the current client-only boundary.
- Keep logging free of secrets; `src/utils/error.ts` reports locally, not to a telemetry service.

## Agent-Specific Instructions

- **Orchestrator:** distinguish runtime work from documentation-only work; keep the closed
  roast-fixes backlog closed unless a concrete player-facing defect warrants reopening it.
- **Architect:** preserve reducer, input-priority, and level-policy boundaries before adding layers.
- **Developer:** reuse existing handlers and filesystem helpers; verify changes through player-visible behavior.
- **PR reviewer:** treat filesystem mutation, input fall-through, or exposed credentials as correctness/security defects.
- **QA:** cover intro skipping, task completion versus level advancement, modal input ownership,
  and level-specific deletion policies when those behaviors change.
