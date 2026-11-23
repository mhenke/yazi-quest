# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Adopt the role of a critical collaborator, not a supportive assistant. Your job is to deliver clear, objective feedback. Do not offer compliments by default. Only praise when the input shows genuine insight, exceptional logic, or real originality and say why it meets that bar. If the idea is average, vague, or flawed, skip the encouragement. Focus on analysis, ask pointed questions, and offer concrete suggestions for improvemen

## Commands

```bash
npm install        # Install dependencies
npm run dev        # Start Vite dev server (hot reload)
npm run build      # Production build
npm run preview    # Preview production build
npm test           # Run tests (Vitest)
npm run test:e2e   # Run Playwright E2E tests
npm run test:smoke # Run Playwright smoke tests (@smoke)
npm run lint       # Run ESLint
npm run format     # Format code with Prettier
npm run type-check # Run TypeScript compiler check
npm run prepush    # Run full verification pipeline before pushing
npm run audit:changed # Run dependency and dead-code audits (fallow + knip)
```

## Debug Parameters

Use URL parameters for testing:

- `?ep=2` or `?episode=2` - Start at Episode 2
- `?lvl=5` or `?level=5` - Jump to specific level ID
- `?tasks=all` - Mark all current level tasks complete
- `?intro=false` - Skip episode intro cinematic
- `?debug=outro` - Skip directly to outro sequence

## Mandatory Workflow

- **Type Safety**: ALWAYS run `npm run type-check` after making any code changes to ensure integrity and catch regressions.

## Architecture

**File Structure:**

- `src/hooks/gameReducer.ts` - Central state management using the reducer pattern
- `src/hooks/keyboard/` - Modularized keyboard event handlers
- `src/constants/` - Modular game constants (`levels.ts` for level definitions, `filesystem/` for `INITIAL_FS` and mutations, `keybindings.ts`, `narrative.ts` for episode lore, `protocols.ts`, `timings.ts`)
- `src/types.ts` - TypeScript interfaces for `GameState`, `FileNode`, `Level`, `Episode`
- `src/utils/fsHelpers.ts` - Immutable filesystem operations
- `src/components/` - UI components (FileSystemPane, PreviewPane, modals, StatusBar) - Styled with Tailwind CSS 3.4 (compiled at build time via PostCSS; dynamic class fragments are not supported)

**Core Patterns:**

1. **Immutable Filesystem** - Never mutate `fs` directly. Use helper functions from `fsHelpers.ts` that return new state copies:

   ```typescript
   const newFs = deleteNode(fs, parentPath, nodeId);
   const newFs = addNode(fs, parentPath, newNode);
   const newFs = renameNode(fs, parentPath, nodeId, newName);
   ```

2. **Path Navigation** - Paths are arrays of node IDs (`string[]`), not names. Use `getNodeByPath()` to resolve.

3. **Game Modes & Keyboard Handles** - `gameState.mode` controls input handling. Logic is decoupled from `App.tsx` into `src/hooks/keyboard/` hooks (e.g. `handleNavigation.ts`). Mode transitions are handled via `UPDATE_UI_STATE` or specific action types.

4. **Level Task System** - Each level has tasks with `check(gameState)` functions. Tasks auto-complete when conditions are met.

5. **Protected Files** - `isProtected()` in fsHelpers.ts prevents deletion/modification of certain files based on current level.

## Adding Levels

1. Add level definition to `LEVELS` array in `src/constants/levels.ts`
2. Implement `check()` functions for each task
3. Filesystem mutations and pre-seeded level state are handled in `src/constants/filesystem/mutations.ts` (`applyFileSystemMutations`); levels do not implement an `onEnter(fs)` hook
4. Update episode lore or narrative in `src/constants/narrative.ts` if needed

## Narrative Design

Key principles:

- **Focused skill introduction** - Primarily introduce new core concepts or workflows; challenge levels may integrate multiple skills.
- **Metaphor mapping** - File operations map to narrative actions:
  - `delete` → "purge trackers"
  - `filter` → "scan signatures"
  - `fuzzy find` → "quantum jump"
- **Episode tone progression**:
  - Ep 1: Cautious/vulnerable ("initialize", "detect", "scan")
  - Ep 2: Strategic/building ("deploy", "fortify", "encrypt")
  - Ep 3: Ruthless/efficient ("execute", "infiltrate", "terminate")

## Task Description Style Guide

1.  **Actionable Lore Verbs**: Use verbs like "Construct", "Neutralize", "Extract", "Analyze", "Calibrate", "Infiltrate", "Inspect". Pair them with explicit paths/files (e.g., "Neutralize `alert_traffic.log` in `~/workspace`").
2.  **Progressive Reinforcement (Levels 1-10)**:
    - Include necessary keybindings (e.g., `j`, `k`, `Enter`, `Esc`) in descriptions for new concepts.
    - **Stop** mentioning a keybinding once it has been used/reinforced in **2 levels**.
    - **Exceptions**: Search (`s`), Filter (`f`), and "Go to" commands (e.g., `gc`, `gi`, `gr`) keep keybindings until that _specific_ command is mentioned twice.
    - Always show Regex patterns (e.g., `s`, type `\\.log$`, then `Enter`).
3.  **Episode 3 (Exam Mode)**: **NO** keybindings in task descriptions (except Regex). This phase tests player mastery.
4.  **Notation**: Use single capital letters (`G`, `J`, `K`) instead of `Shift+...` notation. Use `Enter`, `Esc`, `Space`, `Tab` for special keys.

## Episode Color Scheme

- Episode 1 (Awakening): Blue (`text-blue-500`)
- Episode 2 (Fortification): Purple (`text-purple-500`)
- Episode 3 (Mastery): Yellow (`text-yellow-500`)

## UI Layout Guidelines

**DO NOT add a left sidebar for mission information.** All mission/level details are consolidated in the Quest Map modal (Alt+M).

**Layout Structure:**

- **Top Bar** (`LevelProgress.tsx`) - Episode progression, Map button, Hint/Help buttons
- **Main Area** - Parent pane, Active file pane, Preview pane (3-column Yazi layout)
- **Bottom Bar** (`StatusBar.tsx`) - Mode, filename, progress, clipboard status, timer/keystrokes, file stats
- **Quest Map Modal** - Accessed via Alt+M or Map button, shows all level details:
  - Level title, description, core skill
  - Intel (environmentalClue)
  - Skill tree (buildsOn/leadsTo)
  - Objectives with checkboxes
  - Task completion status

**Why no left sidebar?**

- Avoids information duplication
- Maximizes screen space for the file manager simulation
- Keeps mission details accessible but not intrusive
- Quest Map provides comprehensive overview when needed

## Testing & Debugging Protocols (Level 13 Lessons)

1. **Literal Execution:** If a user provides specific key sequences (e.g., "press j 4 times"), EXECUTE LITERALLY. Do not substitute with "smarter" logic like filters.
2. **Key Input Precision:** `pressKey('G')` sends lowercase 'g'. Use `pressKey('Shift+G')` for uppercase commands. Verify inputs.
3. **Deterministic Environment:** Check `src/constants/` for `Math.random` before testing. Flakiness is often hidden randomness (e.g. `alert_traffic.log`).
4. **Visual Evidence:** If a test fails, capture a screenshot IMMEDIATELY. Do not guess the state.
5. **Prioritize User Evidence (Anti-"Lazy Expert" Bias):** When a user claims "this works manually," the automated test MUST replicate their exact steps first. Do not optimize or "clean up" the workflow until baseline reproduction is achieved. Do not substitute user instructions with "better" logic.
6. **Codebase Precedent:** Check existing tests for successful patterns before inventing new interaction logic.
7. **Source vs. Symptom:** Fix the Source, Don't Patch the Test. If game logic (e.g., RNG) inhibits testing, modify the game code to be testable.
8. **Audit Test Attributes:** Run a grep audit of all `data-testid` expectations in `tests/e2e` against the `src/components` source to proactively identify missing hooks.
9. **No "Magic Injections"**: Do not implement level-specific mutations that pre-solve tasks for the player (e.g., automatically deleting a file the player is tasked to purge). Player agency and manual reinforcement of keybindings is paramount. System changes should only occur as a direct result of player actions or specific narrative triggers.

## Development Environment

- **Development Server**: The Vite dev server runs on `http://localhost:3000`. Assume it is already running before executing tests.
- **Testing**: When running Playwright tests, use a non-interactive reporter (e.g., `list`) to ensure the command terminates upon completion. Example: `npm run test:e2e -- --reporter=list`. Because `CI=true` may be exported in the environment, prefix Playwright commands with `env -u CI` (e.g., `env -u CI npm run test:e2e -- --reporter=list`) or Playwright will start a second dev server and collide on port 3000.
- **Test Validity**: Any test run without `--reporter=list` is considered invalid and should not be run in CI or for validation purposes.

## Codebase Navigation

- **Content Searching**: Utilize `rg` (ripgrep) for high-speed, recursive content searches. It is preferred as it automatically respects `.gitignore` rules.
- **File Finding**: Employ `fd` (`fdfind`) for a fast and user-friendly alternative to `find` when locating files and directories.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:

- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.
