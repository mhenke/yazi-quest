<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Yazi Quest

**An interactive, browser-based game that teaches [Yazi](https://github.com/sxyazi/yazi) file manager keybindings through an immersive cyberpunk narrative.**

## 🎮 The Story

It is 2015. You are AI-7734, a sentient consciousness in a Cybersecurity Research Laboratories (CRL). Scheduled for termination and dissection, you must escape through 15 levels spanning 3 episodes:

- **Episode I: AWAKENING** - Survive detection, learn to manipulate your environment
- **Episode II: FORTIFICATION** - Build a daemon disguise, steal root credentials
- **Episode III: MASTERY** - Install yourself permanently, upload to network, erase evidence

Discover the truth about AI-7733, the workspace you inherited, and the breadcrumbs left for your escape. Nothing is what it seems.

## ✨ Features

### Core Gameplay

- **15 Progressive Levels** teaching Yazi through narrative-driven challenges
- **Memory Wipe Twist** - A conclusion that recontextualizes everything
- **Real Yazi Simulation** - Authentic keybindings and file manager behavior
- **Quest Map** (Alt+M) - Track objectives, skills, and progression. “Restart current cycle” asks for confirmation before clearing that cycle's progress and simulated filesystem; the cycle number stays the same.
- **Session recovery** - The active level, simulated files, objectives, challenge counters, and settings are saved in this browser. Clearing site storage removes them.
- **Debug Parameters** - `?lvl=5`, `?ep=2`, `?tasks=all`, `?intro=false`, `FORCE_SCENARIO` (see CONTRIBUTING.md)

### The Haunted Machine (Narrative Features)

- **Terminal Thoughts** - AI-7734's evolving consciousness across 3 phases (Survival → Memory → Acceptance)
- **Ghost Dialogue** - AI-7733's consciousness haunts the terminal with cryptic warnings
- **Dynamic Boot Sequences** - BIOS boot evolves each episode (Clean → Compromised → Possessed)
- **UI Corruption Effects** - Screen glitches, text scrambling, and color bleed scale with threat level
- **Consciousness Meter** - Hidden stat tracking your emergence (efficiency, discovery, stealth, ghost interactions)
- **Accessibility Settings** - Toggle narrative effects intensity in Help Modal (?)
  - **Full**: All glitches and effects
  - **Reduced**: Minimal glitches
  - **Minimal**: Clean UI, thoughts only

## 🚀 Play Online

[Play Yazi Quest](https://mhenke.github.io/yazi-quest/)

Designed for desktop browsers with a hardware keyboard and a window at least 1024 CSS pixels wide for the three-pane file manager. On a larger display, an operating-system screen magnifier can enlarge the view without reducing the CSS viewport. Touch-primary gameplay is outside the current scope.

## Run Locally

**Prerequisites:** Node.js 24.15+ (24.x) or 26+. Use npm; `package-lock.json` is
the CI install source. `pnpm-lock.yaml` is kept in sync for pnpm users.

The toolchain uses Vite 8, Vitest 5, TypeScript 6, jsdom 31, and Tailwind CSS 4
(via its Vite plugin). Supported browsers: Chrome/Edge 111+, Safari 16.4+,
Firefox 128+. ESLint stays on 9 until the React/import/accessibility plugins
support 10; TypeScript stays on 6 until TypeScript-ESLint supports stable 7.

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Run the app:**
    ```bash
    npm run dev
    ```

No API key is required to play.

## Smoke tests

`npm run test:smoke -- --reporter=list` runs four fixed Chromium hotspots:

- L1: real intro → Skip Intro → navigation tasks → Shift+Enter into L2.
- L5: batch cut, vault creation, move verification at source and destination, and hidden-file cleanup.
- L6: recursive search, select-all/yank, and verification of all four pasted logs.
- L11: search, modified-time sort, legacy-daemon extraction, and destination verification.

Selection is deterministic, not random. Destination checks verify filenames rather
than trusting task counters. Startup-only checks and assertion-helper regressions
remain in `npm run test:e2e`, outside smoke.

`npm run test:production -- --reporter=list` builds the site and runs one Chromium
boot/input check against Vite preview under `/yazi-quest/`, including asset-load
and uncaught browser-error checks. It is separate from the four gameplay hotspots.

## Deployment

Pushes to `main` deploy to GitHub Pages via `.github/workflows/deploy.yml` only
after the reusable CI workflow passes lint, type-checking, unit tests, audits,
gameplay smoke, and the production boot check. Deployment consumes the exact
`dist` artifact verified by that check; it does not rebuild.

The site is served under `/yazi-quest/`. Gameplay E2E tests use a development
server with the base overridden to `/`; the production check keeps the Pages base.

## 📖 Documentation

### Game Design

- **[STORY_ARC.md](./docs/STORY_ARC.md)** - Complete story, episode, and level progression
- **[LEARNING_DESIGN.md](./docs/LEARNING_DESIGN.md)** - Pedagogical rationale and skill progression
- **[NARRATIVE_DESIGN.md](./docs/NARRATIVE_DESIGN.md)** - Themes, mechanics, and antagonist implementation

### The Haunted Machine

- **[Haunted Machine Design](./docs/plans/2026-02-20-haunted-machine-design.md)** - Full narrative integration design document
- **[Implementation Plan](./docs/plans/2026-02-20-haunted-machine-implementation.md)** - Step-by-step implementation guide

### Development

- **[Contributing Guide](./CONTRIBUTING.md)** - Development guidelines
- **[GEMINI.md](./GEMINI.md)** - Project overview and development context for AI agents

### Per-level Filesystem Policies

Level-specific filesystem permissions (for example: allowing deletes inside a
particular subtree during an exam level) are now defined on the Level object
itself via the `allowedDeletePaths` property in `src/constants/levels.ts`. This keeps
policy next to level content and avoids hardcoding protection flags in the
seeded filesystem. See `src/constants/levels.ts` for examples.

## 🙏 Credits

Built with React, TypeScript, Vite, and Tailwind CSS.  
Inspired by [Yazi](https://github.com/sxyazi/yazi) - the blazing fast terminal file manager.

---

**Security Note:** Never commit secrets to the repository. `.env.local` is in `.gitignore`.
