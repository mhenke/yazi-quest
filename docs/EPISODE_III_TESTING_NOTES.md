# Episode III Testing Notes

## Overview

Based on code analysis of `src/constants.tsx`, the following mechanics and test strategies were identified and implemented for Episode III (Levels 11-15).

## Level Analysis

### Level 11: DAEMON RECONNAISSANCE

- **Mechanics**: Metadata Inspection (`Tab`), Selection (Space).
- **Objective**: Identify safe files based on modification dates (or specific names known from code) and avoid "honeypot" files.
- **Test Strategy**:
  - Filter for known safe files (`cron-legacy.service`, `backup-archive.service`).
  - Use `Tab` key to inspect metadata on at least 3 files.
  - Select 2 safe files.

### Level 12: DAEMON INSTALLATION

- **Mechanics**: Long-distance Navigation, Cut/Paste, Conditional Task System.
- **Dynamic Scenarios**: `onEnter` generates random threats based on Level 11 choices (Modern vs Legacy path).
- **Scenario System**:
  - **6 possible scenarios** (3 Modern/Risky, 3 Legacy/Safe)
  - Each scenario spawns different threat files and adds scenario-specific tasks
  - Tasks are dynamically hidden if their threat files don't exist (i.e., other scenarios)
  - Task count excludes hidden tasks

**Modern/Risky Scenarios** (if player chose modern daemons in Level 11):

- **scen-b1**: Traffic Alert (33% chance) - Spawns `alert_traffic.log` in `~/workspace`
- **scen-b2**: Remote Tracker (33% chance) - Spawns `trace_packet.sys` in `~/incoming`
- **scen-b3**: Heuristic Swarm (34% chance) - Scatters `scan_*.tmp` files (`scan_a.tmp`, `scan_b.tmp`, `scan_c.tmp`) across workspace, `/tmp`, and `/etc`

**Legacy/Safe Scenarios** (if player chose legacy daemons in Level 11):

- **scen-a1**: Clean Run (33% chance) - No threat files, only core installation tasks
- **scen-a2**: Bitrot (33% chance) - Spawns hidden `core_dump.tmp` in `~/.config`
- **scen-a3**: Dependency Error (34% chance) - Spawns `lib_error.log` in `~/workspace`

- **Test Strategy**:
  - Force specific scenarios using URL parameter: `?lvl=12&scenario=scen-a1` (or modify `FORCE_SCENARIO` in `constants.tsx`)
  - Navigate to workspace and Cut `systemd-core`.
  - Check for and delete scenario-specific threat files if present
  - Navigate to `/daemons` and Paste.
  - Verify task count matches visible tasks (should be 0/4 or 0/5 depending on scenario)

### Level 13: DISTRIBUTED CONSCIOUSNESS

- **Mechanics**: Node Switching (`1`, `2`, `3`).
- **Objective**: Collect key fragments from Tokyo (1), Berlin (2), and São Paulo (3) nodes into `/tmp/central`.
- **Test Strategy**:
  - Sequentially switch to each node context.
  - Yank the specific key file (`.key`) available in each node.
  - Navigate to `/tmp/central` and Paste.
  - Ensure all 3 nodes are visited.

### Level 14: EVIDENCE PURGE

- **Mechanics**: Permanent Delete (`Shift+D`), Batch Operations.
- **Objective**: Create 3 decoy directories and permanently delete correct evidence directories including hidden ones.
- **Test Strategy**:
  - Create `decoy_1`, `decoy_2`, `decoy_3` in `~`.
  - Select `datastore`, `incoming`, `media`, `workspace` and `Shift+D`.
  - Toggle hidden files (`.`) and delete `.config`.

### Level 15: TRANSMISSION PROTOCOL

- **Mechanics**: Cumulative Mastery (Search, Verify, Delete, Upload).
- **Phases**:
  1. Recursive search (`s`) for keys in `/nodes` (root) -> Copy -> Paste in `/tmp/upload`.
  2. Verify daemon in `/daemons/systemd-core` (Tab + J/K).
  3. Sanitize breadcrumb in `/tmp` (`.ghost_process.pid` via Toggle Hidden + `Shift+D`).
  4. Initiate upload (Jump `Z` -> `upload`, Filter `key`).
- **Test Strategy**:
  - Implement sequential steps for each phase.
  - Use `uplink_v1.conf` specific filter for verification to verify correct file.
  - Use `Shift+J`/`Shift+K` for scrolling inspection.

## Implementation Details

- **Key Support**: Added support for digit keys (`1`-`9`) to `utils.ts` to support Level 13.
- **Robustness**: Tests use explicit waiting and specific filters (e.g., `uplink_v1.conf`) to avoid ambiguity.
- **Input Handling**: Migrated input interactions to use `page.keyboard.press` or `getByRole('textbox')`.

## Known Issues

- **Level 6**: Creation of `training_data` directory occasionally fails in automated tests due to input timing or focus issues, though logic is correct.
- **Level 8/15**: Filter ambiguity with `uplink` vs `uplink_v1` addressed by explicit typing.
