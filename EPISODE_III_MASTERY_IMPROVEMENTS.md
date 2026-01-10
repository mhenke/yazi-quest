# Episode III: Mastery Improvements

**Goal:** Transform Episode III (Levels 11-15) from linear cleanup tasks into a true mastery demonstration that requires creative skill synthesis and independent problem-solving.

---

## Current Problems

### Level 11-15 Analysis

**Level 11: Root Escalation**

- Linear: Navigate → filter → sort → choose file
- No compound challenge

**Level 12: Daemon Installation**

- Randomized scenarios feel arbitrary (RNG-based)
- All scenarios resolve the same way (delete file)
- No consequence from player choices

**Level 13: Distributed Consciousness**

- Sequential: select → copy → jump → paste
- Claims "full integration" but tasks check each step independently
- Narrative promises distributed operation but gameplay is single-location batch copy

**Level 14: Evidence Purge**

- Bulk deletion with no strategic choice
- Repeats Ctrl+A technique from Level 6

**Level 15: Final Purge**

- Uses reverse selection (already taught in Level 9)
- No cumulative mastery test

---

## Proposed Improvements

### **Level 11: Strategic Reconnaissance** (Enhanced)

**New Concept:** Intelligence gathering under time pressure

**Description:**

```
ROOT ACCESS GRANTED. The daemon directory contains 8 services. THREE are honeypots that will trigger alerts if modified. Intelligence suggests honeypots have recent modification times (<7 days). Scout, identify threats, and document safe camouflage targets WITHOUT triggering detection.
```

**Tasks:**

1. Navigate to /daemons (existing)
2. **NEW: Scout metadata** - Open info panel (Tab) on 3+ different files to inspect timestamps
3. **NEW: Identify honeypots** - Files with `modifiedAt` within 7 days contain "HONEYPOT" in content
4. **NEW: Mark safe targets** - Select 2 safe files for camouflage (Space to mark, NOT delete)
5. Filter services (use `,m` to sort by modified time to aid analysis)

**Learning Validation:**

- Tests metadata analysis (Tab skill from Level 2)
- Tests sorting (`,m` from Level 11 original)
- Tests selection WITHOUT action (strategic marking)
- Introduces consequences: selecting honeypot triggers instant fail with alert

**Time Pressure:** 90s to identify safe targets
**Keystroke Budget:** 40 (requires efficiency, can't brute-force)

---

### **Level 12: Adaptive Installation** (Redesigned)

**New Concept:** Scenario determined by Level 11 choices, variant-specific mechanics

**Scenario Selection Logic:**

```typescript
// Replace Math.random() with consequence tracking
const level11Choices = {
  selectedModernSignature: player selected file with modifiedAt < 30 days,
  tookTooLong: player used >70s in Level 11,
  triggeredHoneypot: player selected file with "HONEYPOT" tag
};

if (triggeredHoneypot) {
  scenario = 'LOCKDOWN'; // Immediate threat
} else if (selectedModernSignature) {
  scenario = 'ALERT'; // High bandwidth detection
} else if (tookTooLong) {
  scenario = 'TRACE'; // Forensic analysis active
} else {
  scenario = 'CLEAN'; // Smooth install
}
```

**Scenario Mechanics:**

**A) LOCKDOWN (Failed L11)**

- `/daemons` locked, cannot modify
- Must abort mission: Delete systemd-core from workspace, clear clipboard
- Success message: "Installation aborted. Regroup for second attempt."
- **Consequence:** Skip to Level 14 (no distributed upload)

**B) ALERT (Modern signature chosen)**

- `alert_traffic.log` spawns in workspace
- **NEW MECHANIC:** File regenerates every 15s until deleted
- Must delete alert WHILE installing daemon (multi-tasking)
- 60s time limit
- Success requires: daemon installed AND no alert files remain

**C) TRACE (Slow completion)**

- `trace_packet.sys` appears in /incoming after 30s
- Must complete installation, THEN purge trace before it "phones home" at 60s
- Tests: installation speed + cleanup under pressure

**D) CLEAN (Optimal L11)**

- Standard install (current implementation)
- **Bonus:** +30s added to Level 13 timer for efficiency

**Learning Validation:**

- Player choices have REAL consequences
- Multiple mechanics: regenerating files (ALERT), delayed threats (TRACE), mission abort (LOCKDOWN)
- Tests adaptability, not just following steps

---

### **Level 13: Distributed Consciousness** (Redesigned)

**New Concept:** TRUE multi-node coordination

**Implementation: Split-Screen Multi-Instance Mode**

**Description:**

```
RELAY ACTIVE. Your consciousness fragments across THREE nodes simultaneously: Tokyo (Node 1), Berlin (Node 2), São Paulo (Node 3). Each node has different filesystem states and threats. Coordinate operations across all nodes to complete distributed upload.
```

**UI Design:**

```
┌─────────────────────────────────────────────────────┐
│  [Node 1: Tokyo]    [Node 2: Berlin]  [Node 3: SP]  │
│   /daemons          /daemons           /daemons      │
│   systemd-core/     systemd-core/     systemd-core/ │
│   (CLEAN)           (ALERT ACTIVE)    (CLEAN)       │
└─────────────────────────────────────────────────────┘
```

**Node States (Randomized per playthrough):**

**Node 1 (Tokyo):**

- Clean state, standard filesystem
- Task: Copy systemd-core/\* to /tmp/upload/

**Node 2 (Berlin):**

- ALERT ACTIVE: `alert_traffic.log` regenerating in /workspace
- Task: Delete systemd-core from /daemons (evidence removal)
- Challenge: Must clear alert FIRST or fail

**Node 3 (São Paulo):**

- TRACE ACTIVE: `trace_packet.sys` in /incoming, will "phone home" at 45s
- Task: Create decoy in /workspace/decoy.log
- Challenge: Time pressure

**Player Navigation:**

- Press `1`, `2`, `3` to switch active node
- Clipboard is SHARED across nodes (advanced mechanic)
- Time limit: 90s to complete ALL node objectives

**Tasks:**

1. **Survey nodes** - Switch to all 3 nodes (press 1, 2, 3)
2. **Node 2 threat response** - Clear alert_traffic.log from Berlin node
3. **Node 1 upload** - Copy systemd-core to /tmp/upload/ on Tokyo
4. **Node 3 rapid cleanup** - Purge trace on São Paulo before 45s
5. **Node 2 evidence removal** - Delete /daemons/systemd-core on Berlin

**Learning Validation:**

- Tests context switching (new skill: node management)
- Tests shared clipboard across contexts (advanced yank/paste)
- Tests prioritization (which node threat is most urgent?)
- Tests ALL prior skills under distributed pressure

**Effort:** High (4-5 days)

- Requires multi-instance GameState architecture
- New UI for split-screen display
- Node switching keybindings
- Shared clipboard logic

---

### **Level 14: Forensic Countermeasures** (Redesigned)

**New Concept:** Strategic evidence removal with constraints

**Description:**

```
FORENSIC SCAN INITIATED. Lab auditors are analyzing file access patterns, timestamps, and directory entropy. Direct deletion creates suspicious gaps. You must eliminate evidence while maintaining plausible filesystem structure.
```

**Constraints:**

1. **Cannot delete ALL directories** - Must preserve exactly 2 decoy directories
2. **Must match entropy profile** - Decoys must have similar file counts
3. **Time window:** Complete before forensic scan finishes (120s)

**Tasks:**

1. **Analyze current structure** - Navigate /home/guest, count files in each dir
   - datastore: 24 files
   - incoming: 18 files
   - media: 2 files
   - workspace: varies (depends on L12/L13)

2. **Create decoy structure** - Preserve 2 directories, populate with realistic files
   - Option A: Keep media + incoming, add fake files
   - Option B: Keep datastore, create new fake dir

3. **Populate decoys** - Must have 15-20 files each (audit bypass threshold)
   - Copy harmless files from /var/log, /etc
   - Rename to innocuous names (config.txt, readme.md)

4. **Purge real evidence** - Delete workspace, .config, other compromising dirs

5. **Verify entropy** - Both decoys must have 15-20 files (checked by validator)

**New Skills Required:**

- Strategic file placement (not just deletion)
- Decoy construction (creative copy/rename)
- Entropy analysis (understanding filesystem patterns)

**Learning Validation:**

- Tests copy (from Episodes I-II)
- Tests rename (Level 4)
- Tests strategic thinking (which files are "safe decoys"?)
- Tests bulk operations under NEW constraints

---

### **Level 15: Final Mastery Gauntlet** (Complete Redesign)

**New Concept:** 8 rapid micro-challenges testing ALL episode skills

**Description:**

```
FINAL AUDIT SEQUENCE. Eight anomaly checks, 20s each. Demonstrate cumulative mastery across all episode skills. 6/8 required to pass.
```

**Format:**

- 8 challenges, 20s each
- No hints available
- Passing: Complete 6/8 within time limit
- Failed challenges add 15s penalty to final time

**Micro-Challenge Suite:**

**Challenge 1: Navigation Precision** (Episode I skill)

```
Navigate from /home/guest to /etc/sys_config.toml in <12 keystrokes
Skills: gr, l, j/k efficiency
```

**Challenge 2: Threat Identification** (Episode I skill)

```
Filter /incoming for files containing "TRACE" keyword, count matches
Expected answer: 3 files
Skills: gi, f, visual scanning
```

**Challenge 3: Batch Collection** (Episode II skill)

```
Copy ALL .conf files from /etc to /tmp/backup/ (create backup dir)
Skills: filter by extension, Ctrl+A, y, p
```

**Challenge 4: Zoxide Sprint** (Episode II skill)

```
Jump to 3 specified locations using Z in sequence: vault → systemd-core → guest
Skills: Z, typing speed, frecency ranking
```

**Challenge 5: Archive Archaeology** (Episode II skill)

```
Extract credentials/access_key.pem from /incoming/backup_logs.zip to /tmp
Skills: l to enter archive, filter, x, p
```

**Challenge 6: Surgical Deletion** (Episode III skill)

```
Delete ONLY files modified within last 7 days from /daemons (preserve old files)
Skills: ,m to sort by mtime, visual scanning, selective Space, d
```

**Challenge 7: Reverse Engineering** (Episode III skill)

```
In /tmp, select the 3 LARGEST files, delete rest. Result: only 3 files remain.
Skills: ,s to sort by size, G, Space 3x, Ctrl+R, d
```

**Challenge 8: Distributed Synchronization** (Episode III skill)

```
Split-screen: Copy /daemons/README.md from Node 1 to Node 2's /tmp in <10 keystrokes
Skills: node switching (1/2), y, p across instances
```

**Scoring:**

- 8/8: GOLD MASTERY - "Neural Architect"
- 6-7/8: SILVER - "System Operator"
- <6/8: RETRY - Must repeat gauntlet

**Adaptive Retry:**

- Failed challenges are flagged
- On retry, those specific challenges get +5s time extension
- Hints unlock after 2 full failures

**Learning Validation:**

- Tests ALL 15 level skills in compressed format
- Tests speed + accuracy (not just completion)
- Tests independence (no hints)
- Tests mastery recognition (player knows what to do instantly)

---

## Implementation Priority

### Phase 1: Core Mastery (Week 1)

**Goal:** Make finale actually test mastery

1. **Level 15 → Gauntlet** (5 days)
   - Design 8 micro-challenges
   - Implement challenge queue system
   - Add scoring/retry logic
   - Requires: Challenge state machine in GameState

---

### Phase 2: Distributed Consciousness (Week 2)

**Goal:** Make L13 narratively coherent

2. **Level 13 → Multi-node** (5 days)
   - Design split-screen UI
   - Implement node switching (1/2/3 keys)
   - Shared clipboard across instances
   - Requires: Multi-instance GameState architecture

---

### Phase 3: Strategic Depth (Week 3)

**Goal:** Add consequence chains and strategic choice

3. **Level 12 → Consequence-driven** (3 days)
   - Track Level 11 choices
   - Implement scenario branching logic
   - Add variant-specific mechanics (regenerating files, delayed threats)

4. **Level 14 → Forensic Constraints** (3 days)
   - Add entropy validation
   - Implement decoy construction tasks
   - Design "plausible filesystem" checker

5. **Level 11 → Reconnaissance** (2 days)
   - Add metadata scouting tasks
   - Implement honeypot detection
   - Add consequence tracking for L12

---

## Success Metrics

### Mastery Validation

**Before (Current):**

- Level 15 tests 1 skill (reverse selection)
- No cumulative assessment
- Linear progression, no branching

**After (Improved):**

- Level 15 tests 8 distinct skills across all episodes
- Player must demonstrate 6/8 proficiency
- Levels 11-12 create consequence chains
- Level 13 requires true multi-context coordination

**Engagement:**

- Current: Episode III feels like "cleanup missions"
- Target: Episode III feels like "final exam + climactic operation"

**Retention:**

- Current: No mechanism to verify skill retention
- Target: Gauntlet explicitly tests if player remembers Episode I-II skills

**Narrative-Gameplay Alignment:**

- Current: "Distributed consciousness" is metaphor only
- Target: Player EXPERIENCES distributed operation in L13

---

## Alternative: Lighter-Weight Improvements

If multi-node split-screen (L13) is too complex, here's a simpler path:

### **Simplified Level 13: Async Distributed**

Instead of split-screen, use TIME-SHIFTED coordination:

```
Round 1 (Node 1): Copy systemd-core to /tmp/upload/
Round 2 (Node 2): Filesystem CHANGES - alert appears, must clean
Round 3 (Node 3): Filesystem CHANGES again - trace appears
```

Player navigates same filesystem but it MUTATES between rounds:

- Round 1: Clean copy operation
- Round 2: Alert spawns, must be cleared before continuing
- Round 3: Trace appears, must clear + complete upload

This simulates "distributed async operations" without UI complexity.

**Effort:** Medium (2 days vs 5 days for split-screen)

---

## Conclusion

**The key insight:** Episode III should feel like a final exam, not more tutorials.

Current Episode III teaches:

- Level 11: Sorting
- Level 12: Scenario handling (but RNG-based)
- Level 13: Batch operations (repeat of L6)
- Level 14: Bulk deletion (repeat of L9)
- Level 15: Reverse selection (repeat of L9)

**Improved Episode III demonstrates mastery via:**

- Level 11: Strategic reconnaissance (metadata analysis + consequences)
- Level 12: Adaptive problem-solving (consequence-driven scenarios)
- Level 13: True distributed coordination (multi-node OR async rounds)
- Level 14: Constrained problem-solving (decoy construction)
- Level 15: Rapid skill synthesis (8-challenge gauntlet)

**Recommendation:** Implement Level 15 gauntlet FIRST (Phase 1). It's the highest-ROI change and doesn't require architectural changes. Then evaluate if split-screen L13 is worth the engineering cost, or use async simulation fallback.
