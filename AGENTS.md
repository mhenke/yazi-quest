# AGENTS.md — Yazi Quest

> Scanner-maintained instructions; last reviewed 2026-11-23.
> Future scanner updates require detected architectural changes and human confirmation.

## Stack Context

React + TypeScript + Vite, deployed as a static browser game on GitHub Pages.
The filesystem and security threats are simulated; there is no application backend.
Tailwind is compiled at build time via PostCSS — there is no runtime Tailwind CDN, so a
class that is not literally present in `index.html` or `src/**/*.{ts,tsx}` will not exist
in the bundle.

The product is **desktop, hardware-keyboard play at 1024 CSS px or wider** (ADR-0001).
That is scope, not a bug: a narrower window or a touch device gets a product notice
(`RequirementNotice`), and its wording names the real requirement.

## How to Read This File

- **Architecture or dependency work:** read `.claude/pipeline/project-doc.md` for the
  scanned module map, versions, persistence boundaries, and known verification limits.
- **Codebase exploration:** when `graphify-out/graph.json` exists, run `graphify query "<question>"`
  before grep or file search. Run `graphify update .` after modifying code.
- **Domain terminology:** read `GLOSSARY.md` before naming episodes, levels, tasks, or cycles.
- **Level, narrative, or layout changes:** read the Narrative Design, Task Description
  Style Guide, Episode Color Scheme, and UI Layout Guidelines sections in
  `.github/copilot-instructions.md`.
- **E2E changes or debugging:** read that file's Anti-Failure Protocols and Development
  Environment sections. Its old `src/constants.tsx` references mean the current
  `src/constants/` modules.
- **Deployment changes:** read README's Deployment section and `.github/workflows/deploy.yml`.

## Architecture Guardrails

- Keep reducer-owned filesystem state immutable. Use `src/utils/fsHelpers.ts`, or
  clone the tree before applying existing level setup/mutation routines.
- Navigation paths contain node IDs, not filenames. Resolve them through filesystem
  helpers; `Level.allowedDeletePaths` is a separate, name-based policy.
- Keep input routing in `GlobalInputProvider` / `useGlobalInput` and the existing
  mode handlers. Preserve priority, event consumption, and input-focus behavior.
- Level definitions and task checks live in `src/constants/levels.ts`; filesystem
  seeds, prerequisites, and consequences live in `src/constants/filesystem/`.
- Player actions must satisfy objectives. Do not pre-solve them with level-specific
  filesystem injections.
- Mission navigation belongs in the Quest Map, not a new left sidebar.
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

## Testing Requirements

- Run `npm run type-check` after code changes and the narrow check covering the behavior.
- Run Playwright with `--reporter=list`; use existing fixtures and keyboard helpers.
  Because `CI=true` is exported here, prefix E2E with `env -u CI` or Playwright starts a
  second dev server and collides on port 3000.
- Preserve literal user-reported key sequences. Replicate the reported workflow before
  substituting another command sequence; capture a screenshot immediately after a UI failure.
- Verify relevant level/episode states using URL debug parameters from `src/App.tsx`.
- Coverage percentage is unmeasured. Test counts and passing runs are not coverage.
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
