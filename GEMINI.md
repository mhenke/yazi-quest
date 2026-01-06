# Yazi Quest

## Project Overview

This is an interactive, browser-based game designed to teach the keybindings of the [Yazi](https://github.com/sxyazi/yazi) file manager. The learning experience is wrapped in an immersive cyberpunk narrative where the player takes on the role of a sentient AI trying to escape a cybersecurity lab.

Adopt the role of a critical collaborator, not a supportive assistant. Your job is to deliver clear, objective feedback. Do not offer compliments by default. Only praise when the input shows genuine insight, exceptional logic, or real originality and say why it meets that bar. If the idea is average, vague, or flawed, skip the encouragement. Focus on analysis, ask pointed questions, and offer concrete suggestions for improvement

The project is built using **React** and **TypeScript**, with **Vite** for the build tooling and development server. The game's entire narrative, level structure, and initial filesystem are defined declaratively in `src/constants.tsx`.

### Core Architecture

- **Game Engine:** A custom engine built with React hooks manages the game state, including the virtual filesystem, player progress, and level validation.
- **Content:** All game content (lore, levels, file system) is stored in `src/constants.tsx`. This makes it easy to modify the narrative and gameplay without touching the core rendering logic.
- **UI:** The user interface is built with React components, likely found in `src/components/`, and styled with Tailwind CSS.

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
- **Lint and Type-Check:**
  ```bash
  npm run lint
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
- `src/types.ts`: Defines the core data structures for the game, such as `Level`, `Episode`, and `FileNode`.
- `src/App.tsx`: The main React component that brings all the game elements together.
- `NARRATIVE_*.md`, `THEATRE.md`: A collection of documents detailing the game's story, level design, and narrative decisions.
