# Continuity Fix Plan

## Problem

Levels are using a mix of hardcoded `initialPath` values and implicit inheritance which has historically caused unwanted teleportation or unexplained location jumps. Additionally, filesystem state persistence and `onEnter()` hooks sometimes override player actions, undermining continuity.

## Solution

Primary goals:

1. Avoid teleporting the player within an episode: default `initialPath` to `undefined` so the next level inherits `currentPath` unless a narrative reset is explicitly required.
2. If a level requires a different start, make the location change explicit via a short navigation task (Shift+Z / FZF) that teaches the jump.
3. Audit `onEnter()` hooks: they must never silently overwrite player-modified state unless intentionally part of the level design (document exceptions).
4. Verify `isProtected()` lists include all files required by future levels so player actions on protected files cannot be destroyed.

## Implementation Status (updated 2025-12-21T20:49:21.030Z)

### ✅ Complete

- Level 2: navigation task present and `initialPath` set appropriately
- Level 3: navigation task present and continuity validated

### 🔄 Needs Fix / Verify (priority order)

1. Level 11 — Add explicit navigation task or remove hardcoded `initialPath` (Medium)
2. Level 12 — Add explicit navigation task or remove hardcoded `initialPath` (Medium)
3. File Persistence Verification — Confirm non-protected file edits persist across levels (Critical)
4. Audit `isProtected()` lists across levels and document exceptions (High)
5. Verify `onEnter()` hooks do not reset player state unexpectedly (High)

## Implementation Template & Tests

- Level fix template (use as first task if location differs):

```typescript
{
  id: X,
  initialPath: undefined, // inherit previous location
  tasks: [
    {
      id: 'navigate-to-target',
      description: "Use Zoxide (Shift+Z) to jump to /home/user/docs",
      check: (state) => state.currentPath.join('/') === 'root/home/user/docs',
    },
    // ... existing tasks
  ]
}
```

- File persistence test cases (manual + automated):
  - Delete non-protected file in Level N → verify absence in Level N+1
  - Create file in Level N → verify presence in Level N+1
  - Move/rename in Level N → verify change persists in Level N+1

## Pre-seed Zoxide Data

Pre-seeding exists in `App.tsx` — ensure values include any added target locations for navigation tasks.

## Rollout Plan (3 steps)

1. Run file persistence verification suite (manual playthrough or scripted): mark pass/fail for each test case (1 hour)
2. Implement Level 11/12 navigation tasks and re-run suite (1 hour)
3. Audit `isProtected()` and `onEnter()` hooks; lock required files and document exceptions (2 hours)

## Acceptance Criteria

- No unintentional teleportation within episodes
- File system alterations by player persist across subsequent levels unless marked protected
- All level transitions are either player-driven or explicitly justified by narrative

## Template for Fix

```typescript
{
  id: X,
  initialPath: undefined, // Player could be anywhere
  tasks: [
    {
      id: 'nav',
      description: "Use Zoxide (Shift+Z) to jump to TARGET_LOCATION",
      check: (state) => {
        // Check if player reached required location
      },
      completed: false
    },
    // ... existing tasks
  ]
}
```

## Pre-seed Zoxide Data

Already in `App.tsx`:

```typescript
zoxideData: {
  '/home/user': { count: 50, lastAccess: now },
  '/home/user/workspace': { count: 30, lastAccess: now },
  '/tmp': { count: 20, lastAccess: now },
  // ... etc
}
```
