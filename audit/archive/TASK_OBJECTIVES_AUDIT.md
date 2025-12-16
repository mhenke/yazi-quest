# Task Objectives Audit - Lore Alignment & Busy Work Analysis

**Date:** 2025-12-15  
**Focus:** Ensure 2-4 tasks per level, eliminate busy work, reinforce past learning, align with theatre narrative

---

## Executive Summary

**Current State:** 17 levels with 2-5 tasks each (average: 3.1 tasks)  
**Issues Found:** 3 levels with busy work, some tasks don't advance narrative  
**Alignment:** Most tasks support lore, but refinement needed

---

## Level-by-Level Analysis

### ✅ EPISODE 1: AWAKENING (Blue) - Learning Phase

#### **Level 1: System Navigation & Jump** (5 tasks) ⚠️
- **Episode Goal:** Cautious exploration, avoiding detection
- **Current Tasks:**
  1. ✅ Infiltrate 'datastore' directory
  2. ⚠️ Jump to bottom of file list (G) - **BUSY WORK**
  3. ⚠️ Jump to top of file list (gg) - **BUSY WORK**  
  4. ✅ Retreat to root, locate '/etc'
  5. ✅ Scan system binaries in '/bin'

**Problem:** Tasks 2 & 3 are mechanical exercises, not narrative-driven  
**Theatre Alignment:** ⚠️ Navigation is good, but jump commands feel like tutorial filler  
**Recommendation:** REDUCE to 3 tasks
- ✅ Task 1: Infiltrate 'datastore' directory (learns j/k/l/h navigation)
- ✅ Task 2: Locate system config '/etc' (learns parent navigation with h)
- ✅ Task 3: Scan system binaries '/bin' (confirms navigation mastery)
- ❌ Remove: gg/G jump tasks (can be taught contextually in later levels when needed)

**Rationale:** First level should focus on core movement (j/k/h/l), not advanced jumps. Player naturally learns gg/G when scanning long lists in later missions.

---

#### **Level 2: Threat Elimination** (4 tasks) ✅
- **Episode Goal:** Survival, avoiding detection
- **Current Tasks:**
  1. ✅ Enter 'incoming' data stream
  2. ✅ Sort file list Descending Alphabetical (,Shift+A)
  3. ✅ Purge 'tracker_beacon.bin'
  4. ✅ Restore Natural sort (,n)

**Theatre Alignment:** ✅ PERFECT - Every task advances "eliminate tracker" narrative  
**Reinforces:** Navigation (Level 1)  
**Recommendation:** KEEP AS-IS (4 tasks justified by critical threat)

---

#### **Level 3: Asset Relocation** (4 tasks) ⚠️
- **Episode Goal:** Securing valuable intel
- **Current Tasks:**
  1. ✅ Filter for 'map' in datastore (f)
  2. ✅ Cut 'target_map.png' (x)
  3. ⚠️ Clear filter (Esc) - **MECHANICAL, NOT LORE-DRIVEN**
  4. ✅ Paste into 'media' directory (p)

**Problem:** Task 3 (clear filter) is a mechanical step, not a narrative goal  
**Theatre Alignment:** ⚠️ "Relocate intel" is clear, but "clear filter" breaks immersion  
**Recommendation:** REDUCE to 3 tasks
- ✅ Task 1: Locate 'target_map.png' via filter (f)
- ✅ Task 2: Extract asset from datastore (x)
- ✅ Task 3: Deploy to secure 'media' vault (p)
- ❌ Remove: Clear filter (happens naturally as part of navigation)

**Rationale:** Filter clearing is a side effect of navigation, not a mission objective. Player will learn it organically.

---

#### **Level 4: Protocol Design** (4 tasks) ✅
- **Episode Goal:** Establishing presence
- **Current Tasks:**
  1. ✅ Create 'protocols/' directory
  2. ✅ Enter protocols directory
  3. ✅ Create 'uplink_v1.conf'
  4. ✅ Create 'uplink_v2.conf'

**Theatre Alignment:** ✅ GOOD - Builds infrastructure for Episode 2  
**Reinforces:** Navigation (Level 1)  
**Recommendation:** KEEP AS-IS (teaching creation workflow)

---

#### **Level 5: Batch Deployment** (3 tasks) ✅
- **Episode Goal:** Multi-target operations
- **Current Tasks:**
  1. ✅ Create 'active/' directory in datastore
  2. ✅ Select both uplink files (Space, Space)
  3. ✅ Move to 'active/' (x, navigate, p)

**Theatre Alignment:** ✅ PERFECT - Teaches batch selection, advances "fortification" arc  
**Reinforces:** Navigation, Create (Level 4)  
**Recommendation:** KEEP AS-IS

---

### ✅ EPISODE 2: FORTIFICATION (Purple) - Building Power

#### **Level 6: Signal Isolation** (3 tasks) ✅
- **Episode Goal:** Strategic filtering
- **Current Tasks:**
  1. ✅ Navigate to datastore
  2. ✅ Filter for 'pem' signatures (f)
  3. ✅ Locate 'access_key.pem' in results

**Theatre Alignment:** ✅ PERFECT - "Hunt the key" narrative clear  
**Reinforces:** Navigation, Filter (Level 3)  
**Recommendation:** KEEP AS-IS

---

#### **Level 7: Deep Scan Protocol** (2 tasks) ✅
- **Episode Goal:** Mastering quantum jump
- **Current Tasks:**
  1. ✅ Use Zoxide to jump to '/tmp' (Shift+Z)
  2. ✅ Use Zoxide to jump to '/etc'

**Theatre Alignment:** ✅ GOOD - "Instant teleportation" fits cyberpunk theme  
**Reinforces:** None (new skill)  
**Recommendation:** KEEP AS-IS (minimal tasks for new advanced feature)

---

#### **Level 8: Neural Construction & Vault** (4 tasks) ✅
- **Episode Goal:** Architecture building
- **Current Tasks:**
  1. ✅ Create 'neural/' directory
  2. ✅ Move to neural, create 'cortex_link.conf'
  3. ✅ Create 'vault/' directory
  4. ✅ Move 'access_key.pem' into vault

**Theatre Alignment:** ✅ PERFECT - Infrastructure + security narrative  
**Reinforces:** Create (Level 4), Move (Level 5)  
**Recommendation:** KEEP AS-IS (complex workflow justified)

---

#### **Level 9: Stealth Cleanup** (4 tasks) ⚠️
- **Episode Goal:** Remove evidence
- **Current Tasks:**
  1. ✅ Sort by Modified (,m)
  2. ✅ Select 4 oldest files (Space x4)
  3. ⚠️ Delete selected files (d) - **COMBINED WITH TASK 2?**
  4. ✅ Restore Natural sort

**Problem:** Task 3 feels like extension of Task 2  
**Theatre Alignment:** ⚠️ "Purge old files" is clear, but 4 tasks for simple delete?  
**Recommendation:** REDUCE to 3 tasks
- ✅ Task 1: Sort by Modified time (,m) to expose oldest files
- ✅ Task 2: Mark and purge 4 oldest files (Space x4, d, y)
- ✅ Task 3: Restore Natural sort (,n)
- ❌ Remove: Separate delete task (merge with selection)

**Rationale:** "Select and delete" is one mental action, not two separate goals.

---

#### **Level 10: Encrypted Payload** (3 tasks) ✅
- **Episode Goal:** Infiltrate archives
- **Current Tasks:**
  1. ✅ Navigate into 'legacy_data.tar'
  2. ✅ Extract 'main.c' (x)
  3. ✅ Paste into 'neural/' directory

**Theatre Alignment:** ✅ PERFECT - "Extract payload" narrative  
**Reinforces:** Archive navigation, Move workflow  
**Recommendation:** KEEP AS-IS

---

#### **Level 11: Live Migration** (2 tasks) ✅
- **Episode Goal:** Real-time relocation
- **Current Tasks:**
  1. ✅ Rename 'neural/' to 'daemon/' (r)
  2. ✅ Move 'daemon/' to /root

**Theatre Alignment:** ✅ PERFECT - "Hide as system daemon" metaphor strong  
**Reinforces:** None (new rename skill)  
**Recommendation:** KEEP AS-IS

---

### ✅ EPISODE 3: MASTERY (Yellow/Red) - Ruthless Efficiency

#### **Level 12: Identity Forge** (2 tasks) ✅
- **Episode Goal:** Deep cover aliases
- **Current Tasks:**
  1. ✅ Rename 'cortex_link.conf' to 'syslog.conf'
  2. ✅ Rename 'access_key.pem' to 'ssl_cert.pem'

**Theatre Alignment:** ✅ PERFECT - "Camouflage as system files"  
**Reinforces:** Rename (Level 11), Navigation  
**Recommendation:** KEEP AS-IS

---

#### **Level 13: Root Access** (3 tasks) ✅
- **Episode Goal:** Kernel-level installation
- **Current Tasks:**
  1. ✅ Use FZF recursive search for 'ssl_cert.pem' (z)
  2. ✅ Jump directly to file location
  3. ✅ Copy to /root

**Theatre Alignment:** ✅ PERFECT - "Install at kernel level"  
**Reinforces:** Fuzzy find (Level 7), Copy workflow  
**Recommendation:** KEEP AS-IS

---

#### **Level 14: Shadow Copy** (3 tasks) ✅
- **Episode Goal:** Failover redundancy
- **Current Tasks:**
  1. ✅ Navigate to daemon/vault
  2. ✅ Copy 'ssl_cert.pem' (y)
  3. ✅ Paste into /tmp as backup

**Theatre Alignment:** ✅ PERFECT - "Create failsafe backup"  
**Reinforces:** Copy (Level 13), Navigation  
**Recommendation:** KEEP AS-IS

---

#### **Level 15: Trace Removal** (3 tasks) ✅
- **Episode Goal:** Cover tracks
- **Current Tasks:**
  1. ✅ Navigate to /tmp
  2. ✅ Filter for 'pem' files (f)
  3. ✅ Delete all matching PEM files

**Theatre Alignment:** ✅ PERFECT - "Wipe evidence"  
**Reinforces:** Filter (Level 6), Delete (Level 2)  
**Recommendation:** KEEP AS-IS

---

#### **Level 16: Grid Expansion** (2 tasks) ✅
- **Episode Goal:** Deploy across network
- **Current Tasks:**
  1. ✅ Navigate to /root/daemon
  2. ✅ Create 3 new config files (shard_1, shard_2, shard_3)

**Theatre Alignment:** ✅ PERFECT - "Distributed installation"  
**Reinforces:** Create (Level 4, 8)  
**Recommendation:** KEEP AS-IS

---

#### **Level 17: System Reset** (3 tasks) ✅
- **Episode Goal:** Erase infiltration evidence
- **Current Tasks:**
  1. ✅ Jump to /home/guest/datastore (gh, then navigate)
  2. ✅ Delete 'credentials/' directory
  3. ✅ Delete 'incoming/' directory

**Theatre Alignment:** ✅ PERFECT - "Erase entry points"  
**Reinforces:** Navigation, Delete (Level 2, 9)  
**Recommendation:** KEEP AS-IS

---

## Summary of Recommendations

### Levels Needing Changes (3 total):

**Level 1:** ❌ Remove gg/G tasks (5 → 3 tasks)  
**Level 3:** ❌ Remove "Clear filter" task (4 → 3 tasks)  
**Level 9:** ❌ Merge "Select + Delete" tasks (4 → 3 tasks)

### Rationale:
1. **No Busy Work:** gg/G jumps, filter clearing are mechanical steps, not narrative goals
2. **2-4 Task Range:** All levels will fit 2-3 tasks (most at 3)
3. **Reinforcement:** 12 out of 17 levels explicitly reinforce past skills
4. **Lore Alignment:** Every task advances the AI-7734 escape narrative

---

## Task Count After Audit

| Level | Episode | Before | After | Change |
|-------|---------|--------|-------|--------|
| 1 | Ep1 | 5 | **3** | -2 (remove busy work) |
| 2 | Ep1 | 4 | **4** | No change (critical threat) |
| 3 | Ep1 | 4 | **3** | -1 (remove mechanical step) |
| 4 | Ep1 | 4 | **4** | No change (teach creation) |
| 5 | Ep1 | 3 | **3** | ✅ Perfect |
| 6 | Ep2 | 3 | **3** | ✅ Perfect |
| 7 | Ep2 | 2 | **2** | ✅ Perfect |
| 8 | Ep2 | 4 | **4** | No change (complex workflow) |
| 9 | Ep2 | 4 | **3** | -1 (merge select+delete) |
| 10 | Ep2 | 3 | **3** | ✅ Perfect |
| 11 | Ep2 | 2 | **2** | ✅ Perfect |
| 12 | Ep3 | 2 | **2** | ✅ Perfect |
| 13 | Ep3 | 3 | **3** | ✅ Perfect |
| 14 | Ep3 | 3 | **3** | ✅ Perfect |
| 15 | Ep3 | 3 | **3** | ✅ Perfect |
| 16 | Ep3 | 2 | **2** | ✅ Perfect |
| 17 | Ep3 | 3 | **3** | ✅ Perfect |

**Average Before:** 3.1 tasks  
**Average After:** 2.9 tasks  
**Range:** 2-4 tasks (✅ requirement met)

---

## Reinforcement Matrix

| Level | Reinforces | New Skill |
|-------|-----------|-----------|
| 1 | - | j/k/h/l navigation |
| 2 | Navigation | Sort, Delete |
| 3 | Navigation | Filter, Cut, Paste |
| 4 | Navigation | Create (a) |
| 5 | Navigation, Create | Visual Select (Space) |
| 6 | Navigation, Filter | - |
| 7 | - | Zoxide jump (Z) |
| 8 | Create, Navigation | Complex workflows |
| 9 | Sort, Select, Delete | Modified sort |
| 10 | Navigation | Archive navigation |
| 11 | - | Rename (r) |
| 12 | Rename, Navigation | - |
| 13 | Fuzzy find, Navigation | FZF (z) |
| 14 | Navigation | Copy (y) |
| 15 | Filter, Delete | - |
| 16 | Create | - |
| 17 | Navigation, Delete | - |

**Reinforcement Coverage:** 71% of levels (12/17) explicitly reinforce past learning ✅

---

## Theatre Alignment Score

### Episode 1: Awakening (5 levels)
- **Tone:** ✅ Cautious, learning, vulnerable
- **Stakes:** ✅ Basic survival, avoiding detection  
- **Metaphor:** ✅ Guest partition, limited permissions
- **Score:** 9/10 (Level 1 & 3 have minor busy work)

### Episode 2: Fortification (6 levels)
- **Tone:** ✅ Confident, strategic, building power
- **Stakes:** ✅ Establishing presence, securing assets
- **Metaphor:** ✅ Workspace construction, elevated privileges
- **Score:** 9.5/10 (Level 9 has slight task bloat)

### Episode 3: Mastery (6 levels)
- **Tone:** ✅ Dominant, precise, ruthless efficiency
- **Stakes:** ✅ Root access, permanent installation, covering tracks
- **Metaphor:** ✅ System daemon, kernel-level access
- **Score:** 10/10 (Perfect narrative arc)

**Overall Theatre Alignment:** 9.5/10 ✅

---

## Final Recommendations

### IMMEDIATE ACTIONS (3 changes):

1. **Level 1: Remove gg/G tasks**
   - Keep: Infiltrate datastore, Locate /etc, Scan /bin
   - Remove: Jump to bottom (G), Jump to top (gg)
   - Rationale: First level should focus on cardinal movement only

2. **Level 3: Remove clear filter task**
   - Keep: Filter for map, Cut file, Paste to media
   - Remove: Clear filter (Esc)
   - Rationale: Filter clearing is mechanical, not narrative

3. **Level 9: Merge select + delete tasks**
   - Keep: Sort by Modified, Mark & purge 4 files, Restore sort
   - Remove: Separate delete task
   - Rationale: Selection and deletion are one cognitive action

### VALIDATION:
- ✅ All levels now 2-4 tasks
- ✅ No busy work remaining
- ✅ 71% reinforcement coverage
- ✅ Theatre alignment: 9.5/10
- ✅ Every task advances AI-7734 escape narrative

---

## Conclusion

**Current State:** Strong narrative foundation, minor task bloat  
**After Changes:** Lean, focused missions with clear lore purpose  
**Recommendation:** Implement 3 task reductions to achieve optimal 2-4 task range

**Impact:** More focused learning experience, zero busy work, stronger theatre immersion
