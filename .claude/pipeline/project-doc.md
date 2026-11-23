# Project Documentation

> Generated: 2026-11-23T12:20:00Z | Mode: DELTA
> Source baseline: `70a4928`..`99935c4` (18 commits) plus working-tree documentation

## Tech Stack

- Runtime: browser application; Node.js 24 in the deployment workflow. Local scan environment: Node.js 24.22.2 / npm 11.19.1. No Node engine constraint is declared.
- Language: TypeScript / TSX, ES modules, ES2022 target. TypeScript strict mode, implicit-any checking, and strict-null checking are disabled in `tsconfig.json`.
- Framework: React 19.2.3, bundled by Vite 7.3.7 with the React plugin.
- Database: none. The game operates on an in-memory simulated filesystem.
- Styling: Tailwind CSS 3.4.19 compiled at build time through PostCSS (`tailwind.config.js` scans `index.html` and `src/**/*.{ts,tsx}`; `postcss.config.js` runs Tailwind and Autoprefixer). Episode colours live in `src/constants/palette.ts` as literal utility strings so the scanner sees every class. Inline styles in `index.html` and local CSS cover narrative/glitch effects and the platform gates. The interface uses the system-monospace stack without a webfont download. Tailwind is pinned to v3 deliberately: v4 renames `outline-none`, rescales `rounded-sm`, and changes the default border colour, all of which would shift the existing visual design.
- State management: `useReducer(gameReducer)` in `src/App.tsx`; `GlobalInputProvider` arbitrates keyboard input. Some UI/narrative behavior uses local hook state.
- Hosting: static GitHub Pages site at <https://mhenke.github.io/yazi-quest/>.

## Dependencies

Versions below are resolved from `package-lock.json`, not claims about the newest available releases.

| Group        | Libraries and resolved versions                                                                                                                                                           |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Core         | `react` 19.2.3, `react-dom` 19.2.3, `lucide-react` 0.556.0                                                                                                                                |
| Build        | `vite` 7.3.7, `@vitejs/plugin-react` 5.1.2, `typescript` 5.9.3, `tailwindcss` 3.4.19, `postcss` 8.5.33, `autoprefixer` 10.7.0                                                             |
| Code quality | `eslint` 9.39.2, `@typescript-eslint/parser` and plugin 8.73.0, `prettier` 3.7.4, `husky` 9.1.7, `lint-staged` 16.2.7, `@commitlint/cli` 21.2.4, `@commitlint/config-conventional` 21.2.4 |
| Gate tooling | `fallow` 3.46.0 (dead code, complexity, duplication), `knip` 6.48.0 (unused exports and dependencies)                                                                                     |
| Testing      | `vitest` 4.1.12, `jsdom` 27.4.0, `@testing-library/react` 16.3.1, `@testing-library/jest-dom` 6.9.1, `@playwright/test` 1.57.0, `fast-check` 4.11.0                                       |

`npm run prepush` chains lint, type-check, build, the `@smoke` E2E subset, and `audit:changed`, which runs `fallow audit --base origin/main` (new-only attribution) followed by `knip`. The gate fails a commit only on newly introduced findings; inherited complexity, duplication, and the one inherited unused dev-dependency surface as warnings.

Reproducible deployment uses `npm ci` and `package-lock.json`. The secondary `pnpm-lock.yaml` was regenerated with `pnpm import`; the Pages workflow does not consume it. Fourteen `*` constraints were replaced with exact versions. The offline dependency doctor reported zero manifest findings; it does not resolve dependencies or check vulnerabilities.

### Security review

Before the approved updates, `npm audit --json` reported 20 vulnerable-package entries: 1 critical, 13 high, 5 moderate, and 1 low. Direct vulnerable packages were development dependencies `vite` and `vitest`; this did not demonstrate an exploit in the static Pages build.

The initial Vite and Vitest updates left 17 transitive entries (12 high, 4 moderate, 1 low). In-range transitive updates and TypeScript ESLint 8.73.0 cleared the remainder. Both `npm audit` and `pnpm audit` reported zero known findings after the lockfile updates. Vite 7.3.7, Vitest 4.1.12, and React 19.2.3 were retained. No overrides or peer-dependency bypasses were needed.

## Architecture Pattern

A client-only React application organized by technical concern, with declarative curriculum content and a centralized game reducer. `App.tsx` orchestrates initialization, derived views, task evaluation, transitions, and input registrations; it remains a large integration component rather than a thin shell.

The runtime tree is `StrictMode` → `ErrorBoundary` → `GlobalInputProvider` → `App`. Keyboard behavior is split into mode-specific handlers. Narrative hooks observe game state and feed notifications, dialogue, effects, and timers back into the UI.

**Platform gating** (ADR-0001) is a first-class layer, not styling. Two independent requirements gate the game: primary input, proxied as `(hover: none) and (pointer: coarse)`, and a 1024 CSS px viewport floor. The input half is enforced in three places that must stay in sync — the CSS gate in `index.html`, the mount guard in `src/index.tsx`, and `src/hooks/useViewportFloor.ts`; the mount guard skips mounting entirely on touch-only devices so no timers, typewriter, or Web Audio starts behind the notice. The width half is a React-level gate in `App` using `useViewportFloor`, deliberately not CSS, so cinematics stay reachable below the floor. Both render `src/components/RequirementNotice.tsx`; the static `.touch-gate` markup in `index.html` is the no-JS special case of that component.

The root `index.tsx` is a separate legacy entry file. The actual HTML module entry is `src/index.tsx`, which includes the required input provider.

## Folder Structure

| Location                                       | Purpose                                                                                  |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `src/components/`                              | Filesystem panes, preview, HUD, dialogs, intros, outro, and alerts                       |
| `src/components/narrative/`                    | Boot-sequence and cinematic presentation (typing, skip, scanlines)                       |
| `src/components/ui/`                           | Diegetic prompt and glitch-overlay components                                            |
| `src/hooks/`                                   | Game reducer, keyboard coordination, timers, narrative hooks, and platform gates         |
| `src/hooks/keyboard/`                          | Navigation, clipboard, deletion, fuzzy modes, sorting, and modal handlers                |
| `src/constants/`                               | Levels, keybindings, episode/narrative content, timings, and the episode colour palette  |
| `src/constants/filesystem/`                    | Initial tree, level mutations, prerequisites, and consequence scenarios                  |
| `src/utils/`                                   | Filesystem operations, visible-item derivation, sorting, validation, sound, and effects  |
| `src/types.ts`                                 | Shared filesystem, level, clipboard, settings, and game-state contracts                  |
| `tests/e2e/`                                   | Playwright specs, fixtures, and keyboard/game helpers                                    |
| `public/images/`                               | Static simulation/narrative images                                                       |
| `docs/`                                        | Narrative/curriculum reference, accessibility audit, keyboard research, and ADRs         |
| `docs/adr/`                                    | Accepted architecture decisions; ADR-0001 fixes the input and viewport floor             |
| `.github/workflows/`                           | Production build and Pages deployment                                                    |
| `.husky/`                                      | Commit and push hooks                                                                    |
| `.claude/pipeline/`                            | This scan snapshot and scan checkpoint                                                   |
| `.claude/skills/graphify/`                     | Project-scoped Graphify skill definition and references                                  |
| `.impeccable/`                                 | Design-system sidecar and Live configuration; generated critique history is runtime data |
| `graphify-out/`                                | Deterministic AST code knowledge graph; ignored by Git                                   |
| `dist/`, `test-results/`, `playwright-report/` | Generated build/test artifacts; ignored by Git                                           |

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
- Reusable modal presentation is centralized: warning modals (`FilterWarningModal`, `SearchWarningModal`, `SortWarningModal`, `HiddenFilesWarningModal`) delegate shared layout, title, message, and action button structure to `WarningModal.tsx`.
- Fuzzy search candidate matching, scoring, and derivation logic is centralized in `src/utils/fuzzyHelpers.ts`, decoupling `handleFuzzyMode.ts` and `FuzzyFinder.tsx`.
- Reducer action-to-state mappings leverage dictionary lookup tables (`ACTION_TO_STATE_KEY`, `MODAL_TO_STATE_KEY`) to minimize repetitive action branch duplication.
- Intro and boot presentations (`BiosBoot.tsx`, `EpisodeIntro.tsx`) share presentation hooks (`useTypewriter`, `useSkipIntro`) and visual components (`Scanlines`, `SkipIntroButton`) under `src/components/narrative/`.
- Clipboard collision detection, honeypot safety, and node cleanup are unified in `src/hooks/keyboard/handleClipboard.ts`.
- Codebase knowledge graph is generated via Graphify (`graphify-out/graph.json`) in offline AST mode, with project hooks in `.claude/` enabling graph traversal before search.
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
- Error handling: fallible filesystem operations return the `Result<T, FsError>` union from `src/types.ts`; handlers check the result before updating state. `ErrorBoundary` catches render failures and offers reload; `reportError` writes to the console. No remote telemetry implementation was found.
- Validation: zoxide storage shape validation, filesystem protection checks, operation-specific guards, and regex handling in view/input paths. These checks are not a general schema-validation framework.
- Accessibility: Help has a labelled modal, keyboard scrolling, and verified focus containment/restoration. Overlay focus is centralized in `src/components/useOverlayFocus.ts` (capture, restore, and Tab containment) and used by every overlay that owns keyboard input, including Help, Map, Hint, Info, Fuzzy Finder, and the confirmation and warning modals. Reduced motion is honoured through `src/hooks/useReduceMotion.ts`, which combines `prefers-reduced-motion` with the in-game `narrativeEffects: 'minimal'` setting and stamps `data-narrative-effects` on the root for CSS. Automated axe scans now report zero violations on the gameplay shell (levels 1, 6, 12, and episode 2), the Quest Map, Help, Hint, and the outro. Landmarks are `<header>`, `<main>`, and `<footer>` with the mission title as the page `h1`; both scroll regions and the level strip are focusable with a visible ring. This is automated coverage only — no assistive-technology or real-browser-zoom session was performed, so it does not establish WCAG conformance. [The desktop accessibility audit](../../docs/accessibility-audit.md) records the method and measurements.
- Keyboard-first scope: gameplay and game controls must work without a pointer. The [Yazi keyboard research](../../docs/yazi-keyboard-research.md) separates authentic `Tab` inspection from browser focus navigation and records a proposed focus boundary; runtime routing is unchanged.
- Settings: sound and narrative-effect settings are in-memory. The main glitch wrapper distinguishes `minimal` from other values; do not assume the displayed `reduced` option means every effect has a separate reduced implementation.
- Security: Vite substitutes configured Gemini environment values into client code. Such values are public if used in the bundle; environment files do not provide a secret backend. No Gemini API call was found in scanned source.

## Service Communication

No REST, GraphQL, WebSocket, or application event-bus service boundary was found in scanned source. Reducer dispatch and the keyboard registry coordinate the local application; a browser skip-intro event supports intro transitions.

External resources are limited to an external favicon/background image and a configured S3 conclusion-video URL; their presence does not verify their availability. Tailwind is no longer fetched from a CDN — it is compiled into `dist/assets/*.css` at build time, so the page has no third-party styling dependency at runtime. `index.html` also retains an AI Studio-era import map; the production app is built by Vite.

## Test Coverage

- Overall coverage: **unmeasured**. No coverage summary, LCOV report, configured coverage provider, or installed Vitest coverage provider was found. A percentage cannot be inferred from passing tests.
- Frameworks: Vitest with jsdom; Testing Library for component/hooks tests; Playwright for Chromium E2E scenarios.
- Inventory: **12 unit-test files**, **17 E2E spec files** (110 Chromium tests), and shared E2E fixtures/helpers.
- Unit-test areas: filesystem helpers (including a `fast-check` property suite), game reducer state invariants, skip-intro flag, consciousness/glitch helpers, boot/typewriter/skip hooks, diegetic prompt, and glitch overlay.
- Areas without dedicated colocated unit tests in the inventory: keyboard mode handlers, input arbitration, timer integration, and storage validation. Some are exercised through E2E; this is not a claim of zero executed coverage.
- E2E scenarios: all three episodes and level advancement, intro/skip pathways, modal input, clipboard restrictions, file creation, honeypots/protected assets, failure limits, persistence, protocol violations, selection/Escape behavior, and (in `keyboard-accessibility.spec.ts`) focus order and keyboard reachability.
- E2E helpers use URL debug parameters, clear localStorage for isolated level starts, and centralize keyboard sequences. Tests use root-relative URLs; the Playwright server explicitly overrides Vite's base to `/`.
- Integrated verification: **122 unit tests across 12 files passed**; the `@smoke` E2E subset (5 tests) passed against the dev server, and 110 Chromium tests exist in total. Lint, type-check, Prettier, and the production build also passed. E2E must run with `--reporter=list`. Because `CI=true` is exported in this environment, Playwright's `reuseExistingServer: !CI` starts a second server and collides on port 3000 — run E2E with `env -u CI`.
- The opening displays **FACILITY DATE: MAY 31, 2015**. Browser checks verified Help's eight command groups, focus containment and restoration, and the game layout at 1440×900 and 1024×768 — the floor itself. 720×450 no longer renders the file manager; it renders the width half of `RequirementNotice`. E2E tests cover opening/BIOS behavior and real `j`/`k` Help scrolling.
- Cinematics are exempt from the viewport floor: intro, outro, and the boot sequence are reachable at 320 CSS px and reflow there. That exemption is the reason the width gate lives in React rather than CSS.
- The accessibility audit also used a 320 CSS px reflow check and emulated reduced-motion preferences. No actual browser-zoom or assistive-technology session was performed.

## Entry Points

- `index.html` loads `src/index.tsx`; `src/App.tsx` owns game initialization and orchestration.
- `src/hooks/gameReducer.ts`, `src/GlobalInputContext.tsx`, `src/hooks/useKeyboardHandlers.ts`, and `src/constants/levels.ts` are central behavior entry points.
- `vite.config.ts` configures the production `/yazi-quest/` base, port 3000, React, environment substitution, aliases, Vitest discovery, and a `manualChunks` split that isolates React (192 kB) and lucide (10 kB) from game code (302 kB) so returning players reuse the cached vendor chunks. The split matches on module id; the object form silently matches nothing for `react-dom`.
- `tailwind.config.js` and `postcss.config.js` compile the stylesheet; there is no runtime Tailwind.
- `playwright.config.ts` configures Chromium, the local dev server, timeouts, retries, and artifacts. Run with `--reporter=list` as required by project instructions.
- `.github/workflows/deploy.yml` uses Node 24, `npm ci --ignore-scripts`, type-check, build, and Pages artifact/deploy actions on pushes to `main` or manual dispatch.
- Normal `npm install` triggers `npx playwright install --with-deps`; this machine's attempt failed at password-protected sudo. Installation with `--ignore-scripts` and a separate Chromium download succeeded. Static deployment intentionally skips browser/OS installation and Git hooks.
- `AGENTS.md` contains task-routing instructions; `GLOSSARY.md` contains implementation-free vocabulary. The README links the live game.
- `PRODUCT.md` records confirmed product facts for developers learning Yazi; `DESIGN.md` records the incumbent visual system. `.impeccable/design.json` provides schema-v2 extensions and six self-contained component specimens; `.impeccable/live/config.json` targets `index.html`, with no CSP patch required.
- `.gemini/settings.json` adds Impeccable tool hooks; this is development-harness configuration, not a new application service or authentication boundary.

## Changed Files

Latest delta `70a4928..99935c4` (18 commits, 85 paths: 14 added, 9 deleted, 62 modified). The headline changes are the platform-scope gate, the build-time Tailwind migration, the accessibility remediation, and the dead-narrative removal.

- **Platform scope (ADR-0001):** `docs/adr/0001-keyboard-and-viewport-floor.md` and `docs/adr/README.md` record the decision to require hardware modifiers and a 1024 px viewport. `src/hooks/useViewportFloor.ts`, `src/components/RequirementNotice.tsx`, `src/hooks/useReduceMotion.ts`, `src/index.tsx`, `index.html`, `src/App.tsx`, and `src/index.css` implement and style the gates. `tests/e2e/keyboard-accessibility.spec.ts` covers focus order and reachability.
- **Build-time Tailwind:** `tailwind.config.js`, `postcss.config.js`, and `src/constants/palette.ts` added; `index.html` dropped the Play CDN; `src/index.css` gained the directives. Palette tokens replaced string-surgery derivation in `App.tsx`, `LevelProgress.tsx`, `EpisodeIntro.tsx`, and `OutroSequence.tsx`. This fixed a latent fault: qualitatively derived classes (`border-*-500/30`, `bg-*-500/10`, `ring-*-500`, `text-*-500/50`) existed in no source file and were generated only by the runtime CDN, so a build-time scanner would have dropped them silently.
- **Accessibility remediation:** `FileSystemItem.tsx`, `PreviewPane.tsx`, `LevelProgress.tsx`, `StatusBar.tsx`, `HintModal.tsx`, and `index.html` were changed to replace opacity-based dimming with explicit colour tokens, fix landmark/heading structure, and make scroll regions focusable. `src/components/useOverlayFocus.ts` centralizes overlay focus capture, restore, and Tab containment for all ten overlays that own keyboard input.
- **Dead narrative removed:** Deleted `GhostMessage.tsx`/`.test.tsx`, `ghostDialogue.ts`, `terminalThoughts.ts`/`.test.ts`, `useGhostDialogue.ts`/`.test.ts`, and `useTerminalThoughts.ts`/`.test.ts`, plus their reducer state and actions in `src/hooks/gameReducer.ts`. `src/hooks/useNarrativeSystem.ts` and `src/constants/narrative.ts` were trimmed accordingly; `gameReducer.test.ts` was added for the surviving state invariants.
- **Gate tooling:** `fallow` and `knip` added with `audit:changed`, wired into `.husky/pre-push` and `.husky/pre-commit`. `fast-check` added for `src/utils/fsHelpers.property.test.ts`.
- **Bundle split:** `vite.config.ts` now isolates React and lucide into separate chunks.
- **Original requirements:** `docs/accessibility-audit.md` and `docs/yazi-keyboard-research.md` added; `docs/yazi-mobile-research.md`, `PRODUCT.md`, `DESIGN.md`, and `GLOSSARY.md` updated.
- **Prior deltas** (commitlint, intro/boot dedup, clipboard dedup, E2E helper pruning, narrative timeline alignment, monospace typography, dependency maintenance, Graphify) are unchanged from the previous scan and remain accurate.

Architectural change detected: build-time CSS compilation, a platform-gating layer, and a mandated viewport floor. `AGENTS.md` was patched with human confirmation to record platform scope, the three-way gate sync, literal palette tokens, the `audit:changed` gate, and the `env -u CI` requirement for E2E here.

## Last Scanned

2026-11-23T12:20:00Z
