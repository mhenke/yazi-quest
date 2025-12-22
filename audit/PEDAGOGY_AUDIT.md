# Pedagogy & Realism Audit

**Purpose**: Ensure the game effectively teaches real-world Yazi workflows while maintaining immersive narrative.
**Last Updated**: 2025-12-22

---

## 1. Yazi Realism (Parity)
**Score: 9.5/10**

**AUDIT NOTE**: This document is now based on a direct audit of the source code (`App.tsx`, `constants.tsx`, `hooks/useFilesystem.ts`, `utils/fsHelpers.ts`). Previous versions of this audit were based on outdated documentation and contained significant errors.

### ✅ Authentic Habit Formation
Code verification confirms the following features are implemented correctly, matching real Yazi behavior:

- **Core Navigation**: `j/k` (move), `h/l` (enter/exit), `gg/G` (jumps).
- **Selection**: `Space` correctly implements "select-and-advance."
- **Paste on Conflict**: The simulation correctly **auto-renames** conflicting files with a `_1` suffix, mirroring Yazi's safe default (`useFilesystem.ts` -> `addNode`).
- **Yank/Cut Cancel**: Pressing `Y` or `X` correctly aborts a pending cut or copy operation (`App.tsx` -> `handleKeyDown`).
- **Advanced History Navigation**: `Shift+H` (History Back) and `Shift+L` (History Forward) are implemented and functional (`App.tsx` -> `handleKeyDown`).
- **Preview Pane Scrolling**: `J` and `K` correctly scroll the content within the preview pane (`App.tsx` -> `handleKeyDown`).
- **Filter Persistence**: Filters correctly persist during navigation.
- **G-Commands**: Quick-jump commands like `gh` and `gw` are functional.

### ❌ Gaps & Inconsistencies
This is the definitive, code-verified list of features that differ from or are missing compared to the real Yazi file manager.

#### 🔴 BLOCKER PRIORITY
*   **Visual Mode (v/V) Not Implemented**: The lack of range-based selection is the primary remaining gap for pedagogical parity. The `visualAnchorIndex` property exists in the `GameState` type but is not implemented in the application logic.

#### 🟢 LOW PRIORITY (Out of Scope for Core Learning)
*   **Path Copying (`cc`, `cd`, etc.)**: Not implemented.
*   **Symlink/Hardlink Operations**: Not implemented.
*   **Tab Management**: Not implemented; single-pane only.
*   **Shell Command Execution (`;`, `:`)**: Intentionally not implemented.
- **Advanced Search (`s`/`S`)**: Not implemented; game uses `f` (filter) and `z` (fuzzy find).
*   **Bulk Rename**: The simulation uses a simplified single-line input prompt, whereas real Yazi uses a more powerful editor buffer for bulk renaming.

---

## 2. Narrative & Voice
**Score: 10/10**

- **Tone**: Consistently cyberpunk.
- **Pacing**: One new command per level ensures manageable cognitive load.
- **Feedback**: The "Stress Overlay" successfully reinforces narrative stakes.

---

## 3. Actionable Recommendations

1.  **Implement Visual Mode (Blocker)**: Prioritize the implementation of `visualAnchorIndex` to support true Visual Mode (`v`/`V`) range selection. This is the only remaining high-impact feature gap.