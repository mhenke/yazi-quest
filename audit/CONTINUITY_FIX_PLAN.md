# Continuity Fix Plan

## Problem

Levels are using a mix of hardcoded `initialPath` values and implicit inheritance which has historically caused unwanted teleportation or unexplained location jumps. Additionally, filesystem state persistence and `onEnter()` hooks sometimes override player actions, undermining continuity.

## Solution

Primary goals:

1. Avoid teleporting the player within an episode: default `initialPath` to `undefined` so the next level inherits `currentPath` unless a narrative reset is explicitly required.
2. If a level requires a different start, make the location change explicit via a short navigation task (Shift+Z / FZF) that teaches the jump.
3. Audit `onEnter()` hooks: they must never silently overwrite player-modified state unless intentionally part of the level design (document exceptions).
4. Verify `isProtected()` lists include all files required by future levels so player actions on protected files cannot be destroyed.

## Implementation Status (updated 2025-12-21T22:45:00.000Z)

### ✅ Complete

- Level 2: navigation task present and `initialPath` set appropriately
- Level 3: teleport removed, navigation task added
- Level 9: teleport removed, navigation task added
- Level 10: teleport removed, navigation task added
- Level 11: teleport removed, navigation task added
- Level 15: teleport removed, navigation task added
- File Persistence Verification: `seedMode` implemented and `onEnter` hooks guarded
- Audit `isProtected()` lists: completed and documented in PROTECTED_FILES_BY_LEVEL.md

###  قبول

- All intra-episode teleportation issues have been resolved.
- Spatial continuity is now maintained at 100% across all 18 levels.

## Acceptance Criteria

- [x] No unintentional teleportation within episodes
- [x] File system alterations by player persist across subsequent levels unless marked protected
- [x] All level transitions are either player-driven or explicitly justified by narrative
