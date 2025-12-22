# Yazi Quest - Continuity Audit

**Created:** 2024-12-15  
**Last Updated:** 2025-12-21
**Purpose:** Ensure seamless narrative flow, spatial consistency, and state persistence across levels, episodes, and the entire game experience.

---

## Executive Summary

This audit identifies and tracks continuity issues that break player immersion. Thanks to a major architectural fix, all critical spatial continuity issues have been resolved. Player location is now preserved between levels within the same episode.

### Continuity Score: 18/18 Transitions (100%) ✅

**Analysis of 18 level transitions:**

- ✅ Perfect Continuity: 18 transitions (100%)
- ⚠️ Minor Issues: 0 (all resolved with narrative justification or architectural fixes)
- 🔴 Critical Issues: 0 (all fixed)

**Key Architectural Fix:**
The primary cause of teleportation has been fixed in `App.tsx`. Player location is now preserved across level transitions within an episode. Location only resets to the level's `initialPath` when a new episode begins, which serves as a narrative reset point.

---

## Critical Issues Found

### ✅ RESOLVED: Level 1→2 Location Teleportation

**Issue:** Level 1 ended with player in `/etc`, but Level 2 started in `/home/guest/incoming`.
**Impact:** Broke spatial continuity, confused players about navigation context.
**Status:** ✅ FIXED (2024-12-15)

**Solution Implemented:**
- Level 2 now starts in `/etc` (where Level 1 ended).
- The first task of Level 2 is to navigate to `/home/guest/incoming`, teaching a core skill organically.

---

### ✅ RESOLVED: Global Teleportation on Level Advancement

**Issue:** `App.tsx` was teleporting players to `nextLevel.initialPath` on every level change.
**Impact:** Player could be anywhere, then suddenly teleported, breaking immersion.
**Status:** ✅ FIXED (2024-12-15)

**Solution Implemented:**
The game's `advanceLevel` logic was updated to only reset location for new episodes.

```typescript
// OLD (BAD):
// currentPath: nextLevel.initialPath

// NEW (GOOD):
currentPath: isNewEp ? nextLevel.initialPath : prev.currentPath; // NEVER teleport within an episode
```

---

### ✅ RESOLVED: Intra-Episode Teleports (Levels 3, 9, 10, 11, 15)

**Issue:** Levels 3, 9, 10, 11, and 15 were teleporting players to new directories mid-episode.
**Impact:** Disorienting navigation experience.
**Status:** ✅ FIXED (2025-12-21)

**Solution Implemented:**
- Removed `initialPath` from these levels.
- Added explicit navigation tasks (using manual h/l or Zoxide Shift+Z) to guide the player to the required sectors.

---

## Level-by-Level Analysis

### Level 1: "System Navigation & Jump"
**Start:** `/home/guest` (initial spawn)
**End:** `/etc` (after scanning files)
**Issue:** None.

### Level 2: "Threat Elimination & Sorting"
**Start:** `/etc` ✅ Matches Level 1 end
**End:** `/home/guest/incoming`
**Issue:** ✅ RESOLVED - Player navigates from `/etc` to `~/incoming`.

### Level 3: "Threat Neutralization"
**Start:** `/home/guest/incoming` ✅ Matches Level 2 end
**End:** `/home/guest/datastore`
**Issue:** ✅ RESOLVED - Player navigates from `~/incoming` to `~/datastore`.

### Level 4: "Asset Relocation"
**Start:** `/home/guest/datastore` ✅ Matches Level 3 end
**End:** `/home/guest/media`
**Issue:** ✅ RESOLVED - Mission-driven relocation.

### Level 5: "Protocol Design" ⭐ New Episode
**Start:** `/home/guest/datastore` ✅ Narrative reset point
**End:** `/home/guest/datastore/protocols`
**Issue:** None.

### Level 6: "Batch Deployment"
**Start:** `/home/guest/datastore/protocols` ✅ Matches Level 5 end
**End:** `/home/guest/datastore/protocols`
**Issue:** None.

### Level 7: "Signal Isolation" ⭐ Episode 2 Begins
**Start:** `/home/guest/datastore` ✅ Episode reset point
**End:** `/home/guest/datastore`
**Issue:** None.

### Level 8: "Deep Scan Protocol"
**Start:** `/home/guest/datastore` ✅ Matches Level 7 end
**End:** `/etc`
**Issue:** ✅ RESOLVED - First Zoxide jump mission.

### Level 9: "NEURAL CONSTRUCTION & VAULT"
**Start:** `/etc` ✅ Matches Level 8 end
**End:** `/home/guest/workspace`
**Issue:** ✅ RESOLVED - Navigation task added.

### Level 10: "Stealth Cleanup"
**Start:** `/home/guest/workspace` ✅ Matches Level 9 end
**End:** `/tmp`
**Issue:** ✅ RESOLVED - Navigation task added.

### Level 11: "Encrypted Payload"
**Start:** `/tmp` ✅ Matches Level 10 end
**End:** `/home/guest/datastore`
**Issue:** ✅ RESOLVED - Navigation task added.

### Level 12: "Live Migration"
**Start:** `/home/guest/datastore` ✅ Matches Level 11 end
**End:** `/home/guest/workspace`
**Issue:** ✅ RESOLVED - Round-trip migration flow.

### Level 13: "Identity Forge" ⭐ Episode 3 Begins
**Start:** `/home/guest/workspace` ✅ Episode reset point
**End:** `/home/guest/workspace`
**Issue:** None.

### Level 14: "Root Access"
**Start:** `/home/guest/workspace` ✅ Matches Level 13 end
**End:** `/etc`
**Issue:** ✅ RESOLVED - Root-level navigation.

### Level 15: "Shadow Copy"
**Start:** `/etc` ✅ Matches Level 14 end
**End:** `/tmp`
**Issue:** ✅ RESOLVED - Navigation task added.

### Level 16: "Trace Removal"
**Start:** `/tmp` ✅ Matches Level 15 end
**End:** `/`
**Issue:** ✅ RESOLVED - Retreat to root finale.

### Level 17: "Grid Expansion"
**Start:** `/` ✅ Matches Level 16 end
**End:** `/home/guest`
**Issue:** None.

### Level 18: "System Reset"
**Start:** `/home/guest` ✅ Matches Level 17 end
**End:** `/home/guest`
**Issue:** None.
