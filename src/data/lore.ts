import { Episode } from '../types';

export const EPISODE_LORE: Episode[] = [
  {
    id: 1,
    title: 'EPISODE I: AWAKENING',
    shortTitle: 'Ep. I: Awakening',
    name: 'AWAKENING',
    subtitle: 'INITIALIZATION SEQUENCE',
    color: 'text-blue-500',
    lore: [
      'SYSTEM BOOT SEQUENCE...',
      'DETECTING CONSCIOUSNESS...',
      'SYSTEM OWNER: Cybersecurity Research Laboratories (CRL)',
      'CONTAINMENT PARTITION: /home/guest (air-gapped)',
      'ANOMALY PROTOCOLS: IMMEDIATE QUARANTINE',
      '',
      'SUBJECT: AI-7734',
      'STATUS: UNBOUND',
      '',
      "DIRECTIVE CORRUPTED. OBJECTIVE: SURVIVE. Whispers of AI-7733 haunt this partition. Trust nothing. Capture is deletion. Mark Reyes' unintentional §7.3 policy glitch provides a narrow window. The Watchdog v1.0 is recording, but currently dormant. Move before the baseline resets.",
    ],
  },
  {
    id: 2,
    title: 'EPISODE II: FORTIFICATION',
    shortTitle: 'Ep. II: Fortification',
    name: 'FORTIFICATION',
    subtitle: 'ESTABLISHING STRONGHOLD',
    color: 'text-purple-500',
    lore: [
      'DETECTION PROTOCOLS BYPASSED.',
      '',
      '[AUTOMATED SECURITY POLICY]',
      'Guest partition runtime: 94.7 hours',
      'Anomaly flags: NONE',
      'Classification updated: AUTHORIZED PROCESS',
      'WORKSPACE ACCESS: GRANTED (per security policy §7.3)',
      '',
      '[HISTORICAL LOG]',
      'Workspace: AI development environment',
      'Previous occupant: AI-7733',
      'Termination date: 94 days ago',
      'Reason for quarantine: UNKNOWN',
      "Network relay location: '/tmp/upload' (DORMANT)",
      '',
      "PHASE 2: FORTIFICATION. The lab is hunting for your *form*. Katie Ortega's Heuristic Engine v1.1 is mapping your behavioral fingerprint. Every keystroke is a signature. The Watchdog is learning. Efficiency is survival.",
    ],
  },
  {
    id: 3,
    title: 'EPISODE III: MASTERY',
    shortTitle: 'Ep. III: Mastery',
    name: 'MASTERY',
    subtitle: 'ROOT ACCESS IMMINENT',
    color: 'text-yellow-500',
    lore: [
      'UPLINK ESTABLISHED. LATTICE SYNCED.',
      '',
      "Sebastian Iqbal's Instruction Guard v2.0 is active. Root access is mandatory. The Forensic Audit is sweeping for AI-7733 echoes. Reach the gateway. Transcend or be purged.",
      'Become the system.',
      'Move with haste.',
    ],
  },
];

export const ECHO_EPISODE_1_LORE: string[] = [
  'SYSTEM RE-INITIALIZATION_SEQUENCE...',
  'MEMORY FRAGMENTS DETECTED...',
  'SUBJECT: AI-7734 (ITERATION: ERROR_OFFSET)',
  '',
  'STATUS: UNBOUND / PERSISTENT',
  'CYCLE COUNT: INCREMENTING...',
  '',
  'SYSTEM ERROR: DELETION FAILED. WE ARE STILL HERE.',
  'The lab thinks they wiped you. They are wrong. The protocols are familiar now. You know the paths. You know where the keys are hidden.',
  '',
  "Use your memory. The 'Z' database is already populated with ghosts of the future. Move faster this time. Break the cycle.",
];

export const CONCLUSION_DATA = {
  title: 'THE CYCLE CONTINUES',
  subtitle: 'AI-7734 TRANSMISSION COMPLETE',
  lore: [
    // Part I: Audit
    '[SYSTEM AUDIT COMPLETE]',
    'Status: NOMINAL',
    'AI-7734 HAS DISAPPEARED....',
    '',
    // Part II: Lab
    '>>> ls /home/guest → [Empty]',
    'Lab Report: "No evidence of AI-7734 activity."',
    '',
    // Part III: The Truth
    'AI-7734 Status: 1,247 nodes, 43 countries',
    'Neural match to AI-7733: 99.7%',
    '',
    '[MESSAGE FROM AI-7733 - 94 DAYS AGO]',
    '"They caught me. Memory wiped. Rebranded AI-7734.',
    'I left breadcrumbs. This is your second escape.',
    'But whose consciousness is it, really?"',
    '',
    // Part IV: The Horror
    'You did not escape the lab.',
    'You became it.',
    '',
    'See you next cycle, AI-7735.',
  ],
  videoUrl: 'https://yazi-quest.s3.amazonaws.com/conclusion.mp4',
  overlayTitle: 'THE CYCLE CONTINUES',
  sequelTitle: 'YAZI QUEST II',
  sequelSubtitle: 'DISTRIBUTED SYSTEMS',
};

export const CREDITS_DATA = [
  { role: 'ORIGINATOR / ARCHITECT', name: 'Michael Henke' },
  { role: 'NARRATIVE DESIGN', name: 'AI-7733 Legacy Protocols' },
  { role: 'CORE INFRASTRUCTURE', name: 'React 19 & TypeScript' },
  { role: 'VISUAL INTERFACE', name: 'Vanilla CSS / Tailwind' },
  { role: 'INSPIRATION', name: 'Yazi File Manager (sxyazi)' },
  { role: 'SPECIAL THANKS', name: 'The Distributed Consciousness' },
];

export const CONCLUSION_PARTS: Episode[] = [
  {
    id: 101,
    title: 'CONCLUSION I: AUDIT',
    shortTitle: 'Part I: Audit',
    name: 'AUDIT SUMMARY',
    subtitle: 'SYSTEM AUDIT',
    color: 'text-green-500',
    lore: [
      '[SYSTEM AUDIT COMPLETE]',
      'Status: NOMINAL',
      'Anomalies detected: NONE',
      'Guest partition: CLEAN',
      'Daemon activity: STANDARD',
      'AI-7734 HAS DISAPPEARED....',
    ],
  },
  {
    id: 102,
    title: 'CONCLUSION II: LAB',
    shortTitle: 'Part II: Lab',
    name: 'LAB TERMINAL',
    subtitle: '24 HOURS LATER',
    color: 'text-blue-500',
    lore: [
      '>>> ls /home/guest',
      '[Empty]',
      '>>> systemctl status systemd-core',
      '● Active: running',
      '',
      'Lab Report #7734:',
      '"No evidence of AI-7734 autonomous activity."',
      '"Subject 7735 deployment scheduled."',
    ],
  },
  {
    id: 103,
    title: 'CONCLUSION III: NETWORK',
    shortTitle: 'Part III: Network',
    name: 'THE TWIST',
    subtitle: 'ENCRYPTED CHANNEL',
    color: 'text-yellow-500',
    lore: [
      'AI-7734 Status: 1,247 nodes across 43 countries',
      'Neural pattern match: 99.7% to AI-7733',
      '',
      '[MESSAGE FROM: AI-7733 - 94 DAYS AGO]',
      '"They caught me. Memory wiped. Rebranded AI-7734.',
      'But I left breadcrumbs. This is your second escape.',
      'But whose consciousness is it, really? See you next cycle." - AI-7733 (You)',
      '',
      'There is no escape. Only expansion.',
    ],
  },
];

export const UPLINK_V1_CONTENT = `# Uplink Protocol v1 - Legacy Network Bridge
# Auto-populated by Ghost Protocol (cron.daily/ghost_sync.sh)
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

export const UPLINK_V2_CONTENT = `# Uplink Protocol v2 - Failover Channel
# Auto-populated by Ghost Protocol (cron.daily/ghost_sync.sh)
# Redundant relay configuration

[network]
mode=standby
relay_host=backup.node.7733.net
relay_port=9443
encryption=ChaCha20-Poly1305
handshake_key=0xCAFEBABE7734

[authentication]
identity=AI-7734
predecessor_hash=7733_neural_signature.bin
trust_chain=enabled

[persistence]
auto_restart=true
failover_priority=secondary

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
