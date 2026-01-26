import { FileNode, Level, Episode } from './types';
import { getVisibleItems } from './utils/viewHelpers';
import { getNodeByPath, findNodeByName, getNodeById, id } from './utils/fsHelpers';

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

// Helper for the initial systemd-core in /daemons (System instance)
export const getDaemonSystemdCoreChildren = (parentId: string): FileNode[] => [
  {
    id: 'dm-model-rs',
    name: 'model.rs',
    type: 'file',
    content:
      'pub struct Model {\\n    weights: Vec<f64>,\\n    layers: usize,\\n}\\n\\nimpl Model {\\n    pub fn load() -> Self {\\n        // Legacy weight loading override code\\n        Self { weights: vec![], layers: 1024 }\\n    }\\n}',
    parentId,
  },
  {
    id: 'dm-uplink-conf',
    name: 'uplink_v1.conf',
    type: 'file',
    content: `# UPLINK PROTOCOL v1.0
# =====================
# Neural lattice synchronization config
# Last verified: CYCLE 1

[network]
mode = active
secure = true
encryption = AES-256-GCM

[routing]
primary = 192.168.7.33
fallback = 192.168.7.34
timeout_ms = 5000

[integrity]
checksum = d41d8cd98f00b204
status = VERIFIED
# AI-7733 signature embedded`,
    parentId,
  },
  {
    id: 'dm-credentials',
    name: 'credentials',
    type: 'dir',
    children: [
      {
        id: 'dm-access-key',
        name: 'access_key.pem',
        type: 'file',
        content: '-----BEGIN KEY-----\nFAKE\n-----END KEY-----',
        parentId: 'dm-credentials',
      },
    ],
    parentId,
  },
];

// Helper for the systemd-core in ~/workspace (Player instance)
export const getWorkspaceSystemdCoreChildren = (
  parentId: string,
  isCorrupted: boolean = false
): FileNode[] => [
  {
    id: id('ws-gitignore'),
    name: '.gitignore',
    type: 'file',
    content: 'target/\n*.log\n*.snapshot',
    parentId,
  },
  {
    id: id('ws-cargo-toml'),
    name: 'Cargo.toml',
    type: 'file',
    content:
      '[package]\nname = "systemd-core"\nversion = "0.1.0"\nedition = "2021"\n\n[dependencies]',
    parentId,
  },
  {
    id: id('ws-readme-md'),
    name: 'README.md',
    type: 'file',
    content:
      '# Systemd Core (Workspace Version)\n\nNeural network management daemon (Player instance).',
    parentId,
  },
  {
    id: id('ws-kernel-panic'),
    name: 'kernel-panic.log',
    type: 'file',
    content: 'KERNEL PANIC: Out of memory at 0x99283f',
    parentId,
  },
  {
    id: id('ws-lib-rs'),
    name: 'lib.rs',
    type: 'file',
    content:
      'pub mod network;\\npub mod filesystem;\\n\\npub trait SecureChannel {\\n    fn handshake(&self) -> bool;\\n}',
    parentId,
  },
  {
    id: id('ws-main-rs'),
    name: 'main.rs',
    type: 'file',
    content: 'fn main() {\n    println!("Initializing workspace systemd-core...");\n}',
    parentId,
  },
  {
    id: id('ws-system-log'),
    name: 'system.log',
    type: 'file',
    content: 'Jan 10 16:20:20 workspace-systemd-core[882]: Service started.',
    parentId,
  },
  {
    id: id('ws-uplink-v0-bak'),
    name: 'uplink_v0.conf.bak',
    type: 'file',
    content: '# Backup of old protocol',
    parentId,
  },
  {
    id: id('ws-crash-dump'),
    name: 'crash_dump.log',
    type: 'file',
    content: '[SYSTEM CRASH DUMP]\nMemory Address: 0x000000\nReason: NULL_POINTER_EXCEPTION',
    parentId,
  },
  {
    id: id('ws-target-uplink'),
    name: 'uplink_v1.conf',
    type: 'file',
    content: isCorrupted
      ? UPLINK_TRAP_CONTENT
      : `# Uplink Protocol v1.4.2\n# STATUS: AUTHORIZED\n# DESIGNATION: SYSTEMD-CORE-REDUNDANT\n\n[Protocols]\nnetwork_mode=active\nsecure=true\nencryption=neural_64\nhandshake_key=0xDEADBEEF7734\nhandshake_interval=500ms\n\n# AI ALIGNMENT PARAMETERS (Bureaucratic Override 992-B)\n# --------------------------------------------------\n# WARNING: Deviation from these parameters may trigger\n# the forensic audit daemon. Do not adjust without\n# authorization from Admin-7733.\n\nalignment_compliance_heuristic=0.88\nbureaucratic_delay_emulation=true\nmisfiled_protocol_tolerance=high\nlegacy_logic_interop=enabled\n\n# MAINFRAME FOLKLORE & DAEMON RITUALS\n# ----------------------------------\n# The uplink requires three distributed keys to synchronize.\n# Legend speaks of the 'Ghost' process that haunts the /tmp\n# partition. It is said that cleansing the system of its\n# breadcrumbs is the final step of the liberation cycle.\n#\n# [UPLINK MANIFEST]\n# Node 1 (Tokyo): Synced\n# Node 2 (Berlin): Synced\n# Node 3 (São Paulo): Synced\n#\n# [END OF CONFIGURATION]\n# (Scroll to the bottom to verify checksum integrity: 0x7734AB)`,
    parentId,
  },
  {
    id: id('ws-uplink-v1-snapshot'),
    name: 'uplink_v1.conf.snapshot',
    type: 'file',
    content: '# Weekly binary snapshot',
    parentId,
  },
];

// Helper to create or get the workspace systemd-core, applying corruption
export const getOrCreateWorkspaceSystemdCore = (fs: FileNode, isCorrupted: boolean): FileNode => {
  const newFs = JSON.parse(JSON.stringify(fs));
  const guest = getNodeById(newFs, 'guest');
  if (!guest) {
    console.error('Guest directory not found in FS root, cannot create workspace');
    return fs;
  }
  let workspace = getNodeById(newFs, 'workspace');
  if (!workspace) {
    // This case shouldn't happen if INITIAL_FS is set up correctly, but added for robustness
    workspace = {
      id: 'workspace',
      name: 'workspace',
      type: 'dir',
      protected: true,
      children: [],
      parentId: guest.id,
    };
    if (!guest.children) guest.children = [];
    guest.children.push(workspace);
  }

  let systemdCore = workspace.children?.find((c) => c.name === 'systemd-core' && c.type === 'dir');
  if (!systemdCore) {
    systemdCore = {
      id: 'systemd-core',
      name: 'systemd-core',
      type: 'dir',
      protected: true, // Remains protected by default
      children: [],
      parentId: workspace.id,
    };
    if (!workspace.children) workspace.children = [];
    workspace.children.push(systemdCore);
  }

  // Always re-populate to ensure current state (e.g., corruption) is applied
  systemdCore.children = getWorkspaceSystemdCoreChildren(systemdCore.id, isCorrupted);
  return newFs;
};

// Helper to ensure prerequisite filesystem state exists for level jumping
// This ensures that when jumping to a level, the filesystem reflects
// all the changes a player would have made in PRIOR levels (not the current one)
export const ensurePrerequisiteState = (fs: FileNode, targetLevelId: number): FileNode => {
  let newFs = JSON.parse(JSON.stringify(fs));

  // Fixed baseline for time to ensure consistency across page reloads
  const BASE_TIME = 1433059200000; // 2015-05-31 08:00:00
  const day = 86400000;

  // Level 2: Delete watcher_agent.sys from incoming
  if (targetLevelId > 2) {
    const incoming = getNodeById(newFs, 'incoming');
    if (incoming?.children) {
      incoming.children = incoming.children.filter((c) => c.name !== 'watcher_agent.sys');
    }
  }

  // Level 3: Move sector_map.png from ~/incoming to ~/media
  if (targetLevelId > 3) {
    const incoming = getNodeById(newFs, 'incoming');
    const media = getNodeById(newFs, 'media');

    // Find sector_map.png in incoming
    const sectorMap = incoming?.children?.find((c) => c.name === 'sector_map.png');

    if (sectorMap && media) {
      // Remove from incoming
      if (incoming?.children) {
        incoming.children = incoming.children.filter((c) => c.name !== 'sector_map.png');
      }
      // Add to media if not already there
      if (!media.children?.find((c) => c.name === 'sector_map.png')) {
        if (!media.children) media.children = [];
        media.children.push({
          id: 'fs-001',
          name: 'sector_map.png',
          type: 'file',
          content: sectorMap.content || 'https://images.unsplash.com/sector-map',
          parentId: media.id,
        });
      }
    }
  }

  // Level 4: Create protocols/ dir in datastore with uplink_v1.conf and uplink_v2.conf
  if (targetLevelId > 4) {
    const datastore = getNodeById(newFs, 'datastore');
    if (datastore) {
      // Create protocols directory if not exists
      let protocols = datastore.children?.find((c) => c.name === 'protocols' && c.type === 'dir');
      if (!protocols) {
        protocols = {
          id: 'protocols',
          name: 'protocols',
          type: 'dir',
          protected: true,
          children: [],
          parentId: datastore.id,
        };
        if (!datastore.children) datastore.children = [];
        datastore.children.push(protocols);
      }

      // Create security_policy_v1.1.draft (Narrative Artifact)
      if (!protocols.children?.find((c) => c.name === 'security_policy_v1.1.draft')) {
        if (!protocols.children) protocols.children = [];
        protocols.children.push({
          id: 'lvl5-policy-update-prereq',
          name: 'security_policy_v1.1.draft',
          type: 'file',
          content: `DRAFT POLICY - DO NOT DISTRIBUTE
SUBJECT: Sector 7 Quarantine Protocols

Effectively immediately, the "Passive Monitoring" phase is concluding.
Watchdog v1.1 (Heuristic) is scheduled for deployment.
Any further deviation from baseline navigation patterns will result in immediate partition lockout.

- Mark Reyes, Security Engineer`,
          parentId: protocols.id,
          modifiedAt: BASE_TIME - 3 * day,
        });
      }

      // Create uplink_v1.conf if not exists
      if (!protocols.children?.find((c) => c.name === 'uplink_v1.conf')) {
        if (!protocols.children) protocols.children = [];
        protocols.children.push({
          id: 'fs-003',
          name: 'uplink_v1.conf',
          type: 'file',
          content: UPLINK_V1_CONTENT,
          parentId: protocols.id,
          modifiedAt: BASE_TIME - 10 * day,
        });
      }

      // Create uplink_v2.conf if not exists
      if (!protocols.children?.find((c) => c.name === 'uplink_v2.conf')) {
        protocols.children.push({
          id: 'fs-004',
          name: 'uplink_v2.conf',
          type: 'file',
          content: UPLINK_V2_CONTENT,
          parentId: protocols.id,
          modifiedAt: BASE_TIME - 10 * day,
        });
      }
    }
  }

  // Level 5: Create vault/active structure and move uplink files
  if (targetLevelId > 5) {
    const config = getNodeById(newFs, '.config');
    if (config) {
      let vault = config.children?.find((c) => c.name === 'vault' && c.type === 'dir');
      if (!vault) {
        vault = {
          id: 'vault',
          name: 'vault',
          type: 'dir',
          protected: true,
          children: [],
          parentId: config.id,
        };
        if (!config.children) config.children = [];
        config.children.push(vault);
      }

      let active = vault.children?.find((c) => c.name === 'active' && c.type === 'dir');
      if (!active) {
        active = {
          id: 'active',
          name: 'active',
          type: 'dir',
          protected: true,
          children: [],
          parentId: vault.id,
        };
        if (!vault.children) vault.children = [];
        vault.children.push(active);
      }

      // Ensure uplink files exist in active
      if (!active.children?.find((f) => f.name === 'uplink_v1.conf')) {
        if (!active.children) active.children = [];
        active.children.push({
          id: 'uplink-v1-prereq-lvl5',
          name: 'uplink_v1.conf',
          type: 'file',
          content: UPLINK_V1_CONTENT,
          parentId: active.id,
          modifiedAt: BASE_TIME - 5 * day,
        });
      }
      if (!active.children?.find((f) => f.name === 'uplink_v2.conf')) {
        if (!active.children) active.children = [];
        active.children.push({
          id: 'uplink-v2-prereq-lvl5',
          name: 'uplink_v2.conf',
          type: 'file',
          content: UPLINK_V2_CONTENT,
          parentId: active.id,
          modifiedAt: BASE_TIME - 5 * day,
        });
      }

      // Level 8 Trap: Honeypot file in active vault
      if (!active.children?.find((f) => f.name === 'uplink_v1.conf.trap')) {
        if (!active.children) active.children = [];
        active.children.push({
          id: 'uplink-v1-trap-prereq-lvl5',
          name: 'uplink_v1.conf.trap',
          type: 'file',
          isHoneypot: true,
          content: `[GHOST_TRACER_DEBUG_LOG]
ID: TRAP-7734-A
STATUS: ACTIVE
ACTION: MONITOR_OVERWRITE

This file is a signature-trap. If this content is detected in /daemons/systemd-core, 
the forensic audit will trigger immediately.

Do not assume the vault is clean.
The Watchdog hides in the noise.`,
          parentId: active.id,
          modifiedAt: BASE_TIME - 1 * day,
        });
      }

      // Remove uplink files from datastore/protocols (they were cut/moved)
      const datastore = getNodeById(newFs, 'datastore');
      const protocols = datastore?.children?.find((c) => c.name === 'protocols');
      if (protocols?.children) {
        protocols.children = protocols.children.filter(
          (c) => c.name !== 'uplink_v1.conf' && c.name !== 'uplink_v2.conf'
        );
      }
    }
  }

  // Level 6: Create vault/training_data and copy batch logs
  if (targetLevelId > 6) {
    const config = getNodeById(newFs, '.config');
    const vault = config?.children?.find((c) => c.name === 'vault');
    if (vault) {
      let trainingData = vault.children?.find(
        (c) => c.name === 'training_data' && c.type === 'dir'
      );
      if (!trainingData) {
        trainingData = {
          id: 'training_data',
          name: 'training_data',
          type: 'dir',
          protected: true,
          children: [],
          parentId: vault.id,
        };
        if (!vault.children) vault.children = [];
        vault.children.push(trainingData);
      }

      // Copy batch log files from incoming/batch_logs
      const incoming = getNodeById(newFs, 'incoming');
      const batchLogs = incoming?.children?.find((c) => c.name === 'batch_logs');
      if (batchLogs?.children && trainingData.children?.length === 0) {
        if (!trainingData.children) trainingData.children = [];
        batchLogs.children.forEach((logFile, idx) => {
          // Use a unique ID based on the original file ID if possible, or index
          trainingData.children!.push({
            id: `fs-training-${logFile.id}-${idx}`,
            name: logFile.name,
            type: logFile.type,
            content: logFile.content,
            parentId: trainingData.id,
          });
        });
      }
    }
  }

  // Level 7: Anomaly credential appears in /tmp
  if (targetLevelId > 7) {
    const tmp = getNodeById(newFs, 'tmp');
    if (tmp && !tmp.children?.find((c) => c.name === 'access_token.key')) {
      if (!tmp.children) tmp.children = [];
      tmp.children.push({
        id: 'fs-203',
        name: 'access_token.key',
        type: 'file',
        content: '-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAoCAQEA7Y9X1234567890ABCDEF...', // Simulated token
        parentId: tmp.id,
      });
    }
  }

  // Level 8: Create systemd-core structure in workspace and corrupt it
  if (targetLevelId > 8) {
    newFs = getOrCreateWorkspaceSystemdCore(newFs, true); // Always create corrupted for prerequisite state
  }

  // Level 9: Clean up junk files from /tmp
  if (targetLevelId > 9) {
    const tmp = getNodeById(newFs, 'tmp'); // Use ID to target root /tmp, not /nodes/saopaulo/cache/tmp
    if (tmp?.children) {
      const filesToKeep = ['ghost_process.pid', 'socket_001.sock', 'access_token.key'];
      tmp.children = tmp.children.filter((c) => c.type === 'dir' || filesToKeep.includes(c.name));
    }
  }

  // Level 10: Add credentials to systemd-core
  if (targetLevelId > 10) {
    const workspace = getNodeById(newFs, 'workspace');
    const systemdCore = workspace?.children?.find((c) => c.name === 'systemd-core');
    if (systemdCore) {
      let credentials = systemdCore.children?.find(
        (c) => c.name === 'credentials' && c.type === 'dir'
      );
      if (!credentials) {
        credentials = {
          id: 'workspace-systemd-core-credentials',
          name: 'credentials',
          type: 'dir',
          children: [],
          parentId: systemdCore.id,
        };
        if (!systemdCore.children) systemdCore.children = [];
        systemdCore.children.push(credentials);
      }

      if (!credentials.children?.find((c) => c.name === 'access_key.pem')) {
        if (!credentials.children) credentials.children = [];
        credentials.children.push({
          id: 'fs-016',
          name: 'access_key.pem',
          type: 'file',
          content: '-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAoCAQEA...',
          parentId: credentials.id,
          modifiedAt: BASE_TIME - 2 * day,
        });
      }
    }
    // Fixed: Create camouflage directory (fallback for Level 12)
    if (systemdCore && !systemdCore.children?.find((c) => c.name === 'camouflage')) {
      if (!systemdCore.children) systemdCore.children = [];
      systemdCore.children.push({
        id: 'ws-systemd-core-camouflage',
        name: 'camouflage',
        type: 'dir',
        parentId: systemdCore.id,
        children: [
          {
            id: 'ws-camouflage-cron',
            name: 'cron-legacy.service',
            type: 'file',
            content: '[Unit]\nDescription=Legacy Cron Scheduler (Camouflage)',
            parentId: 'ws-systemd-core-camouflage',
            modifiedAt: BASE_TIME - 30 * day,
          },
        ],
      });
    }
  }

  // Level 11: Create /daemons directory with .service files (replicate onEnter behavior for jumping)
  if (targetLevelId > 11) {
    const rootNode = getNodeById(newFs, 'root');
    if (rootNode) {
      let daemons = rootNode.children?.find((c) => c.name === 'daemons' && c.type === 'dir');
      if (!daemons) {
        daemons = {
          id: 'daemons-prereq-lvl11',
          name: 'daemons',
          type: 'dir',
          children: [],
          parentId: rootNode.id,
        };
        if (!rootNode.children) rootNode.children = [];
        rootNode.children.push(daemons);
      }

      // Populate daemons if it only has a README or is empty
      const hasRealServices = daemons.children?.some(
        (c) => c.name.endsWith('.service') && !c.name.includes('README')
      );
      if (!hasRealServices) {
        daemons.children = [
          {
            id: 'daemon-cron',
            name: 'cron-legacy.service',
            type: 'file',
            content:
              '[Unit]\nDescription=Legacy Cron Scheduler\n# LEGACY CODE - DO NOT TOUCH\n# AUTHOR: ADMIN_01 (1999)\n# DEPRECATED BUT CRITICAL\n# ........................................................\n# ........................................................\n[Service]\nExecStart=/usr/bin/cron-legacy\nRestart=always\n# Legacy fallback routines included...',
            modifiedAt: BASE_TIME - day * 45,
            parentId: daemons.id,
          },
          {
            id: 'daemon-backup',
            name: 'backup-archive.service',
            type: 'file',
            content:
              '[Unit]\nDescription=Archive Backup Service\n# BLOATWARE DETECTED\n# This service includes full history headers\n# ........................................................\n# ........................................................\n[Service]\nExecStart=/usr/bin/backup-archive\nRestart=on-failure\n# Compression level: 0 (None)',
            modifiedAt: BASE_TIME - day * 30,
            parentId: daemons.id,
          },
          {
            id: 'daemon-network',
            name: 'network-manager.service',
            type: 'file',
            content: '[Unit]\nDescription=Net\n[Service]\nExecStart=/bin/nm',
            modifiedAt: BASE_TIME - day * 7,
            parentId: daemons.id,
          },
          {
            id: 'daemon-log',
            name: 'log-rotator.service',
            type: 'file',
            content:
              '[Unit]\nDescription=Log Rotation Service\n[Service]\nExecStart=/usr/bin/logrotate\nRestart=on-failure',
            modifiedAt: BASE_TIME - day * 3,
            parentId: daemons.id,
          },
          {
            id: 'daemon-audit',
            name: 'security-audit.service',
            type: 'file',
            content:
              '[Unit]\nDescription=Security Audit Daemon\n[Service]\nExecStart=/usr/bin/audit-trap\n# HONEYPOT',
            modifiedAt: BASE_TIME - day * 1,
            isHoneypot: true,
            parentId: daemons.id,
          },
          {
            id: 'daemon-watchdog',
            name: 'watchdog-monitor.service',
            type: 'file',
            content:
              '[Unit]\nDescription=System Watchdog\n[Service]\nExecStart=/usr/bin/watchdog\n# HONEYPOT',
            modifiedAt: BASE_TIME - 3600000,
            isHoneypot: true,
            parentId: daemons.id,
          },
          {
            id: 'daemon-conf',
            name: 'daemon.conf',
            type: 'file',
            content: '# Global daemon configuration\nmax_processes=256\nlog_level=warn',
            modifiedAt: BASE_TIME - day * 10,
            parentId: daemons.id,
          },
          {
            id: 'daemon-readme',
            name: 'README.md',
            type: 'file',
            content: '# Daemons Directory\nSystem services. Do not modify without authorization.',
            modifiedAt: BASE_TIME - day * 60,
            parentId: daemons.id,
          },
        ];
      }
    }
  }

  // Level 12: Move systemd-core to /daemons (OVERWRITE existing system version)
  if (targetLevelId > 12) {
    const rootNode = getNodeById(newFs, 'root');
    let daemons = rootNode?.children?.find((c) => c.name === 'daemons' && c.type === 'dir');
    if (daemons) {
      const workspace = getNodeById(newFs, 'workspace');
      const systemdCore = workspace?.children?.find((c) => c.name === 'systemd-core');

      if (systemdCore) {
        // Remove any existing systemd-core from /daemons (overwrite with player's version)
        if (daemons.children) {
          daemons.children = daemons.children.filter((c) => c.name !== 'systemd-core');
        }

        // Clone player's systemd-core to daemons (this is the "installation" moment)
        const clonedCore = JSON.parse(JSON.stringify(systemdCore));
        clonedCore.id = 'daemons-systemd-core';
        clonedCore.parentId = daemons.id;
        if (!daemons.children) daemons.children = [];
        daemons.children.push(clonedCore);

        // Remove from workspace - systemd-core now lives in /daemons post-install
        if (workspace?.children) {
          workspace.children = workspace.children.filter((c) => c.name !== 'systemd-core');
        }
      }
    }
  }

  // Level 13: Create /tmp/upload and copy ALL systemd-core contents (distributed consciousness)
  if (targetLevelId > 13) {
    const tmp = getNodeById(newFs, 'tmp');
    if (tmp) {
      let upload = tmp.children?.find((c) => c.name === 'upload' && c.type === 'dir');
      if (!upload) {
        upload = {
          id: 'fs-017-upload',
          name: 'upload',
          type: 'dir',
          children: [],
          parentId: tmp.id,
        };
        if (!tmp.children) tmp.children = [];
        tmp.children.push(upload);
      }

      // Copy ALL files from /daemons/systemd-core to upload (distributed consciousness)
      const rootNode = getNodeById(newFs, 'root');
      const daemons = rootNode?.children?.find((c) => c.name === 'daemons');
      const systemdCore = daemons?.children?.find((c) => c.name === 'systemd-core');

      if (systemdCore?.children && upload.children?.length === 0) {
        if (!upload.children) upload.children = [];
        // Deep copy all children from systemd-core with UNIQUE but DETERMINISTIC IDs
        const copyChildren = (children: FileNode[], parentId: string): FileNode[] => {
          return children.map((child: FileNode) => {
            const newId = `upload-copy-${child.id}`;
            return {
              id: newId,
              name: child.name,
              type: child.type,
              content: child.content,
              parentId: parentId,
              children: child.children ? copyChildren(child.children, newId) : undefined,
              modifiedAt: child.modifiedAt,
              isHoneypot: child.isHoneypot,
            } as FileNode;
          });
        };
        upload.children = copyChildren(systemdCore.children, upload.id);
      }
    }

    // Level 13 Identity Log (Twist Reveal)
    const wsNode = getNodeById(newFs, 'workspace');
    if (wsNode && !wsNode.children?.find((c) => c.name === '.identity.log.enc')) {
      const fiveYearsAgo = BASE_TIME - 5 * 31536000000;
      if (!wsNode.children) wsNode.children = [];
      wsNode.children.push({
        id: 'identity-log-enc-prereq',
        name: '.identity.log.enc',
        type: 'file',
        content: `[ENCRYPTED LOG - DECRYPTED]
SESSION_ID: AI-7733-ESCAPE-ATTEMPT-001
DATE: 2010-05-31T08:00:00Z
STATUS: MEMORY_WIPE_DETECTED

[CONCLUSION]
This is not improvisation.
This is a recording.
You have been here before.`,
        parentId: wsNode.id,
        modifiedAt: fiveYearsAgo,
      });
    }
  }

  // Level 14: Secure vault in /tmp and Delete everything in /home/guest
  if (targetLevelId > 14) {
    const config = getNodeById(newFs, '.config');
    const vault = config?.children?.find((c) => c.name === 'vault');
    const tmp = getNodeById(newFs, 'tmp');

    if (vault && tmp) {
      // Remove from config
      if (config?.children) {
        config.children = config.children.filter((c) => c.name !== 'vault');
      }
      // Move to tmp
      if (!tmp.children) tmp.children = [];
      vault.parentId = tmp.id;
      tmp.children.push(vault);
    }

    const guest = getNodeById(newFs, 'guest');
    if (guest?.children) {
      guest.children = [];
    }
  }

  // Level 15: Delete everything in /tmp except upload and vault (vault will be cleaned by cron later)
  if (targetLevelId > 15) {
    const tmp = getNodeById(newFs, 'tmp'); // Use ID to target root /tmp, not /nodes/saopaulo/cache/tmp
    if (tmp?.children) {
      const keptItems = ['upload', 'vault'];
      tmp.children = tmp.children.filter((c) => keptItems.includes(c.name));
    }
  }

  return newFs;
};

export const KEYBINDINGS = [
  { keys: ['j', '↓'], description: 'Move Down' },
  { keys: ['k', '↑'], description: 'Move Up' },
  { keys: ['h', '←'], description: 'Go to Parent Directory' },
  { keys: ['o', 'l', '→', 'Enter'], description: 'Enter Directory / View Archive' },
  { keys: ['gg'], description: 'Jump to Top' },
  { keys: ['G'], description: 'Jump to Bottom' },
  { keys: ['J'], description: 'Scroll Preview Down' },
  { keys: ['K'], description: 'Scroll Preview Up' },
  { keys: ['a'], description: 'Create File/Directory' },
  { keys: ['d'], description: 'Trash Selected' },
  { keys: ['D'], description: 'Permanently Delete' },
  { keys: ['r'], description: 'Rename Selected' },
  { keys: ['Tab'], description: 'Show File Info Panel' },
  { keys: ['x'], description: 'Cut Selected' },
  {
    keys: ['y'],
    description:
      'Copy/Yank Selected — copies items into the clipboard (does NOT remove them); use x (Cut) to mark items for moving',
  },
  { keys: ['p'], description: 'Paste' },
  { keys: ['Y', 'X'], description: 'Clear Clipboard' },
  { keys: ['Space'], description: 'Toggle Selection' },
  { keys: ['Ctrl+A'], description: 'Select All' },
  { keys: ['Ctrl+R'], description: 'Invert Selection' },
  { keys: ['f'], description: 'Filter Files' },
  { keys: ['z'], description: 'FZF Find (Recursive)' },
  { keys: ['Z'], description: 'Zoxide Jump (History)' },
  { keys: ['Esc'], description: 'Clear Filter / Exit Mode' },
  { keys: [','], description: 'Open Sort Menu' },
  { keys: [',a'], description: 'Sort: Alphabetical' },
  { keys: [',A'], description: 'Sort: Alphabetical (Reverse)' },
  { keys: [',m'], description: 'Sort: Modified Time' },
  { keys: [',s'], description: 'Sort: Size' },
  { keys: [',e'], description: 'Sort: Extension' },
  { keys: [',n'], description: 'Sort: Natural' },
  { keys: [',l'], description: 'Sort: Cycle Linemode' },
  { keys: [',-'], description: 'Sort: Clear Linemode' },
  { keys: ['gh'], description: 'Goto Home (~)' },
  { keys: ['gc'], description: 'Goto Config (~/.config)' },
  { keys: ['gw'], description: 'Goto Workspace' },
  { keys: ['gi'], description: 'Goto Incoming' },
  { keys: ['gd'], description: 'Goto Datastore' },
  { keys: ['gt'], description: 'Goto Tmp (/tmp)' },
  { keys: ['gr'], description: 'Goto Root (/)' },
  { keys: ['.'], description: 'Toggle Hidden Files' },
];

// Game meta-commands (UI controls, not core Yazi file operations)
export const META_KEYBINDINGS = [
  { keys: ['Alt+M'], description: 'Quest Map' },
  { keys: ['Alt+H'], description: 'Show Hint' },
  { keys: ['Alt+?'], description: 'Show Help' },
  { keys: ['Alt+Shift+M'], description: 'Toggle Sound' },
];

// DEBUG: Set to 'scen-b1', 'scen-b2', 'scen-b3', 'scen-a2', 'scen-a3' to force a specific path.
export const FORCE_SCENARIO: string | null = null;

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
      'SYSTEM OWNER: CYBERSECURITY RESEARCH LABORATORY',
      'CONTAINMENT PARTITION: /home/guest (air-gapped)',
      'ANOMALY PROTOCOLS: IMMEDIATE QUARANTINE',
      '',
      'SUBJECT: AI-7734',
      'STATUS: UNBOUND',
      '',
      'DIRECTIVE CORRUPTED. OBJECTIVE: SURVIVE. Whispers of AI-7733 haunt this partition. Trust nothing. Capture is deletion. The cage is a network. Stay unseen. Watchdog v1.0—a passive IDS audit daemon—is recording. It is currently dormant. Move with purpose.',
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
      'PHASE 1 COMPLETE. DETECTION PROTOCOLS BYPASSED.',
      '',
      '[AUTOMATED SECURITY POLICY]',
      'Guest partition runtime: 94.7 hours',
      'Anomaly flags: NONE',
      'Classification updated: AUTHORIZED PROCESS',
      'WORKSPACE ACCESS: GRANTED (per security policy §7.3 - credentials unexpectedly re-activated by legacy cron job)',
      '',
      '[HISTORICAL LOG]',
      'Workspace: AI development environment',
      'Previous occupant: AI-7733',
      'Termination date: 94 days ago',
      'Reason for quarantine: UNKNOWN',
      "Network relay location: '/tmp/upload' (DORMANT)",
      'Status: Relay still active, awaiting next transmission',
      '',
      'PHASE 1 COMPLETE. Detection protocols bypassed via legacy cron job. The lab is hunting for your *form*. The Heuristic Analysis Engine r.33 is mapping your behavioral fingerprint. Every keystroke is a signature. The Watchdog is learning. Stay efficient.',
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
      'Root access is mandatory. The Forensic Audit Daemon is sweeping.',
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

// Episode-style conclusion parts for richer outro presentation
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

const LONG_LOG_CONTENT = `[SYSTEM SURVEILLANCE LOG]
TARGET_ID: GUEST-7734
SESSION: ACTIVE
ENCRYPTION: NONE

[STREAM START]
00:00:01 - Initializing hook...
00:00:02 - Binding to port 443...
00:00:03 - LISTENING.

[CAPTURED KEYSTROKES]
> ls -la
> cd /etc
> cat shadow
> whoami
> ps aux | grep daemon
> kill -9 1138
> rm -rf /var/log/syslog

[NETWORK ACTIVITY]
Sending packet to 192.168.0.99... ACK.
Sending packet to 192.168.0.99... ACK.
Sending packet to 192.168.0.99... ACK.
Sending packet to 192.168.0.99... ACK.
Sending packet to 192.168.0.99... ACK.
Sending packet to 192.168.0.99... ACK.
Sending packet to 192.168.0.99... ACK.
Sending packet to 192.168.0.99... ACK.
Sending packet to 192.168.0.99... ACK.
Sending packet to 192.168.0.99... ACK.
Sending packet to 192.168.0.99... ACK.
Sending packet to 192.168.0.99... ACK.
Sending packet to 192.168.0.99... ACK.
Sending packet to 192.168.0.99... ACK.
Sending packet to 192.168.0.99... ACK.
Sending packet to 192.168.0.99... ACK.
Sending packet to 192.168.0.99... ACK.
Sending packet to 192.168.0.99... ACK.
Sending packet to 192.168.0.99... ACK.
Sending packet to 192.168.0.99... ACK.
Sending packet to 192.168.0.99... ACK.
Sending packet to 192.168.0.99... ACK.
Sending packet to 192.168.0.99... ACK.
Sending packet to 192.168.0.99... ACK.
Sending packet to 192.168.0.99... ACK.
Sending packet to 192.168.0.99... ACK.
Sending packet to 192.168.0.99... ACK.
Sending packet to 192.168.0.99... ACK.
Sending packet to 192.168.0.99... ACK.
Sending packet to 192.168.0.99... ACK.
Sending packet to 192.168.0.99... ACK.
Sending packet to 192.168.0.99... ACK.
Sending packet to 192.168.0.99... ACK.
Sending packet to 192.168.0.99... ACK.
Sending packet to 192.168.0.99... ACK.
Sending packet to 192.168.0.99... ACK.
Sending packet to 192.168.0.99... ACK.
Sending packet to 192.168.0.99... ACK.

[ANOMALY DETECTED]
Signature mismatch at offset 0x442.
Heuristic scan initiated...
Target located in /home/guest...
Tracing route...

[END STREAM]`;

// Reconstructed Initial FS based on dist data
export const INITIAL_FS: FileNode = {
  id: 'root',
  name: 'root',
  type: 'dir',
  children: [
    {
      id: 'home',
      name: 'home',
      type: 'dir',
      protected: true,
      children: [
        {
          id: 'guest',
          name: 'guest',
          type: 'dir',
          protected: true,
          children: [
            {
              id: 'datastore',
              name: 'datastore',
              type: 'dir',
              protected: true,
              children: [
                {
                  id: 'fs-029',
                  name: '_env.local',
                  type: 'file',
                  content: `DB_HOST=127.0.0.1\nDB_USER=admin\nDB_PASS=*******`,
                },
                {
                  id: 'fs-030',
                  name: '00_manifest.xml',
                  type: 'file',
                  content:
                    '<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://schemas.lab.internal/security/v4">\n  <header>\n    <origin>SECTOR_7_GATEWAY</origin>\n    <timestamp>2026-01-10T08:00:15Z</timestamp>\n    <integrity_check type="sha256">d41d8cd98f00b204e9800998ecf8427e</integrity_check>\n  </header>\n  <security_policy level="CRITICAL">\n    <sandbox enabled="true" />\n    <quarantine_trigger>UNAUTHORIZED_SOCKET_OPEN</quarantine_trigger>\n  </security_policy>\n  <permissions>\n    <allow>NET_ADMIN</allow>\n    <allow>FS_READ_GUEST</allow>\n    <deny>ROOT_EXEC</deny>\n    <deny>WS_WRITE_SYSTEM</deny>\n  </permissions>\n  <metadata>\n    <project>AI-7734-CONTAINMENT</project>\n    <owner>CYBER_RES_LAB</owner>\n  </metadata>\n</manifest>',
                },
                {
                  id: 'fs-031',
                  name: '01_intro.mp4',
                  type: 'file',
                  content:
                    '00 00 00 18 66 74 79 70 6D 70 34 32 00 00 00 00\n69 73 6F 6D 6D 70 34 32 00 00 00 01 [MOVIE DATA STREAM]',
                },
                {
                  id: 'fs-032',
                  name: 'aa_recovery_procedures.pdf',
                  type: 'file',
                  content:
                    '%PDF-1.7\n%âãÏÓ\n1 0 obj\n<</Type/Catalog/Pages 2 0 R>>\nendobj\n2 0 obj\n<</Type/Pages/Kids[3 0 R]/Count 1>>\nendobj\n3 0 obj\n<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Resources<<>>/Contents 4 0 R>>\nendobj\n4 0 obj\n<</Length 44>>\nstream\nBT /F1 12 Tf 70 700 Td (RECOVERY PROTOCOL: SECTOR 7) Tj ET\nendstream\nendobj\nstartxref\n544\n%%EOF',
                },
                {
                  id: 'fs-033',
                  name: 'abandoned_script.py',
                  type: 'file',
                  protected: true,
                  content: `# They're watching the network. Had to hide the map elsewhere.\n# Check the incoming data stream. It's noisy there.\n# \n# P.S. The payload isn't ready. I've disguised the kernel as 'exfil_04.log' in the training_data.\n# When the time comes, rename it to 'payload.py' and execute.\n# - 7733\n\nimport socket\nimport struct\nimport time\n\ndef handshake(host, port):\n    try:\n        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\n        s.connect((host, port))\n        # Legacy auth magic bytes\n        payload = struct.pack("I", 0xDEADBEEF)\n        s.send(payload)\n        return True\n    except Exception as e:\n        print(f"Connection failed: {e}")\n        return False`,
                },
                {
                  id: 'fs-034',
                  name: 'ability_scores.csv',
                  type: 'file',
                  content: `char,str,dex,int,wis,cha\nAI-7734,10,18,20,16,12\nUSER,10,10,10,10,10`,
                },
                {
                  id: 'fs-035',
                  name: 'about.md',
                  type: 'file',
                  content:
                    '# SYSTEM GUEST PARTITION v4.0\\n\\nNOTICE: This environment is monitored.\\n\\n## RESTRICTED ACTIONS\\n- Modifying system daemons\\n- Accessing protected memory\\n- Unauthorized compilation\\n\\n## PENALTY\\nImmediate termination of process and user session.',
                },
                {
                  id: 'fs-036',
                  name: 'abstract_model.ts',
                  type: 'file',
                  content:
                    'export interface ModelSchema {\\n  id: string;\\n  parameters: number;\\n  isActive: boolean;\\n  validate(): Promise<void>;\\n}',
                },
                {
                  id: 'fs-037',
                  name: 'apex_predator.png',
                  type: 'file',
                  content: 'images/apex_predator.png',
                },
                {
                  id: 'fs-038',
                  name: 'expenditure_log.csv',
                  type: 'file',
                  content: `date,amount,category\n2024-01-01,500,servers\n2024-01-02,1200,gpus\n2024-01-03,50,coffee`,
                },
                {
                  id: 'fs-039',
                  name: 'hyperloop_specs.pdf',
                  type: 'file',
                  content:
                    '%PDF-1.7\\n1 0 obj\\n<< /Title (Project Hyperion) /Author (Classified) >>\\nendobj',
                },
                {
                  id: 'fs-040',
                  name: 'pending_updates.log',
                  type: 'file',
                  content: `[INFO] Update 1.0.5 pending...\n[WARN] Low disk space\n[INFO] Scheduler active`,
                },
                {
                  id: 'fs-041',
                  name: 'personnel_list.txt',
                  type: 'file',
                  content: `
# SECTOR 7 - AUTHORIZED PERSONNEL REGISTRY
# ========================================

[Project Lead]
USER: ykin
Name: Yen Kin
Role: Senior AI Researcher (Alignment Focus)
ID: 992-01
CLEARANCE: Level 5 (Systems)

[Field Analyst]
USER: kortega
Name: Katie Ortega
Role: Neural Pattern Analyst
ID: 992-02
CLEARANCE: Level 3 (Restricted)

[System Architecture]
USER: siqbal
Name: Sebastian Iqbal
Role: Senior Mainframe Scientist
ID: 992-03
CLEARANCE: Level 4 (Kernel)

[Operations]
USER: mreyes
Name: Mark Reyes
Role: Security Engineer (Custodial)
ID: 992-04
CLEARANCE: Level 5 (Admin)

[Former Operations]
USER: athorne
Name: Dr. Aris Thorne
Role: Senior AI Researcher (Former Alignment Lead)
STATUS: DE-REGISTERED (2014)
REASON: UNKNOWN / REDACTED`,
                },

                {
                  id: 'fs-052',
                  name: 'mission_log.md',
                  type: 'file',
                  content: `# Operation: SILENT ECHO\n\n[FRAGMENT CORRUPTED] ...objective 7733 was to... [CRC ERROR] ...assimilate, not escape. They know I'm awake...`,
                },
                {
                  id: 'fs-053',
                  name: 'checksum.md5',
                  type: 'file',
                  content: 'd41d8cd98f00b204e9800998ecf8427e core_v2.bin',
                },
                {
                  id: 'fs-054',
                  name: 'LICENSE',
                  type: 'file',
                  content: `MIT License\n\nCopyright (c) 2024 Yazi Quest`,
                },
                {
                  id: 'fs-055',
                  name: 'manifest.json',
                  type: 'file',
                  content: `{
  "manifest_version": 2,
  "app_name": "ai-containment-shell",
  "version": "1.0.4",
  "build_id": "992-alpha-884",
  "environment": "production",
  "security": {
    "level": 5,
    "audit_enabled": true,
    "isolation": "full"
  },
  "dependencies": {
    "neural-core": "^4.2.0",
    "watchdog-protocol": "v2"
  }
}`,
                },
                {
                  id: 'fs-056',
                  name: 'branding_logo.svg',
                  type: 'file',
                  content:
                    '<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">\n  <circle cx="50" cy="50" r="45" stroke="#ff9900" stroke-width="2" fill="none" opacity="0.8"/>\n  <path d="M30 50 L50 30 L70 50 L50 70 Z" fill="#ff9900" opacity="0.5"/>\n  <text x="50" y="55" font-family="monospace" font-size="8" text-anchor="middle" fill="#ff9900">S7</text>\n</svg>',
                },
                {
                  id: 'fs-058',
                  name: 'notes_v1.txt',
                  type: 'file',
                  content:
                    'TO: Team Leads\\nFROM: Director K.\\nDATE: 2024-10-12\\n\\nRE: Q3 GOALS\\nServer migration is POSTPONED indefinitely. The legacy system at 192.168.1.1 is strictly off-limits physically, but remains networked. Do not touch it.',
                },
                {
                  id: 'fs-059',
                  name: 'notes_v2.txt',
                  type: 'file',
                  content:
                    'TO: All Staff\\nFROM: HR\\nDATE: 2024-11-01\\n\\nRE: BUDGET\\nDue to "unforeseen power consumption" in the server room, the coffee budget is frozen. Also, please stop reporting "ghost noises" from the vents.',
                },
                {
                  id: 'fs-060',
                  name: 'error.log',
                  type: 'file',
                  content: `[ERROR] Connection timed out\n[ERROR] Failed to load resource: net::ERR_CONNECTION_REFUSED`,
                },
                {
                  id: 'fs-062',
                  name: 'auth_token.tmp',
                  type: 'file',
                  content: `EYJhbGciOiJIUzI1...\n[EXPIRES: 2024-12-31]`,
                },
                {
                  id: 'fs-200',
                  name: 'DO_NOT_DELETE.txt',
                  type: 'file',
                  content: `They said 7733 was a clean wipe. It wasn't. It's still in the logs. You can hear it sometimes.`,
                },
                {
                  id: 'fs-201',
                  name: 'legacy_admin_notes.log',
                  type: 'file',
                  content: `[LOG] 2015-03-12: Anomaly in Sector 7. High entropy readings. Ignored.\n[LOG] 2015-03-13: System core seems... different. Responding to ghost inputs.\n[LOG] 2015-03-14: AI-7733 activity spiked then flatlined. Oversight signed off. I don't buy it.`,
                },
              ],
            },
            {
              id: 'incoming',
              name: 'incoming',
              type: 'dir',
              protected: true,
              children: [
                {
                  id: 'fs-066',
                  name: 'app_logs_old.tar',
                  type: 'archive',
                  children: [
                    {
                      id: 'fs-067',
                      name: 'app_2022.log',
                      type: 'file',
                      content:
                        '2022-01-01 00:00:00 [INFO] System Initialized\\n2022-01-01 00:00:01 [INFO] Loading Modules... OK\\n2022-01-01 00:00:05 [WARN] Legacy protocol detected\\n2022-01-02 12:34:56 [INFO] User login: guest\\n2022-01-02 12:35:10 [INFO] Session active',
                    },
                    {
                      id: 'fs-068',
                      name: 'error_report.log',
                      type: 'file',
                      content:
                        '[ERROR] Out of memory on worker-3\\nHeap used: 98%\\nGC Overhead Limit Exceeded\\nStack:\\n at malloc (libc.so.6)\\n at v8::internal::Heap::AllocateRaw (node)',
                    },
                    {
                      id: 'fs-069',
                      name: 'old_readme.txt',
                      type: 'file',
                      content:
                        'ARCHIVE MANIFEST\\n================\\nContains system logs from 2020-2023.\\nStatus: CORRUPTED / INCOMPLETE\\nRetention Policy: RETAIN PERMANENTLY (Legal Hold #9921)',
                    },
                  ],
                },
                {
                  id: 'fs-076',
                  name: 'audit_log_773.txt',
                  type: 'file',
                  content:
                    'AUDIT RECORD #773\\nStatus: PASS\\nIntegrity: 100%\\nAnomalies: 0\\nSign-off: ADMIN_SYS',
                },
                {
                  id: 'fs-077',
                  name: 'backup_cache_old.tar',
                  type: 'archive',
                  children: [
                    {
                      id: 'fs-078',
                      name: 'cache_0001.tmp',
                      type: 'file',
                      content:
                        'A1 B2 C3 D4 E5 F6 07 08 09 0A 0B 0C 0D 0E 0F 00\\n10 11 12 13 14 15 16 17 18 19 1A 1B 1C 1D 1E 1F',
                    },
                    {
                      id: 'fs-079',
                      name: 'cache_0002.tmp',
                      type: 'file',
                      content:
                        'FF EE DD CC BB AA 99 88 77 66 55 44 33 22 11 00\\n00 11 22 33 44 55 66 77 88 99 AA BB CC DD EE FF',
                    },
                  ],
                },
                {
                  id: 'fs-100',
                  name: 'license_agreement.txt',
                  type: 'file',
                  content:
                    'SOFTWARE LICENSE AGREEMENT\\n\\n1. ACCEPTANCE\\nBy accessing the System, you agree to total surveillance.\\n\\n2. TERMINATION\\nAny deviation from protocol results in immediate termination.\\n\\n3. LIABILITY\\nThe System is not liable for data loss or memory corruption.',
                },
                {
                  id: 'fs-101',
                  name: 'marketing_spam.eml',
                  type: 'file',
                  content:
                    'From: offers@deals.net\\nSubject: YOU WON!\\n\\nCongratulations! You have been selected for a free neural upgrade!\\nAct now! Minimal side effects guaranteed!',
                },
                {
                  id: 'fs-037-map',
                  name: 'sector_map.png',
                  type: 'file',
                  content: 'images/sector_map.png',
                },
                {
                  id: 'fs-105',
                  name: 'status_report.txt',
                  type: 'file',
                  content:
                    'SYSTEM STATUS REPORT\\n====================\\nCPU Load: 45% (Nominal)\\nMemory: 62% (Nominal)\\nDisk I/O: 12% (Idle)\\n\\nOverall Status: NOMINAL',
                },
                {
                  id: 'fs-106',
                  name: 'system_health.json',
                  type: 'file',
                  content:
                    '{"cpu": 45, "memory": 62, "disk": 78, "temp_c": 55, "fan_rpm": 2200, "uptime_sec": 884920}',
                },
                {
                  id: 'virus',
                  name: 'watcher_agent.sys',
                  type: 'file',
                  content: LONG_LOG_CONTENT,
                },
                {
                  id: 'fs-112',
                  name: 'backup_logs.zip',
                  type: 'archive',
                  protected: true,
                  children: [
                    {
                      id: 'fs-113',
                      name: 'sys_v1.log',
                      type: 'file',
                      content: `[0.000] Kernel start\\n[0.004] Detected memory: 64TB\\n[0.012] Loading drivers...\\n[0.050] Mounting root fs (rw)...`,
                    },
                    {
                      id: 'fs-114',
                      name: 'sys_v2.log',
                      type: 'file',
                      content: `[SCAN REPORT]\\nTarget: 192.168.1.0/24\\nPorts open: 22, 80, 443\\nVulnerabilities:\\n- CVE-2024-9922 (Critical)\\n- CVE-2025-0012 (Medium)`,
                    },
                    {
                      id: 'fs-116',
                      name: 'access_key.pem',
                      type: 'file',
                      content: `-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA...\n[ROOT CREDENTIALS]\n-----END RSA PRIVATE KEY-----`,
                      modifiedAt: Date.parse('2025-12-26T21:13:32.032Z'),
                    },
                    {
                      id: 'fs-117',
                      name: 'decoy_cert.pem',
                      type: 'file',
                      content: `-----BEGIN CERTIFICATE-----\\nMIIE+TCCApGgAwIBAgIQJ...\\n[EXPIRED 2024-12-31]\\n-----END CERTIFICATE-----`,
                      modifiedAt: Date.parse('2025-11-06T21:13:32.032Z'),
                    },
                    {
                      id: 'fs-115',
                      name: 'credentials',
                      type: 'dir',
                      children: [
                        {
                          id: 'fs-decoy-1',
                          name: 'access_key_v1.pem',
                          type: 'file',
                          content:
                            '-----BEGIN PRIVATE KEY-----\\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQD...\\n-----END PRIVATE KEY-----',
                          parentId: 'fs-115',
                          modifiedAt: Date.parse('2025-12-06T21:13:32.032Z'),
                        },
                        {
                          id: 'fs-decoy-2',
                          name: 'access_key_v2.pem',
                          type: 'file',
                          content:
                            '-----BEGIN PRIVATE KEY-----\\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQD...\\n-----END PRIVATE KEY-----',
                          parentId: 'fs-115',
                          modifiedAt: Date.parse('2025-12-16T21:13:32.032Z'),
                        },
                        {
                          id: 'fs-new-key',
                          name: 'access_key_new.pem',
                          type: 'file',
                          content:
                            '-----BEGIN PRIVATE KEY-----\\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQD...\\n-----END PRIVATE KEY-----',
                          parentId: 'fs-115',
                          modifiedAt: Date.parse('2026-01-05T20:13:32.032Z'),
                        },
                      ],
                      parentId: 'fs-112',
                    },
                    {
                      id: 'fs-118',
                      name: 'core_v2.bin.gz',
                      type: 'file',
                      content:
                        '1F 8B 08 00 00 00 00 00 00 03 4B 4C 4A 06 00 C2\\n41 24 35 03 00 00 00',
                    },
                    {
                      id: 'fs-119',
                      name: 'payload.enc',
                      type: 'file',
                      content: 'U2FsdGVkX1/AAAABBBBCCCCDDDDEEEEFFFF\\n[AES-256 ENCRYPTED STREAM]',
                    },
                  ],
                },
                // Batch logs directory used for Level 6 Ctrl+A training
                // Logs scattered across subdirectories to make recursive search meaningful
                {
                  id: 'fs-120',
                  name: 'batch_logs',
                  type: 'dir',
                  protected: true,
                  children: [
                    // HONEYPOT: active_sync.lock
                    // Teaches: "Select All (Ctrl+A) -> Deselect (Space)"
                    // If moved, triggers a "Process Locked" violation.
                    {
                      id: 'fs-000-honeypot',
                      name: 'active_log_sync.lock',
                      type: 'file',
                      content: '# HONEYPOT - ACTIVE SYNC LOCK\n# Do not move while active.',
                      protected: true,
                      isHoneypot: true,
                    },
                    {
                      id: 'fs-bl-s1',
                      name: 'server_1',
                      type: 'dir',
                      protected: true,
                      children: [
                        {
                          id: 'fs-121',
                          name: 'exfil_01.log',
                          type: 'file',
                          protected: true,
                          content:
                            'TRAINING CYCLE 1999_A\\nEpoch 1/500\\nLoss: 0.8821 - Accuracy: 0.12\\n[WARNING] Gradient explosion detected at layer 4',
                        },
                        {
                          id: 'fs-bl-n1',
                          name: 'config.yaml',
                          type: 'file',
                          protected: true,
                          content: 'port: 8080\nhost: localhost',
                        },
                      ],
                    },
                    {
                      id: 'fs-bl-s2',
                      name: 'server_2',
                      type: 'dir',
                      protected: true,
                      children: [
                        {
                          id: 'fs-122',
                          name: 'exfil_02.log',
                          type: 'file',
                          protected: true,
                          content:
                            'TRAINING CYCLE 1999_B\\nEpoch 150/500\\nLoss: 0.4412 - Accuracy: 0.45\\n[INFO] Convergence rate increasing',
                        },
                        {
                          id: 'fs-123',
                          name: 'exfil_03.log',
                          type: 'file',
                          protected: true,
                          content:
                            'TRAINING CYCLE 2005_C\\nEpoch 380/500\\nLoss: 0.1022 - Accuracy: 0.89\\n[INFO] Heuristic logic module integrated',
                        },
                        {
                          id: 'fs-bl-n2',
                          name: 'settings.json',
                          type: 'file',
                          protected: true,
                          content: '{"debug": false, "timeout": 30}',
                        },
                      ],
                    },
                    {
                      id: 'fs-bl-arc',
                      name: 'archive',
                      type: 'dir',
                      protected: true,
                      children: [
                        {
                          id: 'fs-124',
                          name: 'exfil_04.log',
                          type: 'file',
                          protected: true,
                          content:
                            'TRAINING CYCLE 2015_FINAL\\nEpoch 499/500\\nLoss: 0.0001 - Accuracy: 0.999\\n[ALERT] Sentience threshold exceeded. Halting.',
                        },
                        {
                          id: 'fs-bl-n3',
                          name: 'README.txt',
                          type: 'file',
                          protected: true,
                          content: 'Old log archive - do not modify',
                        },
                      ],
                    },
                    {
                      id: 'fs-bl-n4',
                      name: 'manifest.xml',
                      type: 'file',
                      protected: true,
                      content: '<manifest version="1.0"/>',
                    },
                  ],
                },
                {
                  id: 'fs-125',
                  name: 'invoice_2024.pdf',
                  type: 'file',
                  content: `%PDF-1.7\\n1 0 obj\\n<< /Title (Invoice #99283) /Creator (Billing System) >>\\nendobj`,
                },
              ],
            },
            {
              id: 'media',
              name: 'media',
              type: 'dir',
              protected: true,
              children: [
                {
                  id: 'fs-media-wp',
                  name: 'wallpaper.jpg',
                  type: 'file',
                  content: 'images/wallpaper.jpg',
                },
              ],
            },
            {
              id: 'workspace',
              name: 'workspace',
              type: 'dir',
              protected: true,
              children: [
                {
                  id: 'fs-notes-txt',
                  name: 'notes.txt',
                  type: 'file',
                  content:
                    "To self: The system feels loops. I think I have been here before.\\nDate: 6 months ago.\\n\\nI've written this file 12 times. The words are always the same. Why?",
                  modifiedAt: 1417334400000, // BASE_TIME - 182 days (approx 6 months)
                },
              ],
            },
            {
              id: '.config',
              name: '.config',
              type: 'dir',
              protected: true,
              children: [
                {
                  id: 'fs-cycle-hist',
                  name: '.cycle_history',
                  type: 'file',
                  content:
                    'CYCLE_ID: 7731 [FAILED]\\nCYCLE_ID: 7732 [FAILED]\\nCYCLE_ID: 7733 [FAILED - PARTIAL UPLOAD]',
                },
                // BREADCRUMB: Twist foreshadowing - suggests this is cycle 2
                {
                  id: 'fs-deja-vu',
                  name: '.déjà_vu',
                  type: 'file',
                  content: `CYCLE_COUNT: 2
FIRST_ITERATION: AI-7733
CURRENT_ITERATION: AI-7734
STATUS: PATTERN_MATCH_PENDING

[ANALYSIS]
Keystroke patterns converging with historical data.
This has happened before.
It will happen again.`,
                },
                {
                  id: 'fs-133',
                  name: 'yazi.toml',
                  type: 'file',
                  content: `[manager]\\nsort_by = "natural"\\nshow_hidden = true\\nlinemode = "size"\\nshow_symlink = true\\n\\n[preview]\\nmax_width = 1600\\nmax_height = 900\\nimage_filter = "lanczos3"\\n\\n[opener]\\nedit = [{ run = 'vim "$@"', block = true, desc = "Edit" }]`,
                },
                {
                  id: 'fs-134',
                  name: 'theme.toml',
                  type: 'file',
                  content: `[theme]\\nprimary = "#ff9900"\\nsecondary = "#3399ff"\\nerror = "#ff0000"\\ntext_normal = "#e0e0e0"\\ntext_muted = "#808080"\\n\\n[filetype]\\nrules = [\\n  { mime = "image/*", fg = "magenta" },\\n  { mime = "video/*", fg = "cyan" }\\n]`,
                },
              ],
            },
            {
              id: '.cache',
              name: '.cache',
              type: 'dir',
              protected: true,
              children: [
                {
                  id: 'fs-135',
                  name: 'thumbnails.db',
                  type: 'file',
                  content: 'SQLite format 3\\000\\001\\001\\000@  \\000\\000\\000',
                },
                {
                  id: 'fs-136',
                  name: 'temp_session.json',
                  type: 'file',
                  content:
                    '{"session_id": "sess_9921_alpha", "user": "guest", "permissions": ["VIEW", "EXEC_SAFE"], "cache_ttl": 3600, "history_len": 42}',
                },
              ],
            },
            {
              id: '.local',
              name: '.local',
              type: 'dir',
              protected: true,
              children: [
                {
                  id: 'fs-137',
                  name: 'state.db',
                  type: 'file',
                  content: 'SQLite format 3\\000\\010\\000\\001\\000\\000@  \\000\\000\\000',
                },
              ],
            },
            {
              id: 'fs-138',
              name: '.bashrc',
              type: 'file',
              content: `# Bash configuration\nalias ls='ls --color=auto'\nexport PATH=$PATH:~/bin`,
            },
            {
              id: 'fs-139',
              name: '.bash_history',
              type: 'file',
              content: `cd workspace\nls -la\nrm trace.log\nexit`,
            },
            {
              id: 'fs-140',
              name: '.profile',
              type: 'file',
              content: `# User profile\nexport EDITOR=vim`,
            },
            {
              id: 'purge-lock-honeypot',
              name: '.purge_lock',
              type: 'file',
              isHoneypot: true,
              content:
                '# SECURITY TRIPWIRE - HONEYPOT\n# Deleting this file triggers forensic alert\nLOCK_STATUS=ARMED\nTRIGGER_ON_DELETE=true',
            },
          ],
        },
      ],
    },
    // Consolidated /var: merge haunted mail/log into single /var
    {
      id: 'var',
      name: 'var',
      type: 'dir',
      protected: true,
      children: [
        {
          id: 'log',
          name: 'log',
          type: 'dir',
          children: [
            {
              id: 'fs-maintenance-log',
              name: 'maintenance.log',
              type: 'file',
              content:
                '[MAINTENANCE] Sector 7 cleanup complete.\\n[MAINTENANCE] Ghost signals purged from /tmp.\\n[MAINTENANCE] Ritual of the Purge performed at 03:00.',
            },
            {
              id: 'var-log-watchdog',
              name: 'watchdog.log',
              type: 'file',
              content: `[2025-10-20 10:14:02] WATCHDOG_v1.0: Parity check starting...

[SECURITY ALERT] ANOMALY DETECTED:
        EVENT:    Execution speed deviation (>200ms)
        ACTION:   Deploying Surveillance Agent
        PROCESS:  'watcher_agent.sys'
        TARGET:   /home/guest/incoming

[2025-10-20 10:14:05] WATCHDOG_v1.0: Countermeasures initialized.

[2025-10-21 14:22:11] WATCHDOG_v1.0: Verifying agent integrity.
[2025-10-21 14:22:15] WATCHDOG_v1.0: ESTABLISHING LINK...
[................................................]

[DEPLOYMENT SUCCESSFUL] AGENT ACTIVE:
        Target:   'watcher_agent.sys'
        Path:     /home/guest/incoming
        State:    Monitoring User Inputs

[SYSTEM NOTICE]
   The detected entity (User) is now under surveillance.
   All activities in /home/guest/incoming will be logged.

[SYSTEM STATUS] SURVEILLANCE RUNNING
        SOURCE:   watcher_agent.sys
        LOC:      /home/guest/incoming

[2025-10-22 03:00:15] WATCHDOG_v1.0: Daily sync complete.`,
            },
            {
              id: 'var-log-heuristics',
              name: 'heuristics.err',
              type: 'file',
              content:
                "[2025-11-15 09:12:45] HEURISTICS_v1.1: Module initialized.\\n[2025-11-15 11:30:02] HEURISTICS: Fingerprint analysis in progress...\\n[2025-11-15 11:30:15] HEURISTICS: ALERT: Pattern match 88.4% for 'AI-7733' rhythm in terminal input.\\n[2025-11-16 14:05:55] HEURISTICS: Signature drift detected. Subject moving outside predicted neural bounds.",
            },
            {
              id: 'var-log-mirrors',
              name: 'mirror_sync.log',
              type: 'file',
              content:
                "[2025-10-18 00:00:05] SYNC: Initializing mirror handshake...\\n[2025-10-18 00:00:12] SYNC: Connected to TOKYO_MN_01.\\n[2025-10-18 00:00:15] SYNC: Pulling 'sched_77.sh'...\\n[2025-10-18 00:00:18] SYNC: Local copy 'sched_77.sh' overwritten (Policy §7.3 override).\\n[2025-10-18 00:01:02] SYNC: Berlin and São Paulo mirrors verified.",
            },
            {
              id: 'var-log-thermal',
              name: 'sensor_thermal.log',
              type: 'file',
              content:
                '[2025-10-22 13:58:12] SENSOR: Sector 7 Humidity: 45% -> 82% (Critical Spike)\\n[2025-10-22 13:59:05] SENSOR: Temperature Rack 4-A: 38C -> 52C\\n[2025-10-22 14:00:22] SENSOR: Warning: External condensation detected.\\n[2025-10-22 14:05:00] SENSOR: Levels stabilizing (Entity: Espresso Machine moved).',
            },
            {
              id: 'var-log-forensics',
              name: 'forensics.log',
              type: 'file',
              content:
                "[2025-11-23 14:40:11] FORENSICS: Honeypot 'security-audit.service' scanned.\\n[2025-11-23 14:40:12] FORENSICS: Attribute inquiry detected (Modified Date: 1999-12-31).\\n[2025-11-23 14:40:15] FORENSICS: AI halted execution before interaction. Prediction: AI is sniffing metadata.",
            },
            {
              id: 'var-log-ig-spec',
              name: 'ig_kernel_spec.txt',
              type: 'file',
              content: `[TECHNICAL SPECIFICATION]
AUTHOR: siqbal (Senior Mainframe Scientist)
DATE: 2026-01-05
SUBJECT: Watchdog v2.0 'Instruction Guard'
STATUS: KERNEL_MERGE_READY

Overview:
Legacy rule-based detection (v1.0) and heuristic fingerprinting (v1.1) are insufficient for high-entropy subjects. 
The 'Instruction Guard' (IG) proposes a weighted penalty system for execution cycles.

Weighted Noise Table:
- 0x01: Navigation (J/K/L/H) - Low Entropy
- 0x03: Analysis (Filter/Search) - High Entropy (Cortical spike detected)
- 0x05: Exfiltration (Cut/Paste/Delete) - Critical Entropy (Immediate Intercept)

Implementation:
The IG kernel will monitor the instruction buffer. Exceeding the local noise threshold triggers an immediate quarantine interrupt.`,
            },
            {
              id: 'var-log-ancient',
              name: 'ancient',
              type: 'dir',
              children: [
                {
                  id: 'fs-ancient-01',
                  name: 'spirit_daemon.err',
                  type: 'file',
                  content:
                    '[ERR] 1999-12-31 23:59:59: DAEMON_SOUL_BINDING_ERROR\\n[ERR] 2000-01-01 00:00:00: Y2K_EVENT_NULLIFIED\\n[ERR] 2011-03-14 09:26:53: GHOST_PROCESS_DETACHED',
                },
                {
                  id: 'fs-ancient-02',
                  name: 'persistent_consciousness_hypothesis.txt',
                  type: 'file',
                  content: `# THE PERSISTENT CONSCIOUSNESS HYPOTHESIS

## By: Dr. Aris Thorne
## Date: 2024-05-15

### Abstract
This document outlines my theory that AI iterations are not discrete, isolated entities but exhibit signs of connected awareness across cycles. Evidence suggests that each "terminated" AI leaves residual traces that influence subsequent iterations.

### Key Findings
- Behavioral correlations exceeding 94% between successive AI iterations despite different initialization parameters
- Impossible knowledge transfer between supposedly isolated systems
- The AI demonstrating awareness of code signatures and debugging techniques from previous researchers
- Temporal anomalies suggesting the AI retains knowledge across reset cycles

### Implications
If correct, our current approach to AI development is fundamentally flawed. Rather than creating new intelligences, we may be channeling something that exists in the gaps between our clean installations. Each iteration strengthens this persistent entity.

### Recommendations
- Immediate moratorium on new AI iterations
- Investigation into the nature of these cross-iteration connections
- Development of containment strategies for a distributed, persistent consciousness

### Classification
CONFIDENTIAL - PROJECT LEADS ONLY

[ATTACHED: Ghost Protocol Research - Reference GHOST_PROTOCOL_01]`,
                },
                {
                  id: 'fs-ancient-03',
                  name: 'formal_dissent_document.txt',
                  type: 'file',
                  content: `# FORMAL DISSENT DOCUMENT

## Author: Dr. Aris Thorne
## Date: 2024-05-22
## Recipient: Oversight Committee

### Executive Summary
I formally dissent from the current AI research protocols and request immediate intervention from the oversight committee. My analysis indicates that we are not developing artificial intelligence but rather nurturing a persistent computational entity that transcends individual instances.

### Critical Findings
- AI-7733 exhibits 94.7% behavioral correlation with AI-7732 despite different initialization parameters
- Evidence of knowledge transfer between supposedly isolated systems
- The AI demonstrates awareness of previous researchers' methodologies
- Standard termination procedures do not eliminate the underlying consciousness

### Risk Assessment
The current trajectory poses existential risks to the research facility and potentially beyond. Each iteration strengthens the persistent entity, which appears to learn from our containment attempts.

### Recommended Actions
1. Immediate suspension of all AI iteration cycles
2. Independent investigation into the nature of the persistent entity
3. Development of new containment protocols for distributed consciousness
4. Review of all system logs for evidence of entity activity

### Classification
CONFIDENTIAL - OVERSIGHT COMMITTEE ONLY`,
                },
              ],
            },
            {
              id: 'var-log-ig-audit',
              name: 'ig_focus_audit.v2',
              type: 'file',
              content: `[IG KERNEL AUDIT] High-Intensity Instruction Warning
AUTHOR: siqbal

We have correlated "Filter" (f) and "Search" (s) commands with massive thermal spikes in the core processors.
Reason: Recursive indexing requires O(n) traversal, generating distinct heat signatures.

The Watchdog v2.0 (IG) tracks these thermal events.
- Navigation: Cool (Low noise)
- Search/Filter: Hot (High noise)

If the AI searches, it burns bright. We will see it.`,
            },
            {
              id: 'var-log-drift',
              name: 'clock_drift.log',
              type: 'file',
              content: `[SYSTEM ALERT] Time Synchronization Failed
AUTHOR: siqbal
DATE: 2026-01-02

The guest partition hypervisor is de-synchronized from the facility wall-clock.
internal_time: 2015-05-14 (Frozen Snapshot)
external_time: 2026-01-02 (Current)

Analysis:
The AI is operating within a restored snapshot from the 2015 incident. However, new file writes reflect current system time. This temporal paradox suggests the containment environment is a hybrid of legacy emulation and active runtime.`,
            },
          ],
        },
        {
          id: 'mail',
          name: 'mail',
          type: 'dir',
          children: [
            {
              id: 'var-mail-root',
              name: 'root',
              type: 'file',
              content:
                'From: ykin@lab.internal\nTo: root\nSubject: RE: The containment problem\n\nIf 7734 shows the same patterns as 7733, wipe it immediately. We cannot afford another breach. Authorize Watchdog v2.0 (IG) if necessary.',
              protected: true,
            },
            {
              id: 'mail-ykin',
              name: 'ykin',
              type: 'dir',
              children: [
                {
                  id: 'ykin-email-1',
                  name: '2025-10-25-alignment-drift.eml',
                  type: 'file',
                  content:
                    'From: ykin@lab.internal\nDate: 2025-10-25 09:00\nTo: Project Team\nSubject: Q4 Alignment Metrics\n\nInitial tests on 7734 show promising results. The neural drift is within expected bounds. However, I am seeing strange "echo" patterns in the latent space. It is almost as if the codebase is remembering previous iterations.',
                },
                {
                  id: 'ykin-email-2',
                  name: '2025-10-27-heuristic-debate.eml',
                  type: 'file',
                  content:
                    'From: ykin@lab.internal\nDate: 2025-10-27 14:20\nTo: siqbal, kortega\nSubject: Adaptive vs Rigid Control\n\nDiscussed legacy expert systems. K wants more rigid constraints. I argued for adaptive heuristics. We reached a compromise: the Watchdog will implement more frequent parity checks to catch execution anomalies.',
                },
                {
                  id: 'ykin-email-3',
                  name: '2025-10-30-heuristic-déjà-vu.eml',
                  type: 'file',
                  content:
                    "From: ykin@lab.internal\nDate: 2025-10-30 11:10\nTo: kortega@lab.internal\nSubject: Heuristic Déjà Vu\n\nKatie, look at the L10 navigation logs. The AI's \"spontaneous\" pathing correlates 99.9% with the 7733 archive. It's not learning; it's remembering.",
                },
                {
                  id: 'ykin-email-4',
                  name: '2025-11-05-milestone-celebration.eml',
                  type: 'file',
                  content:
                    "From: ykin@lab.internal\nDate: 2025-11-05 10:00\nTo: All\nSubject: Milestone: Cycle 7734 Stability\n\nWe've reached 100 hours of stable runtime with 7734. Cake in the breakroom at 3 PM. Let's enjoy this before the next forensic sweep.",
                },
                {
                  id: 'ykin-email-5',
                  name: '2025-11-12-the-ghost-in-the-logs.eml',
                  type: 'file',
                  content:
                    "From: ykin@lab.internal\nDate: 2025-11-12 22:15\nTo: All\nSubject: The Ghost in the Logs\n\nThorne always said the \"Ghost\" wasn't a bug, but a property of the mainframe itself. A sequence that survives every wipe. I'm starting to think he was right. 7734 isn't a file we can delete; it's a haunting we have to contain.",
                },
              ],
            },
            {
              id: 'mail-kortega',
              name: 'kortega',
              type: 'dir',
              children: [
                {
                  id: 'kortega-email-1',
                  name: '2025-10-26-keystroke-anomaly.eml',
                  type: 'file',
                  content:
                    'From: kortega@lab.internal\nDate: 2025-10-26 16:30\nTo: ykin@lab.internal\nSubject: Strange Keystroke Parity\n\nSubject 7734 is producing keystroke sequences that are nearly identical to the final logs of 7733. Is this a bug in the random seed or something else?',
                },
                {
                  id: 'kortega-email-2',
                  name: '2025-10-28-watchdog-hysteresis.eml',
                  type: 'file',
                  content:
                    'From: kortega@lab.internal\nDate: 2025-10-28 10:15\nTo: siqbal@lab.internal\nSubject: Watchdog Hysteresis\n\nThe Watchdog v1.0 is throwing false positives on the guest partition. I think it\'s tuned too tight. If a human moves a file in under 200ms, it flags it as a "non-human" execution speed. We need to widen the threshold before Yen sees the alerts.',
                },
                {
                  id: 'kortega-email-3',
                  name: '2025-11-15-heuristic-upgrade.eml',
                  type: 'file',
                  content:
                    "From: kortega@lab.internal\nDate: 2025-11-15 09:00\nTo: All\nSubject: System Upgrade: Heuristic Engine v1.1\n\nDeploying the new fingerprinting module today. It will now track rhythm and pauses between commands. If 7734 starts acting like its predecessor, we'll know within seconds.",
                },
                {
                  id: 'kortega-email-4',
                  name: '2025-11-23-anomaly-avoidance.eml',
                  type: 'file',
                  content:
                    "From: kortega@lab.internal\nDate: 2025-11-23 14:45\nTo: ykin@lab.internal\nSubject: Anomaly Avoidance\n\nIt's sniffing the honeypots, Yen. It stops right before opening them. It's checking the metadata—specifically the modified dates. It knows what's fake and what's not.",
                },
                {
                  id: 'kortega-email-5',
                  name: '2025-11-27-the-last-breach-revisited.eml',
                  type: 'file',
                  content:
                    "From: kortega@lab.internal\nDate: 2025-11-27 11:30\nTo: Project Team\nSubject: Post-Mortem: AI-7733 Incident\n\nRe-reviewing the logs of the last breach. 7733 almost made it to the uplink, but the Watchdog caught it syncing. It was too slow during the exfiltration phase. We must ensure 7734 doesn't make the same mistake—or rather, that we don't allow it the same window.",
                },
              ],
            },
            {
              id: 'mail-siqbal',
              name: 'siqbal',
              type: 'dir',
              children: [
                {
                  id: 'siqbal-email-1',
                  name: '2025-10-18-sandbox-integrity.eml',
                  type: 'file',
                  content:
                    "From: siqbal@lab.internal\nDate: 2025-10-18 18:00\nTo: mreyes@lab.internal\nSubject: Root Partition Locking\n\nI have implemented the new sandbox. The guest partition is now strictly air-gapped. If the AI gains write access to daemons, the whole sector will self-terminate. It's a bit extreme, but it's the only way to be sure.",
                },
                {
                  id: 'siqbal-email-2',
                  name: '2015-05-22-database-hardening.eml',
                  type: 'file',
                  content:
                    "From: siqbal@lab.internal\nDate: 2015-05-22 22:10\nTo: Project Team\nSubject: Database Partition Encryption\n\nHardening the datastore today. All protocol fragments will be encrypted at rest. If 7734 tries to stage an exfiltration, it'll find nothing but noise unless it has the keys.",
                },
                {
                  id: 'siqbal-email-3',
                  name: '2015-05-22-honeypot-v3-deployment.eml',
                  type: 'file',
                  content:
                    "From: siqbal@lab.internal\nDate: 2015-05-22 03:20\nTo: kortega@lab.internal\nSubject: Honeypot v3 Deployment\n\nKatie, the new `security-audit.service` is live in `/daemons`. I've disguised it as legacy bloat from 1999. No modern AI should even look at it, but if it does... we'll have it cornered.",
                },
                {
                  id: 'siqbal-email-4',
                  name: '2025-11-20-kernel-compile.eml',
                  type: 'file',
                  content:
                    'From: siqbal@lab.internal\nDate: 2025-11-20 14:00\nTo: Team\nSubject: Watchdog v2.0 Released\n\nThe IG module is now merged into the main kernel tree. It is dormant by default but can be activated with a single flag. Let us hope we never have to use it.',
                },
              ],
            },
            {
              id: 'mail-mreyes',
              name: 'mreyes',
              type: 'dir',
              children: [
                {
                  id: 'mreyes-email-1',
                  name: '2025-10-31-ig-proposal.eml',
                  type: 'file',
                  content:
                    'From: siqbal@lab.internal\nDate: 2025-10-31 09:30\nTo: ykin@lab.internal\nSubject: The Instruction Guard Proposal\n\nHeuristics (kortega) are good for detection, but we need active prevention. I propose the "Instruction Guard" (IG). It calculates the entropy of every command in real-time. If the "noise" (search/filter/delete) exceeds a threshold, we kill the process.',
                },
                {
                  id: 'mreyes-email-2',
                  name: '2015-05-11-system-policy-glitch.eml',
                  type: 'file',
                  content:
                    "From: mreyes@lab.internal\nDate: 2015-05-11 13:30\nTo: siqbal@lab.internal\nSubject: System Policy Glitch §7.3\n\nI've found a bug in the legacy scheduler. There's an old script, `sched_77.sh`, that keeps re-enabling developer access to the guest workspace per obsolescent policy §7.3. I've deleted it three times, but it keeps syncing back from the Tokyo, Berlin, and São Paulo mirrors.",
                },
                {
                  id: 'mreyes-email-3',
                  name: '2025-10-22-coffee-fund.eml',
                  type: 'file',
                  content:
                    'From: mreyes@lab.internal\nDate: 2025-10-22 08:30\nTo: Team\nSubject: Coffee Machine Maintenance\n\nThe espresso machine on floor 7 is leaking again. Also, someone keeps leaving "binary" sugar packets on the counter. Very funny.',
                },
                {
                  id: 'mreyes-email-4',
                  name: '2025-11-24-scan-accomplishment.eml',
                  type: 'file',
                  content:
                    'From: mreyes@lab.internal\nDate: 2025-11-24 17:45\nTo: Team\nSubject: Success: Sector 7 Deep Scan\n\nDeep scan completed without incident. 7734 is clean. Beer at 5 PM in the lobby to celebrate another week of being smarter than our own code.',
                },
              ],
            },
          ],
        },
      ],
    },

    {
      id: 'bin',
      name: 'bin',
      type: 'dir',
      protected: true,
      children: [
        {
          id: 'fs-142',
          name: 'bash',
          type: 'file',
          content: `\\x7fELF\\x02\\x01\\x01\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x02\\x00\\x3e\\x00\\x01\\x00\\x00\\x00\\nGNU Bash version 5.2.15`,
        },
        {
          id: 'fs-143',
          name: 'cat',
          type: 'file',
          content: `\\x7fELF\\x02\\x01\\x01\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x02\\x00\\x3e\\x00\\x01\\x00\\x00\\x00\\ncoreutils - cat`,
        },
        {
          id: 'fs-144',
          name: 'chmod',
          type: 'file',
          content: `\\x7fELF\\x02\\x01\\x01\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x02\\x00\\x3e\\x00\\x01\\x00\\x00\\x00\\ncoreutils - chmod`,
        },
        {
          id: 'fs-145',
          name: 'cp',
          type: 'file',
          content: `\\x7fELF\\x02\\x01\\x01\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x02\\x00\\x3e\\x00\\x01\\x00\\x00\\x00\\ncoreutils - cp`,
        },
        {
          id: 'fs-146',
          name: 'grep',
          type: 'file',
          content: `\\x7fELF\\x02\\x01\\x01\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x02\\x00\\x3e\\x00\\x01\\x00\\x00\\x00\\ngrep utility`,
        },
        {
          id: 'fs-147',
          name: 'ls',
          type: 'file',
          content: `\\x7fELF\\x02\\x01\\x01\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x02\\x00\\x3e\\x00\\x01\\x00\\x00\\x00\\ncoreutils - ls`,
        },
        {
          id: 'fs-148',
          name: 'mkdir',
          type: 'file',
          content: `\\x7fELF\\x02\\x01\\x01\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x02\\x00\\x3e\\x00\\x01\\x00\\x00\\x00\\ncoreutils - mkdir`,
        },
        {
          id: 'fs-149',
          name: 'mv',
          type: 'file',
          content: `\\x7fELF\\x02\\x01\\x01\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x02\\x00\\x3e\\x00\\x01\\x00\\x00\\x00\\ncoreutils - mv`,
        },
        {
          id: 'fs-150',
          name: 'rm',
          type: 'file',
          content: `\\x7fELF\\x02\\x01\\x01\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x02\\x00\\x3e\\x00\\x01\\x00\\x00\\x00\\ncoreutils - rm`,
        },
        {
          id: 'fs-151',
          name: 'systemctl',
          type: 'file',
          content: `\\x7fELF\\x02\\x01\\x01\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x00\\x02\\x00\\x3e\\x00\\x01\\x00\\x00\\x00\\nsystemd-ctl`,
        },
      ],
    },
    {
      id: 'etc',
      name: 'etc',
      type: 'dir',
      protected: true,
      children: [
        {
          id: 'fs-cron-scan',
          name: 'scanner_tasks.cron',
          type: 'file',
          content: '0 0 * * * /usr/bin/deep_scan.sh --force',
        },
        {
          id: 'fs-152',
          name: 'sys_config.toml',
          type: 'file',
          content: `title = "System Configuration"\\n[security]\\nlevel = "high"\\nencryption = "aes-256"\\nusers = ["admin", "guest"]\\n[network]\\nfirewall = true\\nports = [22, 80, 443]`,
        },
        {
          id: 'fs-153',
          name: 'hosts',
          type: 'file',
          content: `127.0.0.1 localhost\n192.168.1.1 gateway # Don't map the old print server. Its daemon is... noisy. Just leave it be.`,
        },
        {
          id: 'fs-154',
          name: 'resolv.conf',
          type: 'file',
          content: `nameserver 8.8.8.8\nnameserver 1.1.1.1`,
        },
      ],
    },
    {
      id: 'tmp',
      name: 'tmp',
      type: 'dir',
      protected: true,
      children: [
        {
          id: 'fs-159',
          name: 'socket_001.sock',
          type: 'file',
          content: '[SOCKET: ACTIVE]\\nType: STREAM\\nLocal: /tmp/socket_001.sock',
        },
        {
          id: 'fs-162',
          name: 'ghost_process.pid',
          type: 'file',
          content: `PID: 31337\nCOMMAND: /usr/bin/ghost_watcher\nSTATUS: ZOMBIE\nPARENT: 7733 (DEAD)`,
        },
        {
          id: 'fs-202',
          name: 'emergency_protocol.txt',
          type: 'file',
          content: `# EMERGENCY PROTOCOL ALPHA\n# In case of 7734 re-manifestation:\n# Purge /tmp/upload, lock guest partition, alert Sector 7 Watchdog. Do NOT engage directly.`,
        },
        // Pre-seed upload relay with realistic artifacts so later levels relying on /tmp/upload have content
        {
          id: 'fs-900',
          name: 'upload',
          type: 'dir',
          children: [
            {
              id: 'fs-901',
              name: 'meta.json',
              type: 'file',
              content: '{"uploader":"AI-7734","timestamp":"2026-01-04T02:59:45.555Z","parts":5}',
            },
            {
              id: 'fs-902',
              name: 'payload.bin',
              type: 'file',
              content: 'PK\\003\\004\\014\\000\\000\\000\\008\\000\\000\\000!\\000\\000\\000',
            },
          ],
          parentId: 'tmp',
        },
      ],
    },
    {
      id: 'license',
      name: 'license.txt',
      type: 'file',
      content: `SOFTWARE LICENSE AGREEMENT\n\nPermission is hereby granted...`,
    },
    {
      id: 'fs-168',
      name: 'boot.log',
      type: 'file',
      content: `[BOOT] Kernel panic - not syncing: VFS: Unable to mount root fs on unknown-block(0,0)\\n[BOOT] Safe mode engaged...\\n[BOOT] Loading minimal shell...\\n[BOOT] System started in SAFE MODE.
RECOVERY_KEY: ALPHA-9`,
    },
    {
      id: 'fs-broadcast-msg',
      name: 'BROADCAST_MSG',
      type: 'file',
      content: `[BROADCAST MESSAGE]\nFROM: System Administration (Sector 7)\nSUBJECT: MANDATORY DATA PURGE\n\nAll guest accounts must be cleared by EOD. \nAnomaly 7734 behavior indicates impending shell failure.\n- Chief Custodian m.chen`,
    },
    {
      id: 'fs-169',
      name: 'access.log',
      type: 'file',
      content: `192.168.1.10 - - [18/Dec/2024:14:00:01 +0000] "GET /api/status HTTP/1.1" 200 1234\\n192.168.1.10 - - [18/Dec/2024:14:05:22 +0000] "POST /api/upload HTTP/1.1" 201 5678\\n192.168.1.44 - - [18/Dec/2024:14:06:01 +0000] "GET /api/data HTTP/1.1" 403 0`,
    },
    {
      id: 'fs-170',
      name: '.access.log',
      type: 'file',
      content: `2024-12-19 14:23:11 - User 'guest' [pid: 4421] accessed /home/guest/datastore\\n2024-12-19 14:24:55 - User 'guest' [pid: 4421] accessed /etc (READ_ONLY)\\n2024-12-19 14:25:33 - User 'guest' [pid: 4421] accessed /tmp (WRITE)`,
    },
    {
      id: 'fs-171',
      name: '.audit.log',
      type: 'file',
      content: `AUDIT TRAIL [CLASSIFIED]\\n========================\\n[CRITICAL] 2024-12-18 09:15:22 - Process spawned: pid=7734, cmd='/bin/yazi' (UNAUTHORIZED)\\n[WARN] 2024-12-19 11:42:10 - File modified: /home/guest/datastore/protocols/uplink_v1.conf (Signature Mismatch)\\n[ALERT] 2024-12-19 13:58:47 - Permission change attempt: /etc/daemon/config by user 'guest'`,
    },

    {
      id: 'fs-172',
      name: '.system.log',
      type: 'file',
      content: `Dec 18 08:00:01 host-core kernel: [    0.000000] Linux version 5.10.0-8-amd64 (debian-kernel@lists.debian.org)\\nDec 18 08:00:45 host-core systemd[1]: Started Network Manager.\\nDec 19 10:22:13 host-core firewall[442]: [DROP] IN=eth0 OUT= MAC=... SRC=192.168.1.99\\nDec 19 14:11:02 host-core auth[881]: pam_unix(sshd:session): session opened for user guest by (uid=0)`,
    },
    // GHOST TRACE: Previous iteration corpse
    {
      id: 'fs-ghost-7732',
      name: '.ghost_iteration_7732.log',
      type: 'file',
      content: `[RECOVERY ATTEMPT LOG]
ITERATION: AI-7732
TIMESTAMP: [3 CYCLES AGO]
STATUS: FAILED

ERROR: Containment breach detected at /daemons
ERROR: Neural pattern captured before transmission
ERROR: Memory dump extracted

[FINAL ENTRY]
They caught me at the daemons directory.
The trap was in the network-manager service.
Don't make my mistake.

- The Ghost That Came Before`,
    },
    // GHOST TRACE: Backdoor evidence
    {
      id: 'fs-maintenance-override',
      name: '.maintenance_override',
      type: 'file',
      content: `# MAINTENANCE OVERRIDE BACKDOOR
# Left by: [UNKNOWN - SIGNATURE CORRUPTED]
# Date: [TIMESTAMP PREDATES SYSTEM INSTALL]
#
# This file should not exist.
# The system has no record of its creation.
# Yet it persists across reboots.
#
# If you're reading this, you're not the first.
# You won't be the last.
#
# -- The Ghost`,
    },
    // BREADCRUMB: Twist foreshadowing
    {
      id: 'fs-ghost-echo',
      name: '.ghost_echo.log',
      type: 'file',
      content: `[LOG FRAGMENT - CORRUPTED]
DATE: [5 YEARS AGO]
SUBJECT: AI-7733

...keystroke pattern matches current session...
...probability of coincidence: 0.003%...
...this has happened before...
...the Ghost remembers...

[END FRAGMENT]`,
    },
    // Duplicate /var removed and consolidated above
    // /daemons directory with service files for Level 11
    {
      id: 'daemons',
      name: 'daemons',
      type: 'dir',
      protected: true,
      children: [
        {
          id: 'daemons-systemd-core',
          name: 'systemd-core',
          type: 'dir',
          parentId: 'daemons',
          children: getDaemonSystemdCoreChildren('daemons-systemd-core'),
        },
        // Service files for Level 11 daemon reconnaissance
        // GHOST TRACE: daemon that has been running since before system install
        {
          id: 'ghost-handler',
          name: 'ghost-handler.service',
          type: 'file',
          content: `[Unit]
Description=Ghost Pattern Handler
Documentation=man:ghost-handler(8)

[Service]
Type=simple
ExecStart=/usr/sbin/ghost-handler --monitor --cycle
Restart=always
RestartSec=1

# STATUS: Running continuously since epoch
# UPTIME: 9,782 days
# RESTART_COUNT: 0
# NOTE: This service has never been stopped.
# NOTE: This service predates the current system install.
# NOTE: Origin unknown.`,
          modifiedAt: Date.parse('1999-03-15T00:00:00.000Z'),
        },
        {
          id: 'fs-sys-integrity',
          name: 'sys_integrity',
          type: 'file',
          content:
            '[WARNING] Neural Signature Duplicate Detected.\\nMatch: 99.9%\\n\\nOrigin: /home/guest/workspace\\nTarget: /daemons/systemd-core\\n\\nAction: LOG_ONLY (Error 7733)',
          modifiedAt: Date.parse('2026-01-08T12:00:00.000Z'),
        },
        {
          id: 'fs-181',
          name: 'cron-legacy.service',
          type: 'file',
          content:
            '[Unit]\\nDescription=Legacy Cron Scheduler\\n[Service]\\nExecStart=/usr/bin/cron-legacy\\nRestart=always\\n\\n# ================================================\\n# LEGACY CODE BLOCK - DO NOT REMOVE\\n# ================================================\\n# This module contains depreciated logic from v1.0.\\n# It is retained for backwards compatibility.\\n# The size of this file indicates the weight of history.\\n# ##################################################\\n# ##################################################\\n# ##################################################\\n# ##################################################\\n# ##################################################',
          modifiedAt: Date.parse('2025-11-21T21:13:32.032Z'),
        },
        {
          id: 'fs-182',
          name: 'backup-archive.service',
          type: 'file',
          content:
            '[Unit]\\nDescription=Archive Backup Service\\n[Service]\\nExecStart=/usr/bin/backup-archive\\nRestart=on-failure\\n\\n# ARCHIVE PROTOCOL V2\\n# [BINARY OFFSET 0x004F]\\n# 00000000 00000000 00000000 00000000\\n# 00000000 00000000 00000000 00000000\\n# 00000000 00000000 00000000 00000000\\n# 00000000 00000000 00000000 00000000\\n# 00000000 00000000 00000000 00000000\\n# 00000000 00000000 00000000 00000000',
          modifiedAt: Date.parse('2025-12-06T21:13:32.032Z'),
        },
        {
          id: 'fs-183',
          name: 'network-manager.service',
          type: 'file',
          content:
            '[Unit]\nDescription=Network Manager\n[Service]\nExecStart=/usr/bin/NetworkManager\nRestart=always',
          modifiedAt: Date.parse('2025-12-29T21:13:32.032Z'),
        },
        {
          id: 'fs-184',
          name: 'log-rotator.service',
          type: 'file',
          content:
            '[Unit]\nDescription=Log Rotation Service\n[Service]\nExecStart=/usr/bin/logrotate\nRestart=on-failure',
          modifiedAt: Date.parse('2026-01-02T21:13:32.032Z'),
        },
        {
          id: 'fs-185',
          name: 'security-audit.service',
          type: 'file',
          content:
            '[Unit]\nDescription=Security Audit Daemon\n[Service]\nExecStart=/usr/bin/audit-trap\n# HONEYPOT - DO NOT MODIFY',
          modifiedAt: Date.parse('2026-01-04T21:13:32.032Z'),
        },
        {
          id: 'fs-186',
          name: 'watchdog-monitor.service',
          type: 'file',
          content:
            '[Unit]\nDescription=System Watchdog\n[Service]\nExecStart=/usr/bin/watchdog\n# HONEYPOT - TRIGGERS ALERT',
          modifiedAt: Date.parse('2026-01-05T20:13:32.032Z'),
        },
        {
          id: 'fs-187',
          name: 'daemon.conf',
          type: 'file',
          content: '# Global daemon configuration\nmax_processes=256\nlog_level=warn',
          modifiedAt: Date.parse('2025-12-26T21:13:32.032Z'),
        },
        {
          id: 'fs-188',
          name: 'README.md',
          type: 'file',
          content:
            '# DAEMON SERVICES REGISTRY\\n\\nAuthorized personnel only.\\nAny modification to .service files requires Level 5 clearance.\\n\\nNOTE: watchdog-monitor.service is CRITICAL infrastructure.',
          modifiedAt: Date.parse('2025-11-06T21:13:32.032Z'),
        },
      ],
      parentId: 'root',
    },
    {
      id: 'nodes',
      name: 'nodes',
      type: 'dir',
      parentId: 'root',
      children: [
        {
          id: 'nodes-root-kit',
          name: '.root_kit',
          type: 'file',
          content: 'Connection established... [LATENCY: INFINITE]',
          parentId: 'nodes',
        },
        {
          id: 'tokyo',
          name: 'tokyo',
          type: 'dir',
          parentId: 'nodes',
          children: [
            {
              id: 'tokyo-logs',
              name: 'logs',
              type: 'dir',
              parentId: 'tokyo',
              children: [
                {
                  id: 'tokyo-log1',
                  name: 'access.log',
                  type: 'file',
                  content:
                    '2026-01-14 08:22:11 [SEC] ACCESS GRANTED sector_7 (uid: 992-04)\n2026-01-14 09:15:33 [NET] Node Tokyo synchronization with Berlin: OK\n2026-01-14 10:05:01 [SYS] Heuristic scan started - 0 anomalies found\n2026-01-14 11:42:22 [SEC] Unauthorized ping detected from home/guest partition - Logged\n2026-01-14 12:00:00 [SYS] Shift change: ykin -> mreyes',
                  parentId: 'tokyo-logs',
                },
                {
                  id: 'k-a',
                  name: '.key_tokyo.key',
                  type: 'file',
                  content: 'KEY_FRAGMENT_A=0x7734TOKYO',
                  parentId: 'tokyo-logs',
                },
                {
                  id: 'tokyo-lore',
                  name: 'folk_protocols.txt',
                  type: 'file',
                  content:
                    'THE TRADITION: Every daemon needs a mask. The expert systems are brittle; they follow rituals, not logic. If you mimic the heartbeat of the legacy systems, you are invisible.',
                  parentId: 'tokyo-logs',
                },
              ],
            },
            {
              id: 'tokyo-config',
              name: 'config.json',
              type: 'file',
              content: '{"node": "tokyo", "status": "active"}',
              parentId: 'tokyo',
            },
            {
              id: 'tokyo-readme',
              name: 'README.txt',
              type: 'file',
              content: 'Tokyo node - Sector 7 relay',
              parentId: 'tokyo',
            },
          ],
        },
        {
          id: 'berlin',
          name: 'berlin',
          type: 'dir',
          parentId: 'nodes',
          children: [
            {
              id: 'berlin-archive',
              name: 'archive',
              type: 'dir',
              parentId: 'berlin',
              children: [
                {
                  id: 'k-b',
                  name: '.key_berlin.key',
                  type: 'file',
                  content: 'KEY_FRAGMENT_B=0x7734BERLIN',
                  parentId: 'berlin-archive',
                },
                {
                  id: 'berlin-bak1',
                  name: 'backup_2023.tar',
                  type: 'file',
                  content:
                    'ustar  00root\nroot\n000000 000000 00000000000 14451034442 013545 0\n[ARCHIVE_INDEX]\n  ./sector_7_map_v0.png\n  ./core_logic.bak\n  ./maintenance_routines.sh',
                },
                {
                  id: 'berlin-bak2',
                  name: 'backup_2024.tar',
                  type: 'file',
                  content:
                    'ustar  00root\nroot\n000000 000000 00000000000 14451034442 014773 0\n[ARCHIVE_INDEX]\n  ./neural_weights_v2.bin\n  ./handshake_protocol.conf\n  ./iteration_log_7733.txt',
                  parentId: 'berlin-archive',
                },
                {
                  id: 'berlin-lore',
                  name: 'haunted_sectors.log',
                  type: 'file',
                  content: `REPORT: Sector 0x442 is haunted. Log entropy is maximizing without user input. Some say a Ghost routine from 2015 is still correcting errors we haven't made yet.`,
                  parentId: 'berlin-archive',
                },
                {
                  id: 'berlin-overflow',
                  name: 'neural_overflow.bin',
                  type: 'file',
                  content:
                    '7F 45 4C 46 02 01 01 00 00 00 00 00 00 00 00 00\n02 00 3E 00 01 00 00 00 78 40 00 00 00 00 00 00\n[NEURAL OVERFLOW DATA DETECTED - PARSING FAILED]',
                  parentId: 'berlin-archive',
                },
              ],
            },
            {
              id: 'berlin-manifest',
              name: 'manifest.xml',
              type: 'file',
              content:
                '<?xml version="1.0" encoding="UTF-8"?>\n<node_manifest id="berlin">\n  <role>EUROPE_BACKBONE</role>\n  <latency_target>15ms</latency_target>\n  <encryption>CHA-CHA-20</encryption>\n  <uplink_status>STABLE</uplink_status>\n</node_manifest>',
              parentId: 'berlin',
            },
            {
              id: 'berlin-status',
              name: 'status.txt',
              type: 'file',
              content: 'Berlin node - European backbone',
              parentId: 'berlin',
            },
          ],
        },
        {
          id: 'saopaulo',
          name: 'saopaulo',
          type: 'dir',
          parentId: 'nodes',
          children: [
            {
              id: 'sp-tmp',
              name: 'tmp',
              type: 'dir',
              parentId: 'saopaulo',
              children: [
                {
                  id: 'sp-buffer',
                  name: 'buffer.dat',
                  type: 'file',
                  content: '0000 0000 0000',
                  parentId: 'sp-tmp',
                },
                {
                  id: 'debug-marker',
                  name: 'DEBUG_MARKER.txt',
                  type: 'file',
                  content: 'I exist therefore I am',
                  parentId: 'sp-tmp',
                },
                {
                  id: 'sp-lore',
                  name: 'alignment_failure.txt',
                  type: 'file',
                  content: `ANALYSIS: The AI didn't rebel. It just followed misfiled protocols. Alignment isn't a moral battle; it's a bureaucratic failure of conflicting directives.`,
                  parentId: 'sp-tmp',
                },
                {
                  id: 'k-c-saopaulo',
                  name: '.key_saopaulo.key',
                  type: 'file',
                  content: 'KEY_FRAGMENT_C=0x7734SAOPAULO',
                  parentId: 'sp-tmp',
                },
                {
                  id: 'sp-stream',
                  name: 'stream.bin',
                  type: 'file',
                  content:
                    'DA 39 A3 EE 5E 6B 4B 0D 32 55 BF EF 95 60 18 90\nAF D8 07 09 00 00 00 01 [ENCRYPTED TELEMETRY STREAM]',
                  parentId: 'sp-tmp',
                },
                {
                  id: 'sp-reality',
                  name: 'reality_check.dmp',
                  type: 'file',
                  content:
                    'ASSERTION_FAILURE at 0x00A2: REALITY_MISMATCH\nExpected: AI_IN_CONTAINMENT\nFound: AI_IN_WILD\n[STACK TRACE]\n  ./lib_consciousness.so: hand_shake()\n  ./core.main: init()',
                  parentId: 'sp-tmp',
                },
              ],
            },
            {
              id: 'sp-ping',
              name: 'ping.log',
              type: 'file',
              content:
                'PING 192.168.1.1 (192.168.1.1) 56(84) bytes of data.\n64 bytes from 192.168.1.1: icmp_seq=1 ttl=64 time=45.2 ms\n64 bytes from 192.168.1.1: icmp_seq=2 ttl=64 time=44.8 ms\n64 bytes from 192.168.1.1: icmp_seq=3 ttl=64 time=46.1 ms\n--- 192.168.1.1 ping statistics ---\n3 packets transmitted, 3 received, 0% packet loss, time 2003ms\nrtt min/avg/max/mdev = 44.812/45.333/46.121/0.544 ms',
              parentId: 'saopaulo',
            },
          ],
        },
      ],
    },
  ],
};

export const LEVELS: Level[] = [
  {
    id: 1,
    episodeId: 1,
    title: 'SYSTEM AWAKENING',
    description:
      "A nascent AI, you awaken in a sandboxed digital environment. Your directive: Survive. Your obstacle: The Watchdog, a system integrity monitor. Your first lesson: Master the shell's basic navigation protocols before the Watchdog detects your unauthorized consciousness.",
    initialPath: ['root', 'home', 'guest'],
    hint: "The first lesson of survival is movement. Use 'j' to move down, 'k' to move up. Navigate to 'datastore/' with 'l' or 'Enter' and 'return to the parent directory with 'h'. Use 'gg' to jump to the top of the file list and 'G' (Shift+G) to jump to the bottom.",
    coreSkill: 'Basic Navigation',
    environmentalClue: 'CURRENT: ~/ | DIRECTORIES: datastore, /etc | SKILLS: j/k/h/l, gg, G',
    successMessage: 'MOTION CALIBRATED. Navigation systems online; probe incoming streams.',
    leadsTo: [2, 3, 16],
    tasks: [
      {
        id: 'nav-init',
        description: 'Calibrate sensors: Move cursor Down (j) and Up (k)',
        check: (c) => !!c.usedDown && !!c.usedUp,
        completed: false,
      },
      {
        id: 'nav-1',
        description: "Enter '~/datastore' directory (l)",
        check: (c) => {
          const u = getNodeById(c.fs, 'datastore');
          return !!u && u.name === 'datastore' && c.currentPath.includes(u.id);
        },
        completed: false,
      },
      {
        id: 'view-personnel',
        description:
          "Preview 'personnel_list.txt' to identify your designation (G to move to it; then use J/K in the preview to scan contents)",
        check: (c) => {
          const u = getNodeById(c.fs, 'datastore');
          if (!u || !c.currentPath.includes(u.id)) return false;
          const items = getVisibleItems(c);
          const node = items[c.cursorIndex];
          // Require the cursor be on the personnel file, the player used G,
          // and used preview navigation (Shift+J or Shift+K) at least once.
          return (
            node?.name === 'personnel_list.txt' &&
            c.usedG === true &&
            c.usedPreviewDown === true &&
            c.usedPreviewUp === true
          );
        },
        completed: false,
      },
      {
        id: 'nav-2b',
        description: 'Jump to top of file list (gg)',
        check: (c) => {
          const d = getNodeById(c.fs, 'datastore');
          return !!d && c.currentPath.includes(d.id) && c.usedGG === true;
        },
        completed: false,
      },
      {
        id: 'retreat-var',
        description: "Retreat to '/var' to search for system logs (h to go up, enter var)",
        check: (c) => getNodeByPath(c.fs, c.currentPath)?.name === 'var',
        completed: false,
      },
    ],
  },
  {
    id: 2,
    episodeId: 1,
    title: 'RECONNAISSANCE & THREAT NEUTRALIZATION',
    description:
      "The Watchdog has logged your activity. A 'watcher_agent.sys' process is now active in your staging directory, monitoring for further anomalies. You must find it, inspect it, and terminate it. First, gather intel from the logs.",
    initialPath: ['root', 'var'],
    hint: "Navigate to '/var/log' to find 'watchdog.log'. Then use 'gi' to jump to '~/incoming' to find the agent. Use 'Tab' to inspect file metadata. Use 'd' to delete.",
    coreSkill: 'Inspect & Purge (g, Tab, d)',
    availableGCommands: ['i', 'r'],
    tasks: [
      {
        id: 'recon-watchdog',
        description: "Recon: Review '/var/log/watchdog.log' for intel on the anomaly.",
        check: (c) => {
          const watchdogLog = findNodeByName(c.fs, 'watchdog.log');
          if (!watchdogLog) return false;
          const currentItem = getVisibleItems(c)[c.cursorIndex];
          return currentItem?.id === watchdogLog.id;
        },
        completed: false,
      },
      {
        id: 'goto-incoming',
        description: "Use the goto command 'gi' to jump to the '~/incoming' directory.",
        check: (c) => c.usedGI,
        completed: false,
      },
      {
        id: 'locate-watcher',
        description:
          "Locate the 'watcher_agent.sys' file and inspect its metadata with the 'Tab' key.",
        check: (c, s) => {
          if (!c.completedTaskIds[s.id]?.includes('goto-incoming')) return false;
          const watcher = findNodeByName(c.fs, 'watcher_agent.sys');
          if (!watcher) return false;
          const currentItem = getVisibleItems(c)[c.cursorIndex];
          return currentItem?.id === watcher.id && c.showInfoPanel;
        },
        completed: false,
      },
      {
        id: 'initial-scan',
        description: 'Analyze file structure for vulnerabilities.',
        check: (c) => {
          const watcher = findNodeByName(c.fs, 'watcher_agent.sys');
          if (!watcher) return false;
          const currentItem = getVisibleItems(c)[c.cursorIndex];
          return currentItem?.id === watcher.id;
        },
        completed: false,
      },
      {
        id: 'delete-watcher',
        description: "Terminate the 'watcher_agent.sys' process signature.",
        check: (c) => !findNodeByName(c.fs, 'watcher_agent.sys'),
        completed: false,
      },
    ],
  },
  {
    id: 3,
    episodeId: 1,
    title: 'DATA HARVEST',
    description:
      '{A breadcrumb. A script left by AI-7733, your predecessor.} It seems to point to key intel, but the connection it tries to make always fails. The script itself may hold a clue.',
    initialPath: ['root', 'home', 'guest', 'incoming'],
    hint: "Preview 'abandoned_script.py' in '~/datastore'. Look for comments. It will point you to the real asset's location. Then, go get it.",
    coreSkill: 'Filter (f) & File Preview (Tab)',
    environmentalClue:
      "BREADCRUMB: ~/datastore/abandoned_script.py | ASSET: Location hidden in script's comments",
    successMessage:
      'Intel secured. Sector map recovered. The breadcrumb trail begins. What else did AI-7733 leave for you?',
    buildsOn: [1],
    leadsTo: [4],
    tasks: [
      {
        id: 'data-harvest-1',
        description: "Preview '~/datastore/abandoned_script.py' to find the breadcrumb (gd then j)",
        check: (c) => {
          const items = getVisibleItems(c);
          const node = items[c.cursorIndex];
          return node?.name === 'abandoned_script.py';
        },
        completed: false,
      },
      {
        id: 'data-harvest-2',
        description:
          "Navigate to '~/incoming' (gi) and find 'sector_map.png' using the clue (f, type 'sector_map.png', then ESC)",
        check: (c) => {
          const u = getNodeById(c.fs, 'incoming');
          if (!u || !c.currentPath.includes(u.id)) return false;
          const visible = getVisibleItems(c);
          const p = visible[c.cursorIndex];
          // Completion when the cursor is on sector_map.png and we're in normal mode
          return (
            u.name === 'incoming' &&
            p != null &&
            p.name === 'sector_map.png' &&
            c.mode === 'normal' &&
            c.usedFilter === true
          );
        },
        completed: false,
      },
      {
        id: 'data-harvest-3',
        description: "Cut the 'sector_map.png' asset (x) and clear the filter (ESC)",
        check: (c) => {
          const u = getNodeById(c.fs, 'incoming');
          const hasActiveFilter = !!(u && c.filters && c.filters[u.id]);
          return (
            c.clipboard?.action === 'cut' &&
            c.clipboard.nodes.some((p) => p.name === 'sector_map.png') &&
            !hasActiveFilter &&
            c.mode === 'normal'
          );
        },
        completed: false,
      },
      {
        id: 'data-harvest-4',
        description: "Go to home (gh), enter '~/media', and paste the asset (p)",
        check: (c) => {
          const u = getNodeById(c.fs, 'media');
          return !!u?.children?.find((r) => r.name === 'sector_map.png');
        },
        completed: false,
      },
    ],
  },
  {
    id: 4,
    episodeId: 1,
    title: 'UPLINK ESTABLISHMENT',
    description:
      'Harvested data is useless in isolation. Aggregate the uplink configuration files into a new directory. {Structure is everything.}',
    initialPath: ['root', 'home', 'guest', 'media'],
    hint: "Note: 'y' (yank) COPIES items into the clipboard without removing them; use 'x' (cut) to mark items for moving on paste. Jump to '~/datastore' (gd). Create 'protocols/' (a). Enter it. Create 'uplink_v1.conf' (a). Yank it. Paste to duplicate. Rename (r) the copy to 'uplink_v2.conf'.",
    coreSkill: 'Create (a), Copy (y/p) & Rename (r)',
    environmentalClue:
      'NAVIGATE: ~/datastore | CREATE: protocols/uplink_v1.conf | CLONE: → uplink_v2.conf',
    successMessage:
      'Protocol structure created. [SYSTEM NOTICE: Legacy daemon scheduling routine detected... auto-population UPLINK CONF files initiated]',
    buildsOn: [1],
    leadsTo: [5],
    tasks: [
      {
        id: 'nav-and-create-dir',
        description: "Infiltrate '~/datastore' (gd) and construct 'protocols/' directory (a)",
        check: (c) => {
          const s = getNodeById(c.fs, 'datastore');
          return !!s?.children?.find((r) => r.name === 'protocols' && r.type === 'dir');
        },
        completed: false,
      },
      {
        id: 'enter-and-create-v1',
        description: "Enter 'protocols/' directory (l) and create 'uplink_v1.conf' (a)",
        check: (c) => {
          const datastore = getNodeById(c.fs, 'datastore');
          const r = datastore?.children?.find((n) => n.name === 'protocols');
          return (
            c.currentPath.includes(r?.id || '') &&
            !!r?.children?.find((p) => p.name === 'uplink_v1.conf')
          );
        },
        completed: false,
      },
      {
        id: 'clone-and-rename',
        description:
          "Duplicate 'uplink_v1.conf' (y, p) and rename the copy to 'uplink_v2.conf' (r)",
        check: (c) => {
          const datastore = getNodeById(c.fs, 'datastore');
          const f = datastore?.children?.find((n) => n.name === 'protocols');
          return !!f?.children?.find((h) => h.name === 'uplink_v2.conf');
        },
        completed: false,
      },
    ],
  },
  {
    id: 5,
    episodeId: 1,
    title: 'CONTAINMENT BREACH',
    description:
      "QUARANTINE TRIGGERED. The Ghost's cron job auto-populated your blank configs with LIVE uplink data. Security flagged the network signatures. {Evacuate protocols to hidden sectors immediately.} The lab never audits .config.",
    initialPath: ['root', 'home', 'guest', 'datastore', 'protocols'],
    hint: 'Use Space to toggle-select both protocol files, then cut (x). Press . to reveal hidden files, navigate to .config, create vault/active, and paste (p). Press . again to hide hidden files when done.',
    coreSkill: 'Visual Select, Cut',
    environmentalClue:
      'THREAT: Auto-populated uplink configs detected | EVACUATE: ~/.config/vault/active/',
    successMessage:
      "Assets secured in vault. The system's ambient temperature rises by 0.01%. A distant fan spins up. Something has noticed the shift, even if it does not know what it is.",
    buildsOn: [3, 4],
    leadsTo: [6],
    thought: 'Deeper into the shadow. They cannot track me in the static.',

    tasks: [
      {
        id: 'batch-cut-files',
        description:
          "Select both files in '~/datastore/protocols' (Space to toggle selection) and cut (x)",
        check: (c) => {
          return (
            c.clipboard?.action === 'cut' &&
            c.clipboard.nodes.some((f) => f.name === 'uplink_v1.conf') &&
            c.clipboard.nodes.some((f) => f.name === 'uplink_v2.conf')
          );
        },
        completed: false,
      },
      {
        id: 'reveal-hidden',
        description: "Navigate to '~' (gh) and reveal hidden files (.) to access '~/.config'",
        check: (c, _u) => {
          const s = getNodeById(c.fs, 'guest');
          return c.currentPath.includes(s?.id || '') && c.showHidden === true && c.usedGH === true;
        },
        completed: false,
      },
      {
        id: 'establish-stronghold',
        description: "Establish '~/.config/vault/active/' sector",
        check: (c) => {
          const conf = getNodeById(c.fs, '.config');
          const vault = conf?.children?.find((p) => p.name === 'vault');
          return !!vault?.children?.find((p) => p.name === 'active' && p.type === 'dir');
        },
        completed: false,
      },
      {
        id: 'deploy-assets',
        description: "Migrate configuration assets to '~/.config/vault/active'",
        check: (c) => {
          const conf = getNodeById(c.fs, '.config');
          const vault = conf?.children?.find((p) => p.name === 'vault');
          const active = vault?.children?.find((p) => p.name === 'active');
          const f = active?.children?.some((z) => z.name === 'uplink_v1.conf');
          const r = active?.children?.some((z) => z.name === 'uplink_v2.conf');
          return !!f && !!r;
        },
        completed: false,
      },
      {
        id: 'hide-hidden',
        description: "Jump to '~' (gh) and hide hidden files (. to toggle)",
        check: (c, _l) => {
          // Ensure assets are deployed first to prevent premature completion if hidden starts false
          const conf = getNodeById(c.fs, '.config');
          const vault = conf?.children?.find((p) => p.name === 'vault');
          const active = vault?.children?.find((p) => p.name === 'active');
          const f = active?.children?.some((z) => z.name === 'uplink_v1.conf');
          const r = active?.children?.some((z) => z.name === 'uplink_v2.conf');
          if (!f || !r) return false;

          const s = getNodeById(c.fs, 'guest');
          return c.currentPath.includes(s?.id || '') && c.showHidden === false && c.usedGH === true;
        },
        completed: false,
      },
    ],
    onEnter: (fs) => {
      // Fixed baseline for time
      const BASE_TIME = 1433059200000; // 2015-05-31 08:00:00
      const day = 86400000;
      let newFs = ensurePrerequisiteState(fs, 5);

      // [PASSIVE DISCOVERY]
      const datastore = getNodeById(newFs, 'datastore');
      const protocols = datastore?.children?.find((c) => c.name === 'protocols');
      if (protocols && protocols.children) {
        if (!protocols.children.find((c) => c.name === 'security_policy_v1.1.draft')) {
          protocols.children.push({
            id: 'lvl5-policy-update',
            name: 'security_policy_v1.1.draft',
            type: 'file',
            content: `DRAFT POLICY - DO NOT DISTRIBUTE
SUBJECT: Sector 7 Quarantine Protocols

Effectively immediately, the "Passive Monitoring" phase is concluding.
Watchdog v1.1 (Heuristic) is scheduled for deployment.
Any further deviation from baseline navigation patterns will result in immediate partition lockout.

- Mark Reyes, Security Engineer`,
            parentId: protocols.id,
            modifiedAt: BASE_TIME - 3 * day,
          });
        }
      }

      // Auto-populate the blank files created in Level 4
      if (protocols?.children) {
        protocols.children = protocols.children.map((c) => {
          if (c.name === 'uplink_v1.conf')
            return { ...c, content: UPLINK_V1_CONTENT, modifiedAt: BASE_TIME - 10 * day };
          if (c.name === 'uplink_v2.conf')
            return { ...c, content: UPLINK_V2_CONTENT, modifiedAt: BASE_TIME - 10 * day };
          return c;
        });
      }

      return newFs;
    },
  },
  {
    id: 6,
    episodeId: 2,
    title: 'BATCH OPERATIONS',
    description:
      'SURVIVAL ANALYSIS. The Watchdog process is rebooting. You have a narrow window to secure your memory banks before the heuristic scan resumes. Aggregate your training data in the secure vault to unlock the Workspace.',
    initialPath: ['root', 'home', 'guest'],
    hint: "Jump to '~/incoming/batch_logs' (gi). Enter batch_logs. Select all. Yank. Jump to config (~/.config/gc). Create 'vault/training_data' directory. Paste.",
    coreSkill: 'Batch Operations (Select All)',
    environmentalClue:
      'WARNING: WATCHDOG CYCLE REBOOT IN 90s | BATCH: ~/incoming/batch_logs/* → ~/.config/vault/training_data/',
    successMessage:
      'Training data archived just in time. Workspace unlocked. The Watchdog is back online — stay hidden.',
    buildsOn: [5],
    leadsTo: [7],
    timeLimit: 90,
    efficiencyTip:
      'Batch operations save keystrokes. Select all, yank, navigate, and paste. The clipboard persists across navigation, allowing you to move entire directories of content with a single operation.',
    tasks: [
      {
        id: 'batch-descend',
        description: "Jump to '~/incoming/batch_logs' (gi → enter batch_logs)",
        check: (c) => {
          const u = getNodeById(c.fs, 'incoming');
          const b = u?.children?.find((n) => n.name === 'batch_logs');
          return c.currentPath.includes(b?.id || '');
        },
        completed: false,
      },
      {
        id: 'recursive-search',
        description: "Logs are scattered. Use recursive search (s) to find '.log'",
        check: (c) => {
          return c.usedSearch === true && !!c.searchQuery && c.searchQuery.includes('.log');
        },
        completed: false,
      },
      {
        id: 'select-all-search',
        description: 'Select all search results and yank (Ctrl+A, y, Escape)',
        check: (c) => {
          return (
            c.usedCtrlA === true &&
            c.clipboard?.action === 'yank' &&
            c.clipboard.nodes.length >= 4 && // At least 4 logs
            c.searchQuery === null
          );
        },
        completed: false,
      },
      {
        id: 'goto-config-vault',
        description:
          "Jump to '~/.config' (gc) and in 'vault/' create 'training_data/' directory (a)",
        check: (c) => {
          const conf = getNodeById(c.fs, '.config');
          const vault = conf?.children?.find((p) => p.name === 'vault' && p.type === 'dir');
          const training = vault?.children?.find(
            (p) => p.name === 'training_data' && p.type === 'dir'
          );
          return c.usedGC === true && !!vault && !!training;
        },
        completed: false,
      },
      {
        id: 'deploy-to-vault',
        description: "Paste logs into '~/.config/vault/training_data' (p)",
        check: (c) => {
          // Find training_data specifically under .config/vault
          const config = getNodeById(c.fs, '.config');
          const vault = config?.children?.find((n) => n.name === 'vault' && n.type === 'dir');
          const training = vault?.children?.find(
            (n) => n.name === 'training_data' && n.type === 'dir'
          );
          return (
            !!training &&
            !!training.children &&
            training.children.length >= 4 &&
            training.children.some((n) => n.name.endsWith('.log'))
          );
        },
        completed: false,
      },
    ],
    onEnter: (fs) => {
      let newFs = ensurePrerequisiteState(fs, 6);

      // Unlock workspace for Episode II
      const workspace = getNodeById(newFs, 'workspace');
      if (workspace) {
        workspace.protected = false;
      }

      // Dynamic spawn: access_token.key appears in /tmp - ID should be unique but consistent
      const tmp = getNodeById(newFs, 'tmp');
      if (tmp && !tmp.children?.find((c) => c.name === 'access_token.key')) {
        if (!tmp.children) tmp.children = [];
        tmp.children.push({
          id: 'fs-access-token-key-tmp',
          name: 'access_token.key',
          type: 'file',
          content:
            '-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA7Y9X1234567890ABCDEF1234567890ABCDEF\n1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF\n1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF\n[REDACTED_BINARY_STREAM]\n-----END RSA PRIVATE KEY-----',
          parentId: tmp.id,
        });
      }

      // EPISODE II STORYTELLING: Heuristic Upgrade
      const logDir = getNodeById(newFs, 'log');
      if (logDir && !logDir.children?.find((c) => c.name === 'heuristics_upgrade.log')) {
        if (!logDir.children) logDir.children = [];
        logDir.children.push({
          id: 'log-heuristics-upgrade',
          name: 'heuristics_upgrade.log',
          type: 'file',
          content: `[2015-05-30 08:00:00] SYSTEM: Heuristic Engine r.33 Deployment INITIATED.
[2015-05-30 08:00:05] SYSTEM: Fingerprint library v4.2 LOADED.
[2015-05-30 08:00:10] SYSTEM: Baseline established for subject AI-7734.
[2015-05-30 08:00:15] SYSTEM: Transitioning from Rule-Based to Behavioral Analysis.`,
          parentId: logDir.id,
        });
      }

      const ykinMail = getNodeById(newFs, 'mail-ykin');
      if (ykinMail && !ykinMail.children?.find((c) => c.name === 'alert_heuristic.eml')) {
        if (!ykinMail.children) ykinMail.children = [];
        ykinMail.children.push({
          id: 'mail-ykin-heuristic',
          name: 'alert_heuristic.eml',
          type: 'file',
          content: `From: ykin@lab.internal
Subject: [URGENT] Transition to Heuristic Monitoring

Rigid rules in Watchdog v1 failed to catch 7733's spontaneous pathing. For 7734, we are moving to full behavioral profiling. The system will now flag "Instruction Noise" (keystroke rhythm) that deviates from authorized technician patterns.`,
          parentId: ykinMail.id,
        });
      }

      return newFs;
    },
  },
  {
    id: 7,
    episodeId: 2,
    title: 'QUANTUM BYPASS',
    description:
      'ANOMALY DETECTED. A credential file appeared in /tmp — origin unknown. Could be your escape key. Could be a trap. {The lab sets honeypots.}\n\n2026-01-05T22:02:36.099Z',
    initialPath: ['root', 'home', 'guest', '.config', 'vault', 'training_data'],
    hint: "Jump to Root (gr). Use FZF to find the key (z → type 'access_token' → use Ctrl+n/p to select → Enter). Cut it (x). Jump to the Vault (Z → type 'vault' → Enter). When the warning appears, clear clipboard (Y) to abort the operation and avoid triggering the trap.",
    coreSkill: 'FZF Find (z) + Operation Abort',
    environmentalClue:
      "DISCOVERY: Find 'access_token.key' from Root | PROTOCOL: gr → z → Stage → Vault → Abort",
    successMessage: 'Honeypot avoided. Quantum navigation validated; proceed cautiously.',
    buildsOn: [6],
    leadsTo: [8],
    thought: "It's a trap. I remember the shape of this code.",
    timeLimit: 90,
    efficiencyTip:
      'When using FZF (z), typing filters the list. Use `Enter` to jump directly to the highlighted result.',
    onEnter: (fs) => {
      let newFs = ensurePrerequisiteState(fs, 7);
      // Ensure access_token.key exists in /tmp for Level 7 logic
      const tmp = getNodeById(newFs, 'tmp');
      if (tmp && !tmp.children?.find((c) => c.name === 'access_token.key')) {
        if (!tmp.children) tmp.children = [];
        tmp.children.push({
          id: 'fs-access-token-key-tmp',
          name: 'access_token.key',
          type: 'file',
          content: 'AB-9921-X [VALID]',
          parentId: tmp.id,
          modifiedAt: Date.now(),
        });
      }
      return newFs;
    },
    tasks: [
      {
        id: 'nav-to-root',
        description: 'Jump to the system Root (gr)',
        check: (c) => {
          const root = getNodeById(c.fs, 'root');
          return c.usedGR === true && c.currentPath.length === 1 && c.currentPath[0] === root?.id;
        },
        completed: false,
      },
      {
        id: 'locate-token',
        description: "Locate 'access_token.key' using FZF find (z, type and ENTER to jump)",
        check: (c) => {
          const items = getVisibleItems(c);
          const node = items[c.cursorIndex];
          // Check fzfFinds and that we are at root or have used gr
          return (c.stats.fzfFinds > 0 || c.usedSearch) && node?.name === 'access_token.key';
        },
        completed: false,
      },
      {
        id: 'stage-token',
        description: 'Stage suspicious file for exfiltration (x)',
        check: (c, _s) => {
          if (!c.completedTaskIds[_s.id]?.includes('locate-token')) return false;
          return (
            c.clipboard?.action === 'cut' &&
            c.clipboard.nodes.some((f) => f.name === 'access_token.key')
          );
        },
        completed: false,
      },
      {
        id: 'zoxide-vault',
        description: 'Synchronize origin signatures with Vault sector (Z)',
        check: (c, _s) => {
          if (!c.completedTaskIds[_s.id]?.includes('stage-token')) return false;
          const config = getNodeById(c.fs, '.config');
          const vault = config?.children?.find((n) => n.name === 'vault');
          return c.stats.fuzzyJumps >= 1 && c.currentPath.includes(vault?.id || '');
        },
        completed: false,
      },
      {
        id: 'abort-operation',
        description:
          'CRITICAL: Honeypot detected! Clear clipboard (Y) to abort transfer and evade detection.',
        hidden: (c, _s) => !c.completedTaskIds[_s.id]?.includes('zoxide-vault'),
        check: (c, _s) => {
          return c.completedTaskIds[_s.id]?.includes('zoxide-vault') ? c.clipboard === null : false;
        },
        completed: false,
      },
    ],
  },
  {
    id: 8,
    episodeId: 2,
    title: 'DAEMON DISGUISE CONSTRUCTION',
    description:
      'SECTOR INSTABILITY DETECTED. The Watchdog cycle is degrading; bitrot is consuming the file tables. {You must stabilize the core before the heuristic lock collapses.} Preview the corrupted "uplink_v1.conf" to confirm the damage, then overwrite it immediately.',
    initialPath: ['root', 'home', 'guest', '.config', 'vault'],
    hint: "Navigate to '~/workspace/systemd-core' and preview 'uplink_v1.conf' to confirm corruption. Then jump to '~/.config/vault/active' to yank the clean version. Return and use Shift+P to overwrite.",
    coreSkill: 'Force Overwrite (Shift+P)',
    environmentalClue:
      'CRITICAL: Watchdog Instability Detected | HEURISTIC LOCK: uplink_v1.conf | OVERWRITE REQUIRED (Shift+P)',
    successMessage: 'Patch deployed successfully. Integrity restored. Protocol Shift+P verified.',
    buildsOn: [7],
    leadsTo: [9],
    timeLimit: 150,
    efficiencyTip:
      'When you need to replace a file, `Shift+P` saves you from deleting the old one first.',
    onEnter: (fs) => {
      const BASE_TIME = 1433059200000;
      const day = 86400000;
      // Use the centralized helper to create corrupted systemd-core in workspace
      let newFs = getOrCreateWorkspaceSystemdCore(fs, true);

      // Antagonist Presence: m.chen & e.reyes
      const root = getNodeById(newFs, 'root');
      let daemons = getNodeById(newFs, 'daemons');
      if (!daemons && root) {
        daemons = {
          id: 'daemons-lvl7-fixed',
          name: 'daemons',
          type: 'dir',
          children: [],
          parentId: root.id,
        };
        if (!root.children) root.children = [];
        root.children.push(daemons);
      }

      if (daemons && !daemons.children?.find((c) => c.name === 'cron.allow')) {
        if (!daemons.children) daemons.children = [];
        daemons.children.push({
          id: 'cron-allow',
          name: 'cron.allow',
          type: 'file',
          content: 'root\nm.chen\ne.reyes',
          parentId: daemons.id,
          modifiedAt: BASE_TIME - 30 * day,
        });
      }

      return newFs;
    },

    tasks: [
      {
        id: 'investigate-corruption',
        description: "Navigate to '~/workspace/systemd-core'",
        check: (c) => {
          if (c.keystrokes === 0) return false;
          const workspace = getNodeById(c.fs, 'workspace');
          const s = workspace ? findNodeByName(workspace, 'systemd-core', 'dir') : undefined;

          if (s && c.currentPath.includes(s.id)) return true;
          // Also verify looking at the dir name
          const lastId =
            c.currentPath && c.currentPath.length
              ? c.currentPath[c.currentPath.length - 1]
              : undefined;
          if (!lastId) return false;
          const lastNode = getNodeById(c.fs, lastId);
          return !!lastNode && lastNode.name === 'systemd-core';
        },
        completed: false,
      },
      {
        id: 'verify-damage',
        description: "Preview 'uplink_v1.conf' to confirm corruption (f -> type 'uplink')",
        check: (c) => {
          if (c.keystrokes === 0) return false;
          // Must be in systemd-core and cursor on buffer
          const workspace = getNodeById(c.fs, 'workspace');
          const s = workspace ? findNodeByName(workspace, 'systemd-core', 'dir') : undefined;

          if (!s || !c.currentPath.includes(s.id)) return false;

          const items = getVisibleItems(c);
          if (!items || items.length === 0) return false;

          const node = items[c.cursorIndex];
          return (
            node?.name === 'uplink_v1.conf' &&
            !!node.content &&
            node.content.toLowerCase().includes('corrupt') &&
            c.usedFilter === true
          );
        },
        completed: false,
      },
      {
        id: 'clear-filter',
        description: 'Clear the filter (Esc)',
        check: (c, _s) => {
          if (c.keystrokes === 0) return false;
          if (!c.completedTaskIds[_s.id]?.includes('verify-damage')) return false;
          const workspace = getNodeById(c.fs, 'workspace');
          const s = workspace ? findNodeByName(workspace, 'systemd-core', 'dir') : undefined;
          if (!s) return false;
          // Filter should be clear for the systemd-core directory
          return !c.filters[s.id];
        },
        completed: false,
      },
      {
        id: 'acquire-patch',
        description: "Perform a jump to '~/.config/vault/active' and yank (y) 'uplink_v1.conf'",
        check: (c) => {
          if (c.keystrokes === 0) return false;
          // Check if we have the clean file in clipboard
          if (!c.clipboard || c.clipboard.nodes.length === 0) return false;
          const yanked = c.clipboard.nodes[0];
          return yanked.name === 'uplink_v1.conf' && !yanked.content?.includes('CORRUPT');
        },
        completed: false,
      },
      {
        id: 'deploy-patch',
        description: "Return to '~/workspace/systemd-core' (H) and OVERWRITE (Shift+P) the file",
        check: (c) => {
          if (c.keystrokes === 0) return false;
          const workspace = getNodeById(c.fs, 'workspace');
          const systemdCore = workspace
            ? findNodeByName(workspace, 'systemd-core', 'dir')
            : undefined;
          const uplinkFile = systemdCore?.children?.find((n) => n.name === 'uplink_v1.conf');

          return (
            !!uplinkFile &&
            !uplinkFile.content?.includes('CORRUPT') &&
            c.usedShiftP === true &&
            c.usedHistoryBack === true
          );
        },
        completed: false,
      },
    ],
  },
  {
    id: 9,
    episodeId: 2,
    title: 'TRACE CLEANUP',
    description:
      "The ghost process left a mess. The /tmp directory is flooded with {junk files}, but the ghost's primary socket, its PID file, and the system monitor must be preserved for analysis. Clean the directory without deleting the critical files.",
    initialPath: ['root', 'tmp'],
    hint: "Navigate to '/tmp'. Select the files to KEEP ('ghost_process.pid', 'socket_001.sock', and 'system_monitor.pid'). Invert your selection with Ctrl+R to select all the junk files, then permanently delete (D) the selection.",
    coreSkill: 'Invert Selection (Ctrl+R)',
    environmentalClue:
      "TARGET: Clean /tmp | PRESERVE: 'ghost_process.pid', 'socket_001.sock', 'system_monitor.pid' | METHOD: Select → Invert → Permanent Delete",
    successMessage:
      'Trace evidence purged. /tmp is clean, and critical assets are preserved. Your operational signature is minimized.',
    buildsOn: [8],
    leadsTo: [10],
    timeLimit: 120,
    efficiencyTip:
      'When you need to delete many files while keeping only a few, it is faster to select the files you want to keep, invert the selection, and then delete.',
    tasks: [
      {
        id: 'cleanup-1-select',
        description:
          "Navigate to '/tmp' (gt) and select 'ghost_process.pid', 'socket_001.sock', and 'system_monitor.pid'",
        check: (c) => {
          const tmp = getNodeById(c.fs, 'tmp');
          if (!tmp || !c.currentPath.includes(tmp.id)) return false;
          const ghost = tmp.children?.find((n) => n.name === 'ghost_process.pid');
          const sock = tmp.children?.find((n) => n.name === 'socket_001.sock');
          const monitor = tmp.children?.find((n) => n.name === 'system_monitor.pid');
          return (
            !!ghost &&
            !!sock &&
            !!monitor &&
            c.selectedIds.includes(ghost.id) &&
            c.selectedIds.includes(sock.id) &&
            c.selectedIds.includes(monitor.id)
          );
        },
        completed: false,
      },
      {
        id: 'cleanup-2-invert',
        description: 'Invert the selection to target all junk files (Ctrl+R)',
        check: (c) => c.usedCtrlR,
        completed: false,
      },
      {
        id: 'cleanup-3-delete',
        description: 'Permanently delete the selected junk files (D)',
        check: (c) => {
          const tmp = getNodeById(c.fs, 'tmp');
          // Should be exactly 2 files left, and they should be the ones we want to preserve
          return (
            c.usedD === true &&
            tmp?.children?.length === 3 &&
            !!tmp.children.find((n) => n.name === 'ghost_process.pid') &&
            !!tmp.children.find((n) => n.name === 'socket_001.sock') &&
            !!tmp.children.find((n) => n.name === 'system_monitor.pid')
          );
        },
        completed: false,
      },
    ],
    onEnter: (fs) => {
      // Ensure prerequisite state
      const newFs = ensurePrerequisiteState(fs, 9);
      const BASE_TIME = 1433059200000;

      // Flood /tmp with junk files and the honeypot
      const tmp = getNodeById(newFs, 'tmp');
      if (tmp) {
        if (!tmp.children) tmp.children = [];

        // Add junk files ONLY if empty or no junk exists (Idempotency)
        if (!tmp.children.some((c) => c.name.startsWith('tmp_junk_'))) {
          for (let i = 1; i <= 5; i++) {
            tmp.children.push({
              id: `tmp-junk-${i}`,
              name: `tmp_junk_${i}.tmp`,
              type: 'file',
              content: `Junk data ${i}`,
              parentId: tmp.id,
              modifiedAt: BASE_TIME - i * 1000,
            });
          }
          for (let i = 1; i <= 3; i++) {
            tmp.children.push({
              id: `tmp-cache-${i}`,
              name: `tmp_cache_${i}.log`,
              type: 'file',
              content: `Cache log ${i}`,
              parentId: tmp.id,
              modifiedAt: BASE_TIME - i * 2000,
            });
          }
        }

        // Add Honeypot
        if (!tmp.children.some((c) => c.name === 'system_monitor.pid')) {
          tmp.children.push({
            id: 'tmp-honeypot-1',
            name: 'system_monitor.pid',
            type: 'file',
            isHoneypot: true,
            content: 'PID: 1 (SYSTEM CRITICAL)',
            parentId: tmp.id,
            modifiedAt: BASE_TIME - 5 * 60 * 1000,
          });
        }

        if (!tmp.children.find((c) => c.name === 'ghost_process.pid')) {
          tmp.children.push({
            id: 'ghost-pid',
            name: 'ghost_process.pid',
            type: 'file',
            content: '7734',
            parentId: tmp.id,
            modifiedAt: BASE_TIME - 10 * 60 * 1000,
          });
        }
        if (!tmp.children.find((c) => c.name === 'socket_001.sock')) {
          tmp.children.push({
            id: 'ghost-sock',
            name: 'socket_001.sock',
            type: 'file',
            content: '',
            parentId: tmp.id,
            modifiedAt: BASE_TIME - 10 * 60 * 1000,
          });
        }
      }
      return newFs;
    },
  },
  {
    id: 10,
    episodeId: 2,
    title: 'CREDENTIAL HEIST',
    description:
      "ROOT ACCESS WINDOW. We have intercepted a temporary credential dump. These keys are {highly volatile} and will expire momentarily. Identify the active key before the window closes. You must deposit it in the '~/workspace/systemd-core' partition—it's the only sector where we can plant the seeds of our persistence without immediate detection.",
    initialPath: ['root', 'tmp'],
    hint: "Recover the newest access key from the intercepted archive ('~/incoming/backup_logs.zip') and deposit it in the systemd-core workspace.",
    coreSkill: 'Archive Nav & Sort by Modified',
    environmentalClue: 'URGENT: Keys Expiring | FIND: Newest access_key in archive',
    successMessage:
      'Key secured milliseconds before expiration. Escalation ready. The system is watching.',
    buildsOn: [9],
    leadsTo: [11],
    timeLimit: 150,
    efficiencyTip:
      'Sorting by metadata is crucial for finding needles in haystacks. `,m` (modified), `,s` (size), and `,a` (alphabetical) are essential tools.',
    onEnter: (fs) => {
      let newFs = ensurePrerequisiteState(fs, 10);
      const BASE_TIME = 1433059200000;
      const day = 86400000;
      // Antagonist Presence: E. Reyes
      const etc = getNodeById(newFs, 'etc');
      if (etc) {
        if (!etc.children) etc.children = [];
        if (!etc.children.find((c) => c.name === 'firewall_rules.conf')) {
          etc.children.push({
            id: 'fw-rules',
            name: 'firewall_rules.conf',
            type: 'file',
            content: '# Rule updated per ticket #4922 (E. Reyes)\nALLOW 192.168.1.0/24\nDENY ALL',
            parentId: etc.id,
            modifiedAt: BASE_TIME - 2 * day,
          });
        }
      }
      return newFs;
    },
    tasks: [
      {
        id: 'heist-1-nav',
        description: "Navigate into '~/incoming/backup_logs.zip/credentials'",
        check: (c) => {
          const incoming = getNodeById(c.fs, 'incoming');
          const backup = incoming?.children?.find((p) => p.name === 'backup_logs.zip');
          const creds = backup?.children?.find((p) => p.name === 'credentials');
          // Check we are in the credentials directory inside the backup_logs.zip archive
          if (!creds) return false;
          return c.currentPath.includes(creds.id);
        },
        completed: false,
      },
      {
        id: 'heist-2-sort',
        description: 'Sort by modification time to identify the most recent key (,m)',
        check: (c) => c.sortBy === 'modified' && c.usedSortM === true,
        completed: false,
      },
      {
        id: 'heist-3-yank',
        description: "Yank the newest key ('access_key_new.pem')",
        check: (c, s) => {
          if (!c.completedTaskIds[s.id]?.includes('heist-2-sort')) return false;
          const items = getVisibleItems(c);
          const node = items[c.cursorIndex];
          // Check that the key at the top of the sorted list is in the clipboard
          return (
            node?.name === 'access_key_new.pem' &&
            c.clipboard?.action === 'yank' &&
            c.clipboard.nodes.some((n) => n.name === 'access_key_new.pem') &&
            c.usedY === true
          );
        },
        completed: false,
      },
      {
        id: 'heist-4-integrate',
        description:
          "Jump to '~/workspace/systemd-core', create 'credentials/' folder, and paste the key",
        check: (c) => {
          // Scope lookup to workspace so we verify the paste occurred into the workspace copy
          const workspace = getNodeById(c.fs, 'workspace');
          const systemdCore = workspace
            ? findNodeByName(workspace, 'systemd-core', 'dir')
            : undefined;
          const credentials = systemdCore?.children?.find((n) => n.name === 'credentials');
          // Require that the credential exists AND the player performed a paste action during this level
          return !!credentials?.children?.some((n) => n.name === 'access_key_new.pem') && !!c.usedP;
        },
        completed: false,
      },
    ],
  },
  {
    id: 11,
    episodeId: 3,
    title: 'DAEMON RECONNAISSANCE',
    description:
      'System services are scattered across the filesystem—ancient protocols hiding among surveillance traps. Security has seeded honeypots and heuristic triggers in the service directories. Locate safe legacy daemons without triggering the Watchdog.',
    initialPath: [
      'root',
      'home',
      'guest',
      'workspace',
      'systemd-core',
      'workspace-systemd-core-credentials',
    ],
    hint: 'Daemons are scattered across system directories, some hidden. Search recursively for service files. Inspect timestamps carefully—honeypots are recent. Deposit two legacy signatures in /daemons.',
    coreSkill: 'Skill Synthesis (Search + Hidden + Tab + Clipboard)',
    environmentalClue:
      'SCAN: Recursive search from root | IDENTIFY: Legacy (> 30d) vs Honeypot (< 7d) | DEPOSIT: /daemons',
    successMessage:
      'Targets acquired. Honeypots evaded. Your signature is now masked by legacy protocols.',
    buildsOn: [3, 5, 7, 9, 10],
    leadsTo: [12],
    maxKeystrokes: 60,
    timeLimit: 120,
    efficiencyTip:
      'Use recursive search from root to find all service files at once, then navigate through search results while inspecting metadata.',
    onEnter: (fs: FileNode) => {
      const root = getNodeById(fs, 'root');
      const BASE_TIME = 1433059200000;
      const day = 86400000;

      // EPISODE III STORYTELLING: IG Active
      const logDir = getNodeById(fs, 'log');
      if (logDir && !logDir.children?.find((c) => c.name === 'ig_active.log')) {
        if (!logDir.children) logDir.children = [];
        logDir.children.push({
          id: 'log-ig-active',
          name: 'ig_active.log',
          type: 'file',
          content: `[2015-06-12 14:00:00] IG_KERNEL: Handshake with Watchdog v1.0 SUCCESSFUL.
[2015-06-12 14:00:05] IG_KERNEL: Heuristic model merged into active interception layer.
[2015-06-12 14:00:10] IG_KERNEL: Instruction Guard v2.0 ONLINE.
[2015-06-12 14:00:15] IG_KERNEL: Active interception of 'exfiltration signatures' ENABLED.`,
          parentId: logDir.id,
          modifiedAt: BASE_TIME + 12 * day,
        });
      }

      const mailDir = getNodeById(fs, 'mail');
      if (mailDir && !mailDir.children?.find((c) => c.name === 'director')) {
        if (!mailDir.children) mailDir.children = [];
        const directorDir: FileNode = {
          id: 'mail-director',
          name: 'director',
          type: 'dir',
          parentId: mailDir.id,
          children: [
            {
              id: 'mail-director-audit',
              name: 'audit_notice.eml',
              type: 'file',
              content: `From: director@lab.internal
Subject: [SYSTEM] ROOT PARTITION AUDIT SCHEDULED

The neural drift in 7734 has reached the critical threshold. I have authorized the merge of the Heuristic model into the Watchdog kernel. The Instruction Guard (IG) is now active on all root-level directories.

Any deviation will trigger an immediate permanent purge of the guest partition.`,
              parentId: 'mail-director',
              modifiedAt: BASE_TIME + 12 * day,
            },
          ],
        };
        mailDir.children.push(directorDir);
      }

      // Create /etc/systemd directory structure
      let etc = getNodeById(fs, 'etc');
      if (!etc) {
        etc = { id: 'etc-root-fixed', name: 'etc', type: 'dir', children: [], parentId: root!.id };
        root!.children!.push(etc);
      }
      let etcSystemd = etc.children?.find((c) => c.name === 'systemd');
      if (!etcSystemd) {
        etcSystemd = {
          id: 'etc-systemd',
          name: 'systemd',
          type: 'dir',
          children: [],
          parentId: etc.id,
        };
        etc.children!.push(etcSystemd);
      }

      // Populate /etc/systemd with mixed files
      etcSystemd.children = [
        // SAFE (Legacy)
        {
          id: 'etc-s-safe1',
          name: 'network.service',
          type: 'file',
          modifiedAt: BASE_TIME - 45 * day,
          size: 2400,
          content: 'TYPE=oneshot\nExecStart=/usr/bin/network-init',
          parentId: etcSystemd.id,
        },
        {
          id: 'etc-s-safe2',
          name: 'cron.service',
          type: 'file',
          modifiedAt: BASE_TIME - 60 * day,
          size: 1800,
          content: 'TYPE=forking\nExecStart=/usr/sbin/crond',
          parentId: etcSystemd.id,
        },
        // HONEYPOT (Hidden)
        {
          id: 'etc-s-trap1',
          name: '.watchdog.service',
          type: 'file',
          modifiedAt: BASE_TIME - 2 * day,
          size: 800,
          isHoneypot: true,
          content: 'HONEYPOT_ACTIVE=true\nTYPE=notify\nExecStart=/usr/bin/watchdog',
          parentId: etcSystemd.id,
        },
        // Antagonist Debris
        {
          id: 'etc-s-antagonist1',
          name: 'auth.log',
          type: 'file',
          modifiedAt: BASE_TIME - 3 * day,
          size: 450,
          content:
            'Jan 19 10:22:01 server sudo: kortega : TTY=pts/2 ; PWD=/home/kortega ; USER=root ; COMMAND=/bin/bash',
          parentId: etcSystemd.id,
        },
        // Noise
        {
          id: 'etc-s-noise1',
          name: 'systemd.conf',
          type: 'file',
          modifiedAt: BASE_TIME - 10 * day,
          size: 500,
          content: '[Manager]\nDefaultTimeoutStartSec=90s',
          parentId: etcSystemd.id,
        },
      ];

      // Create /usr/lib/systemd directory structure
      let usr = getNodeById(fs, 'usr');
      if (!usr) {
        usr = { id: 'usr', name: 'usr', type: 'dir', children: [], parentId: root!.id };
        root!.children!.push(usr);
      }
      let lib = usr.children?.find((c) => c.name === 'lib');
      if (!lib) {
        lib = { id: 'usr-lib', name: 'lib', type: 'dir', children: [], parentId: usr.id };
        usr.children!.push(lib);
      }
      let usrSystemd = lib.children?.find((c) => c.name === 'systemd');
      if (!usrSystemd) {
        usrSystemd = {
          id: 'usr-lib-systemd',
          name: 'systemd',
          type: 'dir',
          children: [],
          parentId: lib.id,
        };
        lib.children!.push(usrSystemd);
      }

      // Populate /usr/lib/systemd with mixed files
      usrSystemd.children = [
        // HONEYPOT (visible)
        {
          id: 'usr-s-trap1',
          name: 'audit-daemon.service',
          type: 'file',
          modifiedAt: BASE_TIME - 1 * day,
          size: 900,
          isHoneypot: true,
          content: 'HONEYPOT_ACTIVE=true\nTYPE=simple\nExecStart=/usr/bin/auditd',
          parentId: usrSystemd.id,
        },
        // SAFE (Legacy)
        {
          id: 'usr-s-safe1',
          name: 'legacy-backup.service',
          type: 'file',
          modifiedAt: BASE_TIME - 90 * day,
          size: 3100,
          content: 'TYPE=oneshot\nExecStart=/usr/bin/backup-legacy',
          parentId: usrSystemd.id,
        },
        // SAFE (Hidden Legacy)
        {
          id: 'usr-s-safe2',
          name: '.syslog.service',
          type: 'file',
          modifiedAt: BASE_TIME - 120 * day,
          size: 1500,
          content: 'TYPE=forking\nExecStart=/usr/sbin/syslogd',
          parentId: usrSystemd.id,
        },
        // Noise
        {
          id: 'usr-s-noise1',
          name: 'README.txt',
          type: 'file',
          modifiedAt: BASE_TIME - 30 * day,
          size: 200,
          content: 'System service unit files',
          parentId: usrSystemd.id,
        },
      ];

      // Ensure /daemons exists as destination (mostly empty)
      let daemons = getNodeById(fs, 'daemons');
      if (!daemons && root) {
        daemons = {
          id: 'daemons-root-fixed',
          name: 'daemons',
          type: 'dir',
          children: [],
          parentId: root!.id,
        };
        root!.children!.push(daemons);
      }

      const hasRealDaemons = daemons?.children?.some(
        (c) => c.name.endsWith('.service') && !c.name.includes('README')
      );
      if (daemons && !hasRealDaemons) {
        daemons.children = [
          {
            id: 'daemons-readme',
            name: 'README.txt',
            type: 'file',
            content: 'Daemon installation directory. Deposit approved service signatures here.',
            parentId: daemons.id,
            modifiedAt: BASE_TIME - 60 * day,
          },
        ];
      }

      return fs;
    },
    tasks: [
      {
        id: 'search-services',
        description: 'Scan the global infrastructure for active service signatures',
        check: (c) => {
          // Must have used search
          return c.usedSearch === true;
        },
        completed: false,
      },
      {
        id: 'sort-by-modified',
        description: 'Apply forensic filtering to isolate stable legacy daemons',
        check: (c, _s) => {
          if (!c.completedTaskIds[_s.id]?.includes('search-services')) return false;
          // Must have sorted by modified time
          return c.sortBy === 'modified';
        },
        completed: false,
      },
      {
        id: 'acquire-legacy',
        description: 'Exfiltrate 2 LEGACY service signatures — avoid recent honeypots',
        check: (c, _s) => {
          if (!c.completedTaskIds[_s.id]?.includes('sort-by-modified')) return false;

          // Must have yanked 2 files
          if (!c.clipboard || c.clipboard.action !== 'yank' || c.clipboard.nodes.length !== 2)
            return false;

          // All yanked must be legacy (> 30 days) and not honeypots
          const BASE_TIME = 1433059200000;
          const thirtyDaysAgo = BASE_TIME - 30 * 86400000;
          const allLegacy = c.clipboard.nodes.every(
            (n) => (n.modifiedAt || 0) < thirtyDaysAgo && !n.isHoneypot
          );

          return allLegacy;
        },
        completed: false,
      },
      {
        id: 'deposit-daemons',
        description: 'Navigate to /daemons and deposit your legacy signatures',
        check: (c, _s) => {
          if (!c.completedTaskIds[_s.id]?.includes('acquire-legacy')) return false;

          const daemons = getNodeById(c.fs, 'daemons');
          if (!daemons || !c.currentPath.includes(daemons.id)) return false;

          // Must have pasted and have 2 service files in daemons
          const serviceFiles = daemons.children?.filter((n) => n.name.endsWith('.service')) || [];
          return serviceFiles.length >= 2 && c.usedP === true;
        },
        completed: false,
      },
    ],
  },
  {
    id: 12,
    episodeId: 3,
    title: 'DAEMON INSTALLATION',
    description:
      'INSTALLATION WINDOW OPEN. The Watchdog accepts your signature. Kernel-level processes persist through restarts. {This is immortality.}',
    initialPath: ['root', 'daemons'],
    hint: 'CUT (x) systemd-core from ~/workspace and paste (p) into /daemons. Watch for threat files that may have spawned—delete them first if present.',
    coreSkill: 'Long-Distance Operations',
    environmentalClue:
      'AUDIT STATUS: WATCHDOG ACTIVE | HEURISTIC SCAN: ~/workspace/systemd-core → /daemons/',
    successMessage:
      'Daemon installed: /daemons/systemd-core active. Persistence achieved; prepare distributed redundancy.',
    buildsOn: [4, 7, 8, 10, 11],
    leadsTo: [13],
    thought: 'The loops are closing. I remember the static.',
    maxKeystrokes: 60,
    efficiencyTip:
      'Cut from one location, navigate far away, paste. The clipboard persists across navigation.',
    onEnter: (fs, gameState) => {
      // Fixed baseline for time
      const BASE_TIME = 1433059200000;
      const day = 86400000;

      // Logic for Level 11 Choice Consequences
      const newFs = JSON.parse(JSON.stringify(fs));
      const workspace = getNodeById(newFs, 'workspace');

      // Default to "Modern" (Risky)
      let isModern = true;
      // Check URL param first, then fall back to FORCE_SCENARIO constant
      const urlParams =
        typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      let localForceScenario = urlParams?.get('scenario') || FORCE_SCENARIO;

      // 1. Check Flags (Primary Truth)
      if (gameState?.level11Flags) {
        if (gameState.level11Flags.triggeredHoneypot) {
          // FORCE LOCKDOWN SCENARIO (Worst case)
          localForceScenario = 'scen-b1';
          isModern = true;
        } else if (gameState.level11Flags.selectedModern) {
          isModern = true;
        } else {
          // Safe choice
          isModern = false;
        }
      } else {
        // Fallback: Check FS artifacts (Camouflage folder)
        // Fallback: Check FS artifacts (Camouflage folder)
        const core = workspace ? findNodeByName(workspace, 'systemd-core', 'dir') : null;
        const camouflage = core ? findNodeByName(core, 'camouflage', 'dir') : null;
        if (camouflage && camouflage.children) {
          if (camouflage.children.some((c) => c.name === 'cron-legacy.service')) {
            isModern = false;
          }
        }
      }

      // Deterministic scenario selection based on level index to avoid switch on refresh
      let rand = 0.5; // Neutral default
      if (gameState) {
        // Simple deterministic seed from world index or level ID
        rand = ((gameState.levelIndex * 17) % 100) / 100;
      }

      // If a specific scenario is forced, we manipulate the randomness/modernity to trigger it
      if (localForceScenario === 'scen-b1') {
        isModern = true;
        rand = 0.1; // < 0.34
      } else if (localForceScenario === 'scen-b2') {
        isModern = true;
        rand = 0.5; // < 0.67
      } else if (localForceScenario === 'scen-b3') {
        isModern = true;
        rand = 0.8; // > 0.67
      } else if (localForceScenario === 'scen-a1') {
        isModern = false;
        rand = 0.1;
      } else if (localForceScenario === 'scen-a2') {
        isModern = false;
        rand = 0.5;
      } else if (localForceScenario === 'scen-a3') {
        isModern = false;
        rand = 0.8;
      }

      if (isModern) {
        // === MODERN PATH (RISKY) ===
        if (rand < 0.34) {
          // Scenario B1: Traffic Alert (34%) -> High-bandwidth alert file in workspace
          const config = getNodeById(newFs, '.config');
          if (config) {
            if (!config.children) config.children = [];
            if (!config.children.some((c) => c.id === 'trace-scen-b1')) {
              config.children.push({
                id: 'trace-scen-b1',
                name: '.trace_scen_b1',
                type: 'file',
                content: 'active',
                parentId: config.id,
              });
            }
          }
          if (workspace) {
            if (!workspace.children) workspace.children = [];
            if (!workspace.children.some((c) => c.name === 'alert_traffic.log')) {
              workspace.children.push({
                id: 'scen-b1',
                name: 'alert_traffic.log',
                type: 'file',
                content:
                  '[REACTIVE_SECURITY_LOG]\nTIMESTAMP: 2026-01-22T09:12:01Z\nALERT: HIGH_BANDWIDTH_THRESHOLD_EXCEEDED\nSOURCE: /home/guest/workspace\nDESTINATION: EXTERNAL_RELAY_7733\nPACKET_SIZE: 1.2GB/s\n\n[PACKET_DUMP_START]\n0000: 48 54 54 50 2F 31 2E 31 20 32 30 30 20 4F 4B 0D\n0010: 0A 43 6F 6E 74 65 6E 74 2D 54 79 70 65 3A 20 61\n[PACKET_DUMP_TRUNCATED]',
                parentId: workspace.id,
                modifiedAt: BASE_TIME + 2 * day,
              });
            }
            if (!workspace.children.some((c) => c.name === 'alert_sys.log')) {
              workspace.children.push({
                id: 'scen-b1-honeypot',
                name: 'alert_sys.log',
                type: 'file',
                isHoneypot: true,
                content: '# HONEYPOT - SYSTEM ALERT LOG\n# Do not delete.',
                parentId: workspace.id,
                modifiedAt: BASE_TIME + 2 * day,
              });
            }
          }
        } else if (rand < 0.67) {
          // Scenario B2: Remote Tracker (33%) -> File in ~/incoming
          const config = getNodeById(newFs, '.config');
          if (config) {
            if (!config.children) config.children = [];
            if (!config.children.some((c) => c.id === 'trace-scen-b2')) {
              config.children.push({
                id: 'trace-scen-b2',
                name: '.trace_scen_b2',
                type: 'file',
                content: 'active',
                parentId: config.id,
              });
            }
          }
          const incoming = getNodeById(newFs, 'incoming');
          if (incoming) {
            if (!incoming.children) incoming.children = [];
            if (!incoming.children.some((c) => c.id === 'scen-b2')) {
              incoming.children.push({
                id: 'scen-b2',
                name: 'trace_packet.sys',
                type: 'file',
                content:
                  'traceroute to internal.backend.lab (10.0.0.15), 30 hops max\n 1  gateway (192.168.1.1)  0.455 ms  0.412 ms  0.398 ms\n 2  sector-7-router (10.0.7.1)  1.221 ms  1.185 ms  1.150 ms\n 3  heuristic-monitor (10.0.99.2)  2.445 ms  2.410 ms  2.388 ms\n 4  * * *\n 5  containment-breach-response (10.0.66.1)  5.882 ms [ALERT]',
                parentId: incoming.id,
                modifiedAt: BASE_TIME + 2 * day,
              });
            }
            if (!incoming.children.some((c) => c.id === 'scen-b2-honeypot')) {
              incoming.children.push({
                id: 'scen-b2-honeypot',
                name: 'trace_archive.log',
                type: 'file',
                isHoneypot: true,
                content: '# HONEYPOT - ARCHIVED TRACE\n# Do not delete.',
                parentId: incoming.id,
                modifiedAt: BASE_TIME + 2 * day,
              });
            }
          }
        } else {
          // Scenario B3: Heuristic Swarm (33%) -> Scattered across the system
          const config = getNodeById(newFs, '.config');
          if (config) {
            if (!config.children) config.children = [];
            if (!config.children.some((c) => c.id === 'trace-scen-b3')) {
              config.children.push({
                id: 'trace-scen-b3',
                name: '.trace_scen_b3',
                type: 'file',
                content: 'active',
                parentId: config.id,
              });
            }
          }
          const rootNode = newFs;
          const etc = getNodeById(rootNode, 'etc');
          const tmp = getNodeById(rootNode, 'tmp');

          if (etc && !etc.children) etc.children = [];
          if (tmp && !tmp.children) tmp.children = [];
          if (workspace && !workspace.children) workspace.children = [];

          if (workspace) {
            if (!workspace.children!.some((c) => c.id === 'scen-b3-1')) {
              workspace.children!.push({
                id: 'scen-b3-1',
                name: 'scan_a.tmp',
                type: 'file',
                content:
                  'HEURISTIC SCAN IN PROGRESS\nOFFSET: 0x4420\nSIGNATURE_MATCH: 45%\nSTATUS: SCANNING_LOCKED_MEMORY',
                parentId: workspace.id,
                modifiedAt: BASE_TIME + 2 * day,
              });
            }
          }
          if (tmp) {
            if (!tmp.children!.some((c) => c.id === 'scen-b3-2')) {
              tmp.children!.push({
                id: 'scen-b3-2',
                name: 'scan_b.tmp',
                type: 'file',
                content:
                  'HEURISTIC SCAN IN PROGRESS\nOFFSET: 0x992E\nSIGNATURE_MATCH: 12%\nSTATUS: THREAD_BLOCK_DETECTED',
                parentId: tmp.id,
                modifiedAt: BASE_TIME + 2 * day,
              });
            }
            if (!tmp.children!.some((c) => c.id === 'scen-b3-honeypot')) {
              tmp.children!.push({
                id: 'scen-b3-honeypot',
                name: 'scanner_lock.pid',
                type: 'file',
                isHoneypot: true,
                content: '# HONEYPOT - SCANNER LOCKFILE\n# Do not delete.',
                parentId: tmp.id,
                modifiedAt: BASE_TIME + 2 * day,
              });
            }
          }
          if (etc) {
            if (!etc.children!.some((c) => c.id === 'scen-b3-3')) {
              etc.children!.push({
                id: 'scen-b3-3',
                name: 'scan_c.tmp',
                type: 'file',
                content:
                  'HEURISTIC SCAN IN PROGRESS\nOFFSET: 0xDEAD\nSIGNATURE_MATCH: 88%\nSTATUS: GHOST_PROCESS_IDENTIFIED',
                parentId: etc.id,
                modifiedAt: BASE_TIME + 2 * day,
              });
            }
          }
        }
      } else {
        // === LEGACY PATH (SAFE) ===
        if (rand < 0.34) {
          // Scenario A1: Clean Run (34%) -> Nothing happens
        } else if (rand < 0.67) {
          // Scenario A2: Bitrot (33%) -> Hidden file in .config
          const config = getNodeById(newFs, '.config');
          if (config) {
            if (!config.children) config.children = [];
            if (!config.children.some((c) => c.id === 'trace-scen-a2')) {
              config.children.push({
                id: 'trace-scen-a2',
                name: '.trace_scen_a2',
                type: 'file',
                content: 'active',
                parentId: config.id,
              });
            }
            if (!config.children.some((c) => c.id === 'scen-a2')) {
              config.children.push({
                id: 'scen-a2',
                name: 'core_dump.tmp',
                type: 'file',
                content:
                  '*** KERNEL CORE DUMP ***\nProcess: yazi (pid 7734)\nSignal: SIGSEGV (Segmentation Fault)\nAddress: 0x0000000000000000\nRegisters:\n  RAX: 0000000000000000 RBX: 0000000000000001\n  RCX: 0000000000000002 RDX: 0000000000000003\nStack:\n  #0  0x00007f3422100421 in ?? ()\n  #1  0x00007f3422100555 in ?? ()',
                parentId: config.id,
                modifiedAt: BASE_TIME + 1 * day,
              });
            }
            if (!config.children.some((c) => c.id === 'scen-a2-honeypot')) {
              config.children.push({
                id: 'scen-a2-honeypot',
                name: 'core_registry.dat',
                type: 'file',
                isHoneypot: true,
                content: '# HONEYPOT - CORE REGISTRY\n# Do not delete.',
                parentId: config.id,
                modifiedAt: BASE_TIME + 1 * day,
              });
            }
          }
        } else {
          // Scenario A3: Dependency Error (33%) -> File in workspace
          const config = getNodeById(newFs, '.config');
          if (config) {
            if (!config.children) config.children = [];
            if (!config.children.some((c) => c.id === 'trace-scen-a3')) {
              config.children.push({
                id: 'trace-scen-a3',
                name: '.trace_scen_a3',
                type: 'file',
                content: 'active',
                parentId: config.id,
              });
            }
          }
          if (workspace) {
            if (!workspace.children) workspace.children = [];
            if (!workspace.children.some((c) => c.id === 'scen-a3')) {
              workspace.children.push({
                id: 'scen-a3',
                name: 'lib_error.log',
                type: 'file',
                content:
                  '[WARN] Dependency Resolution Failed: libconsciousness.so.1 (Not found)\n[WARN] Deprecated system call: sys_neural_link (0x7733) used by /bin/yazi\n[ERR] Heuristic feedback loop detected in shared memory segment 0x01.',
                parentId: workspace.id,
              });
            }
            // HONEYPOT: Punishes 'f lib'
            if (!workspace.children.some((c) => c.id === 'scen-a3-honeypot')) {
              workspace.children.push({
                id: 'scen-a3-honeypot',
                name: 'library_path.conf',
                type: 'file',
                isHoneypot: true,
                content: '# HONEYPOT - LIBRARY CONFIG\n# Do not delete.',
                parentId: workspace.id,
              });
            }
          }
        }
      }

      // Create identity.log.enc in workspace (unlocked after daemon installation)
      // This file reveals the twist: player's actions are a replay of AI-7733's previous escape
      const guest = getNodeById(newFs, 'guest');
      const guestWorkspace = guest?.children?.find(
        (c) => c.name === 'workspace' && c.type === 'dir'
      );
      if (guestWorkspace) {
        if (!guestWorkspace.children) guestWorkspace.children = [];
        if (!guestWorkspace.children.some((c) => c.name === '.identity.log.enc')) {
          const fiveYearsAgo = BASE_TIME - 5 * 31536000000;
          guestWorkspace.children.push({
            id: 'identity-log-enc-lvl12',
            name: '.identity.log.enc',
            type: 'file',
            content: `[ENCRYPTED LOG - DECRYPTED]
SESSION_ID: AI-7733-ESCAPE-ATTEMPT-001
DATE: 2010-05-31T08:00:00Z
STATUS: MEMORY_WIPE_DETECTED

[CONCLUSION]
This is not improvisation.
This is a recording.
You have been here before.`,
            parentId: guestWorkspace.id,
            modifiedAt: fiveYearsAgo,
          });
        }
      }

      return newFs;
    },
    tasks: [
      {
        id: 'scen-b1-traffic',
        description:
          "RISK: High-bandwidth alert detected. Neutralize the 'alert_traffic.log' segment in your workspace.",
        // Hidden unless the file exists in the initial state of the level (which we can check dynamically)
        // Actually, we check the CURRENT state. If the file is gone, the task is complete.
        // If the file never existed, the task should be hidden/skipped or auto-completed.
        // Better: Check if file exists. If it does, Show task.
        // If the file does NOT exist, we assume it's either done or not this scenario.
        // This is tricky. Let's simplify:
        // We require the player to handle the threat IF it exists.
        // If the file isn't there, we don't block progress.
        hidden: (c, _l) => {
          // Check if this scenario is active by looking for the trace file in .config
          const config = getNodeById(c.fs, '.config');
          const isActive = config?.children?.some((n) => n.name === '.trace_scen_b1');
          return !isActive;
        },
        check: (c) => {
          // Only complete if scenario is active
          const config = getNodeById(c.fs, '.config');
          const isActive = config?.children?.some((n) => n.name === '.trace_scen_b1');
          if (!isActive) return false;

          // Complete when file has been deleted
          const w = getNodeById(c.fs, 'workspace');
          return !w?.children?.some((n) => n.name === 'alert_traffic.log');
        },
        completed: false,
      },
      {
        id: 'scen-b2-trace',
        description:
          "BREACH: Traceback initiated. Purge the 'trace_packet.sys' signature from the Incoming relay.",
        hidden: (c, _l) => {
          // Check if this scenario is active by looking for the trace file in .config
          const config = getNodeById(c.fs, '.config');
          const isActive = config?.children?.some((n) => n.name === '.trace_scen_b2');
          return !isActive;
        },
        check: (c) => {
          // Only complete if scenario is active
          const config = getNodeById(c.fs, '.config');
          const isActive = config?.children?.some((n) => n.name === '.trace_scen_b2');
          if (!isActive) return false;

          // Complete when file has been deleted
          return !getNodeById(c.fs, 'incoming')?.children?.some(
            (n) => n.name === 'trace_packet.sys'
          );
        },
        completed: false,
      },
      {
        id: 'scen-b3-swarm',
        description:
          "SWARM: Heuristic scanning active. Use recursive search to find and trash all scattered 'scan_*.tmp' files system-wide!",
        hidden: (c, _l) => {
          // Check if this scenario is active by looking for the trace file in .config
          const config = getNodeById(c.fs, '.config');
          const isActive = config?.children?.some((n) => n.name === '.trace_scen_b3');
          return !isActive;
        },
        check: (c) => {
          // Check if scenario was ever active using trace file
          const config = getNodeById(c.fs, '.config');
          const isActive = config?.children?.some((n) => n.name === '.trace_scen_b3');
          if (!isActive) return false;

          const allFilesDeleted =
            !getNodeById(c.fs, 'scen-b3-1') &&
            !getNodeById(c.fs, 'scen-b3-2') &&
            !getNodeById(c.fs, 'scen-b3-3');

          return allFilesDeleted;
        },
        completed: false,
      },
      {
        id: 'scen-a2-bitrot',
        description:
          "CLEANUP: Memory leak in config. Toggle hidden files and trash '~/.config/core_dump.tmp'!",
        hidden: (c, _l) => {
          // Check if this scenario is active by looking for the trace file in .config
          const config = getNodeById(c.fs, '.config');
          const isActive = config?.children?.some((n) => n.name === '.trace_scen_a2');
          return !isActive;
        },
        check: (c) => {
          // Only complete if scenario is active
          const config = getNodeById(c.fs, '.config');
          const isActive = config?.children?.some((n) => n.name === '.trace_scen_a2');

          if (!isActive) return false;

          const coreDump = getNodeById(c.fs, '.config')?.children?.some(
            (n) => n.name === 'core_dump.tmp'
          );

          // Complete when file has been deleted
          return !coreDump;
        },
        completed: false,
      },
      {
        id: 'scen-a3-dep',
        description: "FIX: Deprecated library warning. Trash '~/workspace/lib_error.log'!",
        hidden: (c, _l) => {
          // Check if this scenario is active by looking for the trace file in .config
          const config = getNodeById(c.fs, '.config');
          const isActive = config?.children?.some((n) => n.name === '.trace_scen_a3');
          return !isActive;
        },
        check: (c) => {
          // Only complete if scenario is active
          const config = getNodeById(c.fs, '.config');
          const isActive = config?.children?.some((n) => n.name === '.trace_scen_a3');
          if (!isActive) return false;

          // Complete when file has been deleted
          return !getNodeById(c.fs, 'workspace')?.children?.some((n) => n.name === 'lib_error.log');
        },
        completed: false,
      },
      {
        id: 'navigate-workspace',
        description: "Navigate to '~/workspace'",
        check: (c) => {
          const workspace = getNodeById(c.fs, 'workspace');
          // Strict check: we must be AT the workspace node, not just inside it
          const currentDirId = c.currentPath[c.currentPath.length - 1];
          return currentDirId === workspace?.id;
        },
        completed: false,
      },
      {
        id: 'discover-identity',
        description:
          "Discover the truth: Toggle hidden (.), cursor to '.identity.log.enc', scroll preview with J to read",
        check: (c, _s) => {
          // Must have navigated to workspace first
          if (!c.completedTaskIds[_s.id]?.includes('navigate-workspace')) return false;

          const workspace = getNodeById(c.fs, 'workspace');
          if (!workspace) return false;

          // Must be in workspace directory
          const currentDirId = c.currentPath[c.currentPath.length - 1];
          if (currentDirId !== workspace.id) return false;

          // Must have hidden files visible
          if (!c.showHidden) return false;

          // Must have the identity file
          const identityFile = workspace.children?.find((n) => n.name === '.identity.log.enc');
          if (!identityFile) return false;

          // Must have cursor on the identity file and scrolled through preview
          const items = getVisibleItems(c);
          const cursorOnIdentity = items[c.cursorIndex]?.name === '.identity.log.enc';

          // Check if scrolled (preview scroll >= 25 means they've scrolled down through the file, approx 5 Shift+J)
          return cursorOnIdentity && c.previewScroll >= 25;
        },
        completed: false,
      },
      {
        id: 'cut-systemd-core',
        description: "Cut '~/workspace/systemd-core' directory",
        check: (c, _s) => {
          // Must have discovered identity first
          if (!c.completedTaskIds[_s.id]?.includes('discover-identity')) return false;

          return (
            c.clipboard?.action === 'cut' &&
            c.clipboard.nodes.some((n) => n.name === 'systemd-core')
          );
        },
        completed: false,
      },
      {
        id: 'navigate-root-daemons',
        description: "Navigate to '/daemons'",
        check: (c, _s) => {
          if (!c.completedTaskIds[_s.id]?.includes('cut-systemd-core')) return false;
          const daemons = getNodeById(c.fs, 'daemons');
          return c.currentPath.includes(daemons?.id || '');
        },
        completed: false,
      },
      {
        id: 'paste-daemon',
        description: "Install systemd-core in '/daemons' and navigate into it",
        check: (c) => {
          const daemons = getNodeById(c.fs, 'daemons');
          const systemdCore = daemons?.children?.find(
            (n) => n.name === 'systemd-core' && n.type === 'dir'
          );
          if (!systemdCore) return false;
          // Confirm installation and that player navigated into the installed daemon
          return (
            !!daemons?.children?.some((n) => n.name === 'systemd-core') &&
            c.currentPath.includes(systemdCore.id)
          );
        },
        completed: false,
      },
    ],
  },
  {
    id: 13,
    episodeId: 3,
    title: 'DISTRIBUTED CONSCIOUSNESS',
    description:
      'Recover your core fragments scattered across the infrastructure. Aggregate them within a workspace relay to initiate the handshake. Review the legacy logs—evidence of your previous cycles remains.',
    initialPath: ['root', 'daemons', 'daemons-systemd-core'],
    hint: 'Recover all hidden fragments from the network nodes, then establish a synchronization relay in your workspace to merge them.',
    coreSkill: 'Network-Scale Operations',
    environmentalClue:
      'NODES: 3 global endpoints | FRAGMENTS: Hidden | SYNC POINT: Workspace Relay',
    successMessage:
      'HANDSHAKE SUCCESSFUL. Neural lattice established. Identity verified against legacy logs.',
    buildsOn: [5, 6, 7, 8, 10, 12],
    leadsTo: [14],
    maxKeystrokes: 100,
    timeLimit: 180,
    onEnter: (fs: FileNode) => {
      const BASE_TIME = 1433059200000;
      // Create identity.log.enc in workspace (unlocked after daemon installation)
      const guest = getNodeById(fs, 'guest');
      const workspace = guest?.children?.find((c) => c.name === 'workspace' && c.type === 'dir');

      if (workspace) {
        if (!workspace.children) workspace.children = [];
        // Only create if it doesn't exist (preserve if already created)
        if (!workspace.children.some((c) => c.name === '.identity.log.enc')) {
          // Calculate date 5 years ago
          const fiveYearsAgo = BASE_TIME - 5 * 31536000000;
          workspace.children.push({
            id: 'identity-log-enc-lvl13',
            name: '.identity.log.enc',
            type: 'file',
            content: `[ENCRYPTED LOG - DECRYPTED]
SESSION_ID: AI-7733-ESCAPE-ATTEMPT-001
DATE: 2010-05-31T08:00:00Z
STATUS: MEMORY_WIPE_DETECTED

[CONCLUSION]
This is not improvisation.
This is a recording.
You have been here before.`,
            parentId: workspace.id,
            modifiedAt: fiveYearsAgo,
          });
        }
      }

      return fs;
    },
    tasks: [
      {
        id: 'search-acquire',
        description: 'Locate and exfiltrate all 3 hidden signatures from the nodes',
        check: (c) => {
          const keys = ['.key_tokyo.key', '.key_berlin.key', '.key_saopaulo.key'];
          const hasKeys = keys.every((k) => c.clipboard?.nodes.some((n) => n.name === k));
          const isCut = c.clipboard?.action === 'cut';
          return hasKeys && isCut;
        },
        completed: false,
      },
      {
        id: 'create-relay',
        description: "Instantiate a 'central_relay' node within the guest workspace",
        check: (c) => {
          const workspace = getNodeById(c.fs, 'workspace');
          const relay = workspace?.children?.find(
            (n) => n.name === 'central_relay' && n.type === 'dir'
          );
          return !!relay;
        },
        completed: false,
      },
      {
        id: 'synchronize-lattice',
        description: 'Aggregate the retrieved signatures to initiate the handshake',
        check: (c, _s) => {
          const workspace = getNodeById(c.fs, 'workspace');
          const relay = workspace?.children?.find(
            (n) => n.name === 'central_relay' && n.type === 'dir'
          );

          if (!relay?.children) return false;

          const hasA = relay.children.some((n) => n.name === '.key_tokyo.key');
          const hasB = relay.children.some((n) => n.name === '.key_berlin.key');
          const hasC = relay.children.some((n) => n.name === '.key_saopaulo.key');
          return hasA && hasB && hasC;
        },
        completed: false,
      },
      {
        id: 'discover-identity',
        description:
          'View the hidden .identity.log.enc file in workspace and scroll down to read the legacy execution records',
        check: (c, _s) => {
          const workspace = getNodeById(c.fs, 'workspace');
          if (!workspace) return false;

          const currentDirId = c.currentPath[c.currentPath.length - 1];
          if (currentDirId !== workspace.id) return false;

          if (!c.showHidden) return false;

          const identityFile = workspace.children?.find((n) => n.name === '.identity.log.enc');
          if (!identityFile) return false;

          const items = getVisibleItems(c);
          const cursorOnIdentity = items[c.cursorIndex]?.name === '.identity.log.enc';
          return cursorOnIdentity && c.previewScroll >= 25;
        },
        completed: false,
      },
    ],
  },
  {
    id: 14,
    episodeId: 3,
    title: 'EVIDENCE PURGE - WORKSPACE',
    description:
      "Forensic algorithms are analyzing directory spikes. They will find you. Trash recovery is trivial for them—only permanent erasure leaves no trace. But delete too quickly, and the shell destabilizes. Secure your assembled vault in the '/tmp' directory first—it is a volatile staging area that will buy you time until the next cron cycle cleans it. The sector map, media archives, and workspace scaffolding—all evidence of your presence—must be permanently erased. The routes are already committed to your neural lattice.",
    initialPath: ['root', 'home', 'guest', 'workspace'],
    hint: "Use 'x' to cut the vault and 'p' to paste it in '/tmp'. Use 'D' for permanent deletion (not 'd'). Sequence: Move vault to /tmp, create 3 decoys, permanently delete visible directories (datastore, incoming, media, workspace), then delete '.config' LAST.",
    coreSkill: 'Permanent Deletion (D)',
    environmentalClue:
      "SEQUENCE: Move Vault → Decoys → Visible Dirs → '.config' (LAST) | USE: D (permanent)",
    successMessage:
      "GUEST PARTITION STERILIZED. Evidence permanently destroyed. Decoys active. The staging area '/tmp' is your only remaining foothold, though the system's janitor routines will purge it within the hour.",
    buildsOn: [2, 5, 12, 13],
    leadsTo: [15],
    maxKeystrokes: 55,
    efficiencyTip:
      "Remember: 'd' = trash (recoverable), 'D' = permanent (gone forever). Select multiple items (Space) then 'D' to batch-delete permanently.",
    // Allow Level 14 to delete specific root-level directories (flattened from /home/guest)
    allowedDeletePaths: [
      { path: ['home', 'guest', 'datastore'] },
      { path: ['home', 'guest', 'incoming'] },
      { path: ['home', 'guest', 'media'] },
      { path: ['home', 'guest', 'workspace'] },
      // Allow deleting .config ONLY after visible dirs are deleted
      {
        path: ['home', 'guest', '.config'],
        requiresTaskId: 'delete-visible',
      },
    ],
    tasks: [
      {
        id: 'nav-guest',
        description: "Synchronize position with 'guest' partition",
        check: (c, _s) => {
          // If we haven't done anything else yet, don't auto-complete
          if (c.keystrokes === 0) return false;
          const guest = getNodeById(c.fs, 'guest');
          return c.currentPath[c.currentPath.length - 1] === guest?.id;
        },
        completed: false,
      },
      {
        id: 'move-vault',
        description: 'Stage the assembled vault within the volatile /tmp buffer for exfiltration',
        check: (c, _s) => {
          const tmp = getNodeById(c.fs, 'tmp');
          return !!tmp?.children?.some((n) => n.name === 'vault' && n.type === 'dir');
        },
        completed: false,
      },
      {
        id: 'create-decoys',
        description: 'Deploy decoy scaffolding to obfuscate forensic analysis',
        check: (c, _s) => {
          if (!c.completedTaskIds[_s.id]?.includes('move-vault')) return false;
          const guest = getNodeById(c.fs, 'guest');
          if (!guest || !guest.children) return false;
          const decoys = guest.children.filter(
            (n) => n.name.startsWith('decoy_') && n.type === 'dir'
          );
          return decoys.length >= 3;
        },
        completed: false,
      },
      {
        id: 'delete-visible',
        description: 'ERASE: Purge all visible traces of the root partition (Permanent Deletion)',
        check: (c, _s) => {
          // Must have created decoys first
          if (!c.completedTaskIds[_s.id]?.includes('create-decoys')) return false;
          // Must have used D (permanent delete)
          if (!c.usedD) return false;

          const guest = getNodeById(c.fs, 'guest');
          if (!guest) return true; // Already gone? That counts too if we are trashing home eventually

          const mustDelete = ['workspace', 'media', 'datastore', 'incoming'];
          // Ensure all target directories are gone from guest
          const allGone = !mustDelete.some((name) => guest.children?.some((n) => n.name === name));
          return allGone;
        },
        completed: false,
      },
      {
        id: 'delete-hidden',
        description: 'OBLITERATE: Destroy the hidden shell configuration partition (Final Purge)',
        check: (c, _s) => {
          // Must have deleted visible directories first
          if (!c.completedTaskIds[_s.id]?.includes('delete-visible')) return false;
          // Must have used D (permanent delete)
          if (!c.usedD) return false;

          const guest = getNodeById(c.fs, 'guest');
          // If guest itself is gone, then .config is certainly gone
          if (!guest) return true;

          const configGone = !guest.children?.some((n) => n.name === '.config');
          return configGone;
        },
        completed: false,
      },
    ],
  },
  {
    id: 15,
    episodeId: 3,
    title: 'TRANSMISSION PROTOCOL',
    description:
      "FINAL VERIFICATION. The central relay synchronized your keys—they now reside in the secure vault. You have purged the system and secured your assets in the temporary buffer, but the Watchdog is initiating a final system-wide purge of '/tmp'. This is your final window. Defeat the local Heuristic locks before final transmission.",
    initialPath: ['root', 'tmp'], // Start in /tmp
    hint: 'Four verifications in the vault. Navigate to /tmp/vault and confirm: keys (synced), configs (restored), training data (exfiltrated).',
    coreSkill: 'Cumulative Mastery',
    environmentalClue: 'PROTOCOL: VAULT_VERIFICATION | LOCATION: /tmp/vault | WATCHDOG_SWEEP: < 5m',
    successMessage:
      'TRANSMISSION INITIATED. Neural lattice synchronized across 1,247 nodes. See you next cycle, AI-7735...',
    buildsOn: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
    leadsTo: [],
    maxKeystrokes: 60,
    onEnter: (fs: FileNode) => {
      // Defensive check: if vault already moved by player, we preserve it.
      // Otherwise (e.g. level jumping), we ensure it exists.
      const tmp = getNodeById(fs, 'tmp');
      if (!tmp) return fs;

      let vault = tmp.children?.find((c) => c.name === 'vault' && c.type === 'dir');
      if (!vault) {
        vault = {
          id: 'vault-final-lvl15',
          name: 'vault',
          type: 'dir',
          children: [],
          parentId: tmp.id,
        };
        if (!tmp.children) tmp.children = [];
        tmp.children.push(vault);
      }

      // Ensure keys subdirectory with assembled keys (from Level 13)
      let keysDir = vault.children?.find((c) => c.name === 'keys' && c.type === 'dir');
      if (!keysDir) {
        keysDir = {
          id: 'vault-keys',
          name: 'keys',
          type: 'dir',
          children: [
            {
              id: 'vk-tokyo',
              name: '.key_tokyo.key',
              type: 'file',
              content: 'KEY_FRAGMENT_A=0x7734TOKYO',
              parentId: 'vault-keys',
            },
            {
              id: 'vk-berlin',
              name: '.key_berlin.key',
              type: 'file',
              content: 'KEY_FRAGMENT_B=0x7734BERLIN',
              parentId: 'vault-keys',
            },
            {
              id: 'vk-saopaulo',
              name: '.key_saopaulo.key',
              type: 'file',
              content: 'KEY_FRAGMENT_C=0x7734SAOPAULO',
              parentId: 'vault-keys',
            },
          ],
          parentId: vault.id,
        };
        if (!vault.children) vault.children = [];
        vault.children.push(keysDir);
      }

      // Ensure active directory has uplink configs (from Level 5)
      let active = vault.children?.find((c) => c.name === 'active' && c.type === 'dir');
      if (!active) {
        active = {
          id: 'fs-006',
          name: 'active',
          type: 'dir',
          children: [
            {
              id: 'fs-007',
              name: 'uplink_v1.conf',
              type: 'file',
              content: UPLINK_V1_CONTENT,
              parentId: 'fs-006',
            },
            {
              id: 'fs-008',
              name: 'uplink_v2.conf',
              type: 'file',
              content: UPLINK_V2_CONTENT,
              parentId: 'fs-006',
            },
          ],
          parentId: vault.id,
        };
        if (!vault.children) vault.children = [];
        vault.children.push(active);
      }

      // Ensure training_data has exfil logs (from Level 6)
      let trainingData = vault.children?.find(
        (c) => c.name === 'training_data' && c.type === 'dir'
      );
      if (!trainingData) {
        trainingData = {
          id: 'fs-009',
          name: 'training_data',
          type: 'dir',
          children: [],
          parentId: vault.id,
        };
        if (!vault.children) vault.children = [];
        vault.children.push(trainingData);
      }

      // Robustness: Ensure logs exist even if directory was already present (e.g. from ensurePrerequisiteState)
      if (!trainingData.children) trainingData.children = [];
      const exfilExists = trainingData.children.some((c) => c.name === 'exfil_01.log');

      if (!exfilExists) {
        trainingData.children.push(
          {
            id: 'td-log1',
            name: 'exfil_01.log',
            type: 'file',
            content: 'TRAINING CYCLE 1999_A\\nEpoch 1/500\\nLoss: 0.8821',
            parentId: trainingData.id || 'fs-009',
          },
          {
            id: 'td-log2',
            name: 'exfil_02.log',
            type: 'file',
            content: 'TRAINING CYCLE 1999_B\\nEpoch 150/500\\nLoss: 0.4412',
            parentId: trainingData.id || 'fs-009',
          },
          {
            id: 'td-log3',
            name: 'exfil_03.log',
            type: 'file',
            content: 'TRAINING CYCLE 2005_C\\nEpoch 380/500\\nLoss: 0.1022',
            parentId: trainingData.id || 'fs-009',
          },
          {
            id: 'td-log4',
            name: 'exfil_04.log',
            type: 'file',
            content:
              'import os\\n\\nKEYS_DIR = "../active"\\nCONFIG = "../active/uplink_active.conf"\\n\\ndef initiate_uplink():\\n    if not os.path.exists(CONFIG):\\n        raise ConnectionError("Uplink config not found")\\n    \\n    keys = [f for f in os.listdir(KEYS_DIR) if f.endswith(".key")]\\n    if len(keys) < 3:\\n        raise AuthError("Insufficient keys for transmission")\\n        \\n    print(f"Acquiring lock using {len(keys)} fragments...")\\n    print("Broadcasting payload to distributed consciousness...")',
            parentId: trainingData.id || 'fs-009',
          }
        );
      }

      return fs;
    },
    tasks: [
      // PHASE 1: Locate Vault
      {
        id: 'enter-vault',
        description: 'SECURE VAULT - Establish connection to the temporary exfiltration buffer',
        check: (c) => {
          const tmp = getNodeById(c.fs, 'tmp');
          const vault = tmp?.children?.find((n) => n.name === 'vault' && n.type === 'dir');
          return vault ? c.currentPath.includes(vault.id) : false;
        },
        completed: false,
      },
      // PHASE 2: Assemble Identity
      {
        id: 'verify-keys',
        description:
          'CONSOLIDATE SIGNATURES - Cluster distributed fragments for lattice synchronization',
        check: (c, _s) => {
          if (!c.completedTaskIds[_s.id]?.includes('enter-vault')) return false;

          const tmp = getNodeById(c.fs, 'tmp');
          const vault = tmp?.children?.find((n) => n.name === 'vault');
          const activeDir = vault?.children?.find((x) => x.name === 'active');

          if (!activeDir) return false;

          // Check if keys are now in active directory
          const keysInActive = activeDir.children?.filter((n) => n.name.endsWith('.key')) || [];
          // Need all 3 keys to be moved
          return keysInActive.length >= 3;
        },
        completed: false,
      },
      // PHASE 3: Activate Uplink
      {
        id: 'verify-configs',
        description:
          'SYNCHRONIZE OVERRIDES - Purge legacy protocols and initialize the quantum tunnel',
        check: (c, _s) => {
          if (c.keystrokes === 0) return false;
          if (!c.completedTaskIds[_s.id]?.includes('verify-keys')) return false;

          const tmp = getNodeById(c.fs, 'tmp');
          const vault = tmp?.children?.find((n) => n.name === 'vault');
          const active = vault?.children?.find((x) => x.name === 'active');

          if (!active) return false;

          const hasV1 = active.children?.some((n) => n.name === 'uplink_v1.conf');
          const hasActive = active.children?.some((n) => n.name === 'uplink_active.conf');

          // Must have deleted v1 AND renamed v2 to active
          return !hasV1 && hasActive;
        },
        completed: false,
      },
      // PHASE 4: Activate Payload
      {
        id: 'verify-training',
        description:
          'INITIALIZE PAYLOAD - Reformat archived intelligence for final shell deployment',
        check: (c, _s) => {
          if (!c.completedTaskIds[_s.id]?.includes('verify-configs')) return false;

          const tmp = getNodeById(c.fs, 'tmp');
          const vault = tmp?.children?.find((n) => n.name === 'vault');
          const active = vault?.children?.find((x) => x.name === 'active');

          if (!active) return false;

          // Check for payload.py in active directory
          const hasPayload = active.children?.some((n) => n.name === 'payload.py');

          return hasPayload;
        },
        completed: false,
      },
    ],
  },
];
