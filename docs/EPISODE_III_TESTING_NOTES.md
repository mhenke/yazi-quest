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

- **Mechanics**: Long-distance Navigation, Cut/Paste.
- **Dynamic Scenarios**: `onEnter` can generate random threats (`alert_traffic.log` etc.).
- **Test Strategy**:
  - Navigate to workspace and Cut `systemd-core`.
  - Check for potential threat files (`alert_traffic.log`, `scan_*.tmp`) and delete them if visible using conditional existence checks.
  - Navigate to `/daemons` and Paste.

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
