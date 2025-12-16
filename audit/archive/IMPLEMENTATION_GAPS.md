# Implementation Gaps Analysis
**Date:** 2025-12-15  
**Branch:** feat/add-audit-documentation

---

## Critical Mismatches Between Documentation and Code

### ✅ Gap #1: Level 1 Task Count - CODE IS CORRECT

**IMPLEMENTATION_SUMMARY.md incorrectly claimed:**
- Level 1 reduced from 5 → 3 tasks
- Removed gg/G jump tasks

**ACTUAL CODE (constants.tsx lines 361-413):**
```
tasks: [
  1. Enter 'datastore' directory (press 'l' when highlighted)
  2. Jump to bottom (G)
  3. Jump to top (gg)
  4. Navigate to /etc (use 'h' repeatedly to go up)
  5. Navigate to /bin directory
]
```

**THEATRE.MD SAYS:** "3-5 micro-goals" per level ✅

**Status:** ✅ **CODE IS CORRECT** - Documentation was wrong

**Resolution:** Update IMPLEMENTATION_SUMMARY.md to match reality

---

### ❌ Gap #2: Level 2 Still Uses Sort (Should Use G Jump)

**IMPLEMENTATION_SUMMARY.md claims:**
- Level 2 changed to use "g then G" jump
- Removed sort workflow
- Teaches g-commands early

**ACTUAL CODE (constants.tsx lines 416-450):**
```
title: "Threat Elimination"
tasks: [
  1. Enter 'incoming'
  2. Sort Descending Alphabetical (,Shift+a)  ← STILL SORTING
  3. Purge 'tracker_beacon.bin'
  4. (implied: restore sort)
]
```

**Status:** ❌ **NOT IMPLEMENTED** - Still teaches sort, not G jump

**Impact:** HIGH - Contradicts audit decision to move sort to Level 9

---

### ❌ Gap #3: Task Descriptions Still Use Wrong Voice

**CONTENT_AUDIT.md Phase 2 claims:**
- Level 1 tasks updated with explicit key hints
- Example: "Enter datastore directory (press 'l' when highlighted)"

**ACTUAL CODE (constants.tsx line 364):**
```
description: "Enter 'datastore' directory (press 'l' when highlighted)"
```

**Status:** ✅ **PARTIALLY DONE** - Task 1 has key hint

But tasks 2-5 still say:
- "Jump to bottom of file list (press 'G')"
- "Jump to top of file list (press 'gg')"
- "Navigate to /etc (use 'h' repeatedly to go up)"
- "Navigate to /bin directory"

**Missing:** Consistent key hints across ALL tasks

---

### ✅ Gap #4: G-Command Dialog (CONFIRMED IMPLEMENTED)

**Verified in code:**
- `components/GCommandDialog.tsx` exists
- `types.ts` has `'g-command'` mode
- `App.tsx` handles g-command mode

**Status:** ✅ **ACTUALLY DONE**

---

### ⚠️ Gap #5: Theatre.md Alignment Unknown

**theatre.md inspection needed:**
- Does Level 1 lore match 3-task or 5-task structure?
- Does Level 2 reference sort or G jump?
- Are skill progressions consistent?

**Status:** ⚠️ **NEEDS VERIFICATION**

---

### ❌ Gap #6: Directory Path Header Missing

**User Report (recent):**
- "Lost the directory location at the top right"
- "It spanned all 3 columns"
- "Had /directory or ~/directory"

**Status:** ❌ **REGRESSION** - Feature removed/broken

**Impact:** MEDIUM - Reduces player orientation

---

### ❌ Gap #7: Level 3 Filter Clearing Not Fixed

**CONTENT_AUDIT.md Task 3:**
- Note added: "Clear filter else retained for rest of game"
- Level 3 should teach filter clearing
- Level 9 should reinforce it

**Status:** ⚠️ **NEEDS CODE VERIFICATION**

---

## Summary of Work Actually Done vs. Claimed

| Item | Claimed | Reality | Status |
|------|---------|---------|--------|
| G-Command Dialog | ✅ Done | ✅ Verified | ✅ |
| Level 1: 5→3 tasks | ✅ Done | ❌ Still 5 tasks | ❌ |
| Level 2: Sort→Jump | ✅ Done | ❌ Still sort | ❌ |
| Level 9: 4→3 tasks | ✅ Done | ⚠️ Unverified | ⚠️ |
| Task voice clarity | ✅ Done | ⚠️ Partial | ⚠️ |
| Directory header | N/A | ❌ Broken | ❌ |

---

## Root Cause Analysis

**Why the gaps exist:**

1. **Documentation written before implementation** - IMPLEMENTATION_SUMMARY describes *intended* work, not *completed* work
2. **Refactoring broke things** - Sam's fixes may have reverted some changes
3. **No verification step** - Changes documented but not tested against actual code
4. **Multiple branches** - Work may be split across branches

---

## Recommended Actions

### Immediate (Critical)
1. ✅ Update IMPLEMENTATION_SUMMARY.md to reflect *actual* state
2. ❌ Implement Level 1 task reduction (5→3)
3. ❌ Implement Level 2 sort→jump replacement
4. ❌ Restore directory path header
5. ✅ Verify theatre.md alignment

### High Priority
6. ⚠️ Apply consistent key hints to ALL Level 1-3 tasks
7. ⚠️ Verify Level 3 filter clearing works
8. ⚠️ Check Level 9 actual task count

### Medium Priority
9. Update all audit docs to match reality
10. Add verification tests to prevent doc/code drift

---

## Next Steps

**For Claude:**
1. Read constants.tsx Level 1-3 definitions
2. Read theatre.md Level 1-3 entries
3. Create reconciliation plan
4. Implement changes surgically
5. Update docs to match reality

**For User:**
- Prioritize which gaps to fix first
- Decide if IMPLEMENTATION_SUMMARY should describe *intent* or *reality*
- Approve reconciliation plan before execution

