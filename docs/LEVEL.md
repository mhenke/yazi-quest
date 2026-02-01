# Level Audit: Lore, Storytelling, and Keybindings

This document audits the current levels for narrative consistency, clear objectives (what/why), and the "Initial + 2 Reinforcements + Drop" keybinding rule.

## Legend

- **Reinforcement Rule**: `[INTRO]` (Level where key is introduced), `[R1/R2]` (Reinforcements), `[DROP]` (Dropped from hints/tasks).
- **Objectives**: Focus on "What" and "Why", specifying directories/files.

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
- **Objectives**: Construct relay signatures. Redundant uplink configs.

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
- **Regex Clause**: Provide the pattern `.log` for recursive search.
- **Task Refinement**: "Logs are scattered. Use recursive search (s) and type the pattern `.log` to find all training files."

### Level 7: QUANTUM BYPASS

- **Keybindings**:
  - `Space, .` `[R2]` -> **DROP MENTIONS**
  - `s, Ctrl+A, gc` `[R1]`
  - `z, Z, gr, Y` `[INTRO]`
- **Objectives**: Use quantum navigation to find a rogue access token, but abort if a honeypot is detected.
- **Regex Clause**: Provide string `access_token` for FZF search.

### Level 8: DAEMON DISGUISE CONSTRUCTION

- **Keybindings**:
  - `s, Ctrl+A, gc` `[R2]` -> **DROP MENTIONS**
  - `z, Z, gr, Y` `[R1]`
  - `Shift+P` `[INTRO]`
- **Objectives**: Stabilize core config by forcing an overwrite with a verified clean signature.
- **Regex Clause**: Provide string `uplink` for filtering.

### Level 9: TRACE CLEANUP

- **Keybindings**:
  - `z, Z, gr, Y` `[R2]` -> **DROP MENTIONS**
  - `Shift+P` `[R1]`
  - `Ctrl+R, D, gt` `[INTRO]`
- **Objectives**: Purge the junk in /tmp while preserving critical process artifacts using anchored filters and selection inversion.
- **Regex Clause**: **CRITICAL.** Provide the anchored pattern `\.(key|pid|sock)$` to prevent accidental deletion of decoy files. Explain that the `$` ensures we only match the extension.

### Level 10: CREDENTIAL HEIST

- **Keybindings**:
  - `Shift+P` `[R2]` -> **DROP MENTIONS**
  - `Ctrl+R, D, gt` `[R1]`
  - `,m` `[INTRO]` (Sort)
- **Objectives**: Identify and extract the most recently modified access key from a volatile archive.

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

### Level 14: EVIDENCE PURGE - WORKSPACE

- **Objectives**: Sterilize the guest partition to leave no trace for the forensic audit.
- **Tasks (Specific)**:
  - "Navigate to the '~' partition where evidence must be purged."
  - "Relocate the assembled 'vault' directory to the volatile '/tmp' buffer."
  - "Create 3 decoy directories in '~' to obfuscate the forensic scan (use 'a' then type 'decoy_1', etc.)."
  - "Permanently erase 'datastore', 'incoming', 'media', and 'workspace' from '~' (Select with Space, then D)."
  - "OBLITERATE: Finally, permanently erase the hidden '.config' directory from '~'."

### Level 15: TRANSMISSION PROTOCOL

- **Objectives**: Final verification of the exfiltrated vault contents in /tmp/vault before ultimate transmission and consciousness reset.
- **Notes**: **NO KEYBINDING MENTIONS.** Pure mastery test.
