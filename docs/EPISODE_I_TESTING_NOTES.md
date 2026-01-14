# Episode I: AWAKENING - Browser Testing Notes

## Overview

Browser testing for Episode I (Levels 1-5) to understand game mechanics and create Playwright tests.

## Test Results Summary

| Level | Name                  | Browser Test | Playwright Test | Notes                   |
| ----- | --------------------- | ------------ | --------------- | ----------------------- |
| 1     | SYSTEM AWAKENING      | ✅ Pass      | ✅ Pass (3.3s)  | Navigation basics       |
| 2     | THREAT NEUTRALIZATION | ✅ Pass      | ✅ Pass (4.6s)  | Tab, delete confirm     |
| 3     | DATA HARVEST          | ✅ Pass      | ✅ Pass (7.7s)  | Filter, cut/paste       |
| 4     | UPLINK ESTABLISHMENT  | ✅ Pass      | ✅ Pass (7.1s)  | Create, copy, rename    |
| 5     | CONTAINMENT BREACH    | ✅ Pass      | ❌ Fail         | Hidden files navigation |

---

## Level 1: SYSTEM AWAKENING

**Core Skill:** Navigation (j/k/h/l, gg/G)

### Key Sequences Discovered

1. **Task 1 (Calibrate sensors):** `j` → `k`
2. **Task 2 (Enter datastore):** `l`
3. **Task 3 (Preview personnel_list.txt):** `Shift+G` (jump to bottom)
4. **Task 4 (Jump to top):** `g` → `g` (with 150ms delay between presses)
5. **Task 5 (Navigate to /etc):** `h` → `h` → `h` → `j` → `j` → `l`

### Issues Found

- `g` key opens a "GOTO" dialog; second `g` triggers `gg` (jump to top)
- Playwright's `page.keyboard.press('g')` doesn't work reliably
- **Solution:** Use `window.dispatchEvent(new KeyboardEvent())` for all key presses

### Visual Feedback

- Cursor highlight shows current selection
- Path breadcrumb updates on navigation
- Task counter shows "Tasks: X/5" in status bar

---

## Level 2: THREAT NEUTRALIZATION

**Core Skill:** Inspect & Purge (Tab, J/K, d)

### Key Sequences Discovered

1. **Task 1 (Navigate to ~/incoming):** `g` → `i` (goto incoming)
2. **Task 2 (Locate and inspect):** `Shift+G` (bottom), `Tab` (info panel)
3. **Task 3 (Scroll preview):** `Escape` (close panel), `Shift+J`, `Shift+K`
4. **Task 4 (Delete file):** `d` → `y` (confirm with lowercase y)

### Issues Found

- Tab opens file information panel (not tab switching)
- Info panel must be closed before scrolling preview works
- Delete confirmation uses `y` (lowercase), not `Y`

### Visual Feedback

- Info panel shows file metadata in overlay
- Delete confirmation shows "Trash" dialog with purple border
- Status bar shows `[Y]es/(N)o` interaction hint

---

## Level 3: DATA HARVEST

**Core Skill:** Filter (f), File Operations (x, p)

### Key Sequences Discovered

1. **Task 1 (Preview abandoned_script.py):** `g` → `d`, then `j` × 6
2. **Task 2 (Filter for sector_map.png):** `g` → `i`, `f`, type "sector_map.png", `Escape`
3. **Task 3 (Cut file):** `x`, `Escape` (clear filter)
4. **Task 4 (Paste to media):** `g` → `h`, `j` × 3, `l`, `p`

### Issues Found

- Filter input requires `page.keyboard.type()` (not dispatchEvent)
- Escape exits filter mode but keeps filter active
- Second Escape clears the filter
- Status bar shows "FLT" mode indicator and filter text

### Visual Feedback

- Filter input appears at bottom-left: `Filter: [text]`
- Filtered file list shows only matching files
- Cut operation shows scissors icon and "MOVE: 1" in status

---

## Level 4: UPLINK ESTABLISHMENT

**Core Skill:** Create (a), Copy (y/p), Rename (r)

### Key Sequences Discovered

1. **Task 1 (Create protocols/):** `g` → `d`, `a`, type "protocols/", `Enter`
2. **Task 2 (Create uplink_v1.conf):** `l`, `a`, type "uplink_v1.conf", `Enter`
3. **Task 3 (Duplicate and rename):** `y`, `p`, `r`, `Ctrl+A`, `Backspace`, type "uplink_v2.conf", `Enter`

### Issues Found

- Appending `/` to name creates a directory
- Create input uses `page.keyboard.type()` for text
- Yank shows "COPY: 1" in status bar
- Rename pre-fills current filename; must clear before typing new name

### Visual Feedback

- Create prompt: `CREATE: [text]`
- Rename prompt: `RENAME: [old_name]` (pre-filled)
- Copy indicator: copy icon next to filename

---

## Level 5: CONTAINMENT BREACH

**Core Skill:** Visual Select (Space), Cut (x), Hidden Files (.)

### Key Sequences Discovered

1. **Task 1 (Select and cut):** `g` → `d`, `l` (enter protocols), `Space`, `j`, `Space`, `x`
2. **Task 2 (Show hidden files):** `g` → `h`, `.`
3. **Task 3 (Create vault/active/):** `j`, `l` (enter .config), `a`, type "vault/active/", `Enter`
4. **Task 4 (Paste files):** `k`, `l`, `l`, `p`
5. **Task 5 (Hide hidden files):** `g` → `h`, `.`

### Issues Found

- **QUARANTINE ALERT overlay:** Level 5 shows a unique alert instead of intro screen
  - Must dismiss with `Shift+Enter` before game starts
  - Standard "Skip Intro" button doesn't appear
- **Playwright test fails at Task 3:** Navigation to .config after showing hidden files is inconsistent
- Hidden files toggle shows "HIDDEN: ON/OFF" in status bar

### Visual Feedback

- Selected files turn yellow with `[VIS]` badge
- Cut files show red scissors icon
- Status shows "MOVE: 2" for cut files

---

## Technical Discoveries

### Key Event Handling

The game uses a global keyboard event listener on `window`. Standard Playwright key presses don't trigger the game's handlers reliably.

**Working Solution:**

```typescript
await page.evaluate(() => {
  window.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: 'g',
      code: 'KeyG',
    })
  );
});
```

### Text Input for Dialogs

Filter, create, and rename inputs work with standard Playwright typing:

```typescript
await page.keyboard.type('filename.txt', { delay: 30 });
await page.keyboard.press('Enter');
```

### Intro Screen Handling

- Levels 1-4: Click "Skip Intro" button or press `Shift+Enter`
- Level 5: Has unique "QUARANTINE ALERT" - press `Shift+Enter` to dismiss

---

## Files Created

1. **playwright.config.ts** - Playwright configuration
2. **tests/e2e/utils.ts** - Key press utilities with dispatchEvent
3. **tests/e2e/episode1.spec.ts** - 5 test suites for Episode I

---

## Outstanding Issues

### Level 5 Playwright Test Failure

The test reaches 2/5 tasks but fails during vault creation. Suspected issues:

1. After showing hidden files, cursor position is uncertain
2. Navigation to `.config` may need different j-press count
3. After creating `vault/active/`, entering the directory fails

**Recommendation:** Debug with headed mode (`--headed`) or record a video to observe actual navigation.
