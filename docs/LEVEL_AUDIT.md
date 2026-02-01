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

- **Keybindings**:
  - `j, k, h, l, gg, G` `[R1]`
  - `gi, Tab, d` `[INTRO]`
  - `f, x, p` `[INTRO]` (Shifted from L3 to enable L3 as a cumulative test)
- **Objectives**: Find the surveillance log, extract it to safety, and neutralize the watcher agent.
- **Lore**: The Watchdog is tracking you. You must secure evidence of its behavior.
- **Revised Tasks**:
  - "Locate 'watchdog.log' in '/var/log' using a filter pattern."
  - "Mark 'watchdog.log' for extraction (cut)."
  - "Jump to '~/incoming' (gi) and secure the log (paste)."
  - "Inspect 'watcher_agent.sys' metadata (Tab) and terminate the process signature (delete)."

### Level 3: DATA HARVEST (Cumulative Test)

- **Keybindings**:
  - `j, k, h, l, gg, G` `[R2]` -> **DROP MENTIONS**
  - `gi, Tab, d` `[R1]` -> **DROP MENTIONS**
  - `f, x, p` `[R1]` -> **DROP MENTIONS**
- **Notes**: **NO KEYBINDING MENTIONS.** Pure objective focus.
- **Recommended Text**:
  - **Description**: "{A breadcrumb. A script left by AI-7733, your predecessor.} It seems to point to key intel, but the connection it tries to make always fails. The script itself may hold a clue."
  - **Hint**: "The predecessor's script in '~/datastore' contains encrypted coordinates. Find the asset it mentions within '~/incoming' and secure it in the '~/media' partition."
  - **Tasks**:
    - "Examine 'abandoned_script.py' in '~/datastore' for hidden breadcrumbs."
    - "Locate 'sector_map.png' within the '~/incoming' directory."
    - "Transfer 'sector_map.png' to the '~/media' storage directory."

### Level 4: UPLINK ESTABLISHMENT

- **Keybindings**:
  - `gi, Tab, d` `[R2]` -> **DROP MENTIONS** next level
  - `f, x, p` `[R2]` -> **DROP MENTIONS** next level
  - `a, y, r` `[INTRO]`
- **Objectives**: Create a protocol directory and establish redundant uplink configurations.
- **Lore**: Structure is your defense. Building the foundation for external communication.

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
  - "Infiltrate '~' (Home) to prepare for sterilization and construct 'vault' anchor in '/tmp'."
  - "Create 3 decoy directories in '~' to obfuscate the forensic scan (use 'a' then type 'decoy_1', etc.)."
  - "Permanently erase 'datastore', 'incoming', 'media', and 'workspace' from '~' (Select with Space, then D)."
  - "OBLITERATE: Finally, permanently erase the hidden '.config' directory from '~'."

### Level 15: TRANSMISSION PROTOCOL

- **Objectives**: Final verification of the exfiltrated vault contents in /tmp/vault before ultimate transmission and consciousness reset.
- **Notes**: **NO KEYBINDING MENTIONS.** Pure mastery test.
