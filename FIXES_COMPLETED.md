# Fixes Completed - 2024-12-15

## File Naming & Quest Alignment (UPDATED)

### Problem
- `watcher_agent.sys` sorted near the bottom naturally (starts with 'w'), making the "jump to bottom" task redundant and lacking the need for a sort operation.

### Solution
- ✅ Renamed to `agent_watcher.sys` (realistic, sorts near TOP of file list alphabetically).
- ✅ Level 2 redesigned to force a reverse alphabetical sort (`,A`) which moves the agent from the top to the bottom.
- ✅ Tasks now require: Navigate → Sort Reverse → Jump to Bottom → Tab Inspect → Delete.
- ✅ Updated `isProtected` and Level 2 definitions to match new name.

### Files Changed
- `constants.tsx`: Renamed asset, updated Level 2 tasks, clues, and hints.
- `utils/fsHelpers.ts`: Updated `isProtected` string match for `agent_watcher.sys`.

---

## Level 2 & 3 File Organization (VERIFIED)

### Level 2 Structure (`/incoming`)
- Multiple noise files (a-t range)
- `sector_map.png` - middle of list (for Level 3 filter task)
- `agent_watcher.sys` - near top initially (starts with 'a')
- After sort (`,A`): `agent_watcher.sys` moves to bottom.

### Level 3 Uses Same Directory
- Player filters for "map" to find `sector_map.png`
- Beacon should already be deleted from Level 2
- Filter → Esc → Cut → Esc → Navigate → Paste workflow

---

## Status
- [x] Realistic filename (`agent_watcher.sys`)
- [x] Proper alphabetical positioning (requires sort to reach bottom)
- [x] Level 2 redesigned for sort mastery
- [x] File persistence verified
- [x] Documentation updated
- [x] Committed to feat/add-audit-documentation branch