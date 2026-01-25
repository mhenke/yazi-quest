# LEARNING_DESIGN — Pedagogical & Curriculum Design

This document details both the _learning theories_ (Cognitive Load, Situated Learning) and the _specific curriculum design_ for Yazi Quest. It serves as the audit trail for the pedagogical sequencing.

## 🧠 Instructional Design Framework

The game utilizes **Situated Learning** theory, placing the learner in an authentic context (a terminal interface) where skills are acquired through usage rather than abstract study. The "hacker" expert persona provides intrinsic motivation and framing for every action.

### Cognitive Load Theory

We strictly manage cognitive load to prevent overwhelming the learner:

- **Segmenting**: The complex Yazi interface is broken down into small, digestible chunks (Episodes and Levels). We do not introduce every keybinding at once.
- **Weeding**: Extraneous information is minimized. The initial file system is sparse, growing in complexity only as the user's ability to navigate it improves.
- **Signaling**: "Environmental Clues" and color-coded UI tones (Blue -> Purple -> Yellow) signal the current mode and stakes, helping the learner orient themselves quickly.

---

## 🏗️ Core Principles

### 1. Scaffolding & Fading

We use a **fading guidance** strategy.

- **Early Levels (1-3)**: Instructions are explicit and prescriptive (e.g., "Press `j` to move down"). The cognitive work is low; the focus is on motor memory.
- **Retention Checkpoints (L5, L10)**: Scaffolding is abruptly removed. Objective-based hints replace step-by-step keys to verify skill retention.
- **Mid Levels (4-8)**: Guidance becomes strategic (e.g., "Aggregate the uplink files"). The user must recall specific keys (`Space`, `x`, `p`) to achieve the goal.
- **Late Levels (11-15)**: Instructions are objective-based (e.g., "Install the daemon"). The user must synthesize multiple skills without explicit prompting.

### 2. Spaced Repetition & Interleaving

Skills are not "one and done." They are revisited with increasing complexity:

- **Navigation (`j/k`)**: Used constantly, becoming automatic.
- **Clipboard (`x/y/p`)**: Introduced in Level 3, reinforced in Level 4, and complicated in Level 8 (overwriting with `Shift+P`).
- **Search (`z/f`)**: Introduced as a shortcut in Level 7, then required for efficiency in later time-sensitive levels.

### 3. Immediate Feedback

The game loop provides tight feedback cycles:

- **Positive**: "Success Message" prompts appear instantly upon task completion, verifying understanding.
- **Negative**: "Threat Alerts" (time limits, keystroke limits) provide immediate consequences for inefficiency, correcting behavior in real-time.
- **Visual**: The file system state (files appearing/disappearing) is the ultimate truth, reinforcing the mental model of the OS.

---

## 📊 Bloom's Taxonomy Mapping

The curriculum moves the learner up Bloom’s Taxonomy:

| Level     | Taxonomy       | Activity                       | Example                                          |
| :-------- | :------------- | :----------------------------- | :----------------------------------------------- |
| **L1-2**  | **Remember**   | Recall keybindings             | "Press `j` to move."                             |
| **L3**    | **Understand** | Interpret filesystem structure | "Find the breadcrumb in `~/datastore`."          |
| **L5**    | **Apply**      | Execute procedures             | "Select files, Cut, and Paste into Vault."       |
| **L7/9**  | **Analyze**    | Distinguish relevant data      | "Invert selection to separate junk from assets." |
| **L12**   | **Evaluate**   | Appraise strategy              | "Choose a camouflage signature based on risk."   |
| **L8/13** | **Create**     | Construct new structures       | "Build the directory hierarchy for the daemon."  |

---

## 📐 Assessment Strategy

Yazi Quest employs a **Hybrid Assessment Model**, combining stealth validation with explicit performance checks.

### 1. Formative Assessment (Stealth)

During standard gameplay (Levels 1-14), assessment is invisible. There are no "quizzes."

- **Integrated**: Validation logic silently monitors state changes (file moves, cursor updates).
- **Authentic**: Success is measured by the actual system state (e.g., "Is the file in `/etc`?"), not by answering a question about how to move it.

### 2. Summative Assessment (Stress Tests)

Key milestones (Level 15) utilize **Performance Gauntlets**.

- **Explicit Constraints**: Time limits and "Stress Test" framing deliberately spike cortisol to test fluency.
- **Mastery Verification**: Unlike stealth checks which allow infinite time, gauntlets verify that skills have become automatic reflexes.

### The Capstone Exception (Level 15)

Level 15 ("Final Mastery Gauntlet") serves as the narrative climax—a "System Audit." To match this high-stakes context, the assessment strategy shifts:

- **Explicit Framing**: Challenges are presented as a scored "exam" (6/8 required to pass).
- **Time Pressure**: Strict time limits force fluency rather than just competence.
- **Cumulative**: It tests the synthesis of all prior skills.
  _Note: The underlying mechanism remains performance-based (doing the tasks), but the stealth layer is removed to create tension._

---

## 🔗 The Cognitive Dependency Chain

Yazi Quest follows a strict dependency chain. We do not introduce a tool until the problem it solves has been felt by the user.

1.  **Movement (L1-2)**: You cannot manipulate files if you cannot reach them.
2.  **Manipulation (L3-6)**: You cannot organize a system if you cannot move items (`x/p`).
3.  **Optimization (L7-10)**: You cannot appreciate speed shortcuts (`z`) until manual navigation feels slow.
4.  **Automation (L11-15)**: You cannot architect complex systems (`/daemons`) until you understand the components.

---

## 📅 Level-by-Level Rationale

### Episode I: The "Mechanical" Phase (Levels 1–5)

_Goal: Build muscle memory for atomic operations._

| Level  | Skill Introduced  | Why here?                                                                                          | Why not earlier?                                        |
| :----- | :---------------- | :------------------------------------------------------------------------------------------------- | :------------------------------------------------------ |
| **L1** | `j/k` (Nav)       | The atom of interaction. Nothing else works without it.                                            | N/A                                                     |
| **L2** | `d` (Delete)      | Immediate gratification; agency. ~Consolidated Tasks (L2.1)~                                       | Needs navigation first.                                 |
| **L3** | `Space` (Select)  | Pre-requisite for batch operations.                                                                | Single-file operations (L2) are simpler to model first. |
| **L4** | `x/p` (Cut/Paste) | The first "transport" mechanic.                                                                    | Requires selection (L3) to be meaningful.               |
| **L5** | Batch Operations  | ~Retention Checkpoint~: Explicit hints removed. Requires `Space` (Select), `x` (Cut), `p` (Paste). | In L1-4, operations were single-file. L5 demands scale. |

### Episode II: The "Efficiency" Phase (Levels 6–10)

_Goal: Bridge the gap between "knowing how" and "being fast"._

> [!NOTE]
> **The Valley of Despair**: Users often struggle here because the cognitive load increases. This is intentional. We force them to feel the pain of manual navigation (L6) before giving them the cure (`z`) in L7.

| Level   | Skill Introduced      | Why here?                                                                     | Why not earlier?                                                         |
| :------ | :-------------------- | :---------------------------------------------------------------------------- | :----------------------------------------------------------------------- |
| **L6**  | Batch `x/p`           | Complex file organization required for the "Workspace".                       | Requires solid grasp of single-item `x/p` (L4).                          |
| **L7**  | `z` (FZF)             | The "aha!" moment. Manual navigation becomes tedious.                         | If taught in L1, users never learn the directory structure mental model. |
| **L8**  | `Shift+P` (Overwrite) | The first "destructive" collision constraint.                                 | Collisions are edge cases; basics must be mastered first.                |
| **L9**  | `Ctrl+R` (Invert)     | Advanced selection logic for "negative space" (select what you _don't_ want). | Requires understanding of basic selection (L3) and batching (L6).        |
| **L10** | `,` (Sort)            | ~Retention Checkpoint~: Explicit hints removed.                               | Sorting is noise until you have enough files to need it.                 |

### Episode III: The "Mastery" Phase (Levels 11–15)

_Goal: Synthesis and complex workflow execution._

| Level   | Skill Introduced         | Why here?                                              | Why not earlier?                                                                   |
| :------ | :----------------------- | :----------------------------------------------------- | :--------------------------------------------------------------------------------- |
| **L11** | `/` (Root)               | Breaking out of the sandbox.                           | Users need to be comfortable in `~` (Home) before exploring `/` (Root).            |
| **L12** | Daemon Config            | System administration metaphor.                        | Requires L8 (overwrite) and L6 (batch moves) to execute.                           |
| **L13** | Node Switching (`1,2,3`) | Distributed systems concept / Context switching.       | Too abstract for early game; requires "mental map" of FS.                          |
| **L14** | Decoy Constraints        | Strategic order of operations (Create before destroy). | Requires mastery of bulk creation/deletion (L2, L4).                               |
| **L15** | Cumulative Mastery       | Final verification cycle with 4 phases.                | The narrative climax; requires total confidence to avoid accidental self-sabotage. |

---

## 🚫 Anti-Patterns (What We Do Not Teach)

We explicitly exclude certain skills to protect the learning curve:

1.  **Mouse Usage**: Yazi supports mouse, but Yazi Quest disables it.
    - _Reason_: Reliance on mouse prevents building keybinding muscle memory.
2.  **Complex Regex**: We use `f` (simple filter) and `z` (fuzzy find) instead of regex.
    - _Reason_: Regex is a separate skill domain (text processing) distinct from file navigation.
3.  **Filter Navigation**: While typing a filter (`f`), users can navigate with `h/j/k/l` — **Correction regarding Yazi Parity**: Real Yazi allows navigation _while_ filtering. Yazi Quest _exits_ filter mode on navigation.
    - _Reason_: We simplify this state management to reduce cognitive load and potential mode confusion for beginners. It is a deliberate deviation.
    - _Implementation Note_: Navigation exits filter mode to prevent confusion.
4.  **Shell Commands**: We limit shell usage (`:`) to specific narrative moments.
    - _Reason_: The goal is to teach _Yazi_, not _Bash_.

---

## 📉 Difficulty Curve Analysis

The difficulty does not climb linearly. It follows a "Sawtooth" pattern:

1.  **Intro (L1)**: Low Friction.
2.  **Ep I Checkpoint (L5)**: High Friction. First removal of explicit keybinding hints.
3.  **Spike (L6)**: High Friction. Batch operations introduction.
4.  **Relief (L7)**: Low Friction. Tool `z` makes life easier.
5.  **Ep II Checkpoint (L10)**: High Friction. Verification of metadata and archive skills without guidance.
6.  **Spike (L12)**: High Friction. Complex multi-step daemon install with randomized consequences.
7.  **Relief (L13)**: Med Friction. Flow state achieved via node switching repetition.
8.  **Final Mastery (L15)**: CRITICAL Friction. Cumulative gauntlet with zero assistance.

This rhythm prevents burnout by alternating between _learning new hard things_, _demonstrating independent mastery_, and _feeling powerful with new tools_.
