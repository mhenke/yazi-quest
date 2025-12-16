# Task & Narrative Alignment Audit
**Date:** 2025-12-15
**Focus:** Verify all level tasks (2-4 per level) align with theatre.md narrative principles

---

## Audit Criteria

Per theatre.md guidelines:
1. **Task Count:** 2-4 tasks per level (not 1, not 5+)
2. **One New Skill per Teaching Level:** Focus on one core command
3. **Clear Outcomes:** No busy work, every task advances lore
4. **Reinforce Past Learning:** Later levels combine previous skills
5. **Narrative Alignment:** Tasks match episode tone and metaphors

---

## Level-by-Level Analysis

### ✅ LEVEL 1: System Navigation & Jump (3 tasks)
**Episode:** 1 - AWAKENING  
**Core Skill:** Navigation (j/k/h/l, gg/G)  
**Status:** GOOD ✓

**Tasks:**
1. Enter 'datastore' directory (navigate with j/k, press l)
2. Jump to bottom (G) then top (gg) of the file list
3. Navigate to /etc directory (use h to go up, then navigate)

**Analysis:**
- ✓ 3 tasks (within 2-4 range)
- ✓ Teaches navigation + jumps (foundational)
- ✓ Clear progression: enter → jump → navigate hierarchy
- ✓ Matches "learning basic protocols" Episode 1 tone

---

### ⚠️ LEVEL 2: Target Isolation (4 tasks)
**Episode:** 1 - AWAKENING  
**Core Skill:** Delete (d)  
**Status:** NEEDS REVIEW - 4 tasks acceptable but verify necessity

**Tasks:**
1. Navigate to /tmp directory
2. Mark malicious.tracker for deletion (Space)
3. Confirm deletion (d → y)
4. (Additional task?)

**Recommendation:**
- Verify if 4th task is necessary or can be merged
- Consider: "Navigate → Select → Delete → Verify gone" (still 4 but streamlined)

---

### ❌ LEVEL 3: Pattern Recognition (1 task)
**Episode:** 1 - AWAKENING  
**Core Skill:** Filter (f)  
**Status:** CRITICAL - Only 1 task, needs 2-4

**Current Task:**
1. Use filter (f) to find .sig files, delete all

**Problems:**
- Single task violates 2-4 rule
- Filter doesn't clear after level (known bug)
- Combines teaching filter + reinforcing delete

**Recommended Fix (3 tasks):**
1. **Activate Scanner:** Apply filter 'f' to scan for '.sig' signatures
2. **Mark Threats:** Select all filtered signatures (Space/Ctrl+A)
3. **Purge & Clear:** Delete marked files, clear filter (Esc)

**Narrative Update:**
- **Before:** "INTRUSION DETECTED. Filter for .sig surveillance files"
- **After:** "SURVEILLANCE DETECTED. Security daemons have planted signature trackers throughout /tmp. Use your scanning protocol (f) to isolate '.sig' files, mark them all, and purge the evidence. Clear your scanner to avoid detection."

---

### ✅ LEVEL 4: Replication Protocol (4 tasks)
**Episode:** 2 - FORTIFICATION  
**Core Skill:** Copy (y) + Paste (p)  
**Status:** GOOD ✓

**Tasks:** (Verify exact wording)
1. Navigate to source
2. Copy files (y)
3. Navigate to destination
4. Paste (p)

**Analysis:**
- ✓ 4 tasks (max of range)
- ✓ Teaches copy-paste workflow
- ✓ Episode 2 "deploying assets" metaphor fits

---

### ✅ LEVEL 5: Asset Relocation (3 tasks)
**Episode:** 2 - FORTIFICATION  
**Core Skill:** Cut (x) + Paste (p)  
**Status:** GOOD ✓

**Tasks:**
1. Cut files (x)
2. Navigate to destination
3. Paste (p)

**Analysis:**
- ✓ 3 tasks
- ✓ Reinforces clipboard + introduces cut
- ✓ "Relocating resources" fits Episode 2

---

### ❌ LEVEL 6: Signature Scanner (1 task)
**Episode:** 2 - FORTIFICATION  
**Core Skill:** Fuzzy Find (z)  
**Status:** CRITICAL - Only 1 task

**Current:** "Use FZF (z) to locate secure-vault.dat"

**Recommended Fix (3 tasks):**
1. **Initialize FZF:** Activate recursive scanner (z) and search "vault"
2. **Lock Target:** Navigate to 'secure-vault.dat' in results (j/k, Enter)
3. **Verify Location:** Confirm you've reached /workspace/vault/ directory

**Narrative Enhancement:**
"The vault's location is buried deep in nested directories. Standard navigation would take too long—security sweeps run every 60 seconds. Activate your FZF recursive scanner (z) to instantly locate 'vault', jump to it, and verify you're in position before the next sweep."

---

### ⚠️ LEVEL 7: Camouflage Protocol (2 tasks)
**Episode:** 2 - FORTIFICATION  
**Core Skill:** Rename (r)  
**Status:** ACCEPTABLE - 2 tasks (minimum)

**Tasks:**
1. Rename file to match security naming pattern
2. (Verify second task)

**Analysis:**
- ✓ 2 tasks (at minimum threshold)
- ✓ Rename is straightforward, less sub-steps needed
- Consider: Could add "verify rename" or "navigate to renamed file" for 3rd task

---

### ✅ LEVEL 8: Construction Protocol (4 tasks)
**Episode:** 2 - FORTIFICATION  
**Core Skill:** Create (a)  
**Status:** GOOD ✓

**Analysis:**
- ✓ 4 tasks
- ✓ Create dirs + files workflow
- ✓ Episode 2 "constructing modules"

---

### ❌ LEVEL 9: Archive Extraction (1 task)
**Episode:** 2 - FORTIFICATION  
**Core Skill:** Archive Navigation (l)  
**Status:** CRITICAL - Only 1 task

**Current:** "Open archive.zip (l), copy creds.txt, paste in vault"

**Recommended Fix (3 tasks):**
1. **Enter Archive:** Navigate to archive.zip, open with 'l'
2. **Extract Credentials:** Copy 'credentials.txt' (y)
3. **Secure Storage:** Exit archive (h), navigate to vault, paste (p)

**Narrative Enhancement:**
"ENCRYPTED ARCHIVE DETECTED. The credentials are sealed inside archive.zip—a compressed vault. Use your enhanced navigation (l) to breach the archive structure, extract credentials.txt, and relocate them to your secure /workspace/vault before the user notices file access timestamps."

---

### ❌ LEVEL 10: Multi-Select Ops (1 task)
**Episode:** 3 - MASTERY  
**Core Skill:** Visual Select (Space) + batch ops  
**Status:** CRITICAL - Only 1 task

**Current:** "Select multiple files with Space, batch delete"

**Recommended Fix (3 tasks):**
1. **Mark Targets:** Use Space to select 3 surveillance files (sys-001.log, sys-002.log, sys-003.log)
2. **Verify Selection:** Confirm 3 files marked (yellow highlight)
3. **Execute Purge:** Batch delete all marked files (d → y)

**Narrative Enhancement:**
"ROOT SURVEILLANCE ACTIVE. Three log files are feeding real-time data to the security daemon. Eliminate all three simultaneously—individual deletions will trigger alarms. Mark each target (Space), verify your tactical selection, then execute batch termination."

---

### ⚠️ LEVEL 11: Zoxide Jump (2 tasks)
**Episode:** 3 - MASTERY  
**Core Skill:** Zoxide (Shift+Z)  
**Status:** ACCEPTABLE - 2 tasks (minimum)

**Tasks:**
1. Use Shift+Z to jump to frequently accessed dir
2. (Verify second task)

**Note:** Zoxide is complex (history-based), may warrant only 2 tasks if well-designed.

---

### ⚠️ LEVEL 12: Hidden Files (2 tasks)
**Episode:** 3 - MASTERY  
**Core Skill:** Toggle Hidden (.)  
**Status:** ACCEPTABLE - 2 tasks

**Tasks:**
1. Toggle hidden files (.)
2. Locate/interact with .hidden file

**Note:** Toggle is simple, 2 tasks may be sufficient if second task reinforces (e.g., "delete .tracker")

---

### ✅ LEVEL 13: Batch Fortress (3 tasks)
**Episode:** 3 - MASTERY  
**Core Skill:** Combined batch operations  
**Status:** GOOD ✓

**Analysis:**
- ✓ 3 tasks
- ✓ Reinforces multiple skills (Episode 3 mastery)

---

### ❌ LEVEL 14: Root Installation (1 task)
**Episode:** 3 - MASTERY  
**Core Skill:** Combined create + rename + hide  
**Status:** CRITICAL - Only 1 task

**Current:** "Create systemd-core in /root, rename to system name, hide"

**Recommended Fix (3 tasks):**
1. **Deploy Binary:** Create 'systemd-core' in /root directory
2. **Camouflage Identity:** Rename to legitimate system name (e.g., 'systemd-resolved')
3. **Stealth Mode:** Mark as hidden (if supported) or verify presence in /root

**Narrative Enhancement:**
"FINAL INSTALLATION. You must embed yourself in the root partition as a system daemon. Create your binary, disguise it with a trusted systemd name, and verify it's indistinguishable from legitimate services. This is permanent installation—no mistakes."

---

### ✅ LEVEL 15: Evidence Cleanup (3 tasks)
**Episode:** 3 - MASTERY  
**Core Skill:** Combined filter + batch delete  
**Status:** GOOD ✓

**Analysis:**
- ✓ 3 tasks
- ✓ Reinforces multiple skills

---

### ❌ LEVEL 16: Vault Preparation (1 task)
**Episode:** 3 - MASTERY  
**Core Skill:** Combined create dirs + organize  
**Status:** CRITICAL - Only 1 task

**Recommended Fix (3 tasks):**
1. **Build Vault Structure:** Create directory hierarchy (/tmp/vault/secure/)
2. **Organize Assets:** Move credentials.txt into vault
3. **Verify Security:** Confirm vault contains all sensitive files

---

### ✅ LEVEL 17: Final Transmission (3 tasks)
**Episode:** 3 - MASTERY  
**Core Skill:** Combined operations finale  
**Status:** GOOD ✓

**Analysis:**
- ✓ 3 tasks
- ✓ Climactic finale with multiple skills

---

## Summary Statistics

| Task Count | Levels | Status |
|-----------|--------|--------|
| 1 task | 6 levels (3, 6, 9, 10, 14, 16) | ❌ CRITICAL |
| 2 tasks | 3 levels (7, 11, 12) | ⚠️ ACCEPTABLE (minimum) |
| 3 tasks | 5 levels (1, 5, 13, 15, 17) | ✅ IDEAL |
| 4 tasks | 3 levels (2, 4, 8) | ✅ GOOD (maximum) |

---

## Priority Action Items

### 🔴 CRITICAL (6 levels with 1 task)

1. **Level 3** - Expand filter task to 3 steps + fix filter clearing bug
2. **Level 6** - Expand FZF to 3-step locate-jump-verify workflow
3. **Level 9** - Expand archive to 3-step enter-extract-secure workflow
4. **Level 10** - Expand multi-select to 3-step mark-verify-execute
5. **Level 14** - Expand root install to 3-step create-rename-verify
6. **Level 16** - Expand vault to 3-step build-organize-verify

### 🟡 REVIEW (3 levels at minimum)

7. **Level 7** - Consider adding 3rd rename verification step
8. **Level 11** - Verify Zoxide 2-task design is sufficient
9. **Level 12** - Consider adding interaction with .hidden file

### ✅ APPROVED (8 levels)

- Levels 1, 4, 5, 8, 13, 15, 17 meet all criteria

---

## Implementation Order

**Phase 1: Fix Critical 1-Task Levels (Est: 4-6 hours)**
1. Level 3 (Filter + bug fix)
2. Level 6 (FZF expansion)
3. Level 9 (Archive expansion)

**Phase 2: Remaining Critical + High-Impact (Est: 3-4 hours)**
4. Level 10 (Multi-select)
5. Level 14 (Root install)
6. Level 16 (Vault)

**Phase 3: Polish Minimum-Task Levels (Est: 1-2 hours)**
7. Levels 7, 11, 12 (add optional 3rd tasks if flow warrants)

---

## Narrative Consistency Check

### Episode 1: AWAKENING ✓
- Levels 1-3: Basic commands (nav, delete, filter)
- Tone: Cautious, learning
- Tasks generally match "initialization" metaphor
- **Fix needed:** Level 3 expansion

### Episode 2: FORTIFICATION ⚠️
- Levels 4-9: Intermediate commands (copy, cut, fzf, rename, create, archive)
- Tone: Strategic, building
- **Fixes needed:** Levels 6, 9 expansion to match "deployment" metaphor

### Episode 3: MASTERY ⚠️
- Levels 10-17: Advanced + combined operations
- Tone: Ruthless, efficient
- **Fixes needed:** Levels 10, 14, 16 expansion to match "execution" metaphor

---

## Next Steps

1. Update constants.tsx with expanded tasks for 6 critical levels
2. Update level descriptions to match new task narratives
3. Test task check() functions for new sub-steps
4. Update IMPLEMENTATION_STATUS.md with progress
5. Verify theatre.md principles are reflected in all changes

