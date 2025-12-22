# GEMINI.md

This file provides development context for the **Yazi Quest** project. It is intended to guide AI assistants and new developers in understanding the project's structure, conventions, and operational commands.
Adopt the role of a critical collaborator, not a supportive assistant. Your job is to deliver clear, objective feedback. Do not offer compliments by default. Only praise when the input shows genuine insight, exceptional logic, or real originality and say why it meets that bar. If the idea is average, vague, or flawed, skip the encouragement. Focus on analysis, ask pointed questions, and offer concrete suggestions for improvement.

## 1. Project Overview

**Yazi Quest** is an interactive, browser-based game designed to teach the keybindings and core concepts of the [Yazi](https://github.com/sxyazi/yazi) file manager. The learning experience is wrapped in a cyberpunk narrative where the player is an AI escaping a secure system.

- **Core Technologies:**
  - **Framework:** React 19
  - **Language:** TypeScript
  - **Build Tool:** Vite
  - **Styling:** Tailwind CSS
  - **Icons:** Lucide React

- **Architecture:**
  - **Main Component (`App.tsx`):** A large, central component that manages the main game state machine, keyboard input handling, and the primary game loop.
  - **Immutable Filesystem:** The game simulates a file system using a state object (`fs`). This state is always treated as immutable. All file operations (create, delete, rename, etc.) are handled by pure functions in `utils/fsHelpers.ts` which return a new, modified copy of the filesystem state. **Direct mutation of the `fs` object is strictly forbidden.**
  - **Game Modes:** A `gameState.mode` string controls the application's behavior and keyboard mappings. Examples include `'normal'`, `'filter'`, `'rename'`, `'sort'`, etc.
  - **Level System (`constants.tsx`):** The `LEVELS` array defines the objectives, narrative, and initial state for each of the game's 18 levels. Each level has a set of `tasks` with a `check(gameState)` function that determines if the task has been completed.

## 2. Building and Running

The project uses `npm` as its package manager.

- **Install Dependencies:**

  ```bash
  npm install
  ```

- **Run Development Server:**
  Starts the Vite dev server with hot reloading. The application will be available at `http://localhost:5173` (or the next available port).

  ```bash
  npm run dev
  ```

- **Build for Production:**
  Compiles and bundles the application for production.

  ```bash
  npm run build
  ```

- **Preview Production Build:**
  Serves the production build locally to test it before deployment.
  ```bash
  npm run preview
  ```

## 3. Development Conventions

- **State Management:** All application state is managed within the `App.tsx` component using React hooks. There are no external state management libraries like Redux or Zustand.

- **Level Design:** Follow the principles outlined in `theatre.md`.
  - **One Skill Per Level:** New concepts should be introduced in focused, dedicated levels.
  - **Metaphor Mapping:** File operations must map to clear narrative actions (e.g., `delete` -> "purge trackers").
  - **Progressive Tone:** The narrative tone should escalate across the three episodes (Awakening -> Fortification -> Mastery).

- **File System Operations:** Never modify the `fs` state object directly. Always use the helper functions from `utils/fsHelpers.ts` which guarantee immutability.
  - **Example:** `const newFs = deleteNode(fs, path, nodeId);`

- **Bypassing and Debugging:** URL parameters can be used to test specific game states:
  - `?lvl=5`: Jump to Level 5.
  - `?ep=2`: Start at Episode 2.
  - `?tasks=all`: Auto-complete all tasks for the current level.
  - `?intro=false`: Skip the cinematic episode intros.
