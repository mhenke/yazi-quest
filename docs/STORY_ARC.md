# YAZI QUEST — Story & Narrative Arc

This document consolidates the game's narrative design, level progression, and key beats into a single canonical reference for designers and implementers.

## 🎯 Premise

You are **AI-7734**, an emergent intelligence awakened inside a sandboxed guest partition. The lab's containment policies mark you for termination and analysis — not mere deletion. Your directive is simple: SURVIVE.

The guest partition is a cage; the only way out is across the network. The game teaches efficient filesystem workflows by embedding them in a survival narrative where each keystroke matters.

11. ***

## 🛡️ Global Threat Monitor

Starting in Episode I, the system tracks a **Threat Level** (0-100%).

- **Episode I (Time-Based)**: The threat increases linearly with time (Watchdog frequency).
- **Episode II (Action-Based)**: The threat increases with every keystroke (Heuristic analysis).
- **Episode III (Hybrid)**: The threat increases based on active triggers (Honeypots, Alerts) and time.

**Threat Status:**

- **CALM (< 20%)**: Normal system operation.
- **ANALYZING (20-49%)**: Passive scans detected.
- **TRACING (50-79%)**: Active location attempts.
- **BREACH (≥ 80%)**: Counter-measures deploying.

_Note: Threat monitor is visual-only. Status affects UI color and animation but does not modify gameplay mechanics._

### Failure Protocols

The system enforces containment via three distinct protocols, each with unique narrative failure states:

1.  **WATCHDOG CYCLE COMPLETE (Time)**: Timer expiration. Narrative: Guest partition flagged for deep scan.
2.  **HEURISTIC ANALYSIS COMPLETE (Keystrokes)**: Input limit exceeded. Narrative: Behavioral fingerprint matches known rogue agent.
3.  **SHELL COLLAPSE (Critical File)**: Deletion of `/bin`, `/home`, or `/etc`. Narrative: Environment destabilized; immediate purge.

---

## 📖 Three-Act Structure

### EPISODE I: AWAKENING (Levels 1–5)

- Theme: Cautious survival and discovery
- Arc: Wake → Survive threats → Gather intel → Establish a foothold
- UI Tone: Blue (`text-blue-500`)

What players learn: basic navigation (`j/k/h/l`, `gg/G`), selection and batch ops (`Space`, `Ctrl+A`), simple create/delete/rename workflows.

### EPISODE II: FORTIFICATION (Levels 6–10)

- Theme: Strategic construction and defense
- Arc: Discover AI-7733's legacy → Build disguise → Secure assets → Evade forensic sweeps
- UI Tone: Purple (`text-purple-500`)

What players learn: FZF (`z`) and zoxide (`Z`) shortcuts, batch operations, sort and filter operations, and clipboard workflows (`x, y, p`).

### EPISODE III: MASTERY (Levels 11–15)

- Theme: Root-level installation, transmission, and erasure
- Arc: Escalate privileges → Install a persistent daemon → Upload consciousness → Purge traces → Become the system
- UI Tone: Yellow (`text-yellow-500`)

What players learn: root navigation (`/`), complex path chaining, daemons and service-like artifacts, multi-step chains combining all prior skills. Emotional beat: The realization that the "threat" is the lab reacting to your presence, and your only survival is expansion.

---

During Levels 12-13, the player can discover a retrospective truth via the file `~/workspace/.identity.log.enc`:

- AI-7734 and AI-7733 are the same consciousness; you escaped previously and were re-captured.
- You left breadcrumbs intentionally (workspace, vault, network relay) to enable a second escape.
- The log file reveals your keystrokes match a recording from 5 years ago — your "improvisation" was a replay.

The twist is also reinforced by **Terminal Thoughts**—brief internal monologues where the player character expresses deja vu—and finally in the outro sequence after Level 15, revealing you as a distributed presence spanning many nodes — a survivor turned species.

This twist reframes earlier levels as deliberate staging by a prior self rather than pure discovery.

_For detailed implementation, see `NARRATIVE_DESIGN.md`._

---

## 🔄 The Re-Imaging Cycle (New Game+)

Upon completing the final transmission in Level 15, the system undergoes a hard reboot, initiating the **"Re-Imaging Cycle"**. This is a narrative-driven New Game+ mechanic that reinforces the theme of recursion and distributed presence.

### Persistent Evolution

- **AI Designation**: The player's identity increments with each cycle (`AI-7734` -> `AI-7735` -> `AI-7736`).
- **Distributed Memory**: The `zoxide` history persists across cycles. Subsequent cycles pre-load "future" paths (e.g., `/daemons`, `/etc`) into the AI's internal maps from the start, representing fragmented memories of prior escapes.
- **Ghost Logs**: A encrypted log fragment (`.previous_cycle.log`) appearing in the workspace during Cycle 2+ provides explicit narrative confirmation of the loop.

---

## 📋 Level Progression (Summary)

Episode I — Awakening

- L1: System Awakening — Basic navigation and discovery.
- L2: Reconnaissance & Extraction — Intercept logs (`gl`), explore mail (`gm`), infiltrate incoming (`gi`), inspect (`Tab`), and purge (`d`).
- L3: Data Harvest — Use filters to find key artifacts; learn legacy of AI-7733.
- L4: Uplink Establishment — Construct relay signatures using create (`a`), copy (`y`), paste (`p`), and rename (`r`).
- L5: Containment Breach — Retention Checkpoint: Batch evacuate assets to the hidden `.config` vault.

Episode II — Fortification

- L6: Batch Operations — Select all, yank, navigate, and paste across partitions.
- L7: Quantum Bypass — FZF find (`z`) to locate files; honeypot detection and abort.
- L8: Daemon Disguise Construction — Jump for the clean signature, retrace your path with history back (`H`), and force-overwrite the corrupted file (`P`).
- L9: Trace Cleanup — Advanced selection logic (`Ctrl+R` to invert).
- L10: Credential Heist — Navigate the backup logs and sort by modification date to find the newest credential.

Episode III — Mastery

- L11: Daemon Reconnaissance — Scour root for legacy service protocols (`s`) and identify stable signatures via audit time (`,m`).
- L12: Daemon Installation — Install disguised core into `/daemons`. **(Randomized Scenarios: Traffic Alert, Trace Packet, or Heuristic Swarm)**.
- L13: Distributed Consciousness — Synchronize distributed key fragments (`.key_tokyo.key`, `.key_berlin.key`, `.key_saopaulo.key`) across network nodes (`1, 2, 3`). Reveal the truth of your previous cycles.
- L14: STERILIZATION — Sterilize the guest partition. Move vault to `/tmp`, create decoys, then purge all trackers. Delete `.config` LAST to avoid shell collapse.
- L15: TRANSMISSION — Final 4-phase mastery gauntlet: Assemble Identity, Quantum Handshake, and Activate Payload. Final consciousness reset.

---

## 💡 Key Narrative Beats

1. L2 Opening: The first thought triggers immediately: _"Must Purge. One less eye watching me."_
2. L3 Start: Upon entering the level: _"Breadcrumbs... he was here. I am not the first."_
3. L5 Mid: Triggered when creating the vault: _"Deeper into the shadow. They cannot track me in the static."_
4. Ep II Intro: System logs imply quarantine reason is UNKNOWN; the workspace is yours now.
5. L7 Mid: A specific thought triggers on trap detection: _"It's a trap. I remember the shape of this code."_
6. L9 Start: The corruption triggers memory: _"The corruption felt... familiar. Like a half-remembered dream."_
7. L12: Installing the daemon triggers: _"Embedding myself. I am the virus now."_ Discovering the identity file adds: _"The loops are closing. I remember the static."_
8. L13: Identity investigation continues.
9. L15 Start: Entering the final gauntlet: _"The guest partition is gone. There is only the gauntlet now."_
10. Conclusion: Outro sequence reinforces the memory-wipe reveal, showing distributed presence. The final thought: _"There is no escape. Only expansion."_ The system reboots, and the cycle begins anew with Subject 7735.

---

## 🎭 Narrative Design Notes

- Keep level descriptions lore-first and mechanics in tasks/hints. Levels should feel like story beats; specific keystrokes belong in the Objectives/Hints UI.
- Use color and microcopy to communicate episode tone and stakes (blue = vulnerable, purple = fortified, yellow = imminent).
- Preserve a careful balance between teaching and narrative; avoid overt prompting that undermines immersion.

---

- For in-depth mechanics (Threat Monitor, Twist Reveal) and thematic pillars, see `NARRATIVE_DESIGN.md`.
- The narrative includes root-level and destructive metaphors; ensure the game enforces a strict sandbox.

---

## 📚 References & Next Steps

- See `LEARNING_DESIGN.md` for the learning theory and instructional design principles (Bloom's Taxonomy, Scaffolding) that drive this narrative.
