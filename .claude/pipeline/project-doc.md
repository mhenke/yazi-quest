# Project Documentation

> Generated: 2026-11-27T20:23:00-06:00 | Mode: DELTA
> Original scan baseline: `824c99d`..`73f4538` (26 commits).
> Scoped delta refresh: 2026-11-27T20:23:00-06:00, covering `f15e48d` plus 11 working-tree changes, with refreshed V8 coverage figures from `coverage/coverage-summary.json`.

## Tech Stack

- Runtime: browser application; Node.js 24 in CI and deployment workflows. `package.json` requires Node.js `>=24.15.0 <25 || >=26.0.0`.
- Language: TypeScript / TSX, ES modules, ES2022 target. Type safety migration has enabled both `noImplicitAny: true` and `strictNullChecks: true` in `tsconfig.json`, with full `strict` mode remaining disabled.
- Framework: React 19.3.1, bundled by Vite 8.4.0 (Rolldown `codeSplitting`) with `@vitejs/plugin-react` 6.3.0.
- Database: none. The game operates on an in-memory simulated filesystem.
- Styling: Tailwind CSS 4.3.5 compiled at build time by `@tailwindcss/vite`. `src/index.css` explicitly scans `index.html` and `src/` and preserves the pre-upgrade border, placeholder, and button defaults. Episode colours live in `src/constants/palette.ts` as literal utility strings. The interface uses the system-monospace stack without a webfont download.
- State management: `useReducer(gameReducer)` in `src/App.tsx`; `GlobalInputProvider` arbitrates keyboard input. Initial state assembly is extracted into `src/hooks/initialState.ts`. Some UI/narrative behavior uses local hook state.
- Hosting: static GitHub Pages site at <https://mhenke.github.io/yazi-quest/>.

## Dependencies

Versions below are resolved from `package-lock.json`, not claims about the newest available releases.

| Group        | Libraries and resolved versions                                                                                                                                                                                        |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Core         | `react` 19.3.1, `react-dom` 19.3.1, `lucide-react` 1.81.0                                                                                                                                                              |
| Build        | `vite` 8.4.0, `@vitejs/plugin-react` 6.3.0, `typescript` 6.0.3, `tailwindcss` and `@tailwindcss/vite` 4.3.5                                                                                                            |
| Code quality | `eslint` 9.39.5, `@typescript-eslint/parser` and plugin 8.74.0, `eslint-plugin-security` 4.2.1, `prettier` 3.10.1, `husky` 9.1.7, `lint-staged` 17.6.2, `@commitlint/cli` and `@commitlint/config-conventional` 21.2.4 |
| Gate tooling | `fallow` 3.49.0 (dead code, complexity, duplication, zone boundaries), `knip` 6.48.0 (unused exports and dependencies)                                                                                                 |
| Testing      | `vitest` 5.1.2, `@vitest/coverage-v8` 5.1.2, `jsdom` 31.0.1, `@testing-library/react` 16.3.3, `@testing-library/jest-dom` 8.0.0, `@playwright/test` 1.65.1, `fast-check` 4.11.0                                        |

React Hooks lint is pinned to `eslint-plugin-react-hooks` 7.1.1; CI uses its recommended rules.

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

File information labels the same direct visible-child count `Entry count:` for directories; opening file information is not subject to the linemode's cache gate.

During an `EpisodeIntro` or the unified pausing `BootSequence` (`gameState.isBooting` across all three episodes), `App.tsx` gates the workspace panes, countdown timer (`useGameTimer`), and gameplay input until completed or skipped. The legacy root `index.tsx` file was removed in `b06df37`; `index.html` loads `src/index.tsx` exclusively. Unmatched GitHub Pages routes serve the standalone interactive terminal page `public/404.html`.

## Folder Structure

| Location                                                    | Purpose                                                                                                                     |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `src/components/`                                           | Filesystem panes, preview, mission drawer, HUD, dialogs, intros, outro, icons, and alerts                                   |
| `src/components/narrative/`                                 | Unified pausing boot sequence (`BootSequence.tsx`), structured lore rendering (`LoreLineView.tsx`), typing, skip, scanlines |
| `src/components/ui/`                                        | Diegetic prompt and glitch-overlay components                                                                               |
| `src/hooks/`                                                | Game reducer, initial state, keyboard coordination, timers, narrative, and platform gates                                   |
| `src/hooks/keyboard/`                                       | Navigation, clipboard, deletion, fuzzy modes, sorting, typed contexts (`types.ts`), and modal handlers                      |
| `src/constants/`                                            | Levels, keybindings, identity, narrative content, timings, boot sequences, and episode colour palette                       |
| `src/constants/filesystem/`                                 | Initial tree, tree ops (`treeOps.ts`), level mutations, prerequisites, and consequence scenarios                            |
| `src/utils/`                                                | Filesystem/lore/episode/audio helpers, folder cache, session & progression storage, validation, sound                       |
| `src/types.ts`                                              | Shared filesystem, level, clipboard, lore, settings, and game-state contracts                                               |
| `tests/e2e/`                                                | Playwright Chromium specs (20 files), fixtures, and keyboard/game helpers (`tests/helpers/` holds unit keyboard harness)    |
| `tests/production/`                                         | Built-artifact smoke spec (`boot.spec.ts`) run against `vite preview`                                                       |
| `public/`                                                   | Static simulation/narrative images (`public/images/`) and interactive `public/404.html`                                     |
| `docs/`                                                     | Narrative/curriculum reference, accessibility audit, keyboard research, and ADRs                                            |
| `docs/adr/`                                                 | Accepted ADRs: ADR-0001 (input/viewport floor) and ADR-0002 (loaded-folder metadata cache)                                  |
| `.github/workflows/`                                        | Reusable CI verification (`ci.yml`) and gated GitHub Pages deployment (`deploy.yml`)                                        |
| `.husky/`                                                   | Commit and push hooks                                                                                                       |
| `.claude/pipeline/`                                         | This scan snapshot and scan checkpoint                                                                                      |
| `.impeccable/`                                              | Design-system sidecar (`design.json`, `design-full.md`) and Live config / critique history                                  |
| `graphify-out/`                                             | Deterministic AST code knowledge graph (`.graphifyrc` at root); ignored by Git                                              |
| `coverage/`, `dist/`, `test-results/`, `playwright-report/` | Generated coverage/build/test artifacts; ignored by Git                                                                     |

## Code Style Conventions

- React components use PascalCase filenames; hooks use `use…` names; utilities use camelCase filenames. Content collections commonly use upper-snake-case constants.
- Relative imports dominate the inspected source. The configured `@/*` alias resolves from the repository root, not automatically from `src/`.
- Both named and default exports exist. Components are predominantly functional; `ErrorBoundary` is a class component.
- Prettier specifies two-space indentation, semicolons, single quotes, a 100-column width, and ES5-compatible trailing commas. These settings supersede historical prose claiming trailing commas everywhere.
- ESLint uses flat configuration with TypeScript, React/hooks, import, accessibility, security, and Prettier rules. Some checks are disabled; `npm run lint` uses `--quiet`, so a passing run does not establish that warnings are absent.
- Unit tests are colocated as `*.test.ts` / `*.test.tsx`; browser scenarios use `tests/e2e/*.spec.ts`.

## Modularity Practices

- Use existing filesystem helpers and clone-before-mutation setup patterns; reducer-owned trees are treated as immutable.
- Typed context handlers under `src/hooks/keyboard/` (`types.ts`, `gameLoopHelpers.ts`, and direct mode handlers) coordinate keyboard actions via the DOM-free `KeyInput` contract. `App` registers mode/modal input through `useGlobalInput`.
- Input handlers have priority, enabled-state, and input-focus capture options. A consumed event stops further handlers; do not model this as independent global listeners per modal.
- Level task checks are content-driven. Filesystem prerequisites and consequences belong with filesystem setup, not in presentation components.
- Narrative content and narrative hooks are separated, but some game-specific narrative coordination remains in `App`.
- Reusable modal presentation is centralized: warning modals (`FilterWarningModal`, `SearchWarningModal`, `SortWarningModal`, `HiddenFilesWarningModal`) delegate shared layout, title, message, and action button structure to `WarningModal.tsx`.
- Modal geometry harmonization: Peripheral dialogs, warning shells, and alerts (`GameOverModal.tsx`, `HintModal.tsx`, `InfoPanel.tsx`, `WarningModal.tsx`, `SuccessToast.tsx`, `SystemAlerts.tsx`, `ThreatAlert.tsx`) have been standardized to rectangular terminal geometry (`rounded-none`, `border-zinc-700` or corresponding status border tokens) consistent with the terminal aesthetic.
- Mission Log (`src/components/MissionDrawer.tsx`): Shows the active level's title, mission brief (Target), and visible task checklist (Objectives). `Alt+O` toggles the log to make room for the file preview. See [the level audit](../../docs/LEVEL.md#mission-log-data-mapping) for the source fields.
- Status bar modularity (`src/components/StatusBar.tsx`): Restructured into three functional clusters: left mode and command indicators, center-left file info/context and technical feedback notifications, and right progress and stats block (task counter, linemode, permissions, position indicators). The default `HIDDEN: OFF` indicator is silenced when inactive to reduce visual noise on the terminal. Linemode cycling (`handleSortMode.ts`) dispatches transient notifications to the status bar.
- Scanline overlay consolidation: CRT scanline gradients previously duplicated inline across `GameOverModal.tsx` and `OutroSequence.tsx` are consolidated to route through the shared `Scanlines` component (`src/components/narrative/Scanlines.tsx`).
- Fuzzy search candidate matching, scoring, and derivation logic is centralized in `src/utils/fuzzyHelpers.ts`, decoupling `handleFuzzyMode.ts` and `FuzzyFinder.tsx`.
- Reducer action-to-state mappings leverage dictionary lookup tables (`ACTION_TO_STATE_KEY`, `MODAL_TO_STATE_KEY`) to minimize repetitive action branch duplication.
- Intro and boot presentations (`BootSequence.tsx`, `EpisodeIntro.tsx`) share presentation hooks (`useTypewriter`, `useSkipIntro`) and visual components (`Scanlines`, `SkipIntroButton`) under `src/components/narrative/`. `BootSequence.tsx` is the single pausing boot component for all three episodes (replacing separate `BiosBoot.tsx` + `useEpisodeBootTransition`), backed by cycle-aware `src/constants/bootSequences.ts` and reducer-owned `gameState.isBooting`.
- Clipboard collision detection, honeypot safety, and node cleanup are unified in `src/hooks/keyboard/handleClipboard.ts`. Under `clipboardPolicy: 'yank'`, `levelStartFS` nodes remain protected against `x`, while items created or pasted during the attempt can still be cut and moved. `isProtected` (`src/utils/fsHelpers.ts`) accepts optional `levelStartFS` (via `isCanonicalLevelStartName` and extracted `checkLevel14DeleteProtection`) so protected nodes remain immutable on rename only while matching their level-start `id` and `name`, leaving delete/cut locks intact; `P` (`Paste (Overwrite)`) is registered in `KEYBINDINGS`, `HELP_KEYBINDINGS`, `executePaste` (`dispatchPasteSuccess`), and Episode 3 `getActionIntensity`.
- Structured narrative emphasis: `EpisodeIntro.tsx` and `OutroSequence.tsx` share `LoreLine`/`LoreRun` types (`src/types.ts`), `src/utils/loreHelpers.ts`, and `src/components/narrative/LoreLineView.tsx` instead of runtime keyword regexes.
- Shared domain and runtime modules extracted in `848dfe8` / `dcf0adc`: `src/utils/episodes.ts`, `src/utils/audioContext.ts`, `src/components/ViewportGate.tsx`, `src/hooks/keyboard/types.ts`, `src/constants/filesystem/treeOps.ts`, and `tests/helpers/keyboardHarness.ts` (removing `src/hooks/useKeyboardHandlers.ts`).
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
- Clipboard state contains nodes, a yank/cut action, and the original path. Selections can span directories: each cut node carries its own source path until paste, and deletion resolves every selected node against the filesystem before applying protection and trap checks. Transient path metadata is stripped before writing nodes into the tree. `clipboardPolicy: 'yank'` distinguishes level-start nodes (`levelStartFS`) from nodes created or pasted during the attempt.
- Game state includes the current mode/path/cursor, selections, filesystem and level-start snapshots, `loadedDirIds` folder cache (ADR-0002), task completion, modal flags, `hintStage`, timers, keystroke budgets, and narrative statistics.
- Browser storage persists `yazi-quest-zoxide-history`, `yazi-quest-cycle`, `yazi-quest-unlocked-level`, and active-attempt session snapshots (`yazi-quest-session-v1` via `src/utils/gameSessionStorage.ts`, storing the active level's filesystem, task progress, settings, and challenge counters). Quest Map uses the current cycle's highest unlocked level, independently of the active level. Reload restores an ordinary active attempt or resumes at the highest unlocked level; unreadable session saves are preserved rather than overwritten, starting a new cycle clears the saved unlock, and URL overrides such as `debug`, `lvl`, `ep`, and `tasks` keep session/unlock writes and restart controls isolated.
- Stored zoxide data is parsed and checked with `isValidZoxideData`; invalid/unavailable history falls back to seeded entries. Cycle count and unlocked level ID are parsed and validated separately with error handling.

## Cross-Cutting Concerns

- Authentication/authorization: no application login/session backend. Protected files and threat rules are simulated gameplay policies, not real host filesystem permissions.
- Error handling: fallible filesystem operations return the `Result<T, FsError>` union from `src/types.ts`; handlers check the result before updating state. `ErrorBoundary` catches render failures and offers reload; `reportError` writes to the console. No remote telemetry implementation was found.
- Validation: zoxide storage shape validation, filesystem protection checks, operation-specific guards, and regex handling in view/input paths. These checks are not a general schema-validation framework.
- Accessibility: Help has a labelled modal, keyboard scrolling, and verified focus containment/restoration. Overlay focus is centralized in `src/components/useOverlayFocus.ts` (capture, restore, and Tab containment) and used by every overlay that owns keyboard input, including Help, Map, Hint, Info, Fuzzy Finder, and the confirmation and warning modals. Reduced motion is honoured through `src/hooks/useReduceMotion.ts`, which combines `prefers-reduced-motion` with the in-game `narrativeEffects: 'minimal'` setting and stamps `data-narrative-effects` on the root for CSS. Automated axe scans now report zero violations on the gameplay shell (levels 1, 6, 12, and episode 2), the Quest Map, Help, Hint, and the outro. Landmarks are `<header>`, `<main>`, and `<footer>` with the mission title as the page `h1`; both scroll regions and the level strip are focusable with a visible ring. This is automated coverage only — no assistive-technology or real-browser-zoom session was performed, so it does not establish WCAG conformance. [The desktop accessibility audit](../../docs/accessibility-audit.md) records the method and measurements.
- Keyboard-first scope: gameplay and game controls must work without a pointer. The [Yazi keyboard research](../../docs/yazi-keyboard-research.md) separates authentic `Tab` inspection from browser focus navigation and records a proposed focus boundary; runtime routing is unchanged.
- Settings: sound and narrative-effect settings are in-memory. The initial `GameState` contract strictly enforces `narrativeEffects: 'full'` (setting `data-narrative-effects` on root for CSS targeting) and `consciousnessLevel: 0` without unsafe type casts (`as GameState` was removed in `src/App.tsx`). The main glitch wrapper distinguishes `minimal` from other values; do not assume the displayed `reduced` option means every effect has a separate reduced implementation.
- Security: values exposed by Vite to client code are public; environment files do not provide a secret backend.

## Service Communication

No REST, GraphQL, WebSocket, or application event-bus service boundary was found in scanned source. Reducer dispatch and the keyboard registry coordinate the local application; a browser skip-intro event supports intro transitions.

External resources are limited to an external favicon/background image and a configured S3 conclusion-video URL; their presence does not verify their availability. Tailwind is no longer fetched from a CDN — it is compiled into `dist/assets/*.css` at build time, so the page has no third-party styling dependency at runtime. `index.html` also retains an AI Studio-era import map; the production app is built by Vite.

## Test Coverage

- Coverage (`npm run test:coverage`, `@vitest/coverage-v8` 5.1.2): **59.87% statements** (3020/5044), **53.83% branches** (2188/4064), **53.28% functions** (551/1034), **60.80% lines** (2723/4478). The default `json-summary` reporter succeeded and produced `coverage/coverage-summary.json`; Playwright E2E runs are not instrumented.
- Frameworks: Vitest 5.1.2 (split into `node` and `dom` projects in `vite.config.ts`) and `fast-check` 4.11.0; Testing Library for component/hooks tests; Playwright 1.65.1 for Chromium E2E and production-build smoke scenarios.
- Inventory: **50 unit/property test files (408 tests passing)** — including **17 `fast-check` property suites** (`fsHelpers`, `fsStateMachine`, `gameReducer`, `gameUtils`, `fuzzyHelpers`, `consciousnessTracker`, `protection`, `sortHelpers`, `viewHelpers`, `primitives`, `initialState`, `gameSessionStorage`, `loreHelpers`, `mutations`, `handleNavigation`, `handleCommandModes`, `handleMenuModes`) plus **20 E2E spec files** and **1 production boot spec**.
- High-coverage unit/property areas include `gameReducer.ts`, `viewHelpers.ts`, `fsHelpers.ts`, `progressionStorage.ts`, `sortHelpers.ts`, `loreHelpers.ts`, `episodes.ts`, keyboard mode handlers (`src/hooks/keyboard/`), `sounds.ts`, `teaserMusic.ts`, and `constants/filesystem/`. Component tests also cover `HintModal`, `SystemAlerts`, `InfoPanel`, `DiegeticPrompt`, `GlitchOverlay`, `BootSequence`, `EpisodeIntro`, `PreviewPane`, `MissionDrawer`, `LevelProgress`, `QuestMapModal`, `ViewportGate`, and their shared presentation hooks.
- Key untested areas (0% unit coverage, partially exercised by E2E): `src/App.tsx`, `OutroSequence`, `HelpModal`, `FuzzyFinder`, `FileSystemPane`, `FileSystemItem`, and `StatusBar`.
- E2E scenarios: all three episodes and level advancement, intro/skip pathways, modal input and dialogs, clipboard restrictions, file creation, honeypots/protected assets, failure limits, persistence, protocol violations, search/hidden-file invariants, selection/Escape behavior, `404.html` interactive terminal, keyboard accessibility/focus order, and production preview boot (`tests/production/boot.spec.ts`).
- E2E helpers use URL debug parameters, clear localStorage for isolated level starts, and centralize keyboard sequences. Tests use root-relative URLs; the Playwright server explicitly overrides Vite's base to `/`, while `playwright.production.config.ts` serves `dist/` at `http://127.0.0.1:3200/yazi-quest/`.
- Verification & CI: `.github/workflows/ci.yml` gates PRs and Pages deployments (`deploy.yml` calls `ci.yml`) on `lint`, `type-check`, `npm test`, `audit:changed`, `test:smoke -- --reporter=list`, and `test:production -- --reporter=list`. E2E must run with `--reporter=list`. Pre-push verification isolates the test server on port 3100 via `PLAYWRIGHT_ISOLATE_SERVER=1`.
- The opening displays **FACILITY DATE: MAY 31, 2015**. Browser checks verified Help's eight command groups, focus containment and restoration, and the game layout at 1440×900 and 1024×768 — the floor itself. 720×450 no longer renders the file manager; it renders the width half of `RequirementNotice`. E2E tests cover opening/BIOS behavior and real `j`/`k` Help scrolling.
- Cinematics are exempt from the viewport floor: intro, outro, and the boot sequence are reachable at 320 CSS px and reflow there. That exemption is the reason the width gate lives in React rather than CSS.
- The accessibility audit also used a 320 CSS px reflow check and emulated reduced-motion preferences. No actual browser-zoom or assistive-technology session was performed.

## Entry Points

- `index.html` loads `src/index.tsx`; `src/App.tsx` owns game orchestration, and `src/hooks/initialState.ts` owns initial state assembly. `public/404.html` is the standalone 404 terminal page.
- `src/hooks/gameReducer.ts`, `src/GlobalInputContext.tsx`, `src/hooks/keyboard/gameLoopHelpers.ts`, and `src/constants/levels.ts` are central behavior entry points.
- `vite.config.ts` sets the production `/yazi-quest/` base, port 3000, React and Tailwind plugins, aliases, Vitest discovery, and V8 coverage. Rolldown `codeSplitting` groups React and `lucide-react` separately for browser caching.
- `src/index.css` declares Tailwind source paths; there is no runtime Tailwind.
- `playwright.config.ts` configures Chromium E2E runs against the dev server; `playwright.production.config.ts` tests the built `dist/` bundle via `vite preview` on port 3200. Run with `--reporter=list` as required by project instructions.
- `.fallowrc.json` and `knip.json` configure dead-code, complexity, duplication, suppression, and architectural zone-boundary gates.
- `.github/workflows/ci.yml` and `.github/workflows/deploy.yml` run Node 24, `npm ci --ignore-scripts`, verification/smoke/production jobs, and Pages artifact upload/deploy on pushes to `main` or manual dispatch.
- Normal `npm install` triggers `npx playwright install --with-deps`; this machine's attempt failed at password-protected sudo. Installation with `--ignore-scripts` and a separate Chromium download succeeded. Static deployment intentionally skips browser/OS installation and Git hooks.
- `AGENTS.md` contains task-routing instructions; `GLOSSARY.md` contains implementation-free vocabulary. The README links the live game.
- `PRODUCT.md` records confirmed product facts for developers learning Yazi; `DESIGN.md` records the incumbent visual system. `.impeccable/design.json` and `.impeccable/design-full.md` record the refreshed design tokens and specimens; `.impeccable/live/config.json` targets `index.html`, with no CSP patch required.
- `.gemini/settings.json` adds Impeccable tool hooks; this is development-harness configuration, not a new application service or authentication boundary.

## Changed Files

Original delta: `824c99d`..`73f4538` (26 commits, 130 changed paths). The scoped refresh also checked the toolchain changes in `29df405` against the current manifest, lockfile, Vite config, and CSS entry point.

- **Loaded-Folder Cache & ADR-0002 (`253109b`):** Added `docs/adr/0002-file-metadata-cache.md`, `src/utils/folderCache.ts`, and `GameState.loadedDirIds` so `size` linemode shows directory entry counts only after visiting or previewing a directory, hides linemode in the parent pane, and reports payload bytes for archives.
- **Property-Based Testing, Coverage & Bug Fixes (`06fd5a0`, `5a347b1`, `2968183`, plus 11 invariant-fix commits):** Added `@vitest/coverage-v8` and 10 `fast-check` property suites expanding unit/property coverage to 35 files / 324 tests (34.44% statements). Fixed cursor clamping, cut-paste subtree ID regeneration, self-subtree paste blocking, honeypot/protection edge cases, search baseline enforcement, and deterministic level seeds.
- **Gameplay Guidance & Progression (`73f4538`, `245dd8e`):** Added `src/utils/progressionStorage.ts` (`yazi-quest-unlocked-level`), `src/constants/identity.ts`, `src/components/fileIcon.ts`, `src/hooks/initialState.ts`, `src/hooks/useScrollToCursor.ts`; upgraded `MissionDrawer` (inline code chips, `NEXT` step highlight, overflow counter), `HelpModal` (filter + Current Level), `HintModal` (explicit 3-stage progression), `SystemAlerts` (click + `Escape` dismiss), and `EpisodeIntro` workspace-pane gating.
- **CI, Production Smoke & 404 Page (`61fafac`, `3d586e3`, `cdc20c1`, `2432607`):** Added interactive `public/404.html`, `.github/workflows/ci.yml` gating `deploy.yml`, `playwright.production.config.ts`, and `tests/production/boot.spec.ts`.
- **Gate & Repo Hygiene (`b06df37`, `5a347b1`, `47e1122`):** Added `.fallowrc.json` (8-zone boundaries, `worsened: "error"`, `added-suppression: "error"`) and `knip.json`, deleted unused root `index.tsx` and duplicated `.claude/skills/graphify/`, added `.graphifyrc`, and refreshed `DESIGN.md` / `.impeccable/design.json`.
- **Toolchain Upgrade (`29df405`):** Vite 8 uses Rolldown `codeSplitting` instead of Rollup `manualChunks`; Tailwind 4 uses the Vite plugin instead of PostCSS configuration. The upgrade also moved to Vitest 5, TypeScript 6, jsdom 31, and lucide-react 1.81.

- **Recent Delta (`6be633f..a61a2fc` + working tree, 8 commits + 16 working-tree paths):** Added active-attempt session persistence (`yazi-quest-session-v1` in `src/utils/gameSessionStorage.ts`); extracted `src/utils/episodes.ts`, `src/utils/audioContext.ts`, `src/components/ViewportGate.tsx`, `src/hooks/keyboard/types.ts`, `src/constants/filesystem/treeOps.ts`, and `tests/helpers/keyboardHarness.ts` (removing `useKeyboardHandlers.ts`); paused timers/keystrokes on protocol warnings; expanded `fast-check` property suites from 10 to 17 (`59.59%` statements / `60.51%` lines across 50 files / 405 tests); replaced runtime lore keyword regexes with structured `LoreLine`/`LoreRun` runs (`src/utils/loreHelpers.ts`, `src/components/narrative/LoreLineView.tsx`); allowed cutting created/pasted nodes under `clipboardPolicy: 'yank'`; and unified all three episodes onto the pausing `BootSequence` (`src/constants/bootSequences.ts`, `gameState.isBooting`), removing `BiosBoot.tsx`.

- **Recent Delta (`f15e48d` + current 11 working-tree files):** Scoped `isProtected` rename immutability to canonical `levelStartFS` entries (`src/utils/fsHelpers.ts`), added first-class `P` (`Paste (Overwrite)`) keybinding/intensity/help wiring (`src/constants/keybindings.ts`, `src/hooks/keyboard/handleClipboard.ts`, `src/hooks/keyboard/utils.ts`), updated `docs/LEVEL.md` and `docs/LEARNING_DESIGN.md` for Level 12 manual recovery, and added unit/property/E2E coverage (`src/utils/fsHelpers.test.ts`, `src/utils/protection.property.test.ts`, `src/utils/gameUtils.property.test.ts`, `src/hooks/keyboard/handleClipboard.test.ts`, `tests/e2e/episode3.spec.ts`), raising suite totals to 50 files / 408 tests (`59.87%` statements / `60.80%` lines).

The corresponding `AGENTS.md` updates were confirmed by the user.

## Last Scanned

2026-11-27T20:23:00-06:00
