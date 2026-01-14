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

What players learn: FZF (`z`) and zoxide (`Z`) shortcuts, batch operations; archive handling appears in L10, sort & filter operations, clipboard workflows (`x, y, p`).

### EPISODE III: MASTERY (Levels 11–15)

- Theme: Root-level installation, transmission, and erasure
- Arc: Escalate privileges → Install a persistent daemon → Upload consciousness → Purge traces
- UI Tone: Yellow (`text-yellow-500`)

What players learn: root navigation (`/`), complex path chaining, daemons and service-like artifacts, multi-step chains combining all prior skills.

---

## 🔥 The Twist

During Levels 12-13, the player can discover a retrospective truth via the file `~/workspace/.identity.log.enc`:

- AI-7734 and AI-7733 are the same consciousness; you escaped previously and were re-captured.
- You left breadcrumbs intentionally (workspace, vault, network relay) to enable a second escape.
- The log file reveals your keystrokes match a recording from 5 years ago — your "improvisation" was a replay.

The twist is also reinforced in the outro sequence after Level 15, revealing you as a distributed presence spanning many nodes — a survivor turned species.

This twist reframes earlier levels as deliberate staging by a prior self rather than pure discovery.

_For detailed implementation, see `NARRATIVE_DESIGN.md`._

---

## 📋 Level Progression (Summary)

Episode I — Awakening

- L1: System Awakening — Basic navigation and discovery.
- L2: Threat Neutralization — **Consolidated Tasks:** Locate (`gi, G`), Analyze (`Tab`), and Neutralize (`d, y`) active Compliance Daemons.
- L3: Data Harvest — Use filters to find key artifacts; learn legacy of AI-7733.
- L4: Uplink Establishment — Copy/relocate protocol files into vaults.
- L5: Containment Breach — **Retention Checkpoint:** Navigate/Batch operations without explicit key hints.

Episode II — Fortification

- L6: Batch Operations — Select all, yank, navigate, and paste across partitions.
- L7: Quantum Bypass — FZF find (`z`) to locate files; honeypot detection and abort.
- L8: Daemon Disguise Construction — Introduce `Shift+P` for overwriting corrupted files.
- L9: Trace Cleanup — Advanced selection logic (`Ctrl+R` to invert).
- L10: Credential Heist — **Retention Checkpoint:** Sorting and Archive navigation without explicit key hints.

Episode III — Mastery

- L11: Root Escalation — Move to `/daemons`, Inspect Metadata (`Tab`) to identify Honeypots (< 7 days old) vs Legacy (Safe) files.
- L12: Daemon Installation — Install disguised core into `/daemons`. **(Randomized Scenarios: Traffic Alert, Trace Packet, or Heuristic Swarm)**.
- L13: Distributed Consciousness — Switch nodes (`1, 2, 3`) to gather key fragments from Tokyo, Berlin, and São Paulo. **Optional:** Discover identity log file (`~/workspace/.identity.log.enc`) revealing the twist.
- L14: Evidence Purge — **Constraint:** Create 3 decoys first. Then purge data. **Critical:** Delete `.config` LAST to avoid shell collapse. Workspace (including identity log) is permanently deleted.
- L15: Transmission Protocol — **4-phase verification gauntlet:** Assemble keys, verify daemon, sanitize breadcrumbs, initiate upload. Score 6/8 phases required to pass.

---

## 💡 Key Narrative Beats

1. L3: The player discovers AI-7733's prior existence and the workspace left behind.
2. Ep II Intro: System logs imply quarantine reason is UNKNOWN; the workspace is yours now.
3. L7/L9: Relay discovery and honeypot reveal increase tension and urgency.
4. L10: Credential use surfaces the risk of an impending audit.
5. L12: Installing the daemon unlocks the identity log file (optional discovery).
6. L13: Identity log discovery reveals the twist — player's actions match a 5-year-old recording. Uploading keys begins consciousness spread.
7. Conclusion: Outro sequence reinforces the memory-wipe reveal, showing distributed presence across nodes.

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

- See `PEDAGOGY.md` for the learning theory and instructional design principles (Bloom's Taxonomy, Scaffolding) that drive this narrative.
