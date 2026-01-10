# Yazi Quest: Critical Audit & Priority Action Plan

**Date:** 2026-01-10  
**Auditor:** Critical Analysis (Source-Based)  
**Scope:** Learning design, engagement mechanics, progression systems, and conclusion effectiveness

---

## Executive Summary

Yazi Quest successfully teaches basic yazi keybindings through narrative-driven tasks but suffers from fundamental pedagogical flaws: no retention testing, inconsistent difficulty scaling, and engagement mechanics that punish rather than motivate. The game teaches skills once but never verifies long-term retention. Progression is linear without compound challenges that require synthesizing multiple skills.

**Critical Finding:** `completedTaskIds` tracks completion but never re-tests learned skills. A player can complete Level 2's delete operation, then fail to remember `d` by Level 10 with no intervention.

---

## 1. Learning Design Issues

### 1.1 No Retention Testing (CRITICAL)

**Problem:**  
Tasks use one-time `check()` functions. Once `completedTaskIds[levelId]` includes a task, it's never re-evaluated. Players can forget skills with no feedback.

**Evidence:**

```typescript
// App.tsx:342
if (!task.completed && task.check(gameState, currentLevel)) {
  newlyCompleted.push(task.id);
  // Task never checked again
}
```

**Impact:** Players may complete all 15 levels by following step-by-step hints without retaining any knowledge.

**Resolution:**

- **Add skill checkpoints** every 5 levels that require demonstrating prior skills WITHOUT hints
- **Implement micro-assessments**: Before advancing episodes, require completing 3 random tasks from previous episode with hints disabled
- **Track skill decay**: If a player takes >3 attempts on a task requiring Skill X, flag it and insert a quick refresher

**Priority:** P0 (Blocks learning effectiveness)

**Effort:** Medium (2-3 days)

- Add `skillCheckpoint` level type to `types.ts`
- Create `assessPriorSkills(episodeId)` function that randomly selects 3 tasks from completed levels
- Modify `advanceLevel()` to trigger assessment at episode boundaries

---

### 1.2 Inconsistent Task Granularity (HIGH)

**Problem:**  
Level 2 has 5 tasks for one delete operation. Level 13 has 5 tasks for copying ALL files across three directories. Arbitrary task-to-action ratios confuse learning objectives.

**Evidence:**

```typescript
// Level 2: 5 tasks = 1 conceptual action (delete file)
// del-1: Jump to incoming
// del-2: Jump to bottom
// verify-meta: Open info panel
// verify-content: Scroll preview
// del-3: Delete file

// Level 13: 5 tasks = 12+ actions (batch select, copy, navigate, create, paste)
```

**Resolution:**

- **Standardize task design**: 1 task = 1 conceptual skill unit
  - "Navigate and delete threat" (single task checking final state)
  - Break only when teaching distinct sub-skills
- **Add task metadata**: `taskType: 'atomic' | 'compound' | 'verification'`
- **Rebalance Levels 2, 7, 8, 12**: Collapse verification steps into single outcome-based tasks

**Priority:** P1 (Affects learning clarity)

**Effort:** Medium (2 days)

- Audit all 15 levels, map tasks to conceptual skills
- Merge verification tasks into outcome checks
- Update level hints to match new task structure

---

### 1.3 Hidden Tasks Are Opaque (HIGH)

**Problem:**  
Level 7's `abort-operation` task is hidden until `zoxide-etc` completes. ThreatAlert appears but doesn't explain WHY clearing clipboard matters. Players see "HONEYPOT DETECTED" after already cutting the file.

**Evidence:**

```typescript
// constants.tsx:2309
{
  id: 'abort-operation',
  description: 'Clear clipboard to abort operation (Y)',
  hidden: (c, _s) => !c.completedTaskIds[_s.id]?.includes('zoxide-etc'),
  // Player sees task AFTER reaching danger zone
}
```

**Resolution:**

- **Reveal intent before action**: Show foreshadowing task: "Scout /etc for traps" that reveals honeypot BEFORE cutting file
- **Progressive disclosure**:
  1. Preliminary task: "Scan /etc metadata (Tab on suspicious files)"
  2. Then reveal: "Honeypot detected in access_token.key — abort staged operations"
- **Add environmental telegraphing**: Files with `HONEYPOT` comment visible in preview pane BEFORE player stages them

**Priority:** P1 (Violates "information before action")

**Effort:** Low (1 day)

- Add `scout-etc` task before `stage-token`
- Modify file content to include `# HONEYPOT - TRIGGERS ALERT` in preview
- Update hint to mention scouting

---

### 1.4 No Scaffolding Removal (MEDIUM)

**Problem:**  
Hints remain equally detailed from Level 1 to Level 15. Game never tests if players can solve problems independently.

**Evidence:**

```typescript
// Level 1 hint: "j/k to move, l/h to enter/exit..."
// Level 15 hint: "Navigate to '/tmp'. Select 'upload'..."
// Both equally prescriptive
```

**Resolution:**

- **Implement hint tiers**:
  - Tier 0 (Episodes 1-2): Full step-by-step
  - Tier 1 (Episode 3): Goal-oriented ("Preserve upload/, delete rest")
  - Tier 2 (Checkpoints): Objective only ("Eliminate evidence")
- **Add hint cost**: Pressing Alt+H reduces "Mastery Score" visible in StatusBar
- **Progressive unlocking**: Level 11+ hints start locked, unlock after 2min or 3 failed attempts

**Priority:** P2 (Impacts skill independence)

**Effort:** Medium (2 days)

- Add `hintTier` property to Level type
- Refactor HintModal to show degraded hints based on tier
- Add mastery score tracking to GameState

---

## 2. Engagement Issues

### 2.1 Engagement Cliff After Episode I (CRITICAL)

**Problem:**  
Early levels (1-5) create urgency with time pressure and specific threats. Mid-game (6-10) descriptions become generic task lists. Tension dissipates.

**Evidence:**

```typescript
// Level 2: "Every millisecond it runs, the lab narrows its search"
// Level 9: "The ghost process left a mess" (passive, low stakes)
```

**Resolution:**

- **Implement escalating threat model**:
  - Episode I: Detection risk (timer-based)
  - Episode II: Resource exhaustion (keystroke budget tightens)
  - Episode III: Active countermeasures (honeypots spawn after delays)
- **Add dynamic notifications**:
  - "SCANNER PROXIMITY: 45m away" (updates every 10s)
  - "AUDIT LOG GROWING: 847KB → 1.2MB" (shows consequence of slow play)
- **Environmental storytelling**: Status bar shows "LAB_STATUS: ALERT_LEVEL_3" during Episode III

**Priority:** P0 (Retention drops without engagement)

**Effort:** High (4-5 days)

- Create threat tracking system in GameState
- Add `threatLevel` calculation based on time/keystrokes
- Design environmental UI indicators (StatusBar modifications)
- Write escalating flavor text for each episode

---

### 2.2 Time Limits Are Punitive (HIGH)

**Problem:**  
Failing time limit shows "CONNECTION LOST" and restarts level from scratch. No partial credit, no adaptive difficulty. Level 6's `efficiencyTip` suggests using zoxide (taught in Level 7).

**Evidence:**

```typescript
// GameOverModal.tsx:55
efficiencyTip ||
  (reason === 'time'
    ? 'The system traced your connection. Optimize your path and use batch operations.'
    : 'Your input noise levels triggered the IDS...');
```

**Resolution:**

- **Add checkpoint system**:
  - Auto-save at 50% task completion
  - Restart from checkpoint (not full reset) with +30s penalty
- **Dynamic time scaling**:
  - First failure: +20% time
  - Second failure: Show detailed walkthrough, remove timer
- **Proactive coaching**: At 30s remaining, show toast: "TIP: Use 'Z' to jump directly to config"

**Priority:** P1 (Frustration causes abandonment)

**Effort:** Medium (3 days)

- Add `checkpointState` to GameState
- Modify `handleRestartLevel()` to restore from checkpoint
- Implement time extension logic in game over flow

---

### 2.3 No Persistent Progression Rewards (MEDIUM)

**Problem:**  
Quest Map shows binary completion (checkmark/no checkmark). No mastery grades, no skill tree unlocks, no replay value.

**Evidence:**

```typescript
// LevelProgress.tsx:212
const isCompleted = globalIdx < currentLevelIndex;
// Only tracks done vs not-done
```

**Resolution:**

- **Add mastery grades**:
  - Bronze: Completed (any time/keystrokes)
  - Silver: Within efficiency threshold
  - Gold: No hints used, first attempt
- **Skill tree visualization**: Quest Map shows unlocked advanced techniques
  - "Archive Operations" unlocks after Level 10 gold
  - "Rapid Deployment" unlocks with <50% of keystroke budget
- **Replay mode**: Jump to any level, attempt mastery grade, compare to previous best

**Priority:** P2 (Enhances replayability)

**Effort:** Medium (3 days)

- Add `masteryGrade` to completedTaskIds structure
- Design grade calculation logic (time/keystrokes/hints)
- Update Quest Map UI to show medals
- Add replay mode without affecting main progression

---

### 2.4 Level 12 Randomization Is Shallow (LOW)

**Problem:**  
Five scenario variants (clean/alert/trace/swarm/bitrot) randomized via `Math.random()`. Player has no agency, variants don't meaningfully branch.

**Evidence:**

```typescript
// constants.tsx:2749
const rand = FORCE_SCENARIO ? 0 : Math.random();
// Spawns different files but same resolution method (delete)
```

**Resolution:**

- **Replace RNG with consequence-driven branching**:
  - Player's Episode II choices determine Level 12 scenario
  - Used modern signature (Level 11)? → Trigger alert scenario
  - Took >90s in Level 9? → Trigger swarm scenario
- **Add variant-specific mechanics**:
  - Alert: Must delete within 30s or auto-fail
  - Swarm: Files regenerate every 10s until root cause deleted
- **Telegraph consequences**: Level 11 description warns "Modern signatures attract attention"

**Priority:** P3 (Nice-to-have narrative depth)

**Effort:** Low (1-2 days)

- Track player choices in GameState
- Replace RNG with deterministic scenario selection
- Add variant-specific timer/respawn logic

---

## 3. Progression & Level Building Issues

### 3.1 Dependencies Aren't Enforced (CRITICAL)

**Problem:**  
`buildsOn` and `leadsTo` arrays are metadata only. Jumping to Level 8 via `?lvl=8` applies prerequisite filesystem state but never verifies player learned Skills 4, 5, 7.

**Evidence:**

```typescript
// types.ts:48-49
buildsOn?: number[]; // Level IDs this level assumes knowledge from
leadsTo?: number[]; // Level IDs that build on this level's skill
// No runtime enforcement
```

**Resolution:**

- **Add prerequisite validation**:
  - Before starting level with `buildsOn`, require completing at least 2/3 of those levels
  - Debug mode (`?lvl=X`) shows warning: "Skipping prerequisites. May encounter unfamiliar skills."
- **Skill-based unlocking**:
  - Parse `buildsOn` to extract required skills (navigation, batch ops, etc.)
  - Lock levels until skills demonstrated in prior episode checkpoint
- **Alternative progression paths**:
  - After Episode I, branch: "Stealth Path" (focus filtering/hiding) vs "Speed Path" (focus batch/zoxide)
  - Episode III converges paths requiring both skill sets

**Priority:** P0 (Undermines learning architecture)

**Effort:** Medium (2-3 days)

- Create `validatePrerequisites(levelId)` function
- Add skill taxonomy to Level type
- Implement prerequisite check in `advanceLevel()`
- Design branching Episode II structure

---

### 3.2 No Compound Challenges (HIGH)

**Problem:**  
Level 13 claims "Full Integration" but tasks are sequential: select all → copy → jump → paste. No task requires NON-LINEAR synthesis.

**Evidence:**

```typescript
// constants.tsx:2995-3047
// Tasks check each step independently
// No task checks: "Did player use BOTH fzf AND batch select in creative combo?"
```

**Resolution:**

- **Design synthesis challenges**:
  - **Level 13 replacement**: "Fragmented intel scattered across 3 directories (datastore, incoming, tmp). Use filter to find '.fragment' files, batch select matches across directories, consolidate in vault."
  - Forces: filter knowledge (L3) + batch ops (L6) + navigation (L1) + zoxide (L7)
- **Open-ended objectives**:
  - "Eliminate all traces in <30 keystrokes using any method"
  - Accept multiple solution paths (batch select vs filter+invert vs manual)
- **Meta-skill tasks**: "Optimize: Redo Level 6 challenge in <50% original keystrokes"

**Priority:** P1 (Required for mastery demonstration)

**Effort:** High (3-4 days per level)

- Redesign Levels 11-15 as compound challenges
- Implement multi-path solution detection
- Write validation logic accepting creative approaches
- Test multiple valid solutions

---

### 3.3 Hint Quality Degrades (MEDIUM)

**Problem:**  
Early hints encourage discovery ("Look for comments"). Late hints are prescriptive ("Navigate to '/home/guest'. Delete ALL visible directories (use Ctrl+A...)").

**Evidence:**

```typescript
// Level 3: "Preview 'abandoned_script.py'...Look for comments."
// Level 14: "Navigate to '/home/guest'. Delete ALL visible directories (use Ctrl+A to select all, then d)."
```

**Resolution:**

- **Standardize hint philosophy**:
  - Tier 1 (default): Goal + environmental clue, no keystrokes
    - "Clear evidence from guest partition. Check hidden files."
  - Tier 2 (after 2min): Add approach hint
    - "Batch select visible, delete, then show hidden."
  - Tier 3 (after 5min): Full walkthrough (current hint)
- **Socratic hints**: Ask guiding questions
  - "What locations have you visited? Where might traces remain?"

**Priority:** P2 (Affects skill independence)

**Effort:** Low (1 day)

- Rewrite Level 10-15 hints as goal-oriented
- Implement multi-tier hint system in HintModal
- Add hint tier progression based on time spent

---

## 4. Conclusion Issues

### 4.1 Passive Conclusion (HIGH)

**Problem:**  
Memory wipe twist is exposition-only. Player reads "1,247 nodes across 43 countries" but never EXPERIENCED distributed operation.

**Evidence:**

```typescript
// OutroSequence.tsx:674
// lore: ["AI-7734 Status: 1,247 nodes across 43 countries"]
// Player reads this, doesn't DO this
```

**Resolution:**

- **Active finale (Level 16 replacement)**:
  - "DISTRIBUTED PURGE": Manage 3 simultaneous filesystem instances (Tokyo, Berlin, São Paulo nodes)
  - Split screen showing 3 terminals
  - Must coordinate: delete evidence on Node 1 while copying intel on Node 2
  - Nodes have different filesystem states (some have alerts, some don't)
  - 60s time limit, requires perfect batch ops + rapid context switching
- **Twist integrated into gameplay**: After completing Level 16, reveal "You've done this before" — replay level with knowledge of traps

**Priority:** P1 (Climax should be interactive)

**Effort:** High (5-6 days)

- Design multi-terminal UI (3-pane split)
- Implement synchronized filesystem instances
- Create node-specific challenges
- Write finale narrative integration

---

### 4.2 No Final Mastery Exam (CRITICAL)

**Problem:**  
Level 15 uses reverse selection (taught in Level 9). No comprehensive test of ALL 15 skills.

**Evidence:**

```typescript
// constants.tsx:3122
// coreSkill: 'Reverse Selection' (repeat of Level 9)
// Only tests 1 skill, not cumulative mastery
```

**Resolution:**

- **Level 15 → Mastery Gauntlet**:
  - 10 micro-challenges, 15s each, covering all episode skills
  - Challenge 1: Navigate to /etc, filter for .conf files, count matches (Ep I skills)
  - Challenge 5: Batch copy from 3 locations to vault using zoxide (Ep II skills)
  - Challenge 10: Multi-step purge requiring creative synthesis (Ep III skills)
  - Minimal hints: objective only, no keystrokes suggested
  - Passing: 7/10 challenges correct
- **Adaptive difficulty**: Failed challenges repeat with extended time

**Priority:** P0 (Essential for learning validation)

**Effort:** High (4-5 days)

- Design 10 micro-challenge specifications
- Implement challenge queue system
- Create challenge-specific validation logic
- Add score tracking UI

---

## 5. Documentation Gaps

### 5.1 No Pedagogical Design Doc (MEDIUM)

**Problem:**  
STORY_ARC.md documents narrative. CLAUDE.md documents code architecture. Nothing documents LEARNING architecture.

**Resolution:**

- **Create LEARNING_DESIGN.md**:
  - Skill taxonomy (15 core yazi operations)
  - Learning objectives per level
  - Cognitive load analysis (why 5 tasks/level average)
  - Spacing strategy (when skills repeated)
  - Assessment criteria (how to validate retention)
- **Add inline docs**: Each level's `coreSkill` should link to skill definition

**Priority:** P2 (Critical for maintainability)

**Effort:** Low (1 day documentation)

---

### 5.2 Contradictions Between Docs (LOW)

**Problem:**

- STORY_ARC: "L12 is permanent persistence moment"
- Implementation: L12 is paste operation with RNG scenarios
- Docs promise narrative climax, code delivers mechanical action

**Resolution:**

- **Audit all markdown docs** against implementation
- Update STORY_ARC.md to reflect actual gameplay beats
- Add "Implementation Status" sections to narrative docs

**Priority:** P3 (Maintenance debt)

**Effort:** Low (2 hours)

---

## Priority Implementation Order

### Phase 1: Core Learning (Weeks 1-2)

**Goal:** Fix fundamental learning ineffectiveness

1. **P0: Add retention testing** (1.1) - 3 days
2. **P0: Enforce dependencies** (3.1) - 3 days
3. **P0: Create final mastery exam** (4.2) - 5 days

**Deliverable:** Players cannot complete game without demonstrating retained knowledge.

---

### Phase 2: Engagement Recovery (Weeks 3-4)

**Goal:** Prevent mid-game abandonment

4. **P0: Implement escalating threats** (2.1) - 5 days
5. **P1: Fix punitive time limits** (2.2) - 3 days
6. **P1: Redesign hidden tasks** (1.3) - 1 day

**Deliverable:** Sustained tension through all 15 levels.

---

### Phase 3: Skill Mastery (Weeks 5-6)

**Goal:** Enable independent problem-solving

7. **P1: Standardize task granularity** (1.2) - 2 days
8. **P1: Add compound challenges** (3.2) - 8 days (2 days/level for 4 levels)
9. **P1: Design active finale** (4.1) - 6 days

**Deliverable:** Players synthesize skills creatively without prescriptive hints.

---

### Phase 4: Polish (Week 7)

**Goal:** Enhance replayability

10. **P2: Remove scaffolding** (1.4) - 2 days
11. **P2: Add mastery grades** (2.3) - 3 days
12. **P2: Write learning design doc** (5.1) - 1 day

**Deliverable:** High replay value, clear pedagogical foundation.

---

## Success Metrics

### Before/After Tracking

**Retention (Target: 80% skill recall after 7 days)**

- Metric: Players complete checkpoint assessments without hints
- Current: Unknown (not measured)
- Target: 80% pass rate on Episode checkpoint micro-assessments

**Engagement (Target: <15% abandonment before Episode III)**

- Metric: % players who start Episode III after completing Episode II
- Current: Unknown
- Target: 85% continuation rate

**Mastery (Target: 60% gold ratings on Episode I levels)**

- Metric: Players achieve gold mastery on replay
- Current: No mastery system
- Target: 60% gold rate on at least 3 Episode I levels

**Independence (Target: 70% complete Level 11+ without hints)**

- Metric: Hint usage drops in later levels
- Current: Unknown
- Target: Avg 0-1 hint uses for Levels 11-15

---

## Conclusion

Yazi Quest's narrative is strong, but the learning design is shallow. The game teaches keybindings but doesn't ensure retention, doesn't scaffold toward independence, and doesn't test compound skill synthesis. The priority fixes target the critical path: retention testing → engagement maintenance → mastery demonstration.

**Recommendation:** Implement Phase 1 immediately. Without retention validation and prerequisite enforcement, the game is a glorified tutorial, not a learning system.

**Expected Outcome:** After Phase 3 implementation, players will:

1. Retain yazi skills 7 days post-completion (measurable via checkpoint assessments)
2. Complete compound challenges requiring creative synthesis
3. Achieve mastery grades demonstrating efficiency improvements
4. Transfer skills to real terminal usage (validate via user studies)

\*\*

## 6. Resolution Status (2026-01-10 Update)

The following high-priority items have been addressed in the recent "Episode III Mastery" refactor:

- **[RESOLVED] 1.3 Hidden Tasks**: Level 7 `abort-operation` has been refactored with better foreshadowing and environmental clues.
- **[RESOLVED] 2.1 Engagement Cliff**: A Global Threat Monitor has been implemented, tracking threat levels across all episodes (Time-Based -> Action-Based -> Hybrid).
- **[RESOLVED] 2.4 Randomization**: Level 12 now uses deterministic scenarios (Traffic Alert, Trace, Swarm) based on player choices in Level 11 (Legacy vs Modern).
- **[RESOLVED] 3.2 Compound Challenges**: Level 13 now features "Async Distributed" node switching (Keys 1, 2, 3), requiring synthesis of navigation and key management.
- **[RESOLVED] 4.1 Passive Conclusion**: The finale has been overhauled with active "Decoy Creation" constraints (Level 14) and a "Final Purge" gauntlet (Level 15).
