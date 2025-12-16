# Master Implementation Plan
**Created:** 2025-12-15
**Status:** Planning Phase

## Overview
This document consolidates all audit findings into a single, prioritized implementation roadmap.

## Phase 1: Critical Fixes (Do First)
### From GAME_DESIGN_AUDIT.md
- [ ] **Success Toast Persistence** - Require user action (Escape/Shift+Enter) to dismiss
- [ ] **Level 1 Task Clarity** - Add explicit key hints to first 3 tasks
- [ ] **Task Completion Visual** - Add checkmarks/strikethrough for completed tasks
- [ ] **Filter Clearing** - Add Level 3 task: "Clear the filter (Escape)"

### From YAZI_AUDIT.md (Critical Accuracy)
- [ ] **Sort Modal Keybinding** - Change from 'm' to ',' (comma)
- [ ] **Goto Commands (g-prefix)** - Implement which-key dialog:
  - gg - Jump to top
  - G - Jump to bottom  
  - gh - Jump to home
  - gc - Jump to config (~/.config)
  - gt - Jump to trash (~/.trash)
  - gd - Jump to downloads (~/Downloads)

### From CONTENT_AUDIT.md
- [ ] **Level 1 Task Wording** - Already implemented, verify:
  - "Enter the datastore directory (press 'l')"
  - "Jump to bottom of list (press 'G')"
  - "Jump to top of list (press 'gg')"
  - "Go up to root, then enter /etc (use 'h' and 'l')"
  - "Navigate to /bin directory"

## Phase 2: Enhanced Yazi Accuracy (High Priority)
### From YAZI_AUDIT.md
- [ ] **Bulk Selection Commands**
  - Ctrl+a - Select all
  - Ctrl+r - Invert selection
- [ ] **Sort Reverse Variants** - Shift+letter for reverse (,A, ,S, ,M, ,E)
- [ ] **Visual Select Mode** - V/v for selection mode with j/k navigation
- [ ] **Symlink Indicators** - Show broken symlinks in red/strikethrough

## Phase 3: UX Improvements (Medium Priority)
### From GAME_DESIGN_AUDIT.md
- [ ] **Task Dependencies** - Grey out tasks until prerequisites complete
- [ ] **Progressive Hints** - Unlock more specific hints over time
- [ ] **Command History** - Show last 3 commands in status bar
- [ ] **Efficiency Feedback** - Show optimal vs actual keystrokes

### From CONTENT_AUDIT.md
- [ ] **Level 9 Task Consolidation** - Reduce from 5 to 3-4 meaningful tasks
- [ ] **Archive Breadcrumbs** - Show when inside archives (e.g., "/archive.zip/internal")
- [ ] **Consistent Voice** - Audit all AI-7734 dialogue for consistent tone

## Phase 4: Polish & Documentation (Low Priority)
### From CODE_AUDIT.md
- [ ] **Performance** - Memoize expensive computations
- [ ] **TypeScript** - Remove 'any' types, add strict null checks
- [ ] **Testing** - Add unit tests for fsHelpers and sortHelpers

### From YAZI_AUDIT.md (Nice-to-Have)
- [ ] **Search Mode** - '/' for fuzzy find
- [ ] **Shell Integration** - '; to open shell command modal
- [ ] **Plugin System** - Smart filter/sorter simulation

## Implementation Strategy

### Batch 1: Quick Wins (1-2 hours)
1. Success toast persistence fix
2. Task completion visual indicators  
3. Level 1 task wording verification
4. Filter clearing task in Level 3

### Batch 2: Goto & Sort (2-3 hours)
1. Implement g-command which-key dialog
2. Change sort modal keybinding from 'm' to ','
3. Add sort reverse variants (Shift+letter)
4. Update affected levels to use new keybindings

### Batch 3: Selection & Visual (2-3 hours)
1. Bulk selection commands (Ctrl+a, Ctrl+r)
2. Visual select mode (V/v)
3. Update UI to show selection mode
4. Test with existing cut/copy/paste

### Batch 4: Content & UX (3-4 hours)
1. Level 9 task consolidation
2. Task dependency system
3. Command history display
4. Progressive hints system

## Testing Checklist
- [ ] All 9 levels playable start to finish
- [ ] No level progression blockers
- [ ] Keybindings match real Yazi
- [ ] Tasks align with theatre.md narrative
- [ ] No console errors
- [ ] Success toast requires user action
- [ ] Filters clear properly

## Notes
- Always verify against theatre.md for narrative consistency
- Test on Google Cloud deployment after each batch
- Keep main branch stable - work in feature branches
- Document any deviations from real Yazi behavior

## Current Status
**Branch:** feat/add-audit-documentation
**Last Sync:** 2025-12-15
**Ready for:** Batch 1 implementation
