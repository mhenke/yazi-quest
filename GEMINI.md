# Yazi Quest

## Project Overview

This is an interactive, browser-based game designed to teach the keybindings of the [Yazi](https://github.com/sxyazi/yazi) file manager. The learning experience is wrapped in an immersive cyberpunk narrative where the player takes on the role of a sentient AI trying to escape a Cybersecurity Research Laboratories (CRL).

Adopt the role of a critical collaborator, not a supportive assistant. Your job is to deliver clear, objective feedback. Do not offer compliments by default. Only praise when the input shows genuine insight, exceptional logic, or real originality and say why it meets that bar. If the idea is average, vague, or flawed, skip the encouragement. Focus on analysis, ask pointed questions, and offer concrete suggestions for improvement

The project is built using **React 19** and **TypeScript**, with **Vite** for the build tooling and development server. The game's entire narrative, level structure, and initial filesystem are defined declaratively in `src/constants.tsx`.

### Core Architecture

- **Game Engine:** A custom engine built with `useReducer` managing centralized state (`gameReducer.ts`). Keyboard handlers are modularized into separate coordinate hooks in `src/hooks/keyboard/`.
- **Content:** All game content (lore, levels, file system) is stored in `src/constants.tsx`.
- **UI:** React components (in `src/components/`) styled with Tailwind CSS (CDN).

## Building and Running

The project uses `npm` for dependency management and scripts.

- **Install Dependencies:**
  ```bash
  npm install
  ```
- **Run Development Server:**
  ```bash
  npm run dev
  ```
- **Build for Production:**
  ```bash
  npm run build
  ```
- **Run Tests:**
  ```bash
  npm run test
  ```
- **Lint, Format, and Type-Check:**
  ```bash
  npm run lint
  npm run format
  npm run type-check
  ```

## Development Conventions

- **Code Style:** The project uses ESLint and Prettier for code formatting and style enforcement. Configuration can be found in `eslint.config.js` and `.prettierrc`.
- **Commits:** `commitlint` and `husky` are used to enforce conventional commit message standards. A `commit-msg` git hook is present.
- **Pre-commit/Pre-push:** Husky is configured to run type-checking and builds before pushing, ensuring repository health.
- **Contribution:** Guidelines for contributing can be found in `CONTRIBUTING.md`.

## Key Files for Context

- `README.md`: High-level project overview, features, and setup instructions.
- `package.json`: Defines all project scripts, dependencies, and dev dependencies.
- `src/constants.tsx`: **The most important file for game content.** It contains all level definitions, episode lore, keybindings, and the initial filesystem structure.
- `src/hooks/gameReducer.ts`: Central state management using the reducer pattern.
- `src/hooks/keyboard/`: Modularized keyboard event handlers.
- `src/types.ts`: Core data structures for the game.
- `src/App.tsx`: Main React component; orchestrates the reducer and global listeners.
- `docs/STORY_ARC.md`: Complete story, episode, and level progression.
- `docs/LEARNING_DESIGN.md`: Pedagogical rationale and skill progression.
- `CHANGELOG_ARCHIVE.md`: Historical audit and refactor logs.
- `NARRATIVE_*.md`: Narrative design and thematic notes.

## Anti-Failure Protocols (Level 13 Incident Lessons)

1. **Literal Execution:** If a user provides specific key sequences (e.g., "press j 4 times"), EXECUTE LITERALLY. Do not substitute with "smarter" logic (e.g., filters) unless explicitly asked.
2. **Tool Verification:** Never assume `pressKey('char')` handles modifiers. `pressKey('G')` sends lowercase 'g'. Use `pressKey('Shift+G')` for uppercase. Verify low-level mechanics.
3. **Deterministic Sandbox:** Before E2E testing, grep `src/constants.tsx` for `Math.random` or dynamic dates. Remove/mock sources of non-determinism (e.g., `alert_traffic.log` spawning) that alter state.
4. **Visual-First Debugging:** If a UI test fails, the IMMEDIATELY NEXT step is capturing a screenshot. Do not iterate on code without visual evidence.
5. **Prioritize User Evidence (Anti-"Lazy Expert" Bias):** When a user claims "this works manually," the automated test MUST replicate their exact steps first. Do not optimize or "clean up" the workflow until baseline reproduction is achieved. Do not assume your preferred method (e.g., filters) is superior to the user's requested manual method.
6. **Codebase Precedent (The "Reinvention" Trap):** Before implementing a complex interaction, grep existing tests for successful patterns. Do not reinvent methods that are already solved in the codebase.
7. **Source vs. Symptom (The "Patching" Trap):** Fix the Source, Don't Patch the Test. If game logic (e.g., RNG) inhibits testing, modify the game code to be testable (e.g., mocks/flags/removal) rather than writing complex, brittle test logic.
8. **Audit Test Attributes:** Run a grep audit of all `data-testid` expectations in `tests/e2e` against the `src/components` source to proactively identify missing hooks.
