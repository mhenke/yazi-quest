# Operational Security (Protection Rules)

**System Logic:** Proactive Reservation (PIR) + Safe Seeding

---

## 1. Global System Protections
Fundamental paths are immutable to prevent simulation corruption:
- `/`, `/home`, `/home/guest`, `/etc`, `/tmp`, `/bin`

## 2. Proactive Reservation (PIR)
The system proactively blocks the creation or renaming of nodes into mission-critical namespaces within the `/workspace` sector.
- **Reserved**: `neural_*`
- **Reserved**: `systemd-core`

## 3. Level-Specific Matrix

| Phase | Path | Rule | Lifted |
|-------|------|------|--------|
| Episode 1 | `datastore/`, `media/` | Structural lock | L14 |
| Level 3 | `target_map.png` | Deletion Blocked | Never |
| Level 4 | `protocols/` | Cut/Delete Blocked | L6 |
| Level 10 | `access_key.pem` | Deletion Blocked | Never |
| Level 13 | `daemon/` | Yank-Only | L14 |

---

## 4. Safe Seeding Protocol
`onEnter` hooks are strictly non-destructive.
- **Logic**: `if (!nodeExists(target)) { seedNode(target); }`
- **Continuity**: This ensures user-created organizational structures are never wiped during level transitions.