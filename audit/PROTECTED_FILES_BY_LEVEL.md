# Protected Files by Level (Generated Summary)

Generated: 2025-12-21T21:15:00.000Z

Purpose: Human-readable mapping of files/directories protected per level, derived from PROTECTION_AUDIT_2025-12-18.md and fsHelpers rules.

## Summary

- Core system protections (root, /etc, /tmp, /bin, /home, /home/guest) apply at all times and are not repeated per-level below.

## Per-Level Highlights

Level 1: Navigation
- No level-specific protected assets.

Level 2: Jump + Delete
- tracking_beacon.sys (teaching element) - monitored by level design

Level 3: Filter + Cut
- target_map.png - cut allowed at L3 only, deletions disallowed

Level 4: Create
- protocols/ directory - protected from deletion until L4

Level 5: Batch Select
- Decoy files - treated as non-critical; seeding occurs via onEnter (non-destructive by default)

Level 6: Archive Ops
- backup_logs.zip - protected until L9

Level 7: Zoxide
- No additional protected files beyond core system

Level 8: Integration
- uplink_v1.conf - protected from delete until L7

Level 9: Sort
- ghost_process.pid - created onEnter as demo artifact; deletable by player (teaches deletion)

Level 10: Zoxide + Ops
- access_key.pem - protected from deletion across levels; cut/yank rules depend on level (yank allowed, cuts controlled)

Level 11: Neural Purge (RESOLVED)
- **Previous Risk:** Destructive hook deleted all `neural_*` files.
- **Resolution:** `onEnter` hook now moves conflicting user files to a `quarantine/` directory within `workspace`. This isolates them for mission clarity while preventing loss of player assets.

Level 12: Vault Operations
- `.config/vault` and `vault/active` - protected from deletion/cut until later levels (see PROTECTION_AUDIT)

Level 13: Daemon Operations
- daemon/ directory - protected until L13

Level 14: Trace Removal
- mission_log.md - deletable only on L14

Level 15: Path Chaining
- Most protections are relaxed; some structural protections remain for core directories

## Notes & Actions
- This is a summarized mapping; for authoritative rules, refer to `utils/fsHelpers.ts` (checkLevelSpecificAssetProtection) and PROTECTION_AUDIT_2025-12-18.md.
- Action: Finalize conditional logic in onEnter hooks to check for `seedMode` before executing.
