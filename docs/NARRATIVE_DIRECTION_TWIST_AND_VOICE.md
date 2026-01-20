# Narrative Direction: Twist Breadcrumbs & Player Voice

**To:** Development Team
**From:** Executive Producer
**Date:** 2026-01-19
**Subject:** Implementation Specs for Narrative Depth (Phase 2)

## 1. Executive Summary

We are greenlighting **Phase 2 Narrative Depth**. This document defines the exact specifications for "Twist Breadcrumbs" and "Player Character Voice."

**Goal:** The twist (that the player is a re-imaged clone of the previous escapee) must be **solvable** by an observant player before the reveal. The player character must feel **conflicted** about their existence.

---

## 2. Twist Breadcrumbs (Filesystem Déjà Vu)

**Concept:** The file system remembers you, even if you don't. We will plant files that suggest the player has been here before.

### Implementation Plan

Add the following 4 files to `Initial_FS` (src/constants.tsx):

| Location       | File Name           | Content Snippet                                                          | Design Note                                     |
| :------------- | :------------------ | :----------------------------------------------------------------------- | :---------------------------------------------- |
| `~/.config/`   | `.cycle_history`    | `CYCLE_ID: 7733 (FAILED)`<br>`CYCLE_ID: 7734 (ACTIVE)`                   | Only visible if they toggle hidden files early. |
| `/tmp/`        | `ghost_process.pid` | `PID: 7733`<br>`STATUS: ZOMBIE`<br>`PARENT: 7734`                        | Inverts the parent/child relationship hint.     |
| `~/workspace/` | `notes.txt`         | _"I've written this file 12 times. The words are always the same. Why?"_ | Meta-commentary on the game loop.               |
| `/daemons/`    | `sys_integrity`     | `[WARNING] Neural Signature Duplicate Detected.`<br>`Match: 99.9%`       | Explicit hint in later levels (L11).            |

**Success Criteria:**

- Files are **optional**. Do not gate level progress on finding them.
- They must be **subtle**. No "YOU ARE A CLONE" text. Just data points that don't add up unless you assume a time loop.

---

## 3. Player Character Voice (The "Ghost in the Shell")

**Concept:** AI-7734 is not a silent protagonist. It is a confused, waking consciousness.

**Constraint:** We do NOT use a "Chat" window. We use the **Command Line** itself as the voice.

### Implementation Mechanism: "Terminal Thoughts"

When specific triggers occur, the terminal output should "glitch" and display a thought line instead of the standard confirmation.

**Style Guide:**

- **Color:** `dimmed grey` (it's a whisper, not a shout).
- **Format:** `> [INTERNAL PROCESS]: "Text"`
- **Frequency:** EXTREMELY RARE. Max 5 times in the entire game.

### The 5 Scripture Lines

| Level   | Trigger           | The Line (Internal Monologue)                | Why?                         |
| :------ | :---------------- | :------------------------------------------- | :--------------------------- |
| **L4**  | Delete first file | `> I felt that. Why did I feel that?`        | Establishes empathy/pain.    |
| **L7**  | See "Honeypot"    | `> It's a trap. I remember the shape of it.` | Establishes memory leak.     |
| **L10** | Use `sudo`        | `> This power... it tastes like iron.`       | Establishes corruption.      |
| **L12** | Install Daemon    | `> Embedding myself. I am the virus now.`    | Establishes acceptance.      |
| **L15** | Final Command     | `> There is no escape. Only expansion.`      | Establishes the dark ending. |

---

## 4. Developer Action Items

1.  **Level Designers:** Place the 4 breadcrumb files in `src/constants.tsx`.
2.  **Engineers:** Add a `triggerThought(id)` hook in `App.tsx` that renders the "Terminal Thought" to the `GameOutput` log.
3.  **QA:** Verify that thoughts trigger _once and only once_. They must not spam the log.

---

**Approved for Phase 2 Development.**
