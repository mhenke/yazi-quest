# Yazi Quest - Realism Audit Report

**Date:** 2025-12-21 (Updated)
**Auditor:** Claude Code  
**Purpose:** Compare Yazi Quest implementation against real Yazi file manager behavior

---

## Executive Summary

Yazi Quest accurately implements **core navigation and file operations** matching real Yazi behavior. The game has **14 notable gaps** including **1 critical keybinding error** (sort mode uses `m` instead of `,`) that must be fixed before release. Most other gaps are minor feature omissions that don't break the teaching experience.

### Audit Score: **9.0/10** (Outstanding Realism!)

### Recent Improvements (Dec 2025):

✅ **Fixed:** Paste auto-renames conflicting files (was modal prompt)  
✅ **Fixed:** Y/X to cancel yank implemented  
✅ **Fixed:** Modified sort now uses real timestamps  
✅ **FIXED Dec 15:** Sort keybinding changed from `m` to `,` (CRITICAL issue resolved!)
✅ **FIXED Dec 15:** Sort reverse variants (,A, ,S, ,M, ,E, ,N) implemented
✅ **FIXED Dec 15:** Bulk selection (Ctrl+a, Ctrl+r) implemented
✅ **FIXED Dec 15:** Goto commands (gh, gc, gt, gd, gD, gr, gw, gi) implemented

---

## ✅ What's Implemented CORRECTLY

### Navigation (100% Accurate)

- ✓ **j/k** - Up/down navigation
- ✓ **h** - Parent directory
- ✓ **l/Enter** - Enter directory
- ✓ **gg** - Jump to top
- ✓ **G** - Jump to bottom
- ✓ **Cursor persistence** - Maintains position when possible

### Selection System (100% Accurate)

- ✓ **Space** - Toggle selection **AND advance cursor** (critical combined action!)
- ✓ Multi-select with Space
- ✓ Visual selection indicators
- ✓ Selection persists during cut/copy operations

### File Operations (95% Accurate)

- ✓ **x** - Cut files (red visual indicator)
- ✓ **y** - Copy/yank files (yellow visual indicator)
- ✓ **p** - Paste files
- ✓ **d** - Delete with confirmation (y/N prompt matches Yazi)
- ✓ **a** - Create file/directory
- ✓ **Trailing slash detection** - `protocols/` creates directory ✓
- ✓ **r** - Rename (single and bulk)

### Filter System (100% Accurate as of fix)

- ✓ **f** - Filter files by name
- ✓ **Filters persist** across operations (cut/copy/paste)
- ✓ **Filters persist** when navigating directories
- ✓ **Esc** - Manual clear only (realistic Yazi behavior)
- ✓ Directory-specific filters (each dir has own filter state)

### Archive Navigation (100% Accurate)

- ✓ **Enter/l on archives** - Enters archive as virtual directory
- ✓ Can navigate inside archives with j/k/h/l
- ✓ Supports .zip and .tar formats
- ✓ Preview files inside archives

### Preview Pane (95% Accurate)

- ✓ Auto-updates as cursor moves
- ✓ Shows file content for text files
- ✓ Shows images with URLs
- ✓ Shows archive contents

### Info Panel (Tab key) (80% Accurate - Simplified)

- ✓ **Tab** - Toggle file info panel
- ✓ Shows mime-type
- ✓ Shows file size
- ✓ Shows file type (dir/file/archive)
- ✓ **Tab/Esc** - Close panel (keyboard-only)
- ❌ Real Yazi's "spot" mode has navigation (h/j/k/l) to browse multiple files
- **Note:** Simplified for teaching purposes, but not full feature parity

### Search & Jump (95% Accurate)

- ✓ **z** - FZF fuzzy find (current directory recursive)
- ✓ **Z** - Zoxide jump (frecency-based directory history)
- ✓ **Frecency algorithm** - Frequency × Recency with time decay ✓
- ✓ Zoxide time multipliers: ×4 (<1hr), ×2 (<1day), ÷2 (<1week), ÷4 (older) ✓

### Sorting System (40% Accurate - CRITICAL ISSUE)

- ❌ **WRONG KEYBINDING:** Uses **`m`** instead of **`,`** (comma) to enter sort mode
- ✓ Sort options work once in mode (a/n/s/m/e)
- ❌ Missing uppercase variants for reverse sort (,M, ,A, ,S, ,E, ,N)
- ❌ Missing random sort (`,r`)
- **Impact:** HIGH - Teaches incorrect muscle memory that won't work in real Yazi

### Hidden Files (100% Accurate)

- ✓ **.** (period) - Toggle hidden files visibility
- ✓ Hidden files filtered before text filters

### Help System (100% Accurate)

- ✓ **?** - Toggle help modal
- ✓ Shows comprehensive keybinding list
- ✓ **Esc** - Close help

### Sound/Settings (100% Accurate)

- ✓ **Shift+M** - Toggle sound on/off

---

## ❌ Gaps & Inconsistencies

### 🔴 CRITICAL ISSUES

### 1. **Sort Keybinding** ✅ FIXED (Dec 15, 2025)

**Real Yazi:**

- Uses **`,`** (comma) as the sort mode prefix
- **`,m`** - Sort by modified time
- **`,M`** - Sort by modified time (reverse)
- **`,a`** - Sort alphabetically
- **`,A`** - Sort alphabetically (reverse)
- **`,n`** - Sort naturally
- **`,N`** - Sort naturally (reverse)
- **`,s`** - Sort by size
- **`,S`** - Sort by size (reverse)
- **`,e`** - Sort by extension
- **`,E`** - Sort by extension (reverse)
- **`,r`** - Sort randomly

**Yazi Quest:** ✅ NOW FULLY FIXED

- Now uses **`,`** to enter sort mode (CORRECT!)
- ✅ Uppercase variants implemented! (,A, ,S, ,M, ,E, ,N for reverse)
- Missing random sort (low priority)
- Level 2 description updated to reflect `,` keybinding
- Help text updated

**Impact:** RESOLVED - Users will now learn correct keybinding

**Changes Made:**

1. ✅ Changed sort prefix from `m` to `,` in App.tsx
2. ✅ Updated KEYBINDINGS in constants.tsx
3. ✅ Updated Level 2 description and hint
4. ✅ Moved sound toggle to `m` (since comma took sort)
5. ✅ Quest Map remains on Shift+M

**Update Log:**
**2025-12-15:** FIXED - Sort keybinding now uses comma like real Yazi!

---

### 🟡 MODERATE ISSUES

### 2. **MODERATE: Paste Overwrite Behavior Differs**

**Real Yazi:**

- Automatically **renames** conflicting files with "\_1" suffix (safe default)
- No prompt by default
- Use **P** (uppercase) to force overwrite
- Philosophy: Prevent accidental overwrites

**Yazi Quest:** ✅ FIXED (Dec 2025)

- Now auto-renames with "\_1" suffix via `addNode()` function
- No P (force overwrite) yet, but auto-rename is the important part

**Impact:** RESOLVED - Now matches real Yazi behavior
**Status:** ✅ FIXED - Auto-rename implemented

---

### 3. **OUT OF SCOPE: Find Feature (/ and ?) - Not Implementing**

**Real Yazi:**

- **`/`** - Find next file (incremental search)
- **`?`** - Find previous file
- **`n`** - Jump to next found item
- **`N`** - Jump to previous found item

**Yazi Quest Decision:**

- **OUT OF SCOPE** - Too advanced for educational game scope
- Filter (`f`) provides sufficient file finding capability for game purposes
- Adding find/search would add complexity without significant educational value

---

### 4. **Bulk Selection (Ctrl+a / Ctrl+r)** ✅ FIXED (Dec 15, 2025)

**Real Yazi:**

- **Ctrl+a** - Select all files in current directory
- **Ctrl+r** - Invert selection (toggle all files)

**Yazi Quest:** ✅ NOW IMPLEMENTED

- **Ctrl+a** - Selects all files with notification
- **Ctrl+r** - Inverts selection with notification
- Space still works for individual selection

**Impact:** RESOLVED - Bulk operations now efficient!

**Changes Made:** Added Ctrl+a and Ctrl+r handlers in App.tsx

---

### 5. **MINOR: Y/X to Cancel Yank** ✅ FIXED (Dec 2025)

**Real Yazi:**

- **Y** or **X** - Cancel yank status (clear clipboard)
- Useful when you change your mind after cutting/copying

**Yazi Quest:** ✅ NOW IMPLEMENTED

- Y/X now clears clipboard and resets yank status
- Implemented in App.tsx around line 485-488

**Impact:** RESOLVED
**Status:** ✅ FIXED - Feature implemented Dec 2025

---

### 6. **MINOR: Visual Mode (v/V) Not Implemented**

**Real Yazi:**

- **v** - Enter visual mode (Vim-style selection)
- **V** - Enter visual unset mode
- Navigate with j/k to expand selection range
- **Esc** - Exit visual mode

**Yazi Quest:**

- No visual mode
- Only Space for individual selection

**Impact:** Minor - Space selection is sufficient for teaching
**Recommendation:** Low priority (Space works well for game context)

---

### 7. **Goto Commands (g prefix)** ✅ FIXED (Dec 15, 2025)

**Real Yazi:**

- **`gh`** - Go to home directory (~)
- **`gc`** - Go to ~/.config
- **`gd`** - Go to ~/Downloads
- **`gt`** - Go to /tmp

**Yazi Quest:** ✅ NOW IMPLEMENTED

- **`gh`** - Jump to /root/home/user (home)
- **`gc`** - Jump to /root/home/user/workspace (config)
- **`gt`** - Jump to /root/tmp
- **`gd`** - Jump to /root/home/user/datastore (Episode 2+)
- Still has **`gg`** (top) and **`G`** (bottom)

**Impact:** RESOLVED - Power user shortcuts added!
**Changes Made:** Enhanced 'g' key handler to support gh, gc, gt, gd

---

### 8. **MINOR: Advanced Navigation Keys Missing**

**Real Yazi:**

- **H** - Back in history
- **L** - Forward in history
- **Ctrl+u** / **Ctrl+d** - Half-page scroll
- **Ctrl+b** / **Ctrl+f** - Full-page scroll

**Yazi Quest:**

- Only basic j/k/h/l/gg/G navigation

**Impact:** Minor - Basic navigation is sufficient
**Recommendation:** Low priority (game levels don't need these)

---

### 9. **MINOR: Preview Navigation (J/K in Preview) Missing**

**Real Yazi:**

- **J** - Seek down in preview pane
- **K** - Seek up in preview pane
- Allows scrolling long file previews

**Yazi Quest:**

- Preview pane is static (no scrolling)

**Impact:** Minor - Preview pane is simplified
**Recommendation:** Low priority (not needed for game)

---

### 10. **MINOR: Clipboard Path Copy (cc/cd/cf/cn) Missing**

**Real Yazi:**

- **cc** - Copy file path
- **cd** - Copy directory path
- **cf** - Copy filename
- **cn** - Copy filename without extension

**Yazi Quest:**

- Not implemented

**Impact:** Minor - Not needed for game objectives
**Recommendation:** Low priority (out of scope)

---

### 11. **MINOR: Symlink Operations Missing**

**Real Yazi:**

- **-** - Create symlink (absolute)
- **\_** - Create symlink (relative)
- **Ctrl+-** - Create hardlink
- **gf** - Follow symlink

**Yazi Quest:**

- Not implemented

**Impact:** Minor - Out of scope for beginner tutorial
**Recommendation:** Low priority (advanced feature)

---

### 12. **MINOR: Tab Management Missing**

**Real Yazi:**

- **t** - New tab
- **1-9** - Switch to tab 1-9
- **[** / **]** - Previous/next tab
- **{** / **}** - Swap tabs
- **Ctrl+c** - Close tab

**Yazi Quest:**

- Single-pane only (no tabs)

**Impact:** Minor - Tabs are advanced feature
**Recommendation:** Low priority (not needed for tutorial)

---

### 13. **MINOR: Shell Command Execution Missing**

**Real Yazi:**

- **;** - Run shell command (non-blocking)
- **:** - Run shell command (blocking)

**Yazi Quest:**

- Not implemented (game is sandboxed filesystem)

**Impact:** None - Intentionally omitted
**Recommendation:** Keep omitted (out of scope)

---

### 14. **MINOR: Search Commands (s/S) Missing**

**Real Yazi:**

- **`s`** - Search filenames with fd (external tool integration)
- **`S`** - Search file contents with ripgrep (external tool integration)
- **Ctrl+s** - Cancel ongoing search

**Yazi Quest:**

- Only has **`f`** (filter), **`z`** (fzf), and **`Z`** (zoxide)
- No fd/ripgrep integration (intentionally omitted - sandboxed environment)

**Impact:** Minor - Filter and fzf cover most teaching use cases
**Recommendation:** Low priority (out of scope - requires external tools)

**Note:** This is separate from the Find feature (`/`, `?`, `n`, `N`) which is documented in gap #3.

---

### 15. **SIMPLIFIED: Linemode Commands Missing**

**Real Yazi:**

- **`m,s`** - Linemode: size (show file sizes in list)
- **`m,p`** - Linemode: permissions (show file permissions)
- **`m,m`** - Linemode: mtime (show modified time)
- **`m,b`** - Linemode: btime (show birth time)
- **`m,o`** - Linemode: owner (show file owner)
- **`m,n`** - Linemode: none (minimal display)

**Yazi Quest:**
**Yazi Quest:**

- A simplified linemode is implemented, accessible via the sort menu, not the `m` prefix.
- This is a "Good enough for teaching" solution.
- Not implemented
- File list shows fixed metadata format

**Impact:** Minor - Linemode is a display preference feature, not core workflow
**Recommendation:** Low priority (display-only feature)

**Note:** Real Yazi uses `m` prefix for linemode. In Yazi Quest, `m` is incorrectly used for sort mode (which should be `,`).

---

### 16. **MINOR: Tasks Manager (w) Missing**

**Real Yazi:**

- **`w`** - Show task manager (view background file operations)

**Yazi Quest:**

- Not implemented (all operations are instant)

**Impact:** None - Intentionally omitted (no background tasks in game)
**Recommendation:** Keep omitted (out of scope)

---

## Update Log

**2025-12-14:** Implemented 'Y/X' to cancel yank status.
**2025-12-15:** Comprehensive audit update - identified critical sort keybinding error, added find/search distinction, bulk selection gaps, goto commands, linemode, and reclassified spot feature as simplified.
**2025-12-15 (Evening):** Updated audit to reflect current codebase state. Paste auto-rename FIXED, Y/X cancel FIXED, timestamps IMPLEMENTED. Sort keybinding (`m` vs `,`) remains UNFIXED and is the #1 priority.
**2025-12-15 (Final Verification):** ✅ **ALL CRITICAL FIXES VERIFIED IN CODEBASE:**

- Sort keybinding uses `,` (comma) ✓
- Reverse sort variants (,A, ,S, ,M, ,E, ,N) implemented ✓
- Ctrl+a (select all) implemented ✓
- Ctrl+r (invert selection) implemented ✓
- G-command dialog with which-key style UI ✓
- Goto commands (gh, gc, gt, gd, gr) fully functional ✓
- All claimed fixes are present in actual code ✓

---

## Recommendations by Priority

### 🔴 CRITICAL PRIORITY (Breaks Teaching Accuracy)

1. **Fix sort keybinding from `m` to `,` (comma)**
   - **Impact:** HIGH - Currently teaches wrong muscle memory
   - **Effort:** Low - Single character change in keymap
   - **Implementation:**
     ```typescript
     // Change in App.tsx keyboard handler
     case ',': // Sort mode (was: case 'm')
       if (gameState.mode === 'normal') {
         e.preventDefault();
         setGameState(prev => ({ ...prev, mode: 'sort' }));
       }
       break;
     ```
   - Add uppercase variants (,M, ,A, ,N, ,S, ,E) for reverse sorting
   - Update all level descriptions mentioning sort
   - Update help modal keybinding list
   - **Must fix before release** - This is incorrect teaching

---

### 🟡 MEDIUM PRIORITY (Improve Teaching Completeness)

2. **Fix paste overwrite behavior**
   - Switch from modal prompt to auto-rename with "\_1" suffix
   - OR keep modal but add note: "Note: Real Yazi auto-renames instead of prompting"
   - Add **P** (force overwrite) option

3. **~~Add find feature (/ and ?)~~ [OUT OF SCOPE]**
   - Not implementing - too advanced for game scope
   - Filter (`f`) provides sufficient functionality

4. **Add bulk selection (Ctrl+a / Ctrl+r) [COMPLETED ✓]**
   - Ctrl+a - Select all files
   - Ctrl+r - Invert selection
   - Low effort, high teaching value for bulk operations

5. **Add Y/X to cancel yank [COMPLETED ✓]**
   - Simple to implement
   - Teaches users how to undo accidental cuts

---

### 🟢 LOW PRIORITY (Nice to Have)

6. Visual mode (v/V)
7. Goto commands (gh / gc / gt / gd / gr) [COMPLETED ✓ - g-dialog with which-key style UI]
8. Advanced navigation (H/L history, Ctrl+u/d, PageUp/PageDown)
9. Preview scrolling (J/K)
10. Clipboard path copy (cc/cd/cf/cn)
11. Symlink operations (-/\_ for symlinks, g,f to follow)
12. Tab management (t/1-9/[/]/{/})
13. Search commands (s/S - require external tools)
14. Linemode commands (m,s / m,p / m,m / m,o / m,n)
15. Tasks manager (w)

---

## Test Cases for Verification

### Filter Persistence ✅

```
1. Navigate to /home/guest/incoming
2. Press 'f', type 'map'
3. Press 'x' to cut target_map.png
4. Check: Filter STAYS active ✓
5. Press 'h' to go to parent
6. Check: Filter STILL shows "map" in incoming directory ✓
7. Press Esc to clear filter
8. Check: Filter cleared ✓
```

### Space Toggle+Advance ✅

```
1. Navigate to directory with multiple files
2. Press Space on first file
3. Check: File is selected AND cursor moves to next file ✓
```

### Trailing Slash Directory Creation ✅

```
1. Press 'a'
2. Type 'protocols/' (with trailing slash)
3. Check: Creates directory, not file ✓
```

### Zoxide Frecency ✅

```
1. Visit /home/guest/datastore multiple times
2. Visit /etc once
3. Press Shift+Z
4. Check: datastore appears before /etc (higher frecency) ✓
```

---

## Conclusion

Yazi Quest achieves **good realism** for a teaching game, with accurate core workflows (navigation, selection, cut/paste, filtering, archives). However, there is **one critical flaw**: the sort keybinding uses `m` instead of `,` (comma), which will teach incorrect muscle memory. This must be fixed before release.

**Verdict:** After fixing the sort keybinding, the game will teach correct Yazi habits. Skills will transfer directly to real Yazi usage. The moderate gaps (find feature, bulk selection, paste behavior) are acceptable for a tutorial environment but should be documented as differences from real Yazi.

---

## Implementation Roadmap

### Phase 1: Critical Fixes (Must Do Before Release)

1. ✅ Change sort keybinding from `m` to `,`
2. ✅ Add reverse sort variants (uppercase: ,M, ,A, ,N, etc.)
3. ✅ Update all level descriptions mentioning sort mode
4. ✅ Update help modal and documentation

### Phase 2: Moderate Improvements (Enhance Teaching)

1. Implement find feature (`/`, `?`, `n`, `N`)
2. Add bulk selection (Ctrl+a, Ctrl+r)
3. Fix paste overwrite behavior (auto-rename or clarify difference)
4. Document differences from real Yazi in help text

### Phase 3: Polish (Optional Enhancements)

1. Visual mode (v/V)
2. Goto commands (g,h / g,c / g,d)
3. Advanced navigation (H/L history, Ctrl+u/d)
4. Preview scrolling (J/K)

## Testing Checklist

After implementing critical fixes:

- [ ] Sort mode activates with `,` not `m`
- [ ] `,m` sorts by mtime, `,M` sorts by mtime reversed
- [ ] `,a` sorts alphabetically, `,A` sorts alphabetically reversed
- [ ] All sorting level objectives still work correctly
- [ ] Help modal shows `,` as sort keybinding
- [ ] Level descriptions mention `,` not `m`
- [ ] `m` key does nothing in normal mode (or implement linemode if desired)

---

## Sources

- [Yazi Official Docs](https://yazi-rs.github.io/)
- [Yazi Default Keymap](https://github.com/sxyazi/yazi/blob/main/yazi-config/preset/keymap-default.toml)
- [Yazi GitHub Issues & Discussions](https://github.com/sxyazi/yazi)
- [Keyboard Shortcuts Reference](https://kb.adamsdesk.com/application/yazi-keyboard-shortcuts/)
