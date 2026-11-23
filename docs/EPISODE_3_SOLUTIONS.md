# Episode 3: The Ghost in the Machine (Levels 11-15) - Walkthrough

This guide provides condensed step-by-step instructions for Episode 3.

**Legend:** `gr`=Go Root, `gw`=Go Workspace, `gc`=Go Config, `gt`=Go Tmp, `gh`=Go Home, `l`=Enter/Right, `h`=Up/Left, `j`/`k`=Down/Up, `Space`=Select, `a`=Create, `x`=Cut, `p`=Paste, `d`=Trash, `D`=Permanent Delete

---

## Level 11: DAEMON RECONNAISSANCE

1. `gr`, `j` (to `daemons`), `l`, `j` (to `archived`), `l` (Task: Navigate to `/daemons/archived`)
2. `,` then `m`, `Space` on `.cron-legacy.service`, `Space` on `.backup-archive.service`, `x` (Task: Identify and extract legacy records)
3. `gw`, `l` (to `systemd-core`), `p` (Task: Construct active signatures in `~/workspace/systemd-core`)

---

## Level 12: DAEMON INSTALLATION

1. `gw`, `.`, Hover `.identity.log.enc` (Task: Analyze `~/workspace/.identity.log.enc` signature)
2. `k` (to `systemd-core`), `Space` (Select), `x` (Task: Extract `~/workspace/systemd-core/`)
3. `gr`, select and enter `/daemons` (`l`), then `P` to overwrite the stock `systemd-core`. Enter the installed directory (`l`) to verify.
4. `gw`, `d` (if `alert_traffic.log`), `gi`, `d` (if `trace_packet.sys`) (Task: Neutralize traces)

---

## Level 13: DISTRIBUTED CONSCIOUSNESS

1. `gr`, enter `/nodes`, press `.` to reveal hidden files, then `s`, type `\.key$`, and press `Enter`. Select the three node keys and cut them (`x`).
2. Clear search (`Esc`), then `gw`, `a`, type `central_relay/`, and press `Enter` to create the directory.
3. Hover `.identity.log.enc` to verify regional hash reconciliation.
4. Enter `central_relay` and paste (`p`). Press `.` to hide dotfiles before completing the mission.

---

## Level 14: STERILIZATION

1. `gw`, enter `central_relay`, then press `.` to reveal the three node keys. Select them, cut (`x`), then `gc`, enter `vault`, and paste (`p`). The objective completes here; press `.` again to hide dotfiles.
2. `gc`, `Space` (target `vault`), `x`, `gt`, `p` (Task: Construct `vault` anchor in `/tmp`)
3. `gh`, then use `a` to create `sys_cache_dump/`, `project_chimera/`, and `neural_training_set/`.
4. Select `workspace`/`media`/`datastore`/`incoming`, `D`, `y`, `.`, Select `.config`, `D`, `y` (Task: Neutralize visible & hidden)

---

## Level 15: TRANSMISSION

1. `gt`, `l` (into `vault`) (Task: Infiltrate `/tmp/vault`)
2. Press `.` to reveal the same three node keys. Select them, cut (`x`), enter `active`, and paste (`p`). Press `.` to hide dotfiles again.
3. `Space` (`uplink_v1`), `D`, `Space` (`uplink_v2`), `r`, `uplink_active.conf` (Task: Neutralize v1/Activate active)
4. `h` (to `vault`), `j` (to `training_data`), `l`, `Space` (`exfil_04.log`), `x`, `h`, `j` (to `active`), `l`, `p`, `Space` (`exfil_04.log`), `r`, `payload.py` (Task: Deploy `payload.py` to `/tmp/vault/active` by extracting disguised kernel from `training_data/exfil_04.log`)
5. With prior 4 tasks complete, initiate transmission (`Shift+Enter` to auto-fix violations / advance) (Task: Initiate transmission once prior 4 tasks are complete)
