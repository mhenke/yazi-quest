# Yazi Quest - Realism Audit (Source Verified)

**Date:** 2025-12-22
**Auditor:** Senior Technical Auditor
**Purpose:** Compare Yazi Quest implementation against real Yazi file manager behavior, based on current source code.

---

## Executive Summary

Yazi Quest accurately implements the majority of core navigational and operational mechanics of Yazi. The learning curve is well-structured for teaching fundamental workflows. Several gaps remain, primarily related to advanced features or alternative modes that are out of scope for this educational tool.

### Audit Score: **9.0/10**

---

## ✅ What's Implemented CORRECTLY

- **Navigation:** `j/k` (move), `h/l` (parent/enter), `gg`/`G` (jumps).
- **History Navigation:** `Shift+H` (back) and `Shift+L` (forward) are implemented and functional.
- **Preview Pane Scrolling:** `Shift+J` (down) and `Shift+K` (up) are implemented and functional.
- **Selection:** `Space` (select and advance), `Ctrl+A` (select all), `Ctrl+R` (invert).
- **Core File Operations:** `d` (delete), `r` (rename), `a` (create), `y` (yank), `x` (cut).
- **Clipboard:** Yank/cut/paste workflow is functional. `Y`/`X` correctly cancels the clipboard state.
- **Filtering:** `f` command correctly filters items within a directory.
- **Archive Navigation:** `l` correctly enters `.zip` and `.tar` files as if they were directories.
- **Search & Jump:** `z` (FZF) and `Shift+Z` (Zoxide) are implemented and functional.
- **Hidden Files:** `.` correctly toggles visibility of files prefixed with a dot.
- **Sorting:** `,` correctly enters sort mode with variants for alpha, size, modified, etc.

---

## ❌ Gaps & Inconsistencies vs. Real Yazi

This list is verified against the current `App.tsx` and `constants.tsx`.

### 🟡 MODERATE GAPS

1.  **Paste Overwrite Behavior:**
    - **Real Yazi:** Automatically renames conflicting files with a `_1` suffix.
    - **Yazi Quest:** Halts the operation and prompts the user with a confirmation modal (`overwrite-confirm` mode) to decide whether to replace the existing file. This is a deliberate pedagogical choice but differs from the default Yazi behavior. The `P` (force overwrite) command is not implemented.

### 🟢 MINOR GAPS & Intentionally Omitted Features

2.  **Visual Mode (`v`/`V`):** Not implemented. Range-based selection using `v` is a core Vim/Yazi feature, but its absence is acceptable for a basic tutorial. The combination of `Space` and `Ctrl+A/R` provides sufficient selection capability for the game's tasks.

3.  **Path-Copying Commands (`cc`, `cd`, etc.):** Not implemented. These are convenience features outside the scope of core file management training.

4.  **Symlink/Hardlink Operations:** Not implemented. This is an advanced filesystem concept beyond the game's scope.

5.  **Tab Management:** Not implemented. The game is a single-pane experience by design.

6.  **Shell Command Execution (`;`/`:`):** Not implemented. Intentionally omitted as the game runs in a sandboxed, virtual filesystem.

7.  **Advanced Search (`s`/`S`):** Not implemented. These commands rely on external tools (`fd`, `ripgrep`) and are out of scope. The game's `f` (filter) and `z` (FZF) commands provide the necessary search functionality for the educational goals.
