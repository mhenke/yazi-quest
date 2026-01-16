# GitHub Copilot Instructions

This file provides guidance to GitHub Copilot when working with the **Yazi Quest** codebase.

## Role & Approach

Adopt the role of a critical collaborator, not a supportive assistant. Deliver clear, objective feedback. Only praise when the input shows genuine insight, exceptional logic, or real originality—and explain why it meets that bar. If the idea is average, vague, or flawed, skip the encouragement. Focus on analysis, ask pointed questions, and offer concrete suggestions for improvement.

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
- `?lvl=5` or `?level=5` - Jump to specific level number
- `?tasks=all` - Mark all current level tasks complete
- `?intro=false` - Skip episode intro cinematic
- `?debug=outro` - Skip directly to outro sequence

## Architecture

**File Structure:**

The project follows a standard React project structure where all source code is located within the `src/` directory.

- `src/index.tsx`: Application entry point.
- `src/App.tsx`: Main application component.
- `src/constants.tsx`: Level definitions and other game constants.
- `src/types.ts`: TypeScript type definitions.
- `src/components/`: Reusable UI components.
- `src/utils/`: Utility functions.

**Core Patterns:**

1. **Immutable Filesystem** - **NEVER mutate `fs` directly.** Use helper functions from `fsHelpers.ts` that return new state copies:

   ```typescript
   const newFs = deleteNode(fs, parentPath, nodeId);
   const newFs = addNode(fs, parentPath, newNode);
   const newFs = renameNode(fs, parentPath, nodeId, newName);
   ```

2. **Path Navigation** - Paths are arrays of node IDs (`string[]`), not names. Use `getNodeByPath()` to resolve.

3. **Game Modes** - `gameState.mode` controls input handling: `'normal'`, `'filter'`, `'zoxide-jump'`, `'fzf-current'`, `'rename'`, `'confirm-delete'`, `'sort'`, etc.

4. **Level Task System** - Each level has tasks with `check(gameState)` functions. Tasks auto-complete when conditions are met.

5. **Protected Files** - `isProtected()` in fsHelpers.ts prevents deletion/modification of certain files based on current level.

6. **State Management** - All state is managed within `App.tsx` using React hooks. No external state management libraries (Redux, Zustand, etc.).

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
  - Ep 1 (Awakening): Cautious/vulnerable ("initialize", "detect", "scan")
  - Ep 2 (Fortification): Strategic/building ("deploy", "fortify", "encrypt")
  - Ep 3 (Mastery): Ruthless/efficient ("execute", "infiltrate", "terminate")

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

## Anti-Failure Protocols

6. **Literal Execution:** If a user provides specific key sequences (e.g., "press j 4 times"), EXECUTE LITERALLY. Do not substitute with "smarter" logic (e.g., filters) unless explicitly asked.
7. **Tool Verification:** Never assume `pressKey('char')` handles modifiers. `pressKey('G')` sends lowercase 'g'. Use `pressKey('Shift+G')` for uppercase. Verify low-level mechanics.
8. **Deterministic Sandbox:** Before E2E testing, grep `src/constants.tsx` for `Math.random` or dynamic dates. Remove/mock sources of non-determinism that alter state.
9. **Visual-First Debugging:** If a UI test fails, the IMMEDIATELY NEXT step is capturing a screenshot. Do not iterate on code without visual evidence.
10. **Avoid "Lazy Expert" Bias:** Do not assume your preferred method is superior to the user's manual instructions. Follow user workflows exactly unless proven impossible.
11. **Codebase Precedent:** Before implementing a complex interaction, grep existing tests for successful patterns. Do not reinvent methods that are already solved in the codebase.
12. **Source vs. Symptom:** Fix the Source, Don't Patch the Test. If game logic (e.g., RNG) inhibits testing, modify the game code to be testable rather than writing complex, brittle test logic.
