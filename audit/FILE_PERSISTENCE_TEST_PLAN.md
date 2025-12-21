# File System Persistence Test Plan
**Date:** 2025-12-18  
**Purpose:** Verify player actions persist across level transitions  
**Status:** ❌ MANUAL TESTING OUT OF SCOPE

---

## Executive Summary

**Architecture Analysis:** ✅ File system state SHOULD persist correctly

**How Persistence Works:**
1. `advanceLevel()` clones current filesystem: `fs = cloneFS(prev.fs)`
2. Applies level-specific `onEnter` hook (if exists)
3. Preserves modified filesystem in state
4. Player actions should carry forward unless explicitly overridden

**Potential Issues Identified:**
- All `onEnter` hooks only ADD missing files, never DELETE
- Level 11 neural files now exist in initial file structure (no dynamic cleanup)

---

## onEnter Hook Analysis

### Level 5: Protocol Setup
**Location:** Lines 560-578  
**Behavior:** 
```typescript
- Creates datastore/protocols/ if missing
- Adds uplink_v1.conf and uplink_v2.conf if missing
```
**Impact on Persistence:** ✅ SAFE - Only adds, never removes  
**Player files affected:** None

---

### Level 8: Neural Network Setup
**Location:** Lines 739-757  
**Behavior:**
```typescript
- Creates .config/vault/ if missing
- Creates vault/active/ if missing
- Adds uplink_v1.conf to active/ if missing
```
**Impact on Persistence:** ✅ SAFE - Only adds, never removes  
**Player files affected:** None

---

### Level 11: Neural Purge Setup (✅ UPDATED - NO CLEANUP)
**Location:** No longer has `onEnter` hook  
**Behavior:**
```typescript
// Neural files now exist in initial file structure (INITIAL_FS_RAW)
// No dynamic file creation or cleanup needed
```
**Impact on Persistence:** ✅ SAFE - No modifications to filesystem  
**Player files affected:** None  
**Change:** As of 2025-12-21, neural files moved to initial structure, `onEnter` hook removed

---

### Level 12: Vault Restoration
**Location:** Lines 992-998  
**Behavior:**
```typescript
- Recreates .config/vault/ if it was deleted in previous levels
```
**Impact on Persistence:** ✅ SAFE - Only adds if missing  
**Player files affected:** None  
**Note:** If player deleted vault in L11, it's restored for L12 tasks

---

## Test Cases

### Test Category 1: Create Files (Persist Across Levels)

#### Test 1.1: Create Non-Essential File in Level 1
**Setup:**
1. Start Level 1
2. Navigate to `/home/guest`
3. Create file `test_persistence.txt` (press `a`)

**Expected Behavior:**
- File should exist in Level 2
- File should exist in Level 3
- File should exist through all levels (unless explicitly deleted by player)

**Result:** ⬜ NOT TESTED

---

#### Test 1.2: Create Directory in Level 4
**Setup:**
1. Complete Levels 1-3
2. In Level 4, navigate to `/home/guest`
3. Create directory `my_custom_folder/` (press `a`, include trailing `/`)

**Expected Behavior:**
- Directory exists in Level 5
- Can navigate into it in subsequent levels
- Remains through all levels

**Result:** ⬜ NOT TESTED

---

### Test Category 2: Delete Files (Non-Protected)

#### Test 2.1: Delete Non-Essential File
**Setup:**
1. Level 1: Create `test_delete.txt` in `/home/guest`
2. Level 2: Verify file exists
3. Level 2: Delete `test_delete.txt` (press `d`, confirm)
4. Level 3: Check if file still deleted

**Expected Behavior:**
- File remains deleted in Level 3
- Deletion persists through subsequent levels

**Result:** ⬜ NOT TESTED

---

#### Test 2.2: Try to Delete Protected File (Should Block)
**Setup:**
1. Level 3: Try to delete `target_map.png`

**Expected Behavior:**
- Protection message: "🔒 PROTECTED: Intel target. Do not destroy."
- File remains intact
- Notification shows for 4 seconds with red pulsing background

**Result:** ⬜ NOT TESTED

---

### Test Category 3: Move/Rename Files (Non-Protected)

#### Test 3.1: Move Custom File Between Directories
**Setup:**
1. Level 1: Create `mobile_file.txt` in `/home/guest`
2. Level 2: Yank file (press `y`)
3. Level 2: Navigate to `/home/guest/media`
4. Level 2: Paste file (press `p`)
5. Level 3: Verify file is in `/media`, not original location

**Expected Behavior:**
- File moved to `/media`
- Original location no longer has the file
- Persists in new location through subsequent levels

**Result:** ⬜ NOT TESTED

---

#### Test 3.2: Rename Non-Protected File
**Setup:**
1. Level 1: Create `old_name.txt` in `/home/guest`
2. Level 2: Rename to `new_name.txt` (press `r`)
3. Level 3: Verify file is `new_name.txt`, not `old_name.txt`

**Expected Behavior:**
- File renamed successfully
- New name persists through levels
- Old name no longer exists

**Result:** ⬜ NOT TESTED

---

### Test Category 4: onEnter Hook Behavior

#### Test 4.1: Level 11 Neural Files (No Cleanup)
**Setup:**
1. Level 10: Navigate to `/workspace`
2. Level 10: Create file named `neural_test.txt`
3. Level 10: Create file named `safe_test.txt`
4. Advance to Level 11
5. Navigate to `/workspace`

**Expected Behavior:**
- ✅ `neural_test.txt` should PERSIST (no cleanup as of 2025-12-21)
- ✅ `safe_test.txt` should PERSIST
- ✅ Pre-existing neural files from initial structure should exist (neural_sig_alpha.log, etc.)

**Note:** As of 2025-12-21, Level 11 no longer has an `onEnter` hook. Neural files exist in initial file structure.

**Result:** ⬜ NOT TESTED

---

#### Test 4.2: Level 12 Vault Restoration
**Setup:**
1. Level 11: Delete `.config/vault` directory (if not protected)
2. Advance to Level 12
3. Check if `.config/vault` exists

**Expected Behavior:**
- Vault directory recreated by Level 12's onEnter
- Empty vault (no children)
- Allows Level 12 tasks to proceed

**Result:** ⬜ NOT TESTED

---

### Test Category 5: Episode Boundary Behavior

#### Test 5.1: Episode 1 → Episode 2 Persistence
**Setup:**
1. Level 5 (last of Episode 1): Create `episode1_file.txt` in `/home/guest`
2. Advance to Level 6 (first of Episode 2)
3. Navigate to `/home/guest` and check for file

**Expected Behavior:**
- File should persist across episode boundary
- Location might reset if new episode has initialPath, but file remains in filesystem

**Result:** ⬜ NOT TESTED

---

### Test Category 6: Edge Cases

#### Test 6.1: Create File with Protected Name (Different Location)
**Setup:**
1. Level 1: Try to create file named `access_key.pem` in `/home/guest` (not in credentials)

**Expected Behavior:**
- File creation succeeds (protection is path-specific)
- File persists
- Does not conflict with real `access_key.pem` in credentials

**Result:** ⬜ NOT TESTED

---

#### Test 6.2: Modify Directory Contents
**Setup:**
1. Level 1: Navigate to `/home/guest/incoming`
2. Level 1: Create 3 files: `a.txt`, `b.txt`, `c.txt`
3. Level 2: Delete `b.txt`
4. Level 3: Verify only `a.txt` and `c.txt` remain

**Expected Behavior:**
- All modifications persist
- Directory reflects cumulative changes

**Result:** ⬜ NOT TESTED

---

## Testing Protocol

### Manual Testing Steps

1. **Prepare Environment**
   - Clear browser cache/localStorage
   - Start fresh game session
   - Have developer tools console open to catch any errors

2. **Execute Test Cases**
   - Follow each test case in order
   - Document actual behavior vs expected
   - Take screenshots of any discrepancies
   - Note console errors

3. **Record Results**
   - Mark each test: ✅ PASS, ❌ FAIL, or ⚠️ PARTIAL
   - Document any deviations from expected behavior
   - Note if protection messages appear correctly

4. **Report Findings**
   - Summarize passing/failing tests
   - Identify patterns in failures
   - Propose fixes for any persistence bugs

---

## Automated Testing (Future)

Consider implementing unit tests for persistence:

```typescript
describe('File System Persistence', () => {
  it('should preserve custom files across level transitions', () => {
    const fs1 = addNode(initialFS, ['root', 'home', 'guest'], customFile);
    const fs2 = advanceLevel(fs1, level2);
    expect(findNodeByName(fs2, 'customFile')).toBeDefined();
  });

  it('should apply onEnter hooks without destroying other files', () => {
    const fs1 = addNode(initialFS, ['root', 'home', 'user', 'workspace'], customFile);
    const fs2 = level12.onEnter(fs1); // Level 12 has onEnter, Level 11 does not
    expect(findNodeByName(fs2, 'customFile')).toBeDefined();
    expect(findNodeByName(fs2, 'vault')).toBeDefined();
  });
});
```

---

## Known Limitations

### By Design (Not Bugs)

1. **Level 12 recreates vault if missing** - Required for tasks to function
2. **Protected files block operations** - Security measure to prevent game-breaking actions
3. **Episode transitions may reset location** - Narrative justification for new starting points
4. **Level 11 neural files in initial structure** - Present from game start, not dynamically added

### Potential Issues (Need Verification)

1. ⚠️ **File timestamps** - Need to verify modified timestamps persist
2. ⚠️ **File content changes** - If player could edit files (not currently possible), would edits persist?
3. ⚠️ **Archive contents** - If player could modify archive internals, would they persist?
4. ⚠️ **Hidden files** - Do hidden files persist correctly?

---

## Results Summary

**Total Test Cases:** 12  
**Passed:** ⬜ 0 (not yet tested)  
**Failed:** ⬜ 0 (not yet tested)  
**Partial:** ⬜ 0 (not yet tested)  

**Status:** ❌ MANUAL TESTING OUT OF SCOPE

---

## Conclusion

**Architectural Assessment:** ✅ LIKELY CORRECT

The code architecture supports file persistence:
- `cloneFS(prev.fs)` preserves state
- `onEnter` hooks only add missing files, never delete
- No global resets between non-episode transitions
- Level 11 neural files exist in initial structure (as of 2025-12-21)

**Confidence Level:** 90% - Code review suggests persistence works correctly. All `onEnter` hooks are additive only.



---

**Document Created:** 2025-12-18 19:50 UTC  
**Next Action:** Manual QA session for persistence testing is out of scope.  
**Estimated Testing Time:** 1-2 hours
