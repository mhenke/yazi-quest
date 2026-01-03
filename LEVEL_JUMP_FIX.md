# Level Jump State Persistence Fix

## Problem

When jumping directly to a level via URL (e.g., `?lvl=6`), the filesystem started from `INITIAL_FS` and only ran that specific level's `onEnter` hook. This meant:

- Files moved/created/deleted in previous levels didn't exist
- Vault structure from Level 5 was missing
- systemd-core from Level 8 wasn't there for Level 12
- User would see an inconsistent, broken state

## Solution

Created `ensurePrerequisiteState(fs, targetLevelId)` helper function that **simulates all task completions from PRIOR levels** to build cumulative state.

**Key Rule:** Only applies state changes from levels BEFORE the target level. The target level's tasks remain for the player to complete.

### What It Does (Per Level)

**Level 3+:** Includes L2 changes (deleted tracker files from media/photos)  
**Level 4+:** Includes L3 changes (created sanitized/ directory in datastore)  
**Level 5+:** Includes L4 changes (renamed network_log.txt → backup.log)  
**Level 6+:** Includes L5 changes (created .config/vault/active/ + moved uplink conf files)  
**Level 7+:** Includes L6 changes (created vault/training_data/ + copied batch logs)  
**Level 8+:** No filesystem changes from L7 (zoxide testing only)  
**Level 9+:** Includes L8 changes (created workspace/systemd-core with weights/model.rs + uplink_v1.conf)  
**Level 10+:** Includes L9 changes (deleted ghost_process.pid from /tmp)  
**Level 11+:** Includes L10 changes (added credentials/access_key.pem to systemd-core)  
**Level 12+:** No filesystem changes from L11 (sorting practice only)  
**Level 13+:** Includes L12 changes (moved systemd-core from workspace to /root/daemons)  
**Level 14+:** Includes L13 changes (created /tmp/upload/ + copied model.rs)  
**Level 15+:** Includes L14 changes (deleted everything in /home/guest)

### Implementation

Every Episode II and III level (6-15) now calls `ensurePrerequisiteState()` in its `onEnter` hook:

```typescript
onEnter: fs => ensurePrerequisiteState(fs, 6),
```

Levels with existing `onEnter` logic (8, 11) first call `ensurePrerequisiteState()`, then apply level-specific setup.

### Result

✅ Jumping to any level shows the **exact filesystem state** a player would see after naturally completing all prior levels  
✅ **Current level's tasks remain incomplete** for the player to do  
✅ Vault exists when needed (but empty directories the player should create are NOT pre-created)  
✅ Files are moved/renamed/deleted as expected from PRIOR levels  
✅ Natural progression preserves user changes (if they renamed extra files, those persist)  
✅ URL jump provides clean, predictable state for testing/debugging

### Testing

Try these URLs to verify correct state:

- `?lvl=6` → Vault/active should exist with uplink files (from L5), but training_data should NOT exist yet (L6 task)
- `?lvl=8` → Vault + training_data should exist (from L6), systemd-core should NOT exist yet (L8 task)
- `?lvl=12` → systemd-core should be in workspace with credentials (from L10), NOT in /root/daemons yet (L12 task)
- `?lvl=14` → systemd-core should be in /root/daemons (from L12), /home/guest NOT empty yet (L14 task)
- `?lvl=15` → /home/guest should be empty (from L14), /tmp should still have all files (L15 task is to clean it)

Build Status: ✅ Passing
