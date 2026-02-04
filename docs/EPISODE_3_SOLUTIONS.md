# Episode 3: The Ghost in the Machine (Levels 11-15) - Walkthrough

This guide provides condensed step-by-step instructions for Episode 3.

**Legend:** `gr`=Go Root, `gw`=Go Workspace, `gc`=Go Config, `gt`=Go Tmp, `gh`=Go Home, `l`=Enter/Right, `h`=Up/Left, `j`/`k`=Down/Up, `Space`=Select, `a`=Create, `x`=Cut, `p`=Paste, `d`=Trash, `D`=Permanent Delete

---

## Level 11: DAEMON HUNTING

1. `gr`, `j` (to `daemons`), `l`, `j` (to `archived`), `l` (Task: Navigate to `/daemons/archived`)
2. `,` then `m`, `Space` on `.cron-legacy.service`, `Space` on `.backup-archive.service`, `x` (Task: Identify and extract legacy records)
3. `gw`, `l` (to `systemd-core`), `p` (Task: Construct active signatures in `~/workspace/systemd-core`)

---

## Level 12: DAEMON INSTALLATION

1. `gw`, `.`, Hover `.identity.log.enc` (Task: Analyze `~/workspace/.identity.log.enc` signature)
2. `k` (to `systemd-core`), `Space` (Select), `x` (Task: Extract `~/workspace/systemd-core/`)
3. `gr`, `j` (to `daemons`), `p`, `l` (Verification) (Task: Finalize daemon installation in `/daemons`)
4. `gw`, `d` (if `alert_traffic.log`), `gi`, `d` (if `trace_packet.sys`) (Task: Neutralize traces)

---

## Level 13: DISTRIBUTED CONSCIOUSNESS

1. `gr`, `j` (to `nodes`), `l`, `s`, type `\.key$`, `Enter`, `Space` (x3 on keys), `x` (Task: Locate node keys in `/nodes`)
2. `gw`, `a`, type `central_relay`, `Enter` (Task: Construct `central_relay` in `~/workspace`)
3. `l` (into `central_relay`), `p` (Task: Calibrate node keys)

---

## Level 14: STERILIZATION

1. `gw`, `l` (into `central_relay`), `Space` (x3 keys), `x`, `gc`, `l` (into `vault`), `p` (Task: Move keys to `~/.config/vault`)
2. `gc`, `Space` (target `vault`), `x`, `gt`, `p` (Task: Construct `vault` anchor in `/tmp`)
3. `gh`, `a` (`sys_cache_dump`), `a` (`project_chimera`), `a` (`neural_training_set`) (Task: Construct 3 decoy directories)
4. Select `workspace`/`media`/`datastore`/`incoming`, `D`, `y`, `.`, Select `.config`, `D`, `y` (Task: Neutralize visible & hidden)

---

## Level 15: TRANSMISSION

1. `gt`, `l` (into `vault`) (Task: Infiltrate `/tmp/vault`)
2. `Space` (x3 keys), `x`, `l` (into `active`), `p` (Task: Calibrate keys into `/tmp/vault/active`)
3. `Space` (`uplink_v1`), `D`, `Space` (`uplink_v2`), `r`, `uplink_active.conf` (Task: Neutralize v1/Activate active)
4. Verify `payload.py` exists (Task: Initiate transmission)
