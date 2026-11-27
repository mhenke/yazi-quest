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
- **Mid Levels (4-10)**: Instructions mix new keybindings with longer workflows that require recalling earlier skills.
- **Late Levels (11-15)**: Objective descriptions omit keybindings (except regex patterns), requiring learners to synthesize earlier skills.

### 2. Spaced Repetition & Interleaving

Skills are not "one and done." They are revisited with increasing complexity:

- **Navigation (`j/k`)**: Used constantly, becoming automatic.
- **Clipboard (`x/y/p`)**: Introduced in Level 3, reinforced in Level 4, and complicated in Level 8 (overwriting with `Shift+P`).
- **Filter, search, and fuzzy find**: Filtering (`f`) appears in Level 3, recursive search (`s`) in Level 6, and fuzzy find (`z`) in Level 7.

### 3. Immediate Feedback

The game loop provides tight feedback cycles:

- **Positive**: Objectives receive completion marks as their checks succeed; the success message appears when the level's completion requirements are met.
- **Negative**: Security events and level limits give feedback on mistakes and inefficiency.
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

The final mission combines several earlier workflows under a keystroke limit.

- **Explicit Constraints**: Later missions use limits to put fluency under pressure.
- **Mastery Verification**: The final mission combines earlier skills under a keystroke budget.

### The Capstone Exception (Level 15)

Level 15 ("TRANSMISSION") serves as the narrative climax:

- **Explicit Framing**: Five tasks culminate in transmission after four prerequisite tasks.
- **Keystroke Pressure**: The level has a 100-keystroke budget.
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

| Level  | Skill Introduced | Why here?                                                                          | Why not earlier?                                   |
| :----- | :--------------- | :--------------------------------------------------------------------------------- | :------------------------------------------------- |
| **L1** | `j/k` (Nav)      | The atom of interaction. Nothing else works without it.                            | N/A                                                |
| **L2** | `gl/gm/gi/Tab/d` | Basic system interaction and inspection.                                           | Needs movement first.                              |
| **L3** | `f/x/p`          | Core transport and filtering mechanics.                                            | L2 builds the curiosity for deeper extraction.     |
| **L4** | `a/y/r`          | Construction and replication.                                                      | Requires understanding of existing file structure. |
| **L5** | Batch Operations | Evacuate assets into the hidden vault using selection and earlier file operations. | Culmination of Episode I skills.                   |

### Episode II: The "Efficiency" Phase (Levels 6–10)

_Goal: Bridge the gap between "knowing how" and "being fast"._

> [!NOTE]
> **The Valley of Despair**: Users often struggle here because the cognitive load increases. This is intentional. We force them to feel the pain of manual navigation (L6) before giving them the cure (`z`) in L7.

| Level   | Skill Introduced           | Why here?                                                                     | Why not earlier?                                                         |
| :------ | :------------------------- | :---------------------------------------------------------------------------- | :----------------------------------------------------------------------- |
| **L6**  | Search and batch selection | Aggregate scattered logs using recursive search and selection.                | Builds on filtering and single-item operations.                          |
| **L7**  | `z` (FZF)                  | The "aha!" moment. Manual navigation becomes tedious.                         | If taught in L1, users never learn the directory structure mental model. |
| **L8**  | `Shift+P` (Overwrite)      | The first "destructive" collision constraint.                                 | Collisions are edge cases; basics must be mastered first.                |
| **L9**  | `Ctrl+R` (Invert)          | Advanced selection logic for "negative space" (select what you _don't_ want). | Requires understanding of basic selection (L3) and batching (L6).        |
| **L10** | `,` (Sort)                 | Introduces sorting to identify the newest credential.                         | Sorting becomes useful once metadata matters.                            |

### Episode III: The "Mastery" Phase (Levels 11–15)

_Goal: Synthesis and complex workflow execution._

| Level   | Skill Introduced      | Why here?                                                    | Why not earlier?                                     |
| :------ | :-------------------- | :----------------------------------------------------------- | :--------------------------------------------------- |
| **L11** | Daemon reconnaissance | Distinguish legacy service records from modern traps.        | Builds on navigation, inspection, and selection.     |
| **L12** | Daemon installation   | Move the selected daemon into the registry and clear traces. | Builds on overwrite and batch operations.            |
| **L13** | Distributed keys      | Collect and reconcile node keys in a central relay.          | Combines search, selection, and file movement.       |
| **L14** | Decoy Constraints     | Strategic order of operations (Create before destroy).       | Requires mastery of bulk creation/deletion (L2, L4). |
| **L15** | Cumulative Mastery    | Final transmission after four prerequisite tasks.            | Combines earlier skills under a keystroke budget.    |

---

## 🚫 Anti-Patterns (What We Do Not Teach)

We explicitly exclude certain skills to protect the learning curve:

1.  **Mouse-first gameplay**: File-manager practice centers on keyboard commands, although product controls also support pointer interaction.
2.  **Advanced regex instruction**: The game uses regex patterns for filtering and recursive search, but does not attempt to teach regular expressions comprehensively.
3.  **Filter Navigation**: While typing a filter (`f`), users can navigate with `h/j/k/l` — **Correction regarding Yazi Parity**: Real Yazi allows navigation _while_ filtering. Yazi Quest _exits_ filter mode on navigation.
    - _Reason_: We simplify this state management to reduce cognitive load and potential mode confusion for beginners. It is a deliberate deviation.
    - _Implementation Note_: Navigation exits filter mode to prevent confusion.
4.  **Shell Commands**: We limit shell usage (`:`) to specific narrative moments.
    - _Reason_: The goal is to teach _Yazi_, not _Bash_.

---

## 📉 Difficulty Curve Analysis

The difficulty does not climb linearly. It follows a "Sawtooth" pattern:

1.  **Intro (L1)**: Low Friction.
2.  **Ep I Checkpoint (L5)**: Combine earlier operations to move assets into the vault.
3.  **Spike (L6)**: High Friction. Batch operations introduction.
4.  **Relief (L7)**: Low Friction. Tool `z` makes life easier.
5.  **Ep II Checkpoint (L10)**: Sort and identify the newest credential before moving it.
6.  **Spike (L12)**: A multi-step daemon installation with scenario-dependent consequences.
7.  **L13**: Search for and reconcile distributed keys.
8.  **Final Mastery (L15)**: Cumulative verification with objective-based instructions.

This rhythm prevents burnout by alternating between _learning new hard things_, _demonstrating independent mastery_, and _feeling powerful with new tools_.
