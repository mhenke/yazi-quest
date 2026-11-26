# Project Documentation

> Generated: 2026-11-26T17:25:00Z | Mode: DELTA
> Source baseline: `824c99d`..`73f4538` (26 commits) + uncommitted working-tree toolchain upgrade (`package.json`, `package-lock.json`, `vite.config.ts`)

## Tech Stack

- Runtime: browser application; Node.js 24 in CI and deployment workflows. Local scan environment: Node.js 24.22.2 / npm 11.19.1. No Node engine constraint is declared.
- Language: TypeScript / TSX, ES modules, ES2022 target. Type safety migration has enabled both `noImplicitAny: true` and `strictNullChecks: true` in `tsconfig.json`, with full `strict` mode remaining disabled.
- Framework: React 19.3.1, bundled by Vite 8.4.0 (Rolldown `codeSplitting`) with `@vitejs/plugin-react` 6.3.0 in the current working tree (`73f4538` used React 19.2.3 / Vite 7.3.7).
- Database: none. The game operates on an in-memory simulated filesystem.
- Styling: Tailwind CSS 3.4.19 compiled at build time through PostCSS (`tailwind.config.js` scans `index.html` and `src/**/*.{ts,tsx}`; `postcss.config.js` runs Tailwind and Autoprefixer). Episode colours live in `src/constants/palette.ts` as literal utility strings so the scanner sees every class. Inline styles in `index.html` and local CSS cover narrative/glitch effects and the platform gates. The interface uses the system-monospace stack without a webfont download. Tailwind is pinned to v3 deliberately: v4 renames `outline-none`, rescales `rounded-sm`, and changes the default border colour, all of which would shift the existing visual design.
- State management: `useReducer(gameReducer)` in `src/App.tsx`; `GlobalInputProvider` arbitrates keyboard input. Initial state assembly is extracted into `src/hooks/initialState.ts`. Some UI/narrative behavior uses local hook state.
- Hosting: static GitHub Pages site at <https://mhenke.github.io/yazi-quest/>.

## Dependencies

Versions below are resolved from the current working-tree `package-lock.json` (which includes an uncommitted Vite 8 / Vitest 5 / React 19.3 upgrade over `73f4538`), not claims about the newest available releases.

| Group        | Libraries and resolved versions                                                                                                                                                            |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Core         | `react` 19.3.1, `react-dom` 19.3.1, `lucide-react` 0.556.0                                                                                                                                 |
| Build        | `vite` 8.4.0, `@vitejs/plugin-react` 6.3.0, `typescript` 5.9.3, `tailwindcss` 3.4.19, `postcss` 8.5.33, `autoprefixer` 10.7.0                                                              |
| Code quality | `eslint` 9.39.5, `@typescript-eslint/parser` and plugin 8.74.0, `prettier` 3.10.1, `husky` 9.1.7, `lint-staged` 16.2.7, `@commitlint/cli` 21.2.4, `@commitlint/config-conventional` 21.2.4 |
| Gate tooling | `fallow` 3.49.0 (dead code, complexity, duplication, zone boundaries), `knip` 6.48.0 (unused exports and dependencies)                                                                     |
| Testing      | `vitest` 5.1.2, `@vitest/coverage-v8` 5.1.2, `jsdom` 27.4.0, `@testing-library/react` 16.3.3, `@testing-library/jest-dom` 8.0.0, `@playwright/test` 1.65.1, `fast-check` 4.11.0            |

`npm run prepush` chains lint, type-check, unit tests (`npm test`), build, the `@smoke` E2E subset, and `audit:changed`, which runs `fallow audit --base origin/main --format compact --quiet && knip --no-progress && knip --no-progress --production`. `.fallowrc.json` enforces `gate: "new-only"`, `worsened: "error"`, `added-suppression: "error"`, and an 8-zone dependency boundary matrix (`tests`, `types`, `utils`, `constants`, `context`, `hooks`, `components`, `app`) with `requireAllFiles: true`. `npm run audit:health` runs `npm run test:coverage` followed by `fallow health --coverage coverage/coverage-final.json`.

Reproducible deployment uses `npm ci` and `package-lock.json`. The secondary `pnpm-lock.yaml` was regenerated with `pnpm import`; the Pages workflow does not consume it. Fourteen `*` constraints were replaced with exact versions. The offline dependency doctor reported zero manifest findings; it does not resolve dependencies or check vulnerabilities.

### Security review

Before the approved updates, `npm audit --json` reported 20 vulnerable-package entries: 1 critical, 13 high, 5 moderate, and 1 low. Direct vulnerable packages were development dependencies `vite` and `vitest`; this did not demonstrate an exploit in the static Pages build.

The initial Vite and Vitest updates left 17 transitive entries (12 high, 4 moderate, 1 low). In-range transitive updates and TypeScript ESLint 8.73.0 cleared the remainder. Both `npm audit` and `pnpm audit` reported zero known findings after the lockfile updates. Vite 7.3.7, Vitest 4.1.12, and React 19.2.3 were retained. No overrides or peer-dependency bypasses were needed.

## Architecture Pattern

A client-only React application organized by technical concern, with declarative curriculum content and a centralized game reducer. `App.tsx` orchestrates initialization, derived views, task evaluation, transitions, and input registrations; it remains a large integration component rather than a thin shell.

The runtime tree is `StrictMode` → `ErrorBoundary` → `GlobalInputProvider` → `App`. Keyboard behavior is split into mode-specific handlers. Narrative hooks observe game state and feed notifications, dialogue, effects, and timers back into the UI.

**Platform gating** (ADR-0001) is a first-class layer, not styling. Two independent requirements gate the game: primary input, proxied as `(hover: none) and (pointer: coarse)`, and a 1024 CSS px viewport floor. The input half is enforced in three places that must stay in sync — the CSS gate in `index.html`, the mount guard in `src/index.tsx`, and `src/hooks/useViewportFloor.ts`; the mount guard skips mounting entirely on touch-only devices so no timers, typewriter, or Web Audio starts behind the notice. The width half is a React-level gate in `App` using `useViewportFloor`, deliberately not CSS, so cinematics stay reachable below the floor. Both render `src/components/RequirementNotice.tsx`; the static `.touch-gate` markup in `index.html` is the no-JS special case of that component.

**Loaded-folder cache** (ADR-0002) gates directory entry counts in the `size` linemode: `GameState.loadedDirIds` records only visited or previewed directory IDs (computed via `src/utils/folderCache.ts`), the parent pane hides linemode, and archives report payload byte sizes rather than member counts.

During an `EpisodeIntro`, `App.tsx` gates the workspace panes and diegetic prompt so the active level UI stays unmounted until the intro completes or is skipped. The legacy root `index.tsx` file was removed in `b06df37`; `index.html` loads `src/index.tsx` exclusively. Unmatched GitHub Pages routes serve the standalone interactive terminal page `public/404.html`.

## Folder Structure

| Location                                                    | Purpose                                                                                    |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `src/components/`                                           | Filesystem panes, preview, mission drawer, HUD, dialogs, intros, outro, icons, and alerts  |
| `src/components/narrative/`                                 | Boot-sequence and cinematic presentation (typing, skip, scanlines)                         |
| `src/components/ui/`                                        | Diegetic prompt and glitch-overlay components                                              |
| `src/hooks/`                                                | Game reducer, initial state, keyboard coordination, timers, narrative, and platform gates  |
| `src/hooks/keyboard/`                                       | Navigation, clipboard, deletion, fuzzy modes, sorting, and modal handlers                  |
| `src/constants/`                                            | Levels, keybindings, identity, narrative content, timings, and the episode colour palette  |
| `src/constants/filesystem/`                                 | Initial tree, level mutations, prerequisites, and consequence scenarios                    |
| `src/utils/`                                                | Filesystem ops, folder cache, progression storage, view/sort helpers, validation, sound    |
| `src/types.ts`                                              | Shared filesystem, level, clipboard, settings, and game-state contracts                    |
| `tests/e2e/`                                                | Playwright Chromium specs (20 files), fixtures, and keyboard/game helpers                  |
| `tests/production/`                                         | Built-artifact smoke spec (`boot.spec.ts`) run against `vite preview`                      |
| `public/`                                                   | Static simulation/narrative images (`public/images/`) and interactive `public/404.html`    |
| `docs/`                                                     | Narrative/curriculum reference, accessibility audit, keyboard research, and ADRs           |
| `docs/adr/`                                                 | Accepted ADRs: ADR-0001 (input/viewport floor) and ADR-0002 (loaded-folder metadata cache) |
| `.github/workflows/`                                        | Reusable CI verification (`ci.yml`) and gated GitHub Pages deployment (`deploy.yml`)       |
| `.husky/`                                                   | Commit and push hooks                                                                      |
| `.claude/pipeline/`                                         | This scan snapshot and scan checkpoint                                                     |
| `.impeccable/`                                              | Design-system sidecar (`design.json`, `design-full.md`) and Live config / critique history |
| `graphify-out/`                                             | Deterministic AST code knowledge graph (`.graphifyrc` at root); ignored by Git             |
| `coverage/`, `dist/`, `test-results/`, `playwright-report/` | Generated coverage/build/test artifacts; ignored by Git                                    |

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
- Modal geometry harmonization: Peripheral dialogs, warning shells, and alerts (`GameOverModal.tsx`, `HintModal.tsx`, `InfoPanel.tsx`, `WarningModal.tsx`, `SuccessToast.tsx`, `SystemAlerts.tsx`, `ThreatAlert.tsx`) have been standardized to rectangular terminal geometry (`rounded-none`, `border-zinc-700` or corresponding status border tokens) consistent with the terminal aesthetic.
- Mission drawer (`src/components/MissionDrawer.tsx`): Extracted from `PreviewPane.tsx` to encapsulate mission title, progress, description, and task checklist. Supports collapsible drawer behavior toggled via `Alt+O` (registered in `src/App.tsx` via `useGlobalInput`) or by clicking the drawer header, allowing players to collapse the mission log to maximize the file preview area.
- Status bar modularity (`src/components/StatusBar.tsx`): Restructured into three functional clusters: left mode and command indicators, center-left file info/context and technical feedback notifications, and right progress and stats block (task counter, linemode, permissions, position indicators). The default `HIDDEN: OFF` indicator is silenced when inactive to reduce visual noise on the terminal. Linemode cycling (`handleSortMode.ts`) dispatches transient notifications to the status bar.
- Scanline overlay consolidation: CRT scanline gradients previously duplicated inline across `GameOverModal.tsx` and `OutroSequence.tsx` are consolidated to route through the shared `Scanlines` component (`src/components/narrative/Scanlines.tsx`).
- Fuzzy search candidate matching, scoring, and derivation logic is centralized in `src/utils/fuzzyHelpers.ts`, decoupling `handleFuzzyMode.ts` and `FuzzyFinder.tsx`.
- Reducer action-to-state mappings leverage dictionary lookup tables (`ACTION_TO_STATE_KEY`, `MODAL_TO_STATE_KEY`) to minimize repetitive action branch duplication.
- Intro and boot presentations (`BiosBoot.tsx`, `EpisodeIntro.tsx`) share presentation hooks (`useTypewriter`, `useSkipIntro`) and visual components (`Scanlines`, `SkipIntroButton`) under `src/components/narrative/`.
- Clipboard collision detection, honeypot safety, and node cleanup are unified in `src/hooks/keyboard/handleClipboard.ts`.
- Filesystem trap integrity: Restored the dropped `isHoneypot: true` flag on `system_monitor.pid` (`tmp-honeypot-1`) in `src/constants/filesystem/initial.ts`, ensuring Level 9 trap detection logic triggers when critical PID keepers are removed.
- Episode 3 Exam Mode scaffolding: On transition to Episode 3, the `MissionDrawer` initializes as collapsed by default to maximize full-height file inspection while challenging players to operate from memory, retaining `Alt+O` expansion.
- POSIX permissions visualization: `StatusBar.tsx`, `FileSystemItem.tsx`, and `InfoPanel.tsx` consume `permissions` attributes on `FileNode` to render standard POSIX indicators (`-rwxr-xr-x`, `-rw-r--r--`, `drwxr-xr-x`) to support forensic inspection objectives.
- Filesystem mutation preservation: `src/constants/filesystem/mutations.ts` sequences Level 13 directory evacuation after prerequisite node seeding, verified via unit test `src/utils/fsMutationPreservation.test.ts`.
- Test server isolation: `playwright.config.ts` configures isolated webServer execution with `reuseExistingServer: !isolatedServer` and port 3100 targeting for pre-push verification.
- Codebase knowledge graph is generated via Graphify (`graphify-out/graph.json`, configured by `.graphifyrc`) in offline AST mode; the duplicated `.claude/skills/graphify/` copy was removed in `5a347b1`.
- Shared UI and state helpers extracted in recent passes: `src/hooks/initialState.ts` (state bootstrapping), `src/utils/folderCache.ts` (loaded-folder ID derivation), `src/utils/progressionStorage.ts` (highest unlocked level persistence), `src/constants/identity.ts` (`getPlayerIdentity`), `src/components/fileIcon.ts` (shared file icon/colour mapping for `FileSystemItem` and `PreviewPane`), and `src/hooks/useScrollToCursor.ts`.
- Gameplay guidance & overlay ergonomics: `MissionDrawer.tsx` renders inline key chips, highlights the next incomplete objective (`NEXT`), and shows a clipped-objectives overflow cue (`↓ N more`); `HelpModal.tsx` adds live filtering and a collapsible Current Level section; `HintModal.tsx` enforces explicit 3-stage progression (`nudge` → `command` → `walkthrough`) without wrap-around; `SystemAlerts.tsx` supports click and bubble-phase `Escape` dismissal (ignoring inputs and dialogs).
- Lint and boundary enforcement: `eslint.config.js` allows `tabIndex` on `role="region"` and `role="tabpanel"` so scroll regions remain keyboard-focusable without inline `eslint-disable` comments; `.fallowrc.json` enforces 8 architectural zones (`requireAllFiles: true`), `worsened: "error"`, and `added-suppression: "error"`.
- The previously proposed input-handler/context extraction is cancelled in the closed roast-fixes round 2 documents; it is not the current architecture.

## Data Architecture

- `FileNode` represents files, directories, and archives in a tree, with identity, optional parent/children, simulated contents/metadata, POSIX permission mode (`permissions?: string`), and protection/honeypot flags.
- Navigation paths are arrays of node IDs. Display paths and zoxide history use readable path strings. `Level.allowedDeletePaths` is a distinct name-based policy, optionally gated by task completion.
- `Level` belongs to an episode and contains tasks. Each task checks the current game state; completion and advancing to the next level are separate events. Canonical domain terms are defined in `GLOSSARY.md`.
- Clipboard state contains nodes, a yank/cut action, and the original path. Search results can carry transient path metadata that clipboard operations strip before writing nodes into the tree.
- Game state includes the current mode/path/cursor, selections, filesystem and level-start snapshots, `loadedDirIds` folder cache (ADR-0002), task completion, modal flags, `hintStage`, timers, keystroke budgets, and narrative statistics.
- Browser storage persists three keys: `yazi-quest-zoxide-history`, `yazi-quest-cycle`, and `yazi-quest-unlocked-level` (`src/utils/progressionStorage.ts`, storing the highest unlocked level ID so reloads resume at that level; persistence is disabled when URL override params such as `debug`, `lvl`, `ep`, or `tasks` are present). The complete filesystem, mid-level task progress, and settings are not serialized. Note: `RESTART_CYCLE` does not currently reset `yazi-quest-unlocked-level`, and the Quest Map currently computes lock status from `currentLevelIndex` rather than the persisted high-water mark.
- Stored zoxide data is parsed and checked with `isValidZoxideData`; invalid/unavailable history falls back to seeded entries. Cycle count and unlocked level ID are parsed and validated separately with error handling.

## Cross-Cutting Concerns

- Authentication/authorization: no application login/session backend. Protected files and threat rules are simulated gameplay policies, not real host filesystem permissions.
- Error handling: fallible filesystem operations return the `Result<T, FsError>` union from `src/types.ts`; handlers check the result before updating state. `ErrorBoundary` catches render failures and offers reload; `reportError` writes to the console. No remote telemetry implementation was found.
- Validation: zoxide storage shape validation, filesystem protection checks, operation-specific guards, and regex handling in view/input paths. These checks are not a general schema-validation framework.
- Accessibility: Help has a labelled modal, keyboard scrolling, and verified focus containment/restoration. Overlay focus is centralized in `src/components/useOverlayFocus.ts` (capture, restore, and Tab containment) and used by every overlay that owns keyboard input, including Help, Map, Hint, Info, Fuzzy Finder, and the confirmation and warning modals. Reduced motion is honoured through `src/hooks/useReduceMotion.ts`, which combines `prefers-reduced-motion` with the in-game `narrativeEffects: 'minimal'` setting and stamps `data-narrative-effects` on the root for CSS. Automated axe scans now report zero violations on the gameplay shell (levels 1, 6, 12, and episode 2), the Quest Map, Help, Hint, and the outro. Landmarks are `<header>`, `<main>`, and `<footer>` with the mission title as the page `h1`; both scroll regions and the level strip are focusable with a visible ring. This is automated coverage only — no assistive-technology or real-browser-zoom session was performed, so it does not establish WCAG conformance. [The desktop accessibility audit](../../docs/accessibility-audit.md) records the method and measurements.
- Keyboard-first scope: gameplay and game controls must work without a pointer. The [Yazi keyboard research](../../docs/yazi-keyboard-research.md) separates authentic `Tab` inspection from browser focus navigation and records a proposed focus boundary; runtime routing is unchanged.
- Settings: sound and narrative-effect settings are in-memory. The initial `GameState` contract strictly enforces `narrativeEffects: 'full'` (setting `data-narrative-effects` on root for CSS targeting) and `consciousnessLevel: 0` without unsafe type casts (`as GameState` was removed in `src/App.tsx`). The main glitch wrapper distinguishes `minimal` from other values; do not assume the displayed `reduced` option means every effect has a separate reduced implementation.
- Security: Vite substitutes configured Gemini environment values into client code. Such values are public if used in the bundle; environment files do not provide a secret backend. No Gemini API call was found in scanned source.

## Service Communication

No REST, GraphQL, WebSocket, or application event-bus service boundary was found in scanned source. Reducer dispatch and the keyboard registry coordinate the local application; a browser skip-intro event supports intro transitions.

External resources are limited to an external favicon/background image and a configured S3 conclusion-video URL; their presence does not verify their availability. Tailwind is no longer fetched from a CDN — it is compiled into `dist/assets/*.css` at build time, so the page has no third-party styling dependency at runtime. `index.html` also retains an AI Studio-era import map; the production app is built by Vite.

## Test Coverage

- Overall coverage (measured via `npm run test:coverage -- --coverage.reporter=text-summary`, `@vitest/coverage-v8` 5.1.2): **34.44% statements** (1691/4909), **31.49% branches** (1283/4074), **33.07% functions** (303/916), **34.15% lines** (1488/4356). Note: in the uncommitted Vitest 5.1.2 upgrade, the default `json-summary` reporter in `vite.config.ts` throws `Cannot find module 'json-summary'` from `istanbul-reports`; `text-summary` runs cleanly. Playwright E2E runs are not instrumented.
- Frameworks: Vitest 5.1.2 with jsdom and `fast-check` 4.11.0; Testing Library for component/hooks tests; Playwright 1.65.1 for Chromium E2E and production-build smoke scenarios.
- Inventory: **35 unit/property test files (324 tests passing)** — including **10 `fast-check` property suites** (`fsHelpers`, `fsStateMachine`, `gameReducer`, `gameUtils`, `fuzzyHelpers`, `consciousnessTracker`, `protection`, `sortHelpers`, `viewHelpers`, `primitives`) — **20 E2E spec files (123 Playwright tests)** in `tests/e2e/`, plus **1 production boot spec** (`tests/production/boot.spec.ts` via `playwright.production.config.ts`).
- High-coverage unit/property areas: `gameReducer.ts` (99.19% stmts), `viewHelpers.ts` (98.30%), `hooks/keyboard/utils.ts` (97.95%), `fsHelpers.ts` (97.02%), `progressionStorage.ts` (94.11%), `sortHelpers.ts` (84.31%), `constants/filesystem/` (77.10%), and 100% statements in `folderCache.ts`, `gameUtils.ts`, `fuzzyHelpers.ts`, `consciousnessTracker.ts`, `glitchEffects.ts`, `sizeHelpers.ts`, `skipIntroFlag.ts`, `validation.ts`, `identity.ts`, `keybindings.ts`, `protocols.ts`, `timings.ts`. Colocated component tests also cover `HintModal`, `SystemAlerts`, `InfoPanel`, `DiegeticPrompt`, `GlitchOverlay`, `BootSequence`, `useTypewriter`, and `useSkipIntro`.
- Key untested areas (0% unit coverage, partially exercised by E2E): `src/App.tsx`, most keyboard mode handlers under `src/hooks/keyboard/` (aside from `handleClipboard`, `handleDeleteMode`, `handleNarrativeTriggers`, and `utils`), `useGameTimer`, `useNarrativeSystem`, `useConsciousness`, `useKeyboardHandlers`, `useReduceMotion`, `useViewportFloor`, `useScrollToCursor`, most presentation components (`FileSystemPane`, `PreviewPane`, `MissionDrawer`, `LevelProgress`, `HelpModal`, `StatusBar`, `EpisodeIntro`, `OutroSequence`, `BiosBoot`), `sounds.ts`, `teaserMusic.ts`, `dynamicGlitch.ts`, and `error.ts`.
- E2E scenarios: all three episodes and level advancement, intro/skip pathways, modal input and dialogs, clipboard restrictions, file creation, honeypots/protected assets, failure limits, persistence, protocol violations, search/hidden-file invariants, selection/Escape behavior, `404.html` interactive terminal, keyboard accessibility/focus order, and production preview boot (`tests/production/boot.spec.ts`).
- E2E helpers use URL debug parameters, clear localStorage for isolated level starts, and centralize keyboard sequences. Tests use root-relative URLs; the Playwright server explicitly overrides Vite's base to `/`, while `playwright.production.config.ts` serves `dist/` at `http://127.0.0.1:3200/yazi-quest/`.
- Verification & CI: `.github/workflows/ci.yml` gates PRs and Pages deployments (`deploy.yml` calls `ci.yml`) on `lint`, `type-check`, `npm test`, `audit:changed`, `test:smoke -- --reporter=list`, and `test:production -- --reporter=list`. E2E must run with `--reporter=list`. Pre-push verification isolates the test server on port 3100 via `PLAYWRIGHT_ISOLATE_SERVER=1`.
- The opening displays **FACILITY DATE: MAY 31, 2015**. Browser checks verified Help's eight command groups, focus containment and restoration, and the game layout at 1440×900 and 1024×768 — the floor itself. 720×450 no longer renders the file manager; it renders the width half of `RequirementNotice`. E2E tests cover opening/BIOS behavior and real `j`/`k` Help scrolling.
- Cinematics are exempt from the viewport floor: intro, outro, and the boot sequence are reachable at 320 CSS px and reflow there. That exemption is the reason the width gate lives in React rather than CSS.
- The accessibility audit also used a 320 CSS px reflow check and emulated reduced-motion preferences. No actual browser-zoom or assistive-technology session was performed.

## Entry Points

- `index.html` loads `src/index.tsx`; `src/App.tsx` owns game orchestration, and `src/hooks/initialState.ts` owns initial state assembly. `public/404.html` is the standalone 404 terminal page.
- `src/hooks/gameReducer.ts`, `src/GlobalInputContext.tsx`, `src/hooks/useKeyboardHandlers.ts`, and `src/constants/levels.ts` are central behavior entry points.
- `vite.config.ts` configures the production `/yazi-quest/` base, port 3000, React, environment substitution, aliases, Vitest discovery + V8 coverage, and (in the uncommitted Vite 8 config) `build.rolldownOptions.output.codeSplitting` groups isolating `react` and `icons` (`lucide-react`) from game code so returning players reuse cached vendor chunks.
- `tailwind.config.js` and `postcss.config.js` compile the stylesheet; there is no runtime Tailwind.
- `playwright.config.ts` configures Chromium E2E runs against the dev server; `playwright.production.config.ts` tests the built `dist/` bundle via `vite preview` on port 3200. Run with `--reporter=list` as required by project instructions.
- `.fallowrc.json` and `knip.json` configure dead-code, complexity, duplication, suppression, and architectural zone-boundary gates.
- `.github/workflows/ci.yml` and `.github/workflows/deploy.yml` run Node 24, `npm ci --ignore-scripts`, verification/smoke/production jobs, and Pages artifact upload/deploy on pushes to `main` or manual dispatch.
- Normal `npm install` triggers `npx playwright install --with-deps`; this machine's attempt failed at password-protected sudo. Installation with `--ignore-scripts` and a separate Chromium download succeeded. Static deployment intentionally skips browser/OS installation and Git hooks.
- `AGENTS.md` contains task-routing instructions; `GLOSSARY.md` contains implementation-free vocabulary. The README links the live game.
- `PRODUCT.md` records confirmed product facts for developers learning Yazi; `DESIGN.md` records the incumbent visual system. `.impeccable/design.json` and `.impeccable/design-full.md` record the refreshed design tokens and specimens; `.impeccable/live/config.json` targets `index.html`, with no CSP patch required.
- `.gemini/settings.json` adds Impeccable tool hooks; this is development-harness configuration, not a new application service or authentication boundary.

## Changed Files

Latest delta `824c99d..73f4538` (26 commits, 130 changed paths) plus 3 uncommitted working-tree toolchain files (`package.json`, `package-lock.json`, `vite.config.ts`).

- **Loaded-Folder Cache & ADR-0002 (`253109b`):** Added `docs/adr/0002-file-metadata-cache.md`, `src/utils/folderCache.ts`, and `GameState.loadedDirIds` so `size` linemode shows directory entry counts only after visiting or previewing a directory, hides linemode in the parent pane, and reports payload bytes for archives.
- **Property-Based Testing, Coverage & Bug Fixes (`06fd5a0`, `5a347b1`, `2968183`, plus 11 invariant-fix commits):** Added `@vitest/coverage-v8` and 10 `fast-check` property suites expanding unit/property coverage to 35 files / 324 tests (34.44% statements). Fixed cursor clamping, cut-paste subtree ID regeneration, self-subtree paste blocking, honeypot/protection edge cases, search baseline enforcement, and deterministic level seeds.
- **Gameplay Guidance & Progression (`73f4538`, `245dd8e`):** Added `src/utils/progressionStorage.ts` (`yazi-quest-unlocked-level`), `src/constants/identity.ts`, `src/components/fileIcon.ts`, `src/hooks/initialState.ts`, `src/hooks/useScrollToCursor.ts`; upgraded `MissionDrawer` (inline code chips, `NEXT` step highlight, overflow counter), `HelpModal` (filter + Current Level), `HintModal` (explicit 3-stage progression), `SystemAlerts` (click + `Escape` dismiss), and `EpisodeIntro` workspace-pane gating.
- **CI, Production Smoke & 404 Page (`61fafac`, `3d586e3`, `cdc20c1`, `2432607`):** Added interactive `public/404.html`, `.github/workflows/ci.yml` gating `deploy.yml`, `playwright.production.config.ts`, and `tests/production/boot.spec.ts`.
- **Gate & Repo Hygiene (`b06df37`, `5a347b1`, `47e1122`):** Added `.fallowrc.json` (8-zone boundaries, `worsened: "error"`, `added-suppression: "error"`) and `knip.json`, deleted unused root `index.tsx` and duplicated `.claude/skills/graphify/`, added `.graphifyrc`, and refreshed `DESIGN.md` / `.impeccable/design.json`.
- **Uncommitted Working-Tree Toolchain Upgrade:** Upgraded `vite` 7→8 (migrating `vite.config.ts` from Rollup `manualChunks` to Rolldown `codeSplitting`), `vitest` & `@vitest/coverage-v8` 4→5, `react`/`react-dom` 19.2→19.3, `@playwright/test` 1.57→1.65, `fallow` 3.46→3.49, and `prettier` 3.7→3.10.

Architectural changes detected in this delta (see Step 4B confirmation prompt before patching `AGENTS.md`).

## Last Scanned

2026-11-26T17:25:00Z
