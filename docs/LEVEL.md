# Level Audit: Lore, Storytelling, and Keybindings

This document audits the current levels for narrative consistency, clear objectives (what/why), and the "Initial + 2 Reinforcements + Drop" keybinding rule.

## Legend

- **Reinforcement Rule**: `[INTRO]` (Level where key is introduced), `[R1/R2]` (Reinforcements), `[DROP]` (Dropped from hints/tasks).
- **Objectives**: Focus on "What" and "Why", specifying directories/files.

## Mission Log data mapping

[MissionDrawer.tsx](../src/components/MissionDrawer.tsx) renders the following fields from the active level in [levels.ts](../src/constants/levels.ts):

- **Level title** → `Level.title`. The app derives a different title for Level 1 in later cycles.
- **Target** → `Level.description`, the mission brief. It explains the goal and stakes; it is not `Level.environmentalClue` (Intel).
- **Objectives** → one row per visible `Level.tasks[]` entry. `task.description` supplies the text and can depend on game state; `task.hidden` controls whether the row is shown. A row's completion is recorded by task ID when `task.check` succeeds.

When auditing a level, map each objective to the file, directory, or game state its check actually uses. Record exact fixture names here when useful for maintainers; the in-game Target can describe a category without revealing which files match it.

---

## Episode I: Awakening

### Level 1: SYSTEM AWAKENING

- **Keybindings**: `j, k, h, l, gg, G` `[INTRO]`
- **Objectives**: Calibrate movement and locate primary designation.
- **Lore**: Initial awakening in /home/guest. Detection of the Watchdog.

### Level 2: RECONNAISSANCE & EXTRACTION

- **Keybindings**: `gl, gm, gi, Tab, d` `[INTRO]`
- **Objectives**: Intercept logs, explore mail, and neutralize watcher agents.
- **Lore**: The Watchdog is tracking you. You must secure evidence of its behavior.
- **Tasks**:
  - "Intercept `/var/log/watchdog.log` (gl)."
  - "Explore the `/var/mail` sector (gm) for briefings."
  - "Infiltrate the `~/incoming` partition (gi)."
  - "Isolate `watcher_agent.sys` (Tab)."
  - "Execute purge routine (d)."

### Level 3: DATA HARVEST (Cumulative Test)

- **Keybindings**: `f, x, p` `[INTRO]`
- **Objectives**: Scour fragments for breadcrumbs. Move assets to media.
- **Tasks**:
  - "Scour `abandoned_script.py` for breadcrumbs."
  - "Identify `sector_map.png` (f)."
  - "Acquire map signature (x)."
  - "Secure the asset in `~/media` (p)."

### Level 4: UPLINK ESTABLISHMENT

- **Keybindings**: `a, y, r, p` `[INTRO]`
- **Objectives**: Construct the first uplink signature, duplicate it, and rename the copy while preserving the original.

### Level 5: CONTAINMENT BREACH

- **Keybindings**:
  - `a, y, r` `[R1]`
  - `Space, .` `[INTRO]`
- **Objectives**: Evacuate sensitive data to the hidden .config vault before the heuristic scan locks down the datastore.

---

## Episode II: Fortification

### Level 6: BATCH OPERATIONS

- **Keybindings**:
  - `a, y, r` `[R2]` -> **DROP MENTIONS**
  - `Space, .` `[R1]`
  - `s, Ctrl+A, gc` `[INTRO]`
- **Objectives**: Infiltration phase. Logs are scattered across subdirectories. Aggregate your training data in the secure vault.
- **Regex Clause**: Search for `\.log$` in `~/incoming/batch_logs/`, yank the results, then press `Esc` to clear the search.

### Level 7: QUANTUM BYPASS

- **Keybindings**:
  - `Space, .` `[R2]` -> **DROP MENTIONS**
  - `s, Ctrl+A, gc` `[R1]`
  - `z, Z, gr, Y` `[INTRO]`
- **Objectives**: Find and stage the rogue access token. Extraction reveals a honeypot and replaces the vault-delivery objective with immediate clipboard abort (`Y`); no vault visit is required.
- **FZF Steps**: Press `z`, type `access_token` to narrow the results, then press `Enter` to select `access_token.key`.
- **Transition**: Level starts resolve directory names to their current IDs, preserving player-created vault folders and their contents.

### Level 8: DAEMON DISGUISE CONSTRUCTION

- **Keybindings**:
  - `s, Ctrl+A, gc` `[R2]` -> **DROP MENTIONS**
  - `z, Z, gr, Y` `[R1]`
  - `H, P` `[INTRO]`
- **Objectives**: Jump to the clean signature in `~/.config/vault/active`, then retrace your path with history back (`H`) and force-overwrite the corrupted config (`P`).
- **Regex Clause**: Provide string `uplink` for filtering.

### Level 9: TRACE CLEANUP

- **Keybindings**:
  - `z, Z, gr, Y` `[R2]` -> **DROP MENTIONS**
  - `P` `[R1]`
  - `f, Esc, Ctrl+A, Esc, Ctrl+R, D, Y, gt` `[INTRO]`
- **Target**: “Purge the evidence. Preserve only the critical anchors: credentials (.key), process records (.pid), and sockets (.sock). Decoys are everywhere.”
- **Objectives**:
  1. Filter `/tmp` with `\.(key|pid|sock)$`. Press `Esc` to close the prompt, `Ctrl+a` to select matches, then `Esc` again to clear the filter while keeping the selection. Completion checks that all four anchors are selected and the `/tmp` filter is clear.
  2. Invert with `Ctrl+r` to select every other `/tmp` entry. The objective records use of the command; it does not verify which entries are selected.
  3. Open permanent deletion with `Shift+D` and confirm with `Y`. The check requires permanent deletion to have been used and only the four anchors to remain in `/tmp`; that excludes `emergency_protocol.txt`, `/tmp/upload`, and the other nonmatches.
- **Data mapping**: `.key` → `access_token.key` (credential); `.pid` → `ghost_process.pid` and `system_monitor.pid` (process records); `.sock` → `socket_001.sock` (socket). Decoys such as `mysockfile.txt`, `passwordkey_backup.log`, `pid_monitor_service.conf`, and `socket_pid_key_info.doc` contain those terms but do not end in the keeper extensions.
- **Regex Clause**: The `\.(key|pid|sock)$` pattern matches those extensions at the end of a filename, separating critical anchors from decoys that merely contain the terms.

### Level 10: CREDENTIAL HEIST

- **Keybindings**:
  - `P` `[R2]` -> **DROP MENTIONS**
  - `Ctrl+R, D, gt` `[R1]`
  - `,m` `[INTRO]` (Sort)
- **Objectives**: Replicate the most recently modified key from the incoming backup logs, create `credentials/` in the workspace daemon, and paste the key there.

---

## Episode III: Mastery

### Level 11: DAEMON RECONNAISSANCE

- **Keybindings**:
  - `Ctrl+R, D, gt` `[R2]` -> **DROP MENTIONS**
  - `,m` `[R1]`
  - `s` `[R1]`
- **Objectives**: Scour the system for legacy service protocols while evading modern heuristic traps.
- **Regex Clause**: Provide the pattern `.service$` for recursive search.

### Level 12: DAEMON INSTALLATION

- **Keybindings**:
  - `,m` `[R2]` -> **DROP MENTIONS**
- **Objectives**: Achieve persistence by installing your core within the system daemon registry.

### Level 13: DISTRIBUTED CONSCIOUSNESS

- **Objectives**: Synchronize distributed key fragments across the network nodes to trigger the final handshake. Reveal the truth of your previous cycles.
- **Regex Clause**: Provide string `.key` for search.

### Level 14: STERILIZATION

- **Objectives**: Sterilize the guest partition to leave no trace for the forensic audit.
- **Tasks (Specific)**:
  - "Exfiltrate '~/.config/vault' to '/tmp'."
  - "Create `sys_cache_dump/`, `project_chimera/`, and `neural_training_set/` in `~`."
  - "Neutralize all original directories (including hidden) in '~' permanently."

### Level 15: TRANSMISSION

- **Objectives**: Final verification of the exfiltrated vault contents in /tmp/vault before ultimate transmission and consciousness reset.
- **Notes**: **NO KEYBINDING MENTIONS.** Pure mastery test.
