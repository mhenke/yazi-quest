import { FileNode } from '../types';
import { getNodeById } from './fsHelpers';
import { getDaemonSystemdCoreChildren } from '../data/filesystem';
import { UPLINK_TRAP_CONTENT, UPLINK_V1_CONTENT, UPLINK_V2_CONTENT } from '../data/lore';
import { id } from './fsHelpers';

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

export const getOrCreateWorkspaceSystemdCore = (fs: FileNode, isCorrupted: boolean): FileNode => {
  const newFs = JSON.parse(JSON.stringify(fs));
  const guest = getNodeById(newFs, 'guest');
  if (!guest) {
    console.error('Guest directory not found in FS root, cannot create workspace');
    return fs;
  }
  let workspace = getNodeById(newFs, 'workspace');
  if (!workspace) {
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

  let systemdCore = workspace.children?.find((c: FileNode) => c.name === 'systemd-core' && c.type === 'dir');
  if (!systemdCore) {
    systemdCore = {
      id: 'systemd-core',
      name: 'systemd-core',
      type: 'dir',
      protected: true,
      children: [],
      parentId: workspace.id,
    };
    if (!workspace.children) workspace.children = [];
    workspace.children.push(systemdCore);
  }

  systemdCore.children = getWorkspaceSystemdCoreChildren(systemdCore.id, isCorrupted);
  return newFs;
};

export const ensurePrerequisiteState = (fs: FileNode, targetLevelId: number): FileNode => {
  let newFs = JSON.parse(JSON.stringify(fs));

  // Fixed baseline for time to ensure consistency across page reloads
  const BASE_TIME = 1433059200000; // 2015-05-31 08:00:00
  const day = 86400000;

  // Level 2: Delete watcher_agent.sys from incoming
  if (targetLevelId > 2) {
    const incoming = getNodeById(newFs, 'incoming');
    if (incoming?.children) {
      incoming.children = incoming.children.filter((c: FileNode) => c.name !== 'watcher_agent.sys');
    }
  }

  // Level 3: Move sector_map.png from ~/incoming to ~/media
  if (targetLevelId > 3) {
    const incoming = getNodeById(newFs, 'incoming');
    const media = getNodeById(newFs, 'media');

    // Find sector_map.png in incoming
    const sectorMap = incoming?.children?.find((c: FileNode) => c.name === 'sector_map.png');

    if (sectorMap && media) {
      // Remove from incoming
      if (incoming?.children) {
        incoming.children = incoming.children.filter((c: FileNode) => c.name !== 'sector_map.png');
      }
      // Add to media if not already there
      if (!media.children?.find((c: FileNode) => c.name === 'sector_map.png')) {
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
      let protocols = datastore.children?.find((c: FileNode) => c.name === 'protocols' && c.type === 'dir');
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
      if (!protocols.children?.find((c: FileNode) => c.name === 'security_policy_v1.1.draft')) {
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
      if (!protocols.children?.find((c: FileNode) => c.name === 'uplink_v1.conf')) {
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
      if (!protocols.children?.find((c: FileNode) => c.name === 'uplink_v2.conf')) {
        if (!protocols.children) protocols.children = [];
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
      let vault = config.children?.find((c: FileNode) => c.name === 'vault' && c.type === 'dir');
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

      let active = vault.children?.find((c: FileNode) => c.name === 'active' && c.type === 'dir');
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
      if (!active.children?.find((f: FileNode) => f.name === 'uplink_v1.conf')) {
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
      if (!active.children?.find((f: FileNode) => f.name === 'uplink_v2.conf')) {
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
      if (!active.children?.find((f: FileNode) => f.name === 'uplink_v1.conf.trap')) {
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
      const protocols = datastore?.children?.find((c: FileNode) => c.name === 'protocols');
      if (protocols?.children) {
        protocols.children = protocols.children.filter(
          (c: FileNode) => c.name !== 'uplink_v1.conf' && c.name !== 'uplink_v2.conf'
        );
      }
    }
  }

  // Level 6: Create vault/training_data and copy batch logs
  if (targetLevelId > 6) {
    const config = getNodeById(newFs, '.config');
    const vault = config?.children?.find((c: FileNode) => c.name === 'vault');
    if (vault) {
      let trainingData = vault.children?.find(
        (c: FileNode) => c.name === 'training_data' && c.type === 'dir'
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
      const batchLogs = incoming?.children?.find((c: FileNode) => c.name === 'batch_logs');
      if (batchLogs?.children && trainingData.children?.length === 0) {
        if (!trainingData.children) trainingData.children = [];
        batchLogs.children.forEach((logFile: FileNode, idx: number) => {
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

  // Level 8: Ensure systemd-core exists in workspace (Corrupted state)
  if (targetLevelId >= 8) {
    const isCorrupted = targetLevelId === 8;
    newFs = getOrCreateWorkspaceSystemdCore(newFs, isCorrupted);
  }

  // Level 7: Ensure access_token.key exists in /tmp (User aborted move, so it remains)
  if (targetLevelId > 7) {
    const tmp = getNodeById(newFs, 'tmp');
    if (tmp) {
      if (!tmp.children) tmp.children = [];
      if (!tmp.children.find((c: FileNode) => c.name === 'access_token.key')) {
        tmp.children.push({
          id: 'fs-access-token-key-tmp-prereq',
          name: 'access_token.key',
          type: 'file',
          content: 'AB-9921-X [VALID]',
          parentId: tmp.id,
          modifiedAt: BASE_TIME - 30 * 60 * 1000,
        });
      }
    }
  }

  // Level 9: Clean up junk files from /tmp
  if (targetLevelId > 9) {
    const tmp = getNodeById(newFs, 'tmp'); // Use ID to target root /tmp, not /nodes/saopaulo/cache/tmp
    if (tmp?.children) {
      const filesToKeep = [
        'ghost_process.pid',
        'socket_001.sock',
        'access_token.key',
        'system_monitor.pid',
      ];
      tmp.children = tmp.children.filter((c: FileNode) => c.type === 'dir' || filesToKeep.includes(c.name));
    }
  }

  // Level 10: Add credentials to systemd-core
  if (targetLevelId > 10) {
    const workspace = getNodeById(newFs, 'workspace');
    const systemdCore = workspace?.children?.find((c: FileNode) => c.name === 'systemd-core');
    if (systemdCore) {
      let credentials = systemdCore.children?.find(
        (c: FileNode) => c.name === 'credentials' && c.type === 'dir'
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

      if (!credentials.children?.find((c: FileNode) => c.name === 'access_key.pem')) {
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
    if (systemdCore && !systemdCore.children?.find((c: FileNode) => c.name === 'camouflage')) {
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
      let daemons = rootNode.children?.find((c: FileNode) => c.name === 'daemons' && c.type === 'dir');
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
        (c: FileNode) => c.name.endsWith('.service') && !c.name.includes('README')
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
    let daemons = rootNode?.children?.find((c: FileNode) => c.name === 'daemons' && c.type === 'dir');
    if (daemons) {
      const workspace = getNodeById(newFs, 'workspace');
      const systemdCore = workspace?.children?.find((c: FileNode) => c.name === 'systemd-core');

      if (systemdCore) {
        // Remove any existing systemd-core from /daemons (overwrite with player's version)
        if (daemons.children) {
          daemons.children = daemons.children.filter((c: FileNode) => c.name !== 'systemd-core');
        }

        // Clone player's systemd-core to daemons (this is the "installation" moment)
        const clonedCore = JSON.parse(JSON.stringify(systemdCore));
        clonedCore.id = 'daemons-systemd-core';
        clonedCore.parentId = daemons.id;
        if (!daemons.children) daemons.children = [];
        daemons.children.push(clonedCore);

        // Remove from workspace - systemd-core now lives in /daemons post-install
        if (workspace?.children) {
          workspace.children = workspace.children.filter((c: FileNode) => c.name !== 'systemd-core');
        }
      }
    }
  }

  // Level 13: Create /tmp/upload and copy ALL systemd-core contents (distributed consciousness)
  if (targetLevelId > 13) {
    const tmp = getNodeById(newFs, 'tmp');
    if (tmp) {
      let upload = tmp.children?.find((c: FileNode) => c.name === 'upload' && c.type === 'dir');
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
      const daemons = rootNode?.children?.find((c: FileNode) => c.name === 'daemons');
      const systemdCore = daemons?.children?.find((c: FileNode) => c.name === 'systemd-core');

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
    if (targetLevelId >= 13) {
      const wsNode = getNodeById(newFs, 'workspace');
      if (wsNode && !wsNode.children?.find((c: FileNode) => c.name === '.identity.log.enc')) {
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
  }

  // Level 14: Secure vault in /tmp and Delete everything in /home/guest
  if (targetLevelId > 14) {
    const config = getNodeById(newFs, '.config');
    const vault = config?.children?.find((c: FileNode) => c.name === 'vault');
    const tmp = getNodeById(newFs, 'tmp');

    if (vault && tmp) {
      // Remove from config
      if (config?.children) {
        config.children = config.children.filter((c: FileNode) => c.name !== 'vault');
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
      tmp.children = tmp.children.filter((c: FileNode) => keptItems.includes(c.name));
    }
  }

  return newFs;
};
