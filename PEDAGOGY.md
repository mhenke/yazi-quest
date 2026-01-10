# Yazi Quest — Pedagogical Design

This document outlines the learning theories and instructional design principles underpinning Yazi Quest. While `STORY_ARC.md` details the narrative journey, this document focuses on how that journey translates into effective skill acquisition.

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
- **Mid Levels (4-8)**: Guidance becomes strategic (e.g., "Aggregate the uplink files"). The user must recall specific keys (`Space`, `x`, `p`) to achieve the goal.
- **Late Levels (11-15)**: Instructions are objective-based (e.g., "Install the daemon"). The user must synthesize multiple skills (navigation, selection, copying, root access) without explicit key prompting.

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

Yazi Quest uses **Stealth Assessment**. There are no quizzes or multiple-choice questions. Assessment is:

- **Performance-based**: The user must _do_ the task to proceed.
- **Integrated**: Validation logic (`check` functions) runs silently in the background, monitoring state changes (file existence, cursor position, selection state).
- **Authentic**: The criteria for success (e.g., "File exists in `/etc`") matches the real-world outcome of the skill.
