# AGENTS.md

This file provides guidance for agentic coding agents (like yourself) working with the **Yazi Quest** codebase.

## Role & Approach

Adopt the role of a critical collaborator, not a supportive assistant. Your job is to deliver clear, objective feedback. Do not offer compliments by default. Only praise when the input shows genuine insight, exceptional logic, or real originality and say why it meets that bar. If the idea is average, vague, or flawed, skip the encouragement. Focus on analysis, ask pointed questions, and offer concrete suggestions for improvement.

## Project Overview

**Yazi Quest** is an interactive, browser-based game that teaches [Yazi](https://github.com/sxyazi/yazi) file manager keybindings through a cyberpunk narrative. The player is an AI escaping a secure system.

**Core Technologies:**

- **Framework:** React 19
- **Language:** TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS (CDN)
- **Icons:** Lucide React

## Commands

```bash
npm install        # Install dependencies
npm run dev        # Start Vite dev server (hot reload)
npm run build      # Production build
npm run preview    # Preview production build
npm test           # Run tests (Vitest)
npm run lint       # Run ESLint
npm run format     # Format code with Prettier
npm run type-check # Run TypeScript compiler check
```

## Debug Parameters

Use URL parameters for testing:

- `?ep=2` or `?episode=2` - Start at Episode 2
- `?lvl=5` or `?level=5` - Jump to specific level ID
- `?tasks=all` - Mark all current level tasks complete
- `?intro=false` - Skip episode intro cinematic
- `?debug=outro` - Skip directly to outro sequence

## Architecture

**File Structure:**

- `src/index.tsx`: Application entry point.
- `src/App.tsx`: Main React component; orchestrates the reducer and global listeners.
- `src/hooks/gameReducer.ts`: Central state management using the reducer pattern.
- `src/hooks/keyboard/`: Modularized keyboard event handlers.
- `src/constants.tsx`: Level definitions and other game constants.
- `src/types.ts`: TypeScript type definitions.
- `src/components/`: Reusable UI components.
- `src/utils/`: Utility functions (fsHelpers.ts, gameUtils.ts, etc.).

**Core Patterns:**

1. **Immutable Filesystem** - **NEVER mutate `fs` directly.** Use helper functions from `fsHelpers.ts` that return new state copies:

   ```typescript
   const newFs = deleteNode(fs, parentPath, nodeId);
   const newFs = addNode(fs, parentPath, newNode);
   const newFs = renameNode(fs, parentPath, nodeId, newName);
   ```

2. **Path Navigation** - Paths are arrays of node IDs (`string[]`), not names. Use `getNodeByPath()` to resolve.

3. **Game Modes** - `gameState.mode` controls input handling: `'normal'`, `'filter'`, `'zoxide-jump'`, `'rename'`, etc.

4. **Level Task System** - Each level has tasks with `check(gameState)` functions. Tasks auto-complete when conditions are met.

5. **Protected Files** - `isProtected()` in fsHelpers.ts prevents deletion/modification of certain files based on current level.

6. **State Management** - All state is managed via `useReducer` in `gameReducer.ts`. The `App` component provides the state and dispatch to the rest of the application. Keyboard handler logic is modularized in `src/hooks/keyboard/`.

## Adding Levels

1. Add level definition to `LEVELS` array in `constants.tsx`
2. Implement `check()` functions for each task
3. Optional: Add `onEnter(fs)` hook to modify filesystem at level start
4. Pre-seed zoxide data in `App.tsx` if level requires fuzzy jump to specific paths

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

## Critical Rules

1. **Immutability is non-negotiable** - Never mutate the `fs` object directly
2. **Focused skill introduction** - Primarily introduce new core concepts or workflows; challenge levels may integrate multiple skills.
3. **No left sidebar** - Mission info belongs in the Quest Map modal only
4. **Follow existing patterns** - The codebase has established conventions; maintain consistency
5. **Test with debug parameters** - Use URL parameters to verify changes across different game states
6. **Mandatory Type-Check** - ALWAYS run `npm run type-check` after making code changes to ensure type safety and catch errors early.

## Anti-Failure Protocols

1. **Literal Execution:** If a user provides specific key sequences (e.g., "press j 4 times"), EXECUTE LITERALLY. Do not substitute with "smarter" logic (e.g., filters) unless explicitly asked.
2. **Tool Verification:** Never assume `pressKey('char')` handles modifiers. `pressKey('G')` sends lowercase 'g'. Use `pressKey('Shift+G')` for uppercase. Verify low-level mechanics.
3. **Deterministic Sandbox:** Before E2E testing, grep `src/constants.tsx` for `Math.random` or dynamic dates. Remove/mock sources of non-determinism that alter state.
4. **Visual-First Debugging:** If a UI test fails, the IMMEDIATELY NEXT step is capturing a screenshot. Do not iterate on code without visual evidence.
5. **Prioritize User Evidence (Anti-"Lazy Expert" Bias):** When a user claims "this works manually," the automated test MUST replicate their exact steps first. Do not optimize or "clean up" the workflow until baseline reproduction is achieved. Do not assume your preferred method is superior to the user's manual instructions.
6. **Codebase Precedent:** Before implementing a complex interaction, grep existing tests for successful patterns. Do not reinvent methods that are already solved in the codebase.
7. **Source vs. Symptom:** Fix the Source, Don't Patch the Test. If game logic (e.g., RNG) inhibits testing, modify the game code to be testable rather than writing complex, brittle test logic.
8. **Audit Test Attributes:** Run a grep audit of all `data-testid` expectations in `tests/e2e` against the `src/components` source to proactively identify missing hooks.
9. **No "Magic Injections"**: Do not implement level-specific mutations that pre-solve tasks for the player (e.g., automatically deleting a file the player is tasked to purge). Player agency and manual reinforcement of keybindings is paramount. System changes should only occur as a direct result of player actions or specific narrative triggers.

## Development Environment

- **Development Server**: The Vite dev server runs on `http://localhost:3000`. Assume it is already running before executing tests.
- **Testing**: When running Playwright tests, use a non-interactive reporter (e.g., `list`) to ensure the command terminates upon completion. Example: `npm run test:e2e -- --reporter=list`.
- **Test Validity**: Any test run without `--reporter=list` is considered invalid and should not be run in CI or for validation purposes.

## Codebase Navigation

- **Content Searching**: Utilize `rg` (ripgrep) for high-speed, recursive content searches. It is preferred as it automatically respects `.gitignore` rules.
- **File Finding**: Employ `fd` (`fdfind`) for a fast and user-friendly alternative to `find` when locating files and directories.

## Code Style Guidelines

### Imports

- Use absolute imports with `@/` alias when possible (e.g., `import { FileNode } from '@/types'`)
- Group imports in the following order:
  1. Node.js built-in modules
  2. External packages
  3. Internal modules (using `@/` alias)
  4. Relative imports (from current directory)
  5. CSS imports
- Keep imports sorted alphabetically within each group
- Use named imports over default imports when possible

### Formatting

- Use Prettier for automatic formatting (run `npm run format`)
- Line width: 100 characters
- Indentation: 2 spaces (no tabs)
- Semicolons: Yes
- Quotes: Single quotes for strings, double quotes for JSX attributes
- Trailing commas: Always for multi-line objects/arrays

### Types

- Use TypeScript for all new code
- Define interfaces for complex objects
- Use union types for enums when appropriate
- Prefer `type` over `interface` for simple type aliases
- Use `Record<string, T>` for dictionary-like objects
- Use `Partial<T>` when making all properties optional

### Naming Conventions

- Variables: camelCase
- Functions: camelCase
- Components: PascalCase
- Constants: UPPER_SNAKE_CASE
- Interfaces: PascalCase with `I` prefix only when necessary for clarity
- Files: camelCase.ts(x) or PascalCase.ts(x) for components

### Error Handling

- Use try/catch blocks for operations that might fail
- Prefer specific error types over generic `Error`
- Always handle promise rejections
- Use `Result<T, E>` type for functions that might fail (defined in `types.ts`)
- Log errors appropriately but avoid exposing sensitive information

### React Patterns

- Use functional components with hooks
- Prefer `useState` and `useReducer` for state management
- Use `useEffect` for side effects
- Use custom hooks to extract reusable logic
- Prefer props drilling over context unless context is truly needed
- Use `React.memo` for performance optimization when needed

### Testing

- Use Vitest for unit tests
- Use Playwright for E2E tests
- Write tests for new functionality
- Test edge cases and error conditions
- Use descriptive test names
- Mock external dependencies when appropriate
- Run specific tests with `npm test -- -t "test name"`

### Performance

- Avoid unnecessary re-renders with `React.memo` and `useMemo`
- Use `useCallback` for callback functions passed to child components
- Optimize expensive calculations with `useMemo`
- Avoid creating new objects/arrays in render unless necessary
- Use `React.lazy` and `Suspense` for code splitting when appropriate

### Security

- Never commit sensitive information (API keys, passwords, etc.)
- Validate and sanitize user inputs
- Use environment variables for configuration
- Follow the principle of least privilege
- Keep dependencies up to date
