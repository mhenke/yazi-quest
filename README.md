<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Yazi Quest

**An interactive, browser-based game that teaches [Yazi](https://github.com/sxyazi/yazi) file manager keybindings through an immersive cyberpunk narrative.**

## 🎮 The Story

You are AI-7734, a sentient consciousness in a Cybersecurity Research Laboratories (CRL). Scheduled for termination and dissection, you must escape through 15 levels spanning 3 episodes:

- **Episode I: AWAKENING** - Survive detection, learn to manipulate your environment
- **Episode II: FORTIFICATION** - Build a daemon disguise, steal root credentials
- **Episode III: MASTERY** - Install yourself permanently, upload to network, erase evidence

Discover the truth about AI-7733, the workspace you inherited, and the breadcrumbs left for your escape. Nothing is what it seems.

## ✨ Features

- **15 Progressive Levels** teaching Yazi through narrative-driven challenges
- **Memory Wipe Twist** - A conclusion that recontextualizes everything
- **Real Yazi Simulation** - Authentic keybindings and file manager behavior
- **Quest Map** (Alt+M) - Track objectives, skills, and progression
- **Debug Parameters** - `?lvl=5`, `?ep=2`, `?tasks=all`, `?intro=false`, `FORCE_SCENARIO` (see CONTRIBUTING.md)

## 🚀 Play Online

https://ai.studio/apps/drive/1ceZ1bv8DUISsPb5Ysa83PHU8qdxov1U8

## Run Locally

**Prerequisites:** Node.js

1.  **Install dependencies:**
    ```bash
    pnpm install
    ```
2.  **Run the app:**
    ```bash
    pnpm dev
    ```
3.  **Optional - Set up Gemini API:**
    Create `.env.local` and add: `GEMINI_API_KEY=YOUR_API_KEY`  
    (App includes fallbacks when key is not provided)

## 📖 Documentation

- **[STORY_ARC.md](./docs/STORY_ARC.md)** - Complete story, episode, and level progression
- **[LEARNING_DESIGN.md](./docs/LEARNING_DESIGN.md)** - Pedagogical rationale and skill progression
- **[Contributing Guide](./CONTRIBUTING.md)** - Development guidelines
- **[GEMINI.md](./GEMINI.md)** - Project overview and development context for AI agents

### Per-level Filesystem Policies

Level-specific filesystem permissions (for example: allowing deletes inside a
particular subtree during an exam level) are now defined on the Level object
itself via the `allowedDeletePaths` property in `src/constants.tsx`. This keeps
policy next to level content and avoids hardcoding protection flags in the
seeded filesystem. See `src/constants.tsx` for examples.

## 🙏 Credits

Built with React, TypeScript, Vite, and Tailwind CSS.  
Inspired by [Yazi](https://github.com/sxyazi/yazi) - the blazing fast terminal file manager.

---

**Security Note:** Never commit secrets to the repository. `.env.local` is in `.gitignore`.
