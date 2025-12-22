# Operational Security (Protection Rules) (Source Verified)

**Date:** 2025-12-22
**Auditor:** Senior Technical Auditor
**System Logic:** Tiered Protection based on Path and Level Index.

---

## 1. Protection System Architecture

The file protection system, implemented in the `isProtected` function in `utils/fsHelpers.ts`, uses a three-tier model to prevent game-breaking actions and guide gameplay. An action (`delete`, `cut`, `rename`) is checked against these tiers in order.

### Tier 1: Core System Protection
Fundamental system directories are immutable. Any modification action is blocked.
- **Paths:** `/`, `/home`, `/home/guest`, `/etc`, `/tmp`, `/bin`
- **Rule:** Permanent structural lock.

### Tier 2: Episode Structural Protection
Key gameplay directories are protected from modification until the final episode to preserve the mission structure.
- **Paths:** `/home/guest/datastore`, `/home/guest/incoming`, `/home/guest/media`, `/home/guest/workspace`
- **Rule:** Locked until Level 15 (index 14).

### Tier 3: Level-Specific Asset Protection
Specific files and directories have fine-grained rules that depend on the player's current level and the attempted action. This is the primary mechanism for creating level-specific puzzles and objectives.

---

## 2. Level-Specific Rules Matrix

The following rules are verified against the `checkLevelSpecificAssetProtection` function in the source code.

| Asset Path / Name | Action | Rule / Condition |
|-------------------|--------|------------------|
| `access_key.pem` | `delete` | Always Blocked. |
| | `cut` | **Allowed** only on Levels 8 and 10 (indices 7, 9). Blocked otherwise. |
| | `rename` | **Allowed** only on Level 10 (index 9). Blocked otherwise. |
| `mission_log.md` | `delete` | **Allowed** only on Level 14 (index 13). Blocked otherwise. |
| | `rename` | Blocked before Level 14 (index 13). |
| `target_map.png` | `delete` | Always Blocked. |
| | `cut` | **Allowed** only on Level 3 (index 2). Blocked otherwise. |
| `protocols/` (in datastore) | `delete`/`cut`| Blocked before Level 5 (index 4). |
| `uplink_v1.conf` | `delete` | Blocked before Level 8 (index 7). |
| `uplink_v2.conf` | `delete` | Blocked before Level 5 (index 4). |
| `.config/vault` | `delete` | Blocked before Level 13 (index 12). |
| | `cut` | Blocked before Level 10 (index 9). |
| `.config/vault/active`| `delete`/`cut`| Blocked before Level 8 (index 7). |
| `backup_logs.zip`| `delete`/`cut`| Blocked before Level 10 (index 9). |
| `daemon/` (in etc) | `delete`/`cut`| Blocked before Level 14 (index 13). |

---

## 3. Audit Findings

- The "Proactive Identifier Reservation (PIR)" concept mentioned in the previous version of this document is no longer explicitly implemented. Name-based restrictions are now handled within the level-specific rules.
- The "Safe Seeding Protocol" is not part of the protection system; it is related to the `onEnter` hooks for levels in `constants.tsx`, which are responsible for setting up the initial state for a level.
- The current implementation is robust and correctly enforces the gameplay path required by the level designs.
- **Question:** The protection logic is hardcoded within a single, large function. As more levels are added, has consideration been given to a more data-driven approach (e.g., defining protection rules alongside the level data in `constants.tsx`) to improve maintainability?
