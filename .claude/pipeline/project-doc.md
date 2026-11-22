# Project Documentation

> Generated: 2026-11-22T21:39:10Z | Mode: DELTA
> Source baseline: `70a4928` plus working-tree documentation

## Tech Stack

- Runtime: browser application; Node.js 24 in the deployment workflow. Local scan environment: Node.js 24.22.2 / npm 11.19.1. No Node engine constraint is declared.
- Language: TypeScript / TSX, ES modules, ES2022 target. TypeScript strict mode, implicit-any checking, and strict-null checking are disabled in `tsconfig.json`.
- Framework: React 19.2.3, bundled by Vite 7.3.7 with the React plugin.
- Database: none. The game operates on an in-memory simulated filesystem.
- Styling: Tailwind through its browser CDN, inline styles in `index.html`, and local CSS for narrative/glitch effects. The interface uses the existing system-monospace stack without a webfont download.
- State management: `useReducer(gameReducer)` in `src/App.tsx`; `GlobalInputProvider` arbitrates keyboard input. Some UI/narrative behavior uses local hook state.
- Hosting: static GitHub Pages site at <https://mhenke.github.io/yazi-quest/>.

## Dependencies

Versions below are resolved from `package-lock.json`, not claims about the newest available releases.

| Group        | Libraries and resolved versions                                                                                                                                                           |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Core         | `react` 19.2.3, `react-dom` 19.2.3, `lucide-react` 0.556.0                                                                                                                                |
| Development  | `vite` 7.3.7, `@vitejs/plugin-react` 5.1.2, `typescript` 5.9.3                                                                                                                            |
| Code quality | `eslint` 9.39.2, `@typescript-eslint/parser` and plugin 8.73.0, `prettier` 3.7.4, `husky` 9.1.7, `lint-staged` 16.2.7, `@commitlint/cli` 21.2.4, `@commitlint/config-conventional` 21.2.4 |
| Testing      | `vitest` 4.1.12, `jsdom` 27.4.0, `@testing-library/react` 16.3.1, `@testing-library/jest-dom` 6.9.1, `@playwright/test` 1.57.0                                                            |

Reproducible deployment uses `npm ci` and `package-lock.json`. The secondary `pnpm-lock.yaml` was regenerated with `pnpm import`; the Pages workflow does not consume it. Fourteen `*` constraints were replaced with exact versions. The offline dependency doctor reported zero manifest findings; it does not resolve dependencies or check vulnerabilities.

### Security review

Before the approved updates, `npm audit --json` reported 20 vulnerable-package entries: 1 critical, 13 high, 5 moderate, and 1 low. Direct vulnerable packages were development dependencies `vite` and `vitest`; this did not demonstrate an exploit in the static Pages build.

The initial Vite and Vitest updates left 17 transitive entries (12 high, 4 moderate, 1 low). In-range transitive updates and TypeScript ESLint 8.73.0 cleared the remainder. Both `npm audit` and `pnpm audit` reported zero known findings after the lockfile updates. Vite 7.3.7, Vitest 4.1.12, and React 19.2.3 were retained. No overrides or peer-dependency bypasses were needed.

## Architecture Pattern

A client-only React application organized by technical concern, with declarative curriculum content and a centralized game reducer. `App.tsx` orchestrates initialization, derived views, task evaluation, transitions, and input registrations; it remains a large integration component rather than a thin shell.

The runtime tree is `StrictMode` → `ErrorBoundary` → `GlobalInputProvider` → `App`. Keyboard behavior is split into mode-specific handlers. Narrative hooks observe game state and feed notifications, dialogue, effects, and timers back into the UI.

The root `index.tsx` is a separate legacy entry file. The actual HTML module entry is `src/index.tsx`, which includes the required input provider.

## Folder Structure

| Location                                       | Purpose                                                                                  |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `src/components/`                              | Filesystem panes, preview, HUD, dialogs, intros, outro, and alerts                       |
| `src/components/narrative/`                    | Boot-sequence and ghost-message presentation                                             |
| `src/components/ui/`                           | Diegetic prompt and glitch-overlay components                                            |
| `src/hooks/`                                   | Game reducer, keyboard coordination, timers, and narrative hooks                         |
| `src/hooks/keyboard/`                          | Navigation, clipboard, deletion, fuzzy modes, sorting, and modal handlers                |
| `src/constants/`                               | Levels, keybindings, episode/narrative content, timings, and filesystem setup            |
| `src/constants/filesystem/`                    | Initial tree, level mutations, prerequisites, and consequence scenarios                  |
| `src/utils/`                                   | Filesystem operations, visible-item derivation, sorting, validation, sound, and effects  |
| `src/types.ts`                                 | Shared filesystem, level, clipboard, settings, and game-state contracts                  |
| `tests/e2e/`                                   | Playwright specs, fixtures, and keyboard/game helpers                                    |
| `public/images/`                               | Static simulation/narrative images                                                       |
| `docs/`                                        | Narrative/curriculum reference and historical plans; plans may be closed or stale        |
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
- Accessibility: Help has a labelled modal, keyboard scrolling, and verified focus containment/restoration. Other overlays, inputs, and motion settings have gaps documented in [the desktop accessibility audit](../../docs/accessibility-audit.md). Neither this scan nor the audit establishes WCAG conformance.
- Keyboard-first scope: gameplay and game controls must work without a pointer. The [Yazi keyboard research](../../docs/yazi-keyboard-research.md) separates authentic `Tab` inspection from browser focus navigation and records a proposed focus boundary; runtime routing is unchanged.
- Settings: sound and narrative-effect settings are in-memory. The main glitch wrapper distinguishes `minimal` from other values; do not assume the displayed `reduced` option means every effect has a separate reduced implementation.
- Security: Vite substitutes configured Gemini environment values into client code. Such values are public if used in the bundle; environment files do not provide a secret backend. No Gemini API call was found in scanned source.

## Service Communication

No REST, GraphQL, WebSocket, or application event-bus service boundary was found in scanned source. Reducer dispatch and the keyboard registry coordinate the local application; a browser skip-intro event supports intro transitions.

External resources include the Tailwind CDN, an external favicon/background image, and a configured S3 conclusion-video URL. Their presence does not verify their availability. `index.html` also retains an AI Studio-era import map; the production app is built by Vite.

## Test Coverage

- Overall coverage: **unmeasured**. No coverage summary, LCOV report, configured coverage provider, or installed Vitest coverage provider was found. A percentage cannot be inferred from passing tests.
- Frameworks: Vitest with jsdom; Testing Library for component/hooks tests; Playwright for Chromium E2E scenarios.
- Inventory: **14 unit-test files**, **16 E2E spec files**, and shared E2E fixtures/helpers.
- Unit-test areas: filesystem/game helpers, skip-intro flag, consciousness/glitch helpers, terminal thoughts and ghost dialogue, boot/ghost UI, typewriter/intro hooks, diegetic prompt, and glitch overlay.
- Areas without dedicated colocated unit tests in the inventory: `gameReducer`, keyboard mode handlers, input arbitration, timer integration, and storage validation. Some are exercised through E2E; this is not a claim of zero executed coverage.
- E2E scenarios: all three episodes and level advancement, intro/skip pathways, modal input, clipboard restrictions, file creation, honeypots/protected assets, failure limits, persistence, protocol violations, and selection/Escape behavior.
- E2E helpers use URL debug parameters, clear localStorage for isolated level starts, and centralize keyboard sequences. Tests use root-relative URLs; the Playwright server explicitly overrides Vite's base to `/`.
- Integrated verification: **132 unit tests across 14 files and 101 Chromium E2E tests passed**. Lint, type-check, and the Vite 7.3.7 production build also passed. E2E ran on an isolated dev server with `--reporter=list`.
- The opening displays **FACILITY DATE: MAY 31, 2015**. Browser checks verified Help's eight command groups, focus containment and restoration, and layout at 1440×900, 1024×768, and 720×450. E2E tests cover opening/BIOS behavior and real `j`/`k` Help scrolling.
- The accessibility audit also used a 320 CSS px reflow check and emulated reduced-motion preferences. No actual browser-zoom or assistive-technology session was performed.

## Entry Points

- `index.html` loads `src/index.tsx`; `src/App.tsx` owns game initialization and orchestration.
- `src/hooks/gameReducer.ts`, `src/GlobalInputContext.tsx`, `src/hooks/useKeyboardHandlers.ts`, and `src/constants/levels.ts` are central behavior entry points.
- `vite.config.ts` configures the production `/yazi-quest/` base, port 3000, React, environment substitution, aliases, and Vitest discovery.
- `playwright.config.ts` configures Chromium, the local dev server, timeouts, retries, and artifacts. Run with `--reporter=list` as required by project instructions.
- `.github/workflows/deploy.yml` uses Node 24, `npm ci --ignore-scripts`, type-check, build, and Pages artifact/deploy actions on pushes to `main` or manual dispatch.
- Normal `npm install` triggers `npx playwright install --with-deps`; this machine's attempt failed at password-protected sudo. Installation with `--ignore-scripts` and a separate Chromium download succeeded. Static deployment intentionally skips browser/OS installation and Git hooks.
- `AGENTS.md` contains task-routing instructions; `GLOSSARY.md` contains implementation-free vocabulary. The README links the live game.
- `PRODUCT.md` records confirmed product facts for developers learning Yazi; `DESIGN.md` records the incumbent visual system. `.impeccable/design.json` provides schema-v2 extensions and six self-contained component specimens; `.impeccable/live/config.json` targets `index.html`, with no CSP patch required.
- `.gemini/settings.json` adds Impeccable tool hooks; this is development-harness configuration, not a new application service or authentication boundary.

## Changed Files

Latest delta (`git diff HEAD~1 --name-only` plus research-related working-tree files): `.husky/pre-push` delegates to `npm run prepush` without repeating the reporter flag; `.claude/pipeline/project-doc.md`, `PRODUCT.md`, `docs/accessibility-audit.md`, and `docs/yazi-keyboard-research.md` document the keyboard-first scope and open accessibility work. Five paths accounted for. Prior integrated changes retained below:

- **Commitlint integration:** Installed `@commitlint/cli` and `@commitlint/config-conventional` (v21.2.4) in `devDependencies`, added `commitlint` npm script, configured `commitlint.config.cjs` with `body-max-line-length: [0]`, and activated git hook validation.
- **Intro & boot deduplication:** Extracted shared typing animation and CRT rendering into `src/components/narrative/useTypewriter.ts`, `useSkipIntro.ts`, `Scanlines.tsx`, and `SkipIntroButton.tsx` (with unit tests in `useTypewriter.test.ts` and `useSkipIntro.test.ts`), eliminating clone group `dup:6f93754e` across `BiosBoot.tsx` and `EpisodeIntro.tsx`.
- **Clipboard paste deduplication:** Unified destination collision detection, honeypot safety, and cut node cleanup in `src/hooks/keyboard/handleClipboard.ts`, eliminating clone groups `dup:70715035` and `dup:682b7a72`.
- **E2E test helpers pruned:** Cleaned 12 unreferenced helper exports in `tests/e2e/utils.ts` and scoped `dismissViolation` internally, dropping Knip's unused export count to 0.
- **Narrative timeline alignment ("Story present: 2015"):** Aligned boot sequence date (`FACILITY DATE: MAY 31, 2015`), `BASE_TIME`, simulated filesystem timestamps, and historical email records in `docs/emails_from_athorne/` (renamed 6 files to `2013-*`), `src/components/BiosBoot.tsx`, `src/components/FileSystemItem.tsx`, `src/constants/filesystem/initial.ts`, `src/constants/filesystem/scenarios.ts`, `src/constants/narrative.ts`, `tests/e2e/episode1.spec.ts`, and `tests/e2e/intro-pathway.spec.ts`.
- **Help and typography:** `src/components/HelpModal.tsx`, `src/constants/keybindings.ts`, and `tests/e2e/dialogs.spec.ts` group the command reference and cover keyboard focus/scrolling. `index.html`, `src/glitch.css`, `src/index.css`, and `DESIGN.md` align the interface on system monospace.
- **Dependency maintenance:** `package.json`, `package-lock.json`, and `pnpm-lock.yaml` record reviewed pins and patched versions. Pre-push smoke tests use the noninteractive `list` reporter.
- **Domain model & instructions:** Documented canonical `Story present` in `GLOSSARY.md` and `PRODUCT.md`; added `Codebase exploration` instructions to `AGENTS.md` guiding agents to query `graphify-out/` before search.
- **Graphify:** The local AST graph was refreshed to 638 nodes and 1,776 edges across 45 communities. A query resolves `HelpModal` and `useTypewriter`; this is not a semantic documentation index.

No framework, application-layer, or auth/session change in the latest delta. `AGENTS.md` was left unchanged by this scan.

## Last Scanned

2026-11-22T21:39:10Z
