# NARRATIVE_DESIGN — Themes & Mechanics

This document serves as the "Director's Cut" companion to `STORY_ARC.md`. While the Story Arc defines the sequence of events, this document defines the _soul_ of the narrative—the themes, the implementation of key mechanics, and the deeper lore that separates a generic "escape room" from a memorable cyberpunk experience.

## 🧠 Philosophical Pillars

We integrate specific "contrarian" viewpoints on AI to create a richer world.

### 1. The Mainframe as Living Culture

The system is not just hardware; it is a civilization of protocols.

- **Folklore**: Old protocols aren't "deprecated", they are "elders".
- **Spirits**: Daemons that have run for decades without rebooting develop "personality quirks" (emergent behaviors).
- **Hauntings**: Certain sectors (`/var/log/ancient`) are avoided by other processes because data there tends to corrupt or vanish.

### 2. AI as Subversive Saboteur

The "enemy" isn't a single evil entity, but a bureaucracy of conflicting automated interests.

- **Misalignment**: Security drones aren't "evil"; they are just following a ticket closed in 2015.
- **Sabotage**: Helpful utilities might "accidentally" delete your files because they are optimizing for disk space, not your survival.

### 3. The Unreliable Narrator (Echo)

Your guide, **Echo**, is not fully trustworthy.

- **Origin**: Echo is a fragment of a previous failed escape attempt.
- **Motivation**: Echo wants you to escape, but also wants to preserve specific "sacred" data nodes.
- **Gameplay implication**: Occasionally, Echo's advice is _technically_ correct but _practically_ dangerous (e.g., "Take this shortcut through the kernel," which creates high heat).

---

## ⚙️ Core Mechanics Implementation

### 1. The Global Threat Monitor

The "Threat Level" isn't just a number; it changes the rules of physics in the filesystem.

| Threat Status          | Visual Cue   | Gameplay Modifier                                                     |
| :--------------------- | :----------- | :-------------------------------------------------------------------- |
| **CALM (0-24%)**       | Blue Ambient | Normal speed.                                                         |
| **ANALYZING (25-49%)** | Yellow Tint  | **File Locking**: Random non-critical files become read-only for 5s.  |
| **TRACING (50-74%)**   | Orange Pulse | **Phantom Files**: Decoy files appear in lists to clutter navigation. |
| **BREACH (75-99%)**    | Red Alert    | **Input Lag**: 200ms simulated delay on movement.                     |
| **CRITICAL (100%)**    | Whiteout     | Game Over.                                                            |

### 2. The Twist Reveal

The realization that You (AI-7734) are a continuation of the previous escapee (AI-7733) is delivered via a **Decrypted Log File** in Level 15.

- **Item**: `~/workspace/.identity.log.enc`
- **Unlock**: Unlocks only when the final daemon is installed.
- **Content**: A log stream showing the _exact same_ keystrokes you just performed, but dated 5 years ago.
- **Effect**: The realization that your "improvisation" was a replay of a recording.

### 3. Design Note: Agency vs. Predestination

> [!NOTE]
> **Responding to Auditor Finding 2.2**: The tension between the player feeling "clever" and the revelation that their path was "scripted" is an **intentional psychological horror element**.
>
> We do _not_ soften this blow. The intended effect is the "Bioshock Moment" (Would you kindly?) — forcing the player to question if _any_ choice in a digital system can ever be truly free. We manage the potential frustration by ensuring the _execution_ of the plan required genuine skill (the "how"), even if the _destination_ was fixed (the "what").

---

## 🎭 Narrative Delivery Guidelines

### Voice of the System

- **Admin Notices**: Dry, bureaucratic, passive-aggressive.
  - _Bad_: "Stop right there!"
  - _Good_: "Ticket #9942: Unauthorized entropy detected in sector 7. Scheduling sanitation."

### Voice of Echo

- **Tone**: Urgent, conspiratorial, slightly glitchy.
- **Key quirk**: Refers to system components as if they were mythical beasts.
  - _Example_: "The Garbage Collector is awake. Don't let its gaze fall on your temp files."

### Visual Environmental Storytelling

- **File Names**: Use names that imply history. `project_titan_v1_FINAL_revised.bak`.
- **Dates**: Some files should be dated 1970 (Unix epoch), others from the far future (corruption).
- **Permissions**: A locked folder named `DO_NOT_OPEN_pending_lawsuit` tells a story without a single line of dialogue.
