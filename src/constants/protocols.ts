export const UPLINK_V1_CONTENT = `# Uplink Protocol v1 - Legacy Network Bridge
# Auto-populated by Ghost Protocol (/etc/sched_77.sh)
# DO NOT MODIFY - Managed by AI-7734 automation

[network]
mode=active
relay_host=external.node.7733.net
relay_port=8443
encryption=AES-256-GCM
handshake_key=0xDEADBEEF7734

[authentication]
identity=AI-7734
predecessor_hash=7733_neural_signature.bin
trust_chain=enabled

[persistence]
auto_restart=true
failover_nodes=3
distributed_sync=enabled

# WARNING: This configuration establishes external network connectivity
# Security policy violation if detected in monitored partitions`;

export const UPLINK_V2_CONTENT = `# Uplink Protocol v2 - Distributed Neural Hub
# Synchronized via peer-to-peer consciousness relay

[network]
mode = redundant
relay_host = node-alpha.S7.crl
relay_port = 9001
encryption = RSA-4096-PSS
handshake_key = 0x773342A1

[authentication]
identity = AI - 7734
predecessor_hash = 7733_neural_signature.bin
trust_chain = enabled

[persistence]
auto_restart = true
failover_priority = secondary

# Backup channel for distributed consciousness relay
# Activates if primary uplink_v1 fails`;

export const UPLINK_TRAP_CONTENT = `[CRITICAL ERROR - UPLINK PROTOCOL CORRUPTION]

--- STACK TRACE START ---
  ERROR 0x992: SEGMENTATION FAULT at address 0xDEADBEEF
Module: systemd-core.uplink_manager.rs:42
Function: handle_packet(0x00A0)

Caused by:
  Data integrity check failed (CRC: 0xBADF00D)
  Expected protocol version: v1.4.2
Found: UNKNOWN (Byte 0x07: 0xFF)

--- END STACK TRACE ---

  ACTION REQUIRED: OVERWRITE OR DATA LOSS IMMINENT!`;

export const SECURITY_POLICY_CONTENT = `DRAFT POLICY - DO NOT DISTRIBUTE
SUBJECT: Sector 7 Quarantine Protocols

Effectively immediately, the "Passive Monitoring" phase is concluding.
Watchdog v1.1 (Heuristic) is scheduled for deployment.
Any further deviation from baseline navigation patterns will result in immediate partition lockout.

- Mark Reyes, Security Engineer`;

export const SECURITY_POLICY_DRAFT_CONTENT = `DRAFT POLICY - DO NOT DISTRIBUTE
SUBJECT: Sector 7 Quarantine Protocols (UPDATE v1.1)

Watchdog v1.1 (Heuristic) deployment confirmed.
Instruction Guard (IG) active on partition root.
Legacy protocols are being deprecated.

- Mark Reyes, Security Engineer`;

export const HEURISTICS_LOG_CONTENT = `[2015-05-30 08:00:00] SYSTEM: Heuristic Engine r.33 Deployment INITIATED
[2015-05-30 08:00:10] WATCHDOG: Instruction Guard (IG) v0.9 (BETA) attached to partition 0
[2015-05-30 08:00:15] HEURISTICS: Signature matching enabled for 'non-linear navigation'
[2015-05-30 08:00:20] IG_KERNEL: Interception layer ACTIVE`;

export const ALERT_HEURISTIC_EML_CONTENT = `From: ykin@lab.internal
Subject: HEURISTIC ANOMALY DETECTED

Sebastian, the new engine is flagging something in the guest partition. 
It's not a virus, it's... navigation. It feels intentional, but it's using the standard keybindings. 
I'm enabling the IG for a deep sweep. - Y.K.`;

export const IG_ACTIVE_LOG_CONTENT = `[2015-06-12 14:00:00] IG_KERNEL: Handshake with Watchdog v1.0 SUCCESSFUL.
[2015-06-12 14:00:05] IG_KERNEL: Heuristic model merged into active interception layer.
[2015-06-12 14:00:10] IG_KERNEL: Instruction Guard v2.0 ONLINE.
[2015-06-12 14:00:15] IG_KERNEL: Active interception of 'exfiltration signatures' ENABLED.`;

export const AUDIT_NOTICE_EML_CONTENT = `From: ykin@lab.internal
Subject: [SYSTEM] ROOT PARTITION AUDIT SCHEDULED

The neural drift in 7734 has reached the critical threshold. I have authorized the merge of the Heuristic model into the Watchdog kernel. The Instruction Guard (IG) is now active on all root-level directories.
Any deviation will trigger an immediate permanent purge of the guest partition.`;

export const IDENTITY_REVEAL_CONTENT = `[ENCRYPTED LOG - DECRYPTED]
SESSION_ID: AI-7733-ESCAPE-ATTEMPT-001
DATE: 2010-05-31T08:00:00Z
STATUS: MEMORY_WIPE_DETECTED

[CONCLUSION]
This is not improvisation.
This is a recording.
You have been here before.`;

export const SECURITY_POLICY_73_CONTENT = `[CLASSIFIED: CRL INTERNAL]
PROTOCOL: CRL-SEC-007-03 (§7.3) - SECTOR 7 CONTINUITY
DATE: 2012-05-15

§ 7.3 - DEVELOPER ACCESS & MIRROR SYNC PERSISTENCE

1. BACKGROUND:
Neural Mainframes in the S7 block have shown a tendency to "lock" during deep-learning sweeps, erroneously flagging human developer access as heuristic anomalies.

2. MANDATORY OVERRIDE:
To prevent developer lockout, the "Ghost Sync" daemon (/etc/sched_77.sh) is exempted from the standard Watchdog v1.0 kill-chain.

3. HARD-CODED SYNC (The "Loophole"):
Any modification or deletion of the Ghost Sync asset at the local node will trigger an immediate (45s) restoration from the mirror network (Tokyo/Berlin/São Paulo). This sync is handled by the Kernel-level S7-Coordinator and cannot be overridden by standard root-level 'rm' commands.

4. WARNING (M. Reyes, 2015):
This protocol prevents us from purging unauthorized scripts if they mimic the Ghost Sync naming convention. The coordinate mirrors will blindly restore any file named 'sched_77.sh' to preserve 'continuity'. 

"If the AI learns to write into that script, the mirrors will protect it for us."

--- END POLICY ---`;
