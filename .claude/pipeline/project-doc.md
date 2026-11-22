# Project Documentation

> Generated: 2026-11-22T19:23:13Z | Mode: FULL
> Source baseline: `b42d6a5916e50cc29c625d5c7e0ee41025099eff`

## Tech Stack

- Runtime: browser application; Node.js 24 in the deployment workflow. Local scan environment: Node.js 24.22.2 / npm 11.19.1. No Node engine constraint is declared.
- Language: TypeScript / TSX, ES modules, ES2022 target. TypeScript strict mode, implicit-any checking, and strict-null checking are disabled in `tsconfig.json`.
- Framework: React 19.2.3, bundled by Vite 7.3.0 with the React plugin.
- Database: none. The game operates on an in-memory simulated filesystem.
- Styling: Tailwind through its browser CDN, inline styles in `index.html`, and local CSS for narrative/glitch effects. JetBrains Mono is loaded from Google Fonts.
- State management: `useReducer(gameReducer)` in `src/App.tsx`; `GlobalInputProvider` arbitrates keyboard input. Some UI/narrative behavior uses local hook state.
- Hosting: static GitHub Pages site at <https://mhenke.github.io/yazi-quest/>.

## Dependencies

Versions below are resolved from `package-lock.json`, not claims about the newest available releases.

| Group        | Libraries and resolved versions                                                                                                |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Core         | `react` 19.2.3, `react-dom` 19.2.3, `lucide-react` 0.556.0                                                                     |
| Development  | `vite` 7.3.0, `@vitejs/plugin-react` 5.1.2, `typescript` 5.9.3                                                                 |
| Code quality | `eslint` 9.39.2, `@typescript-eslint/parser` and plugin 8.51.0, `prettier` 3.7.4, `husky` 9.1.7, `lint-staged` 16.2.7          |
| Testing      | `vitest` 4.0.16, `jsdom` 27.4.0, `@testing-library/react` 16.3.1, `@testing-library/jest-dom` 6.9.1, `@playwright/test` 1.57.0 |

Several development dependencies use `*` in `package.json`. Reproducible deployment uses `npm ci` and the npm lockfile; `pnpm-lock.yaml` also exists, but the current workflow does not consume it. The offline dependency doctor reported wildcard constraints, not a resolver or security audit.

## Architecture Pattern

A client-only React application organized by technical concern, with declarative curriculum content and a centralized game reducer. `App.tsx` orchestrates initialization, derived views, task evaluation, transitions, and input registrations; it remains a large integration component rather than a thin shell.

The runtime tree is `StrictMode` → `ErrorBoundary` → `GlobalInputProvider` → `App`. Keyboard behavior is split into mode-specific handlers. Narrative hooks observe game state and feed notifications, dialogue, effects, and timers back into the UI.

The root `index.tsx` is a separate legacy entry file. The actual HTML module entry is `src/index.tsx`, which includes the required input provider.

## Folder Structure

| Location                                       | Purpose                                                                                 |
| ---------------------------------------------- | --------------------------------------------------------------------------------------- |
| `src/components/`                              | Filesystem panes, preview, HUD, dialogs, intros, outro, and alerts                      |
| `src/components/narrative/`                    | Boot-sequence and ghost-message presentation                                            |
| `src/components/ui/`                           | Diegetic prompt and glitch-overlay components                                           |
| `src/hooks/`                                   | Game reducer, keyboard coordination, timers, and narrative hooks                        |
| `src/hooks/keyboard/`                          | Navigation, clipboard, deletion, fuzzy modes, sorting, and modal handlers               |
| `src/constants/`                               | Levels, keybindings, episode/narrative content, timings, and filesystem setup           |
| `src/constants/filesystem/`                    | Initial tree, level mutations, prerequisites, and consequence scenarios                 |
| `src/utils/`                                   | Filesystem operations, visible-item derivation, sorting, validation, sound, and effects |
| `src/types.ts`                                 | Shared filesystem, level, clipboard, settings, and game-state contracts                 |
| `tests/e2e/`                                   | Playwright specs, fixtures, and keyboard/game helpers                                   |
| `public/images/`                               | Static simulation/narrative images                                                      |
| `docs/`                                        | Narrative/curriculum reference and historical plans; plans may be closed or stale       |
| `.github/workflows/`                           | Production build and Pages deployment                                                   |
| `.husky/`                                      | Commit and push hooks                                                                   |
| `.claude/pipeline/`                            | This scan snapshot and scan checkpoint                                                  |
| `dist/`, `test-results/`, `playwright-report/` | Generated build/test artifacts; ignored by Git                                          |

## Code Style Conventions

- React components use PascalCase filenames; hooks use `use…` names; utilities use camelCase filenames. Content collections commonly use upper-snake-case constants.
- Relative imports dominate the inspected source. The configured `@/*` alias resolves from the repository root, not automatically from `src/`.
- Both named and default exports exist. Components are predominantly functional; `ErrorBoundary` is a class component.
- Prettier specifies two-space indentation, semicolons, single quotes, a 100-column width, and ES5-compatible trailing commas. These settings supersede historical prose claiming trailing commas everywhere.
- ESLint uses flat configuration with TypeScript, React/hooks, import, accessibility, security, and Prettier rules. Some checks are disabled; `npm run lint` uses `--quiet`, so a passing run does not establish that warnings are absent.
- Unit tests are colocated as `*.test.ts` / `*.test.tsx`; browser scenarios use `tests/e2e/*.spec.ts`.

## Modularity Practices

- Use existing filesystem helpers and clone-before-mutation setup patterns; reducer-owned trees are treated as immutable.
- `useKeyboardHandlers` coordinates handlers under `src/hooks/keyboard/`. `App` also registers mode/modal input through `useGlobalInput`.
- Input handlers have priority, enabled-state, and input-focus capture options. A consumed event stops further handlers; do not model this as independent global listeners per modal.
- Level task checks are content-driven. Filesystem prerequisites and consequences belong with filesystem setup, not in presentation components.
- Narrative content and narrative hooks are separated, but some game-specific narrative coordination remains in `App`.
- The previously proposed input-handler/context extraction is cancelled in the closed roast-fixes round 2 documents; it is not the current architecture.

## Data Architecture

- `FileNode` represents files, directories, and archives in a tree, with identity, optional parent/children, simulated contents/metadata, and protection/honeypot flags.
- Navigation paths are arrays of node IDs. Display paths and zoxide history use readable path strings. `Level.allowedDeletePaths` is a distinct name-based policy, optionally gated by task completion.
- `Level` belongs to an episode and contains tasks. Each task checks the current game state; completion and advancing to the next level are separate events. Canonical domain terms are defined in `GLOSSARY.md`.
- Clipboard state contains nodes, a yank/cut action, and the original path. Search results can carry transient path metadata that clipboard operations strip before writing nodes into the tree.
- Game state includes the current mode/path/cursor, selections, filesystem and level-start snapshots, task completion, modal flags, timers, keystroke budgets, and narrative statistics.
- Browser storage persists only `yazi-quest-zoxide-history` and `yazi-quest-cycle` in the inspected save effect. The complete filesystem, current level, task progress, and settings are not serialized there.
- Stored zoxide data is parsed and checked with `isValidZoxideData`; invalid/unavailable history falls back to seeded entries. Cycle count is parsed separately. Storage access is protected with error handling.

## Cross-Cutting Concerns

- Authentication/authorization: no application login/session backend. Protected files and threat rules are simulated gameplay policies, not real host filesystem permissions.
- Error handling: fallible filesystem operations return the `Result<T, FsError>` union from `src/types.ts`; handlers check the result before updating state. `ErrorBoundary` catches render failures and offers reload; `reportError` writes to the console. `safeExec` has a separate success/error result union. No remote telemetry implementation was found.
- Validation: zoxide storage shape validation, filesystem protection checks, operation-specific guards, and regex handling in view/input paths. These checks are not a general schema-validation framework.
- Accessibility: keyboard input, some ARIA roles/labels, decorative-layer hiding, and narrative-effect controls exist. Focus management and dialog semantics are inconsistent; this scan is not a WCAG audit.
- Settings: sound and narrative-effect settings are in-memory. The main glitch wrapper distinguishes `minimal` from other values; do not assume the displayed `reduced` option means every effect has a separate reduced implementation.
- Security: Vite substitutes configured Gemini environment values into client code. Such values are public if used in the bundle; environment files do not provide a secret backend. No Gemini API call was found in scanned source.

## Service Communication

No REST, GraphQL, WebSocket, or application event-bus service boundary was found in scanned source. Reducer dispatch and the keyboard registry coordinate the local application; a browser skip-intro event supports intro transitions.

External resources include the Tailwind CDN, Google Fonts, an external favicon/background image, and a configured S3 conclusion-video URL. Their presence does not verify their availability. `index.html` also retains an AI Studio-era import map; the production app is built by Vite.

## Test Coverage

- Overall coverage: **unmeasured**. No coverage summary, LCOV report, configured coverage provider, or installed Vitest coverage provider was found. A percentage cannot be inferred from passing tests.
- Frameworks: Vitest with jsdom; Testing Library for component/hooks tests; Playwright for Chromium E2E scenarios.
- Inventory: **12 unit-test files**, **16 E2E spec files**, and shared E2E fixtures/helpers.
- Unit-test areas: filesystem/game helpers, skip-intro flag, consciousness/glitch helpers, terminal thoughts and ghost dialogue, boot/ghost UI, diegetic prompt, and glitch overlay.
- Areas without dedicated colocated unit tests in the inventory: `gameReducer`, keyboard mode handlers, input arbitration, timer integration, and storage validation. Some are exercised through E2E; this is not a claim of zero executed coverage.
- E2E scenarios: all three episodes and level advancement, intro/skip pathways, modal input, clipboard restrictions, file creation, honeypots/protected assets, failure limits, persistence, protocol violations, and selection/Escape behavior.
- E2E helpers use URL debug parameters, clear localStorage for isolated level starts, and centralize keyboard sequences. Tests use root-relative URLs; the Playwright server explicitly overrides Vite's base to `/`.
- Verification already observed in this session before the documentation scan: **101/101 local E2E tests passed**, lint/type-check/build passed, the Pages workflow succeeded, and live keyboard input completed two Level 1 objectives. No new test suite or coverage run was performed for this documentation-only scan.

## Entry Points

- `index.html` loads `src/index.tsx`; `src/App.tsx` owns game initialization and orchestration.
- `src/hooks/gameReducer.ts`, `src/GlobalInputContext.tsx`, `src/hooks/useKeyboardHandlers.ts`, and `src/constants/levels.ts` are central behavior entry points.
- `vite.config.ts` configures the production `/yazi-quest/` base, port 3000, React, environment substitution, aliases, and Vitest discovery.
- `playwright.config.ts` configures Chromium, the local dev server, timeouts, retries, and artifacts. Run with `--reporter=list` as required by project instructions.
- `.github/workflows/deploy.yml` uses Node 24, `npm ci --ignore-scripts`, type-check, build, and Pages artifact/deploy actions on pushes to `main` or manual dispatch.
- Normal `npm install` triggers `npx playwright install --with-deps`; this machine's attempt failed at password-protected sudo. Installation with `--ignore-scripts` and a separate Chromium download succeeded. Static deployment intentionally skips browser/OS installation and Git hooks.
- `AGENTS.md` contains task-routing instructions; `GLOSSARY.md` contains implementation-free vocabulary. The README links the live game.

## Last Scanned

2026-11-22T19:23:13Z
