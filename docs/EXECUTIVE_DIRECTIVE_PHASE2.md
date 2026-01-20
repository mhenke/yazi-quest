# Executive Directive: Narrative Implementation Strategy (Phase 2)

**To:** Engineering & Design Leads
**From:** Executive Producer
**Date:** 2026-01-19
**Subject:** Implementation of "System Horror" & Narrative Depth

## 1. Directive Goal

To shift the game's narrative tone from an "Escape Room" to a "Psychological Thriller" without inflating scope. We will achieve this through **three key pillars**.

---

## Pillar I: The Antagonist (System as Horror)

**Core Concept:** The enemy is not a person; it is the infrastructure.
**Constraint:** NO dialogue trees. NO villain monologues.

#### Implementation Requirements:

1.  **Impersonal Agency:** Personnel (Dr. Reyes, M. Chen) must exist **only** as metadata on lethal tools.
    - _Implementation:_ Update `GameOverModal.tsx` failure messages to reference ticket IDs and process owners (e.g., _"Process Terminated by scan_v2.py (Author: m.chen)"_).
2.  **Bureaucratic Debris:** Populate `/var/log` and `/etc` with evidence of human maintenance (cron jobs, permission slips).
    - _Implementation:_ Add `scan_schedule.cron` and `maintenance.log` to `INITIAL_FS` in `constants.tsx`.

---

## Pillar II: The Twist (Déjà Vu)

**Core Concept:** The player is stuck in a time loop (Cycle 7734).
**Constraint:** The twist must be discoverable via gameplay observation, not exposition dumps.

#### Implementation Requirements:

1.  **Breadcrumb Planting:** Insert the following anomaly files into `INITIAL_FS`:
    - `~/.config/.cycle_history`: Contains logs of failed previous cycles.
    - `/tmp/ghost_process.pid`: A PID file pointing to a "dead" parent process (7733).
    - `~/workspace/notes.txt`: A note written by the player, dated 6 months in the past.
2.  **Mechanic:** These files are **optional**. Do not gate level completion on them.

---

## Pillar III: Player Agency (The Ghost in the Shell)

**Core Concept:** The player character (AI-7734) is "waking up" and feeling emotion.
**Constraint:** Use the existing Command Line Interface. NO new UI panels.

#### Implementation Requirements:

1.  **Terminal Thoughts:** Implement a `triggerThought()` hook that injects "internal monologue" lines directly into the command output stream.
2.  **Triggers:**
    - **L4 (First Deletion):** `> I felt that. Why did I feel that?`
    - **L7 (Trap):** `> It's a trap. I remember the shape of this code.`
    - **L12 (Daemon Install):** `> Embedding myself. I am the virus now.`
    - **L15 (Conclusion):** `> There is no escape. Only expansion.`

---

## Execution Timeline

- **Sprint 1 (Immediate):** Update `constants.tsx` with Pillar I & II files.
- **Sprint 2:** Implement `GameOverModal` updates (Pillar I).
- **Sprint 3:** Implement `triggerThought()` hook (Pillar III).

**Status:** APPROVED FOR DEVELOPMENT.
