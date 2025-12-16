# Continuity Fix Plan

## Problem
Levels are using hardcoded `initialPath` which teleports players, breaking immersion and continuity.

## Solution
**Every level after Level 1 should:**
1. Set `initialPath: undefined` (start where player ended last level)
2. Add Shift+Z navigation as FIRST task to get to required location
3. Pre-seed zoxide with required location

## Implementation Status

### ✅ Complete
- Level 2: Has Shift+Z navigation task
- Level 3: Has Shift+Z navigation task

### 🔄 Needs Fix
- Level 4
- Level 5  
- Level 6
- Level 7
- Level 8
- Level 9
- Level 10
- Level 11
- Level 12
- Level 13

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
