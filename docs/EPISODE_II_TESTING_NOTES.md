# Episode II: FORTIFICATION - Browser Testing Notes

## Overview

Browser testing for Episode II (Levels 6-10) to understand game mechanics and create Playwright tests.

## Test Results Summary

| Level | Name             | Browser Test | Key Mechanics                   | Notes                                                     |
| ----- | ---------------- | ------------ | ------------------------------- | --------------------------------------------------------- |
| 6     | BATCH OPERATIONS | ✅ Pass      | Search (s), Select All (Ctrl+A) | Search finds files across dirs                            |
| 7     | QUANTUM BYPASS   | ✅ Pass      | FZF (z), Abort (Y)              | "Threat Detected" alert blocks completion until dismissed |
| 8     | DAEMON DISGUISE  | ✅ Pass      | Overwrite (Shift+P)             | Persistent filter triggers Protocol Violation alert       |
| 9     | TRACE CLEANUP    | ✅ Pass      | Invert (Ctrl+R), Delete (D)     | Filter->Select->Clear workflow works best                 |
| 10    | CREDENTIAL HEIST | ⚠️ Skipped   | Sort (,m), Zip Navigation       | Rate limit reached; logic inferred from constants         |

---

## Level 6: BATCH OPERATIONS

**Core Skill:** Batch Operations & Recursive Search

### Key Sequences

1. **Nav to inbound:** `g` → `i` → `Enter` (into batch_logs)
2. **Recursive Search:** `s` → type "log" → `Enter`
3. **Select All:** `Ctrl+A` (selects all search results)
4. **Yank:** `y`
5. **Exit Search:** `Escape`
6. **Nav to config:** `g` → `c`
7. **Create Vault:** `Enter` (into vault) → `a` → "training_data/" → `Enter`
8. **Paste:** `Enter` (into training_data) → `p`

### Visual Feedback

- Recursive search shows list of matching files from subdirectories
- Status bar shows "YANK: 4" after selecting logs

---

## Level 7: QUANTUM BYPASS

**Core Skill:** FZF Find & Operation Abort

### Key Sequences

1. **Nav to Root:** `g` → `r`
2. **FZF Find:** `z` → type "access_token" → `Enter`
3. **Cut:** `x`
4. **Jump to etc:** `Shift+Z` → type "etc" → `Enter`
5. **Abort:**
   - **Critical:** "Threat Detected" overlay appears immediately
   - Action: `Shift+Enter` (dismiss overlay) → `Shift+Y` (clear clipboard)

### Issues Found

- The overlay blocks the final task check. Test must dismiss overlay before clearing clipboard.

---

## Level 8: DAEMON DISGUISE CONSTRUCTION

**Core Skill:** Force Overwrite (Shift+P)

### Key Sequences

1. **Preview Corruption:** `g` → `w` → `Enter` (systemd-core) → `f` (filter) → "uplink" → `Escape`
2. **Nav to Vault:** `g` → `c` → `Enter` (vault) → `Enter` (active)
   - **Issue:** Filter from previous directory persists, triggering "Protocol Violation"
   - **Fix:** Press `Escape` twice to clear filter/alert before navigating
3. **Yank Clean File:** `y` (assuming cursor on file)
4. **Overwrite:** `g` → `w` → `Enter` (systemd-core) → `Shift+P`

---

## Level 9: TRACE CLEANUP

**Core Skill:** Invert Selection (Ctrl+R)

### Key Sequences (User Workflow)

1. **Nav to tmp:** `g` → `t`
2. **Select Ghost:** `f` → "ghost" → `Escape` → `Space` → `Escape` (clear filter)
3. **Select Socket:** `f` → "socket" → `Escape` → `Space` → `Escape` (clear filter)
4. **Invert:** `Ctrl+R` (selects all junk)
5. **Delete:** `Shift+D` → `y` (confirm)

### Visual Feedback

- Filter reduces list to single item
- Space selects item (yellow)
- Ctrl+R swaps selection to all other files

---

## Level 10: CREDENTIAL HEIST

**Core Skill:** Archive Navigation & Sorting

### Key Sequences (Inferred)

1. **Nav to Archive:** `g` → `i` → `Enter` (backup_logs.zip) → `Enter` (credentials)
2. **Sort:** `,` → `m` (Sort by Modified)
3. **Yank:** `y` (Top item is newest)
4. **Deploy:** `g` → `w` → `Enter` (systemd-core) → `a` → "credentials/" → `Enter` → `Enter` (into creds) → `p`

---

## Playwright Implementation Plan

Create `tests/e2e/episode2.spec.ts` with 5 tests:

1. **Level 6:** Needs `waitForTimeout` after search Enter to allow results to populate.
2. **Level 7:** Must handle overlay dismissal (`Shift+Enter`) before `Shift+Y`.
3. **Level 8:** Must handle "Protocol Violation" alert if filter persists (press Esc multiple times).
4. **Level 9:** Implement the robust filter-select-clear loop.
5. **Level 10:** Test `,m` sorting logic and zip file traversal.
