# AGENTS.md — Yazi Quest

> Scanner-maintained; human confirmation required for architectural updates.

Client-only React/TypeScript/Tailwind 4 browser game on GitHub Pages teaching real Yazi keybindings inside a simulated filesystem (no backend).

## Context Pointers

Read the matching target before editing that area:

- **Architecture, module map, persistence, or boot lifecycle:** `.claude/pipeline/project-doc.md`
- **Codebase exploration:** query `graphify query|path|explain` first when `graphify-out/` exists; refresh via `npm run graphify:update` after structural edits (keep uncommitted; symlink `../../graphify-out` into worktrees)
- **Domain vocabulary (episodes, levels, tasks, cycles):** `GLOSSARY.md`
- **Viewport floor, touch gating, or 3-pane layout:** `docs/adr/0001-keyboard-and-viewport-floor.md`
- **Directory entry counts or `size` linemode:** `docs/adr/0002-file-metadata-cache.md`
- **Level copy, task style, episode colours, or E2E protocols:** `.github/copilot-instructions.md` (`src/constants.tsx` there refers to `src/constants/`)
- **Yazi keybindings or commands:** [Yazi Quick Start](https://yazi-rs.github.io/docs/quick-start/#keybindings)
- **CI or GitHub Pages deployment:** `README.md` (Deployment) and `.github/workflows/ci.yml` + `deploy.yml`

## Always-On Invariants

Only rules that apply across branches or trap changes before tests catch them:

- **Immutable FS & ID paths:** clone before mutating via `src/utils/fsHelpers.ts`. Store node IDs in navigation paths; `Level.allowedDeletePaths` uses names separately.
- **Input arbitration:** route keyboard events through `GlobalInputProvider` / `useGlobalInput` (`src/hooks/keyboard/`), preserving priority, event consumption, and focus restoration.
- **Player agency & level policies:** satisfy objectives solely through player actions. Configure clipboard limits in `Level.clipboardPolicy` independently of copy (`'yank'` protects `levelStartFS` nodes while allowing cut/move of attempt-created/pasted items).
- **Platform gate sync:** keep `(hover: none) and (pointer: coarse)` identical across `index.html`, `src/index.tsx`, and `src/hooks/useViewportFloor.ts`; keep the 1024 CSS px width floor in React so cinematics stay reachable.
- **Tailwind & WCAG contrast:** write complete literal utility classes (`src/index.css` scanner; add episode variants to `src/constants/palette.ts`). Dim text with colour tokens (`text-zinc-400`), keeping `opacity` for decoration so contrast stays >= 4.5:1 with zero `axe-core` violations.
- **Client-only boundary:** Vite env vars bundle publicly into the client; keep secrets out of them and out of `src/utils/error.ts` logs. Flag any auth or remote-session addition explicitly.

## Verification Gotchas

- Run `npm run type-check` plus the narrow test covering your change; commits gate on `npm run audit:changed` (`.fallowrc.json` 8-zone boundaries + `knip`, failing on newly introduced findings).
- Always run Playwright with `--reporter=list` (otherwise it hangs). Pre-push/CI isolate Vite on port 3100+; pass `env -u CI` to reuse the local port 3000 dev server.
- Replicate user-reported key sequences literally before optimizing; capture a screenshot immediately on UI test failure. Use URL debug params in `src/App.tsx` to jump to target states.
- Measure unit/property coverage via `npm run test:coverage` (Playwright runs are uninstrumented).
