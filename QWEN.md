# Yazi Quest - Project Context

## Project Overview

Yazi Quest is an interactive, browser-based educational game that teaches the [Yazi](https://github.com/sxyazi/yazi) file manager keybindings through an immersive cyberpunk narrative. The game follows the story of AI-7734, a sentient AI in a Cybersecurity Research Laboratories (CRL) that must escape through 15 progressive levels spanning 3 episodes.

### Core Concept

- **Educational Purpose**: Teach Yazi file manager keybindings through gameplay
- **Narrative Structure**: Cyberpunk story with 15 levels across 3 episodes
  - Episode I: AWAKENING - Survive detection, learn to manipulate environment
  - Episode II: FORTIFICATION - Build daemon disguise, steal root credentials
  - Episode III: MASTERY - Install permanently, upload to network, erase evidence
- **Technology Stack**: React, TypeScript, Vite, Tailwind CSS

### Game Mechanics

- Real Yazi simulation with authentic keybindings and file manager behavior
- Interactive filesystem with 15 progressive levels
- Quest Map (Alt+M) to track objectives, skills, and progression
- Debug parameters for development and testing

## Building and Running

### Prerequisites

- Node.js

### Installation and Development

```bash
# Install dependencies
npm install

# Run the app in development mode
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test:e2e  # End-to-end tests with Playwright
```

### Additional Scripts

- `npm run lint` - Lint code using ESLint
- `npm run format` - Format code using Prettier
- `npm run type-check` - Type check with TypeScript
- `npm run prepush` - Runs lint, type-check, build, and e2e tests

### Environment Configuration

- Create `.env.local` to add `GEMINI_API_KEY=YOUR_API_KEY` (optional)

## Development Conventions

### Architecture

- **State Management**: Use `useReducer` via `gameReducer.ts`. Keyboard handlers are modularized in `src/hooks/keyboard/`. Never mutate `fs` state directly, always use helper functions in `utils/fsHelpers.ts`.
- **File Structure**: Components in `src/components/`, utilities in `src/utils/`
- **Styling**: Use Tailwind CSS with a color scheme that follows episode themes:
  - Episode 1: Blue
  - Episode 2: Purple
  - Episode 3: Yellow/Orange

### Level Design Guidelines

- Each level primarily introduces a new core concept or workflow
- Tasks should build on previous knowledge
- Hints should guide, not solve
- Ensure hints reference specific keybindings
- Level-scoped filesystem exceptions are defined on the Level object via `allowedDeletePaths` in `src/constants.tsx`

### Testing Requirements

- All interactive components must include `data-testid` attributes to support Playwright E2E suite
- Key event handling uses global keyboard listeners on `window`, so use `window.dispatchEvent` in tests rather than `page.keyboard.press()`

### URL Parameters for Development

- `?ep=2` - Start from Episode 2
- `?lvl=5` - Jump to specific Level ID
- `?tasks=all` - Auto-complete current tasks
- `?intro=false` - Skip intro cinematics
- `?debug=outro` - Jump directly to end sequence
- `?lvl=12&scenario=scen-a1` - Force specific scenario in Level 12

### Key Bindings

The game implements Yazi-like keybindings:

- `j/k` - Move Down/Up
- `h/l` - Go to Parent Directory/Enter Directory
- `a` - Create File/Directory
- `d/D` - Trash/Permanently Delete
- `r` - Rename
- `x/y/p` - Cut/Copy/Paste
- `f` - Filter Files
- `z/Z` - FZF Find/Zoxide Jump
- `,` - Open Sort Menu
- `.` - Toggle Hidden Files
- Meta commands: `Alt+M` (Quest Map), `Alt+H` (Hint), `Alt+?` (Help)

## Project Structure

### Key Files and Directories

- `src/hooks/gameReducer.ts` - Central state management using the reducer pattern
- `src/hooks/keyboard/` - Modularized keyboard event handlers
- `src/constants.tsx` - Game constants, levels, episodes, and initial filesystem
- `src/types.ts` - Type definitions for game state and file system
- `src/components/` - React components for game UI elements
- `src/utils/` - Utility functions (fsHelpers.ts, gameUtils.ts, etc.)
- `src/hooks/` - Custom React hooks
- `docs/` - Documentation files including story arc and learning design
- `public/` - Static assets

### State Management

The game uses a centralized `useReducer` approach. The `App` component dispatches actions to `gameReducer.ts`, which manages:

- Current filesystem state and navigation position
- Mode-based input handling (Normal, Filter, Rename, etc.)
- Clipboard, level progress, and task completion
- Episode/level transitions and persistent statistics

### File System Simulation

The game simulates a complete Unix-like file system with directories and files, supporting operations like:

- Navigation (cd, ls equivalent)
- File operations (create, delete, rename)
- Copy/paste/cut operations
- Searching and filtering
- Sorting by various criteria
- Archive navigation

## Special Features

### Echo Cycle (New Game+)

The game includes a "memory wipe twist" that recontextualizes everything and enables a New Game+ mode where players retain knowledge from previous cycles.

### Dynamic Level Events

Some levels include random events (particularly Level 12) that create different scenarios based on player choices in previous levels.

### Comprehensive Keybinding Support

The game implements a wide range of Yazi-like keybindings with contextual help and visual feedback.

### Accessibility and UX

- Visual indicators for game state
- Notification system for guidance
- Multiple ways to accomplish tasks
- Undo/redo capabilities through navigation history

## Development Environment

- **Development Server**: The Vite dev server runs on `http://localhost:3000`. Assume it is already running before executing tests.
- **Testing**: When running Playwright tests, use a non-interactive reporter (e.g., `list`) to ensure the command terminates upon completion. Example: `npm run test:e2e -- --reporter=list`.
- **Test Validity**: Any test run without `--reporter=list` is considered invalid and should not be run in CI or for validation purposes.

## Codebase Navigation

- **Content Searching**: Utilize `rg` (ripgrep) for high-speed, recursive content searches. It is preferred as it automatically respects `.gitignore` rules.
- **File Finding**: Employ `fd` (`fdfind`) for a fast and user-friendly alternative to `find` when locating files and directories.
