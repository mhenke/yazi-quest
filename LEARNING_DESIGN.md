# LEARNING_DESIGN — Skill Progression Methodology

This document serves as the audit trail for the _pedagogical sequencing_ in Yazi Quest. It answers the question: **"Why do we teach Skill X at Level Y?"**

While `PEDAGOGY.md` covers the _learning theories_ (Cognitive Load, Situated Learning), this document covers the _specific curriculum design_.

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

| Level  | Skill Introduced  | Why here?                                                  | Why not earlier?                                            |
| :----- | :---------------- | :--------------------------------------------------------- | :---------------------------------------------------------- |
| **L1** | `j/k` (Nav)       | The atom of interaction. Nothing else works without it.    | N/A                                                         |
| **L2** | `d` (Delete)      | Immediate gratification; demonstrates agency on the world. | Needs navigation first to reach the target.                 |
| **L3** | `Space` (Select)  | Pre-requisite for batch operations.                        | Single-file operations (L2) are simpler to model first.     |
| **L4** | `x/p` (Cut/Paste) | The first "transport" mechanic.                            | Requires selection (L3) to be meaningful.                   |
| **L5** | `gg/G` (Jump)     | The file list grows long enough to be annoying.            | In L1-4, lists were short enough that `j/k` was sufficient. |

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
| **L10** | `,` (Sort)            | large datasets require metadata visibility.                                   | Sorting is noise until you have enough files to need it.                 |

### Episode III: The "mastery" Phase (Levels 11–15)

_Goal: Synthesis and complex workflow execution._

| Level   | Skill Introduced      | Why here?                       | Why not earlier?                                                                   |
| :------ | :-------------------- | :------------------------------ | :--------------------------------------------------------------------------------- |
| **L11** | `/` (Root)            | Breaking out of the sandbox.    | Users need to be comfortable in `~` (Home) before exploring `/` (Root).            |
| **L12** | Daemon Config         | System administration metaphor. | Requires L8 (overwrite) and L6 (batch moves) to execute.                           |
| **L13** | Multi-Tab/Node        | Distributed systems concept.    | Too abstract for early game; requires "mental map" of FS.                          |
| **L15** | `rm -rf` (Mass Purge) | Ultimate destructive power.     | The narrative climax; requires total confidence to avoid accidental self-sabotage. |

---

## 🚫 Anti-Patterns (What We Do Not Teach)

We explicitly exclude certain skills to protect the learning curve:

1.  **Mouse Usage**: Yazi supports mouse, but Yazi Quest disables it.
    - _Reason_: Reliance on mouse prevents building keybinding muscle memory.
2.  **Complex Regex**: We use `f` (simple filter) and `z` (fuzzy find) instead of regex.
    - _Reason_: Regex is a separate skill domain (text processing) distinct from file navigation.
3.  **Shell Commands**: We limit shell usage (`:`) to specific narrative moments.
    - _Reason_: The goal is to teach _Yazi_, not _Bash_.

---

## 📉 Difficulty Curve Analysis

The difficulty does not climb linearly. It follows a "Sawtooth" pattern:

1.  **Intro (L1)**: Low Friction.
2.  **Spike (L6)**: High Friction (Batch ops introduction).
3.  **Relief (L7)**: Low Friction (Tool `z` makes life easier).
4.  **Spike (L12)**: High Friction (Complex multi-step daemon install).
5.  **Relief (L13)**: High Friction (Flow state, repeating known patterns fast).

This rhythm prevents burnout by alternating between _learning new hard things_ and _feeling powerful with new tools_.
