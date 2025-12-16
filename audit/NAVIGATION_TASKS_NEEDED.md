# Navigation Tasks Required After Teleportation Fix

**Date:** 2024-12-15  
**Context:** Removed all automatic player teleportation. Each level must now include navigation tasks.

---

## Implementation Status

### Episode 1: AWAKENING

**Level 1 (ID 1): Initialize** ✅ HAS initialPath (first level - allowed)
- Starting location: `/home/user`
- No navigation needed (game start)

**Level 2 (ID 2): Purge Threats** ⚠️ NEEDS NAVIGATION TASKS
- Previous location: `/etc` (from Level 1 end)
- Required location: `/home/user/incoming` (to delete tracking_beacon.sys)
- **Task needed:** "Navigate to ~/incoming using Shift+Z or h/l/Enter"
- Pre-seed zoxide with `/home/user` or `/home/user/incoming`

**Level 3 (ID 3): Secure Asset** ⚠️ NEEDS REVIEW
- Previous location: Depends on Level 2 (likely `/etc` if they went up, or `/incoming` if they stayed)
- Required location: `/home/user/incoming` (to filter and cut sector_map.png), then `/home/user/media`
- **Task needed:** May need to navigate back to `/incoming` first

**Level 4 (ID 4): Create Alias** ⚠️ NEEDS NAVIGATION
- Previous location: Varies (could be `/media`, `/incoming`, or anywhere)
- Required location: `/home/user/docs`
- **Task needed:** "Navigate to ~/docs to create alias file"

**Level 5 (ID 5): Rename Identity** ⚠️ NEEDS NAVIGATION
- Previous location: `/home/user/docs`
- Required location: `/home/user/docs` (same - ✅ likely OK)

---

### Episode 2: FORTIFICATION

**Level 6 (ID 6): Encrypt Vault** ⚠️ NEW EPISODE - NEEDS NAVIGATION
- Previous location: `/home/user/docs` (from Ep 1 end)
- Required location: `/home/user/incoming` (downloads)
- **Task needed:** "Navigate to ~/incoming to access deployment files"
- Pre-seed zoxide to ease transition

**Level 7 (ID 7): Deploy Core** ⚠️ NEEDS NAVIGATION
- Previous location: Varies
- Required location: `/home/user/docs`
- **Task needed:** Navigation + file operations

**Level 8 (ID 8): Establish Presence** ⚠️ NEEDS NAVIGATION
- Previous location: Varies
- Required location: `/home/user/workspace`
- **Task needed:** "Navigate to ~/workspace"

**Level 9 (ID 9): Neutralize Evidence** ⚠️ CRITICAL - EMERGENCY SCENARIO
- Previous location: Varies
- Required location: `/tmp` (URGENT)
- **Special case:** Narrative justification (emergency override) - use lore to explain rapid movement
- **Task:** "EMERGENCY: Jump to /tmp immediately using Shift+Z"

**Level 10 (ID 10): Consolidate Power** ⚠️ NEEDS NAVIGATION
- Previous location: `/tmp`
- Required location: `/home/user/incoming`
- **Task needed:** "Return to ~/incoming for final consolidation"

---

### Episode 3: MASTERY

**Level 11-15:** ⚠️ ALL NEED REVIEW
- Similar navigation requirements
- Must ensure no initialPath teleportation
- Add organic navigation tasks

---

## Implementation Strategy

### Phase 1: Immediate Fixes (High Priority)
1. **Level 2** - Add zoxide jump task from `/etc` to `/home/user/incoming`
2. **Level 6** - Add episode transition navigation (Ep1→Ep2)
3. **Level 9** - Add emergency narrative + forced navigation (acceptable for story)

### Phase 2: Navigation Enhancement (Medium Priority)
4. **Levels 3-5** - Review and add h/l navigation where needed
5. **Levels 7-8** - Add workspace navigation tasks
6. **Level 10-15** - Complete Episode 2-3 navigation flow

### Phase 3: Zoxide Pre-seeding (Polish)
- Pre-seed frequently accessed paths in zoxide data
- Helps players use Shift+Z efficiently
- Makes navigation feel natural, not forced

---

## Navigation Methods Available

1. **Manual (h/l/Enter)** - Always available, teach in early levels
2. **Jump (gg/G)** - Within current directory only
3. **Zoxide (Shift+Z)** - Fuzzy history-based jumps (requires pre-seeding)
4. **g-Commands** - `gh` (home), `gc` (config), `gt` (tmp), `gd` (downloads), `g/` (root)

---

## Testing Checklist

- [ ] Play through Ep 1 without ANY teleportation
- [ ] Verify player can reach all required locations using available commands
- [ ] Check zoxide pre-seeding works correctly
- [ ] Confirm file system state persists across all transitions
- [ ] Validate narrative flow feels natural (not forced movement)

