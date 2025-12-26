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
- **Styling:** Tailwind CSS
- **Icons:** Lucide React

## Commands

```bash
npm install    # Install dependencies
npm run dev    # Start Vite dev server (hot reload)
npm run build  # Production build
npm run preview # Preview production build
```

## Debug Parameters

Use URL parameters for testing:

- `?ep=2` or `?episode=2` - Start at Episode 2
- `?lvl=5` or `?level=5` - Jump to specific level ID
- `?tasks=all` - Mark all current level tasks complete
- `?intro=false` - Skip episode intro cinematic
- `?debug=outro` - Skip directly to outro sequence

## Architecture

**File Structure (flat layout, no src/):**

- `App.tsx` - Main game component with state machine, keyboard handlers, and game loop
- `constants.tsx` - Level definitions (`LEVELS`), initial filesystem (`INITIAL_FS`), episode lore, keybindings
- `types.ts` - TypeScript interfaces for `GameState`, `FileNode`, `Level`, `Episode`
- `utils/fsHelpers.ts` - Immutable filesystem operations (clone, add, delete, rename, path resolution)
- `components/` - UI components (FileSystemPane, PreviewPane, modals, StatusBar)

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

See `theatre.md` for the comprehensive lore generation guide. Key principles:

- **One skill per level** - Each level teaches exactly ONE Yazi command
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

**DO NOT add a left sidebar for mission information.** All mission/level details are consolidated in the Quest Map modal (M).

**Layout Structure:**

- **Top Bar** (`LevelProgress.tsx`) - Episode progression, Map button, Hint/Help buttons
- **Main Area** - Parent pane, Active file pane, Preview pane (3-column Yazi layout)
- **Bottom Bar** (`StatusBar.tsx`) - Mode, filename, progress, clipboard status, timer/keystrokes, file stats
- **Quest Map Modal** - Accessed via M or Map button, shows all level details:
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
2. **One skill per level** - Don't introduce multiple new concepts in a single level
3. **No left sidebar** - Mission info belongs in the Quest Map modal only
4. **Follow existing patterns** - The codebase has established conventions; maintain consistency
5. **Test with debug parameters** - Use URL parameters to verify changes across different game states
