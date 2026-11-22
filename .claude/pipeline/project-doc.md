# Project Documentation

> Generated: 2026-11-22T20:40:47Z | Mode: DELTA
> Source baseline: `245e76602381e5927ad399d8d64caecaa0fe84a0`

## Tech Stack

- Runtime: browser application; Node.js 24 in the deployment workflow. Local scan environment: Node.js 24.22.2 / npm 11.19.1. No Node engine constraint is declared.
- Language: TypeScript / TSX, ES modules, ES2022 target. TypeScript strict mode, implicit-any checking, and strict-null checking are disabled in `tsconfig.json`.
- Framework: React 19.2.3, bundled by Vite 7.3.7 with the React plugin.
- Database: none. The game operates on an in-memory simulated filesystem.
- Styling: Tailwind through its browser CDN, inline styles in `index.html`, and local CSS for narrative/glitch effects. JetBrains Mono is loaded from Google Fonts.
- State management: `useReducer(gameReducer)` in `src/App.tsx`; `GlobalInputProvider` arbitrates keyboard input. Some UI/narrative behavior uses local hook state.
- Hosting: static GitHub Pages site at <https://mhenke.github.io/yazi-quest/>.

## Dependencies

Versions below are resolved from `package-lock.json`, not claims about the newest available releases.

| Group        | Libraries and resolved versions                                                                                                |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Core         | `react` 19.2.3, `react-dom` 19.2.3, `lucide-react` 0.556.0                                                                     |
| Development  | `vite` 7.3.7, `@vitejs/plugin-react` 5.1.2, `typescript` 5.9.3                                                                 |
| Code quality | `eslint` 9.39.2, `@typescript-eslint/parser` and plugin 8.51.0, `prettier` 3.7.4, `husky` 9.1.7, `lint-staged` 16.2.7          |
| Testing      | `vitest` 4.1.12, `jsdom` 27.4.0, `@testing-library/react` 16.3.1, `@testing-library/jest-dom` 6.9.1, `@playwright/test` 1.57.0 |

Several development dependencies use `*` in `package.json`. Reproducible deployment uses `npm ci` and the npm lockfile; `pnpm-lock.yaml` also exists, but the current workflow does not consume it. The offline dependency doctor reported wildcard constraints, not a resolver or security audit.

### Security review

Before the approved updates, `npm audit --json` reported 20 vulnerable-package entries: 1 critical, 13 high, 5 moderate, and 1 low. Direct vulnerable packages were development dependencies `vite` and `vitest`; this did not demonstrate an exploit in the static Pages build.

The user approved Vite 7.3.7 and Vitest 4.1.12. These exact versions are installed and locked; Node 24 and the installed React plugin satisfy their published engine/peer ranges. The post-update audit reports 17 transitive entries (12 high, 4 moderate, 1 low), with no critical or directly flagged packages. Fourteen wildcard manifest constraints remain; unrelated major upgrades were not applied.

Do not use an unbounded `npm update` for this security pass: existing wildcard constraints permit major TypeScript, ESLint, and React-plugin changes.

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
- Integrated verification: **125 unit tests across 12 files and 101 E2E tests passed** under Vitest 4.1.12. Lint, type-check, and the Vite 7.3.7 production build passed. After the final metadata/footer CSS adjustments, type-check and build passed again; the scoped Impeccable type detector returned no findings.
- The Episode II boot regression failed before the callback/timer fix and passed afterward. Actual browser verification confirmed direct Episode II entry dismisses boot and accepts keyboard navigation.
- Rendered checks covered 1440×900, 1024×768, and 720×450 viewports. At 720px, the task counter remained fully visible without horizontal overflow. This is narrow-window/zoom-equivalent layout evidence, not an actual browser-zoom, mobile, screen-reader, or full WCAG test.

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

Delta discovery used `git diff HEAD~1 --name-only`, supplemented by untracked-file discovery and integration review. The review inventoried 67 selected paths: 57 existing files and 10 deletions. Deleted files were not opened or restored. The grouped changes include:

- **Dead code and unused assets removed:** `src/components/CelebrationConfetti.tsx`, `src/components/GlitchText.tsx`, `src/components/GlitchThoughtText.tsx`, `src/components/ScreenFlash.tsx`, `src/utils/fuzzyMatch.ts`, `src/utils/glitchHelper.tsx`, `src/screen-flash.css`, `src/glitch-codrops.css`.
- **New shared modules:** `src/components/WarningModal.tsx` (unified modal dialog shell), `src/utils/fuzzyHelpers.ts` (centralized fuzzy candidate evaluation and filtering).
- **Refactored UI and warning dialogs:** `src/components/FilterWarningModal.tsx`, `src/components/SearchWarningModal.tsx`, `src/components/SortWarningModal.tsx`, `src/components/HiddenFilesWarningModal.tsx`, `src/components/FuzzyFinder.tsx`, `src/components/StatusBar.tsx`, `src/components/FileSystemPane.tsx`, `src/components/PreviewPane.tsx`, `src/App.tsx`.
- **Refactored hooks, reducers, and keyboard routing:** `src/hooks/gameReducer.ts` (action/modal lookup maps, tick separation), `src/hooks/keyboard/handleFuzzyMode.ts` (selection handler extraction), `src/hooks/keyboard/handleGCommandMode.ts`, `src/hooks/keyboard/handleNavigation.ts`, `src/hooks/keyboard/utils.ts`.
- **Refactored utilities, types, and constants:** `src/utils/fsHelpers.ts`, `src/utils/viewHelpers.ts`, `src/utils/error.ts`, `src/utils/gameUtils.ts`, `src/utils/dynamicGlitch.ts`, `src/types.ts`, `src/constants/bootSequences.ts`, `src/constants/keybindings.ts`, `src/constants/protocols.ts`, `src/constants/ghostDialogue.ts`, `src/constants/filesystem/mutations.ts`, `src/constants/filesystem/scenarios.ts`.
- **Boot regression and objective clarity:** `src/components/narrative/BootSequence.tsx`, `src/components/narrative/BootSequence.test.tsx`, `src/constants/levels.ts`. Original mission verbs and narrative nouns were retained; only the watcher-agent inspection objective gained a mechanical clarification.
- **Additional functional typography:** `src/components/FileSystemItem.tsx`, `src/components/LevelProgress.tsx`, `src/components/InfoPanel.tsx`, `src/components/HelpModal.tsx`, `src/components/HintModal.tsx`, `src/components/GCommandDialog.tsx`, `src/components/OutroSequence.tsx`, `src/components/SuccessToast.tsx`, `src/components/ThreatAlert.tsx`, `src/components/narrative/GhostMessage.tsx`.
- **Product/design scope and research:** `PRODUCT.md`, `DESIGN.md`, `.impeccable/design.json`, `.impeccable/live/config.json`, `README.md`, `docs/yazi-mobile-research.md`. Desktop browsers with physical keyboards are the confirmed target; touch-only mobile gameplay is outside scope, while desktop zoom and narrow windows remain in scope.
- **Tooling, knowledge graph, and documentation:** `graphify-out/` (in-project AST code knowledge graph), `.claude/skills/graphify/`, `.claude/settings.json`, `CLAUDE.md`, `.gitignore`, `GLOSSARY.md`, `PRODUCT.md`, `README.md`, `package.json`, `package-lock.json`, `.claude/pipeline/project-doc.md`, `.claude/pipeline/state.json`.

Vite 7.3.7 and Vitest 4.1.12 were installed. Helper extractions remain within the existing component, utility, and keyboard-handler layers; no application service or auth/session boundary was introduced. This scan did not edit `AGENTS.md`.

## Last Scanned

2026-11-22T20:40:47Z
