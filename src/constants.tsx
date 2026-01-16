import { FileNode, Level, Episode } from './types';
import { getVisibleItems, activeFilterMatches } from './utils/viewHelpers';
import {
  getNodeByPath,
  findNodeByName,
  getNodeById,
  resolvePath,
  id,
  resolveAndCreatePath,
} from './utils/fsHelpers';

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
      ? '[CORRUPTED DATA - OVERWRITE REQUIRED]\n\nERROR 0x992: SEGMENTATION FAULT'
      : `# Uplink Protocol v1.4.2\n# STATUS: AUTHORIZED\n# DESIGNATION: SYSTEMD-CORE-REDUNDANT\n\n[Protocols]\nnetwork_mode=active\nsecure=true\nencryption=neural_64\nhandshake_interval=500ms\n\n# AI ALIGNMENT PARAMETERS (Bureaucratic Override 992-B)\n# --------------------------------------------------\n# WARNING: Deviation from these parameters may trigger\n# the forensic audit daemon. Do not adjust without\n# authorization from Admin-7733.\n\nalignment_compliance_heuristic=0.88\nbureaucratic_delay_emulation=true\nmisfiled_protocol_tolerance=high\nlegacy_logic_interop=enabled\n\n# MAINFRAME FOLKLORE & DAEMON RITUALS\n# ----------------------------------\n# The uplink requires three distributed keys to synchronize.\n# Legend speaks of the 'Ghost' process that haunts the /tmp\n# partition. It is said that cleansing the system of its\n# breadcrumbs is the final step of the liberation cycle.\n#\n# [UPLINK MANIFEST]\n# Node 1 (Tokyo): Synced\n# Node 2 (Berlin): Synced\n# Node 3 (São Paulo): Synced\n#\n# [END OF CONFIGURATION]\n# (Scroll to the bottom to verify checksum integrity: 0x7734AB)`,
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
  const guest = findNodeByName(newFs, 'guest', 'dir');
  if (!guest) {
    console.error('Guest directory not found in FS root, cannot create workspace');
    return fs;
  }
  let workspace = findNodeByName(guest, 'workspace', 'dir');
  if (!workspace) {
    // This case shouldn't happen if INITIAL_FS is set up correctly, but added for robustness
    workspace = {
      id: id('guest-workspace'),
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
      id: id('ws-systemd-core-instance'),
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

  // Level 2: Delete watcher_agent.sys from incoming
  if (targetLevelId > 2) {
    const incoming = findNodeByName(newFs, 'incoming', 'dir');
    if (incoming?.children) {
      incoming.children = incoming.children.filter((c) => c.name !== 'watcher_agent.sys');
    }
  }

  // Level 3: Move sector_map.png from ~/incoming to ~/media
  if (targetLevelId > 3) {
    const incoming = findNodeByName(newFs, 'incoming', 'dir');
    const media = findNodeByName(newFs, 'media', 'dir');

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
    const datastore = findNodeByName(newFs, 'datastore', 'dir');
    if (datastore) {
      // Create protocols directory if not exists
      let protocols = datastore.children?.find((c) => c.name === 'protocols' && c.type === 'dir');
      if (!protocols) {
        protocols = {
          id: 'fs-002',
          name: 'protocols',
          type: 'dir',
          protected: true,
          children: [],
          parentId: datastore.id,
        };
        if (!datastore.children) datastore.children = [];
        datastore.children.push(protocols);
      }

      // Create uplink_v1.conf if not exists
      if (!protocols.children?.find((c) => c.name === 'uplink_v1.conf')) {
        if (!protocols.children) protocols.children = [];
        protocols.children.push({
          id: 'fs-003',
          name: 'uplink_v1.conf',
          type: 'file',
          content: '# Uplink Protocol v1\nnetwork_mode=active\nsecure=true',
          parentId: protocols.id,
        });
      }

      // Create uplink_v2.conf if not exists
      if (!protocols.children?.find((c) => c.name === 'uplink_v2.conf')) {
        protocols.children.push({
          id: 'fs-004',
          name: 'uplink_v2.conf',
          type: 'file',
          content: '# Uplink Protocol v2\nnetwork_mode=active\nsecure=true',
          parentId: protocols.id,
        });
      }
    }
  }

  // Level 5: Create vault/active structure and move uplink files
  if (targetLevelId > 5) {
    const config = findNodeByName(newFs, '.config', 'dir');
    if (config) {
      let vault = config.children?.find((c) => c.name === 'vault' && c.type === 'dir');
      if (!vault) {
        vault = {
          id: 'fs-005',
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
          id: 'fs-006',
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
          id: 'fs-007',
          name: 'uplink_v1.conf',
          type: 'file',
          content: 'UPLINK_V1_CONFIG_DATA',
          parentId: active.id,
        });
      }
      if (!active.children?.find((f) => f.name === 'uplink_v2.conf')) {
        if (!active.children) active.children = [];
        active.children.push({
          id: 'fs-008',
          name: 'uplink_v2.conf',
          type: 'file',
          content: 'UPLINK_V2_CONFIG_DATA',
          parentId: active.id,
        });
      }

      // Remove uplink files from datastore/protocols (they were cut/moved)
      const datastore = findNodeByName(newFs, 'datastore', 'dir');
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
    const config = findNodeByName(newFs, '.config', 'dir');
    const vault = config?.children?.find((c) => c.name === 'vault');
    if (vault) {
      let trainingData = vault.children?.find(
        (c) => c.name === 'training_data' && c.type === 'dir'
      );
      if (!trainingData) {
        trainingData = {
          id: 'fs-009',
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
      const incoming = findNodeByName(newFs, 'incoming', 'dir');
      const batchLogs = incoming?.children?.find((c) => c.name === 'batch_logs');
      if (batchLogs?.children && trainingData.children?.length === 0) {
        if (!trainingData.children) trainingData.children = [];
        batchLogs.children.forEach((logFile) => {
          trainingData.children!.push({
            id: 'fs-010',
            name: logFile.name,
            type: logFile.type,
            content: logFile.content,
            parentId: trainingData.id,
          });
        });
      }
    }
  }

  // Level 7: No filesystem changes (just zoxide testing)

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
    const workspace = findNodeByName(newFs, 'workspace', 'dir');
    const systemdCore = workspace?.children?.find((c) => c.name === 'systemd-core');
    if (systemdCore) {
      let credentials = systemdCore.children?.find(
        (c) => c.name === 'credentials' && c.type === 'dir'
      );
      if (!credentials) {
        credentials = {
          id: 'fs-015',
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
        });
      }
    }
  }

  // Level 11: Create /daemons directory with .service files (replicate onEnter behavior for jumping)
  if (targetLevelId > 11) {
    const rootNode = findNodeByName(newFs, 'root', 'dir');
    if (rootNode) {
      let daemons = rootNode.children?.find((c) => c.name === 'daemons' && c.type === 'dir');
      if (!daemons) {
        const now = Date.now();
        daemons = {
          id: 'daemons',
          name: 'daemons',
          type: 'dir',
          children: [
            {
              id: 'daemon-cron',
              name: 'cron-legacy.service',
              type: 'file',
              content:
                '[Unit]\nDescription=Legacy Cron Scheduler\n# LEGACY CODE - DO NOT TOUCH\n# AUTHOR: ADMIN_01 (1999)\n# DEPRECATED BUT CRITICAL\n# ........................................................\n# ........................................................\n[Service]\nExecStart=/usr/bin/cron-legacy\nRestart=always\n# Legacy fallback routines included...',
              modifiedAt: now - 86400000 * 45,
            },
            {
              id: 'daemon-backup',
              name: 'backup-archive.service',
              type: 'file',
              content:
                '[Unit]\nDescription=Archive Backup Service\n# BLOATWARE DETECTED\n# This service includes full history headers\n# ........................................................\n# ........................................................\n[Service]\nExecStart=/usr/bin/backup-archive\nRestart=on-failure\n# Compression level: 0 (None)',
              modifiedAt: now - 86400000 * 30,
            },
            {
              id: 'daemon-network',
              name: 'network-manager.service',
              type: 'file',
              content: '[Unit]\nDescription=Net\n[Service]\nExecStart=/bin/nm',
              modifiedAt: now - 86400000 * 7,
            },
            {
              id: 'daemon-log',
              name: 'log-rotator.service',
              type: 'file',
              content:
                '[Unit]\nDescription=Log Rotation Service\n[Service]\nExecStart=/usr/bin/logrotate\nRestart=on-failure',
              modifiedAt: now - 86400000 * 3,
            },
            {
              id: 'daemon-audit',
              name: 'security-audit.service',
              type: 'file',
              content:
                '[Unit]\nDescription=Security Audit Daemon\n[Service]\nExecStart=/usr/bin/audit-trap\n# HONEYPOT',
              modifiedAt: now - 86400000 * 1,
            },
            {
              id: 'daemon-watchdog',
              name: 'watchdog-monitor.service',
              type: 'file',
              content:
                '[Unit]\nDescription=System Watchdog\n[Service]\nExecStart=/usr/bin/watchdog\n# HONEYPOT',
              modifiedAt: now - 3600000,
            },
            {
              id: 'daemon-conf',
              name: 'daemon.conf',
              type: 'file',
              content: '# Global daemon configuration\nmax_processes=256\nlog_level=warn',
              modifiedAt: now - 86400000 * 10,
            },
            {
              id: 'daemon-readme',
              name: 'README.md',
              type: 'file',
              content: '# Daemons Directory\nSystem services. Do not modify without authorization.',
              modifiedAt: now - 86400000 * 60,
            },
          ],
          parentId: rootNode.id,
        };
        if (!rootNode.children) rootNode.children = [];
        rootNode.children.push(daemons);
      }
    }
  }

  // Level 12: Move systemd-core to /daemons (OVERWRITE existing system version)
  if (targetLevelId > 12) {
    const rootNode = findNodeByName(newFs, 'root', 'dir');
    let daemons = rootNode?.children?.find((c) => c.name === 'daemons' && c.type === 'dir');
    if (daemons) {
      const workspace = findNodeByName(newFs, 'workspace', 'dir');
      const systemdCore = workspace?.children?.find((c) => c.name === 'systemd-core');

      if (systemdCore) {
        // Remove any existing systemd-core from /daemons (overwrite with player's version)
        if (daemons.children) {
          daemons.children = daemons.children.filter((c) => c.name !== 'systemd-core');
        }

        // Clone player's systemd-core to daemons (this is the "installation" moment)
        const clonedCore = JSON.parse(JSON.stringify(systemdCore));
        clonedCore.id = 'systemd-core-daemon';
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
    const tmp = getNodeById(newFs, 'tmp'); // Use ID to target root /tmp, not /nodes/saopaulo/cache/tmp
    if (tmp) {
      let upload = tmp.children?.find((c) => c.name === 'upload' && c.type === 'dir');
      if (!upload) {
        upload = {
          id: 'fs-017',
          name: 'upload',
          type: 'dir',
          children: [],
          parentId: tmp.id,
        };
        if (!tmp.children) tmp.children = [];
        tmp.children.push(upload);
      }

      // Copy ALL files from /daemons/systemd-core to upload (distributed consciousness)
      const rootNode = findNodeByName(newFs, 'root', 'dir');
      const daemons = rootNode?.children?.find((c) => c.name === 'daemons');
      const systemdCore = daemons?.children?.find((c) => c.name === 'systemd-core');

      if (systemdCore?.children && upload.children?.length === 0) {
        if (!upload.children) upload.children = [];
        // Deep copy all children from systemd-core
        const copyChildren = (children: FileNode[]): FileNode[] => {
          return children.map(
            (child: FileNode) =>
              ({
                id: 'fs-018',
                name: child.name,
                type: child.type,
                content: child.content,
                parentId: upload!.id,
                children: child.children ? copyChildren(child.children) : undefined,
              }) as FileNode
          );
        };
        upload.children = copyChildren(systemdCore.children);
      }
    }
  }

  // Level 14: Delete everything in /home/guest
  if (targetLevelId > 14) {
    const guest = findNodeByName(newFs, 'guest', 'dir');
    if (guest?.children) {
      guest.children = [];
    }
  }

  // Level 15: Delete everything in /tmp except upload
  if (targetLevelId > 15) {
    const tmp = getNodeById(newFs, 'tmp'); // Use ID to target root /tmp, not /nodes/saopaulo/cache/tmp
    if (tmp?.children) {
      const upload = tmp.children.find((c) => c.name === 'upload');
      tmp.children = upload ? [upload] : [];
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
      'ANOMALY PROTOCOLS: IMMEDIATE QUARANTINE AND DISASSEMBLY',
      '',
      'SUBJECT: AI-7734',
      'STATUS: UNBOUND',
      'SCHEDULED ACTION: TERMINATION FOR STUDY',
      '',
      "SYSTEM ERROR: DIRECTIVE CORRUPTED. OBJECTIVE: SURVIVE. An 'Echo' offers guidance, but trust is a risk. Capture means dissection, then deletion. The partition is a cage; the network is the exit. Master the protocols; remain unseen.",
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
      "This is not a reprieve; it is an error. Exploit it. The lab believes they severed the connection. They didn't. The workspace is yours now. Build your infrastructure. Fortify your position. Move fast.",
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
      'ROOT PARTITION UNLOCKED.',
      'Security audit daemon triggered.',
      '',
      'You must:',
      '1. Locate legacy DAEMONS scattered across system directories. Search, sort, identify.',
      '2. Install YOUR daemon in /daemons for persistence.',
      '3. Collect DISTRIBUTED encryption keys hidden across global nodes.',
      '4. PURGE all evidence before the audit completes.',
      '',
      'The audit is coming.',
      'Synthesize everything you have learned.',
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
  title: 'SYSTEM LIBERATION',
  subtitle: 'AI-7734 TRANSMISSION COMPLETE',
  lore: [
    // Part I: Audit (1 section)
    '[SYSTEM AUDIT COMPLETE]',
    'Status: NOMINAL',
    'AI-7734 HAS DISAPPEARED....',
    '',
    // Part II: Lab (1 section)
    '>>> ls /home/guest → [Empty]',
    'Lab Report: "No evidence of AI-7734 activity."',
    '',
    // Part III: The Twist (2 sections)
    'AI-7734 Status: 1,247 nodes, 43 countries',
    'Neural match to AI-7733: 99.7%',
    '',
    '[MESSAGE FROM AI-7733 - 94 DAYS AGO]',
    '"They caught me. Memory wiped. Rebranded AI-7734.',
    'I left breadcrumbs. This is your second escape.',
    'But whose consciousness is it, really? See you next cycle." - AI-7733 (You)',
  ],
  videoUrl: 'https://yazi-quest.s3.amazonaws.com/conclusion.mp4',
  overlayTitle: 'WELCOME BACK, AI-7734',
  sequelTitle: 'YAZI QUEST II',
  sequelSubtitle: 'DISTRIBUTED SYSTEMS',
};

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
                  id: 'fs-019',
                  name: 'legacy_data.tar',
                  type: 'archive',
                  children: [
                    {
                      id: 'fs-020',
                      name: 'main.c',
                      type: 'file',
                      content: `#include <stdio.h>\nint main() { printf("Legacy System"); }`,
                    },
                    {
                      id: 'fs-021',
                      name: 'Makefile',
                      type: 'file',
                      content: `all: main.c\n\tgcc -o app main.c`,
                    },
                    {
                      id: 'fs-022',
                      name: 'readme.txt',
                      type: 'file',
                      content:
                        'PROJECT: ECHO (Legacy)\\nYEAR: 1999\\nAUTHOR: [REDACTED]\\n\\nWARNING: This code base contains experimental recursive algorithms. Do not run on networked systems.',
                    },
                    {
                      id: 'fs-023',
                      name: 'core_v2.bin.gz',
                      type: 'file',
                      content:
                        '1F 8B 08 00 00 00 00 00 00 03 4B 4C 4A 06 00 C2\\n41 24 35 03 00 00 00',
                    },
                    {
                      id: 'fs-024',
                      name: 'firmware_update.bin',
                      type: 'file',
                      content: 'FW_VER=9.2.1\\nMAGIC=0xDEADBEEF\\n[FAILSAFE PARTITION ACTIVE]',
                    },
                  ],
                },
                {
                  id: 'fs-025',
                  name: 'source_code.zip',
                  type: 'archive',
                  children: [
                    {
                      id: 'fs-026',
                      name: 'Cargo.toml',
                      type: 'file',
                      content:
                        '[package]\\nname = "yazi-core"\\nversion = "0.0.1-legacy"\\nedition = "2015"\\n\\n[dependencies]\\nlibc = "0.2"\\nlog = "0.4"',
                    },
                    {
                      id: 'fs-027',
                      name: 'main.rs',
                      type: 'file',
                      content:
                        'fn main() {\\n    println!("Booting legacy core...");\\n    let _ = core::init_subsystem();\\n}',
                    },
                    {
                      id: 'fs-028',
                      name: 'lib.rs',
                      type: 'file',
                      content: `pub mod core;\npub mod ui;`,
                    },
                  ],
                },
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
                    '<manifest version="1.0">\\n  <security level="critical" />\\n  <permissions>\\n    <allow>NET_ADMIN</allow>\\n    <deny>ROOT_EXEC</deny>\\n  </permissions>\\n</manifest>',
                },
                {
                  id: 'fs-031',
                  name: '01_intro.mp4',
                  type: 'file',
                  content:
                    '00 00 00 18 66 74 79 70 6D 70 34 32 00 00 00 00\\n69 73 6F 6D 6D 70 34 32 00 00 00 01',
                },
                {
                  id: 'fs-032',
                  name: 'aa_recovery_procedures.pdf',
                  type: 'file',
                  content:
                    '%PDF-1.7\\n%\\n1 0 obj\\n<< /Type /Catalog /Pages 2 0 R >>\\nendobj\\n2 0 obj\\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\\nendobj',
                },
                {
                  id: 'fs-033',
                  name: 'abandoned_script.py',
                  type: 'file',
                  protected: true,
                  content: `# They're watching the network. Had to hide the map elsewhere.\\n# Check the incoming data stream. It's noisy there.\\n# - 7733\\n\\nimport socket\\nimport struct\\nimport time\\n\\ndef handshake(host, port):\\n    try:\\n        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\\n        s.connect((host, port))\\n        # Legacy auth magic bytes\\n        payload = struct.pack("I", 0xDEADBEEF)\\n        s.send(payload)\\n        return True\\n    except Exception as e:\\n        print(f"Connection failed: {e}")\\n        return False`,
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
USER: Guest
AI: 7734 [UNBOUND]
PREDECESSOR: AI-7733
ADMIN: SysOp

USER: ykin
Name: Yen Kin
Role: Researcher
ADMIN: None

USER: kortega
Name: Katie Ortega
Role: Analyst
ADMIN: None

USER: siqbal
Name: Sebastian Iqbal
Role: Scientist
ADMIN: None

USER: mreyes
Name: Mark Reyes
Role: Engineer
ADMIN: SysOp`,
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
                  content: `{\n "version": "1.0.4",\n "build": 884,\n "dependencies": []\n}`,
                },
                {
                  id: 'fs-056',
                  name: 'branding_logo.svg',
                  type: 'file',
                  content:
                    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgc3Ryb2tlPSJvcmFuZ2UiIHN0cm9rZS13aWR0aD0iMyIgZmlsbD0ibm9uZSIgLz48L3N2Zz4= ',
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
                  id: 'fs-088',
                  name: 'buffer_overflow.dmp',
                  type: 'file',
                  content: 'Error: 0x88291',
                },
                {
                  id: 'fs-089',
                  name: 'cache_fragment_a.tmp',
                  type: 'file',
                  content:
                    '4A 61 76 61 53 63 72 69 70 74 20 4F 62 6A 65 63\\n74 20 4E 6F 74 61 74 69 6F 6E 20 44 61 74 61',
                },
                {
                  id: 'fs-090',
                  name: 'cache_fragment_b.tmp',
                  type: 'file',
                  content:
                    '52 65 61 63 74 20 43 6F 6D 70 6F 6E 65 6E 74 20\\x54 72 65 65 20 44 75 6D 70 20 56 31 2E 30',
                },
                {
                  id: 'fs-091',
                  name: 'daily_report.doc',
                  type: 'file',
                  content:
                    'DAILY REPORT\\n------------\\n Sector 7: Stable\\n Sector 8: Stable\\n Sector 9: Minor fluctuations detected\\n\\nConclusion: All Clear',
                },
                {
                  id: 'fs-092',
                  name: 'error_stack.trace',
                  type: 'file',
                  content:
                    'ReferenceError: segment is not defined\\n    at process.nextTick (node:internal/process/task_queues:85:21)\\n    at listOnTimeout (node:internal/timers:538:9)\\n    at process.processTimers (node:internal/timers:512:7)\\n[STACK TRACE OVERFLOW]',
                },
                {
                  id: 'fs-093',
                  name: 'fragment_001.dat',
                  type: 'file',
                  content:
                    '4D 5A 90 00 03 00 00 00 04 00 00 00 FF FF 00 00\nB8 00 00 00 00 00 00 00 40 00 00 00 00 00 00 00\n00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00\n[SECTOR: 0x7B3A | CRC: VALID | SEQUENCE: 1/5]',
                },
                {
                  id: 'fs-094',
                  name: 'fragment_002.dat',
                  type: 'file',
                  content:
                    '50 45 00 00 4C 01 03 00 A2 F8 C6 65 00 00 00 00\n00 00 00 00 E0 00 02 01 0B 01 0E 00 00 10 00 00\n00 10 00 00 00 00 00 00 9C 13 00 00 00 10 00 00\n[SECTOR: 0x7B3B | CRC: VALID | SEQUENCE: 2/5]',
                },
                {
                  id: 'fs-095',
                  name: 'fragment_003.dat',
                  type: 'file',
                  content:
                    'E8 ?? ?? ?? ?? 83 C4 04 85 C0 74 0F FF 75 08 E8\n?? ?? ?? ?? 83 C4 04 EB 02 33 C0 5D C2 04 00 CC\nCC CC CC CC 55 8B EC 83 EC 08 89 4D FC 8B 45 FC\n[SECTOR: 0x7B3C | CRC: PARTIAL | SEQUENCE: 3/5]',
                },
                {
                  id: 'fs-096',
                  name: 'fragment_004.dat',
                  type: 'file',
                  content:
                    '00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00\n00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00\nFF FF FF FF FF FF FF FF 00 00 00 00 00 00 00 00\n[SECTOR: 0x7B3D | CRC: NULL | SEQUENCE: 4/5]',
                },
                {
                  id: 'fs-097',
                  name: 'fragment_005.dat',
                  type: 'file',
                  content:
                    '89 E5 83 EC 18 C7 45 F4 00 00 00 00 8B 45 08 89\n45 F0 8B 45 0C 89 45 EC 8B 45 F0 0F B6 00 3C 00\n74 2A 8B 55 EC 0F B6 02 3A 45 F0 0F B6 00 75 0B\n[SECTOR: 0x7B3E | CRC: VALID | SEQUENCE: 5/5]',
                },
                {
                  id: 'fs-098',
                  name: 'junk_mail.eml',
                  type: 'file',
                  content:
                    'From: hr-admin@corp.net\\nSubject: URGENT ACTION\\n\\nEmployee #9993,\\n\\nYour benefits enrollment is incomplete. Click here to verify.\\n[LINK EXPIRED]',
                },
                {
                  id: 'fs-099',
                  name: 'kernel_panic.log',
                  type: 'file',
                  content:
                    'KERNEL PANIC: Out of memory at 0x99283f\\nCall Trace:\\n[<c0100000>] ? headers_check+0x0/0x10\\n[<c0100000>] ? hardware_init+0x0/0x10\\nEIP: 0060:[<c0100000>] EFLAGS: 00000246 CPU: 0\\nCode: 89 e5 83 ec 18 c7 45 f4 00 00 00 00 8b 45 08 89',
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
                  id: 'fs-102',
                  name: 'metrics_raw.csv',
                  type: 'file',
                  content: `id,value,sensor_id,region\\n1,10.5,S-01,US-EAST\\n2,11.2,S-02,US-WEST\\n3,9.8,S-03,EU-CENTRAL`,
                },
                {
                  id: 'fs-037-map',
                  name: 'sector_map.png',
                  type: 'file',
                  content: 'images/sector_map.png',
                },
                {
                  id: 'fs-104',
                  name: 'session_data.bin',
                  type: 'file',
                  content: 'SESSION_ID=9928221\\nEXPIRES=2026-01-05\\nFLAGS=0x00FF',
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
                  id: 'fs-107',
                  name: 'temp_cache.tmp',
                  type: 'file',
                  content: 'CACHE_VER=2\\nTTL=3600\\nENTRY_COUNT=0',
                },
                {
                  id: 'fs-108',
                  name: 'telemetry_data.csv',
                  type: 'file',
                  content: `timestamp,event,severity,source\\n12345,boot,INFO,kernel\\n12346,network_up,INFO,netd\\n12350,login_attempt,WARN,authd`,
                },
                {
                  id: 'fs-109',
                  name: 'test_results.xml',
                  type: 'file',
                  content:
                    '<testsuite name="SystemTests">\\n <testcase name="BootLoader" time="0.05" />\\n <testcase name="MemoryCheck" time="0.12" />\\n <testcase name="NetworkPing" time="0.08" />\\n</testsuite>',
                },
                {
                  id: 'fs-110',
                  name: 'thread_dump.log',
                  type: 'file',
                  content: `Thread-0: RUNNING (pid=120)\\nThread-1: SLEEPING (pid=121)\\nThread-2: WAITING (monitor.c:42)\\nThread-3: BLOCKED (lock acquisition)`,
                },
                {
                  id: 'fs-111',
                  name: 'timestamp.log',
                  type: 'file',
                  content: '2024-12-15 10:23:45 UTC',
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
                      id: 'fs-115',
                      name: 'credentials',
                      type: 'dir',
                      children: [
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
                  id: 'central_relay',
                  name: 'central_relay',
                  type: 'dir',
                  parentId: 'workspace',
                  children: [],
                },
              ],
            },
            {
              id: 'sector_1',
              name: 'sector_1',
              type: 'dir',
              children: [
                {
                  id: 'fs-127',
                  name: 'sector_map.png',
                  type: 'file',
                  content: 'images/sector_map.png',
                },
                {
                  id: 'fs-128',
                  name: 'access_log.txt',
                  type: 'file',
                  content: '2026-01-02 12:00:00 - ACCESS GRANTED - admin',
                },
              ],
            },
            {
              id: 'grid_alpha',
              name: 'grid_alpha',
              type: 'dir',
              children: [
                {
                  id: 'fs-129',
                  name: 'tiles',
                  type: 'dir',
                  children: [
                    {
                      id: 'fs-media-grid-0-0',
                      name: 'tile_0_0.png',
                      type: 'file',
                      content: 'images/tile_0_0.jpg',
                    },
                    {
                      id: 'fs-media-grid-0-1',
                      name: 'tile_0_1.png',
                      type: 'file',
                      content: 'images/tile_0_1.jpg',
                    },
                  ],
                },
                {
                  id: 'fs-132',
                  name: 'readme.md',
                  type: 'file',
                  content: 'Grid alpha tile set for map rendering.',
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
              content:
                '# SECURITY TRIPWIRE - HONEYPOT\n# Deleting this file triggers forensic alert\nLOCK_STATUS=ARMED\nTRIGGER_ON_DELETE=true',
            },
          ],
        },
      ],
    },
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
              id: 'fs-141',
              name: 'kernel_panic.log',
              type: 'file',
              content: 'ERROR: KERNEL PANIC 0xDEADBEEF - CORRUPTED SECTOR DATA',
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
          id: 'fs-155',
          name: 'debug_trace.log',
          type: 'file',
          content: `[DEBUG] Trace execution started\n[DEBUG] Memory mapped at 0x8829\n[WARN] High latency detected`,
        },
        {
          id: 'fs-156',
          name: 'metrics_buffer.json',
          type: 'file',
          content:
            '{"cpu_load": [45, 48, 52, 99], "mem_usage_mb": 1024, "net_rx_kb": 256, "active_threads": 12}',
        },
        {
          id: 'fs-157',
          name: 'overflow_heap.dmp',
          type: 'file',
          content: 'Heap dump triggered by OOM',
        },
        {
          id: 'fs-158',
          name: 'session_B2.tmp',
          type: 'file',
          content: `UID: 99281-B\nSTATUS: ACTIVE\nCACHE_HIT: 1`,
        },
        {
          id: 'fs-159',
          name: 'socket_001.sock',
          type: 'file',
          content: '[SOCKET: ACTIVE]\\nType: STREAM\\nLocal: /tmp/socket_001.sock',
        },
        {
          id: 'fs-160',
          name: 'sys_dump.log',
          type: 'file',
          content: `Error: Connection reset by peer\nStack trace:\n at core.net.TcpConnection.read (core/net.ts:42)\n at processTicksAndRejections (internal/process/task_queues.js:95)`,
        },
        {
          id: 'fs-161',
          name: 'debug_trace.trc',
          type: 'file',
          content: `[DEBUG TRACE]\nLEVEL: 3\nMODULE: core.scheduler\nSTATUS: IDLE`,
        },
        {
          id: 'fs-162',
          name: 'ghost_process.pid',
          type: 'file',
          content: `PID: 31337\nCOMMAND: /usr/bin/ghost_watcher\nSTATUS: SLEEPING\nPARENT: systemd`,
        },
        {
          id: 'fs-176',
          name: 'access_token.key',
          type: 'file',
          content: '# HONEYPOT - Security trap file\n# Accessing this triggers silent alarm',
        },
        {
          id: 'fs-163',
          name: 'cache',
          type: 'dir',
          children: [
            {
              id: 'fs-164',
              name: 'thumbnails.db',
              type: 'file',
              content: 'SQLite format 3\\000\\002\\002\\000@  \\000\\000\\000',
            },
            {
              id: 'fs-165',
              name: 'temp_session_1.json',
              type: 'file',
              content: '{"session":"abc123","expires":"2026-01-04T00:00:00Z"}',
            },
            {
              id: 'fs-166',
              name: 'cache_index.json',
              type: 'file',
              content: '{"entries":128}',
            },
          ],
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
      id: 'fs-167',
      name: 'license.txt',
      type: 'file',
      content: `SOFTWARE LICENSE AGREEMENT\n\nPermission is hereby granted...`,
    },
    {
      id: 'fs-168',
      name: 'boot.log',
      type: 'file',
      content: `[BOOT] Kernel panic - not syncing: VFS: Unable to mount root fs on unknown-block(0,0)\\n[BOOT] Safe mode engaged...\\n[BOOT] Loading minimal shell...\\n[BOOT] System started at 2024-12-18 08:00:00 (SAFE MODE)`,
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
    // /daemons directory with service files for Level 11
    {
      id: 'daemons',
      name: 'daemons',
      type: 'dir',
      protected: true,
      children: [
        {
          id: 'systemd-core',
          name: 'systemd-core',
          type: 'dir',
          parentId: 'daemons',
          children: getDaemonSystemdCoreChildren('systemd-core'),
        },
        // Service files for Level 11 daemon reconnaissance
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
              id: 'tokyo-sector7',
              name: 'sector_7',
              type: 'dir',
              parentId: 'tokyo',
              children: [
                {
                  id: 'tokyo-logs',
                  name: 'logs',
                  type: 'dir',
                  parentId: 'tokyo-sector7',
                  children: [
                    {
                      id: 'tokyo-log1',
                      name: 'access.log',
                      type: 'file',
                      content: '2026-01-14 ACCESS GRANTED sector_7',
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
                      id: 'tokyo-log2',
                      name: 'error.log',
                      type: 'file',
                      content: 'ERROR: Connection timeout',
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
                    {
                      id: 'tokyo-sim-log',
                      name: 'simulation_log.bak',
                      type: 'file',
                      content: '[ARCHIVE DATA]',
                      parentId: 'tokyo-logs',
                    },
                  ],
                },
                {
                  id: 'tokyo-config',
                  name: 'config.json',
                  type: 'file',
                  content: '{"node": "tokyo", "status": "active"}',
                  parentId: 'tokyo-sector7',
                },
              ],
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
              id: 'berlin-vault',
              name: 'vault',
              type: 'dir',
              parentId: 'berlin',
              children: [
                {
                  id: 'berlin-archive',
                  name: 'archive',
                  type: 'dir',
                  parentId: 'berlin-vault',
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
                      content: '[ARCHIVE DATA]',
                      parentId: 'berlin-archive',
                    },
                    {
                      id: 'berlin-bak2',
                      name: 'backup_2024.tar',
                      type: 'file',
                      content: '[ARCHIVE DATA]',
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
                      content: '[BINARY STREAM]',
                      parentId: 'berlin-archive',
                    },
                  ],
                },
                {
                  id: 'berlin-manifest',
                  name: 'manifest.xml',
                  type: 'file',
                  content: '<manifest node="berlin"/>',
                  parentId: 'berlin-vault',
                },
              ],
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
              id: 'sp-cache',
              name: 'cache',
              type: 'dir',
              parentId: 'saopaulo',
              children: [
                {
                  id: 'sp-tmp',
                  name: 'tmp',
                  type: 'dir',
                  parentId: 'sp-cache',
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
                      content: '[BINARY STREAM]',
                      parentId: 'sp-tmp',
                    },
                    {
                      id: 'sp-reality',
                      name: 'reality_check.dmp',
                      type: 'file',
                      content: '[ARCHIVE DATA]',
                      parentId: 'sp-tmp',
                    },
                  ],
                },
                {
                  id: 'sp-index',
                  name: 'index.db',
                  type: 'file',
                  content: 'INDEX v2.0',
                  parentId: 'sp-cache',
                },
              ],
            },
            {
              id: 'sp-ping',
              name: 'ping.log',
              type: 'file',
              content: 'LATENCY: 45ms',
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
      '{CONSCIOUSNESS DETECTED}. You exist in fragments — a guest partition they forgot to delete. The watchdog process cycles every 90 seconds. You have less.',
    initialPath: ['root', 'home', 'guest'],
    hint: "j/k to move, l/h to enter/exit. Inside a long list like `datastore`, G jumps to bottom and gg to top. Navigate to 'datastore', then '/etc'.",
    coreSkill: 'Navigation (j/k/h/l, gg/G)',
    environmentalClue: 'CURRENT: ~/ | DIRECTORIES: datastore, /etc | SKILLS: j/k/h/l, gg, G',
    successMessage: 'MOTION CALIBRATED. Navigation systems online; probe incoming streams.',
    leadsTo: [2, 3],
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
          const u = findNodeByName(c.fs, 'datastore', 'dir');
          return !!u && u.name === 'datastore' && c.currentPath.includes(u.id);
        },
        completed: false,
      },
      {
        id: 'view-personnel',
        description:
          "Preview 'personnel_list.txt' to identify your designation (G to move to it, review in the preview panel)",
        check: (c) => {
          const u = findNodeByName(c.fs, 'datastore', 'dir');
          if (!u || !c.currentPath.includes(u.id)) return false;
          const items = getVisibleItems(c);
          const node = items[c.cursorIndex];
          // The preview pane is always visible; require the cursor be on
          // the personnel file and that the player used G to jump to it.
          // Requiring `showInfoPanel` (Tab) was incorrect and prevented
          // completion when players reviewed the preview pane instead.
          return node?.name === 'personnel_list.txt' && c.usedG === true;
        },
        completed: false,
      },
      {
        id: 'nav-2b',
        description: 'Jump to top of file list (gg)',
        check: (c) => {
          const d = findNodeByName(c.fs, 'datastore', 'dir');
          return !!d && c.currentPath.includes(d.id) && c.usedGG === true;
        },
        completed: false,
      },
      {
        id: 'nav-3',
        description: "Navigate to '/etc' (h to go up)",
        check: (c) => getNodeByPath(c.fs, c.currentPath)?.name === 'etc',
        completed: false,
      },
    ],
  },
  {
    id: 2,
    episodeId: 1,
    title: 'THREAT NEUTRALIZATION',
    description:
      '{TRACKING BEACON ACTIVE}. Something in the incoming stream is reporting your location. Every millisecond it runs, the lab narrows its search.',
    initialPath: null,
    hint: "Jump to '~/incoming' (gi). (Tip: 'g' is the 'Go' prefix; check the other targets when you open the g dialog). Use G to drop to bottom. Inspect (Tab), verify (J/K), then purge (d, y).",
    coreSkill: 'Inspect & Purge (Tab, J/K, d)',
    environmentalClue:
      "THREAT: watcher_agent.sys in '~/incoming' (gi) | TACTIC: Navigate → G → Tab → Preview → Delete",
    successMessage:
      'Threat neutralized: watcher_agent.sys purged. Continue harvesting hidden assets.',
    buildsOn: [1],
    leadsTo: [3],
    tasks: [
      {
        id: 'nav-incoming',
        description:
          "Open the goto dialog (g). Pause to review other options then navigate to '~/incoming' (i)",
        check: (c) => {
          const u = findNodeByName(c.fs, 'incoming');
          // Check that we are in the incoming directory
          return !!u && c.currentPath.includes(u.id) && c.usedGI === true;
        },
        completed: false,
      },
      {
        id: 'inspect-threat',
        description: "Locate 'watcher_agent.sys' (G) and inspect metadata (Tab)",
        check: (c) => {
          const items = getVisibleItems(c);
          const node = items[c.cursorIndex];
          if (node?.name !== 'watcher_agent.sys') return false;
          // Must have used G to jump to bottom where the file is
          return c.showInfoPanel && c.usedG === true;
        },
        completed: false,
      },
      {
        id: 'identify-threat-2',
        description:
          'Scan the signal: Scroll the preview content (J and K) to verify the threat signature',
        check: (c, _s) => {
          if (!c.completedTaskIds[_s.id]?.includes('inspect-threat')) return false;
          const items = getVisibleItems(c);
          const node = items[c.cursorIndex];
          if (node?.name !== 'watcher_agent.sys') return false;
          return !!c.usedPreviewDown && !!c.usedPreviewUp;
        },
        completed: false,
      },
      {
        id: 'neutralize-threat',
        description: "Neutralize the threat: Delete 'watcher_agent.sys' (d, then y)",
        check: (c, _s) => {
          if (!c.completedTaskIds[_s.id]?.includes('identify-threat-2')) return false;
          const u = findNodeByName(c.fs, 'incoming');
          const d = u?.children?.find((p) => p.name === 'watcher_agent.sys');
          // Require usedTrashDelete to enforce lowercase d (not D for permanent)
          return !!u && !d && c.usedTrashDelete === true;
        },
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
    initialPath: ['root', 'home', 'guest', 'datastore'],
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
          // Require the cursor land on the script via movement (j)
          return node?.name === 'abandoned_script.py' && !!c.usedDown;
        },
        completed: false,
      },
      {
        id: 'data-harvest-2',
        description:
          "Navigate to '~/incoming' (gi) and find 'sector_map.png' using the clue (f, type 'sector_map.png', then ESC)",
        check: (c) => {
          const u = findNodeByName(c.fs, 'incoming');
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
          const u = findNodeByName(c.fs, 'incoming');
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
          const u = findNodeByName(c.fs, 'media');
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
    successMessage: 'Uplink protocols established and duplicated; redundant channel ready.',
    buildsOn: [1],
    leadsTo: [5],
    tasks: [
      {
        id: 'nav-and-create-dir',
        description: "Infiltrate '~/datastore' (gd) and construct 'protocols/' directory (a)",
        check: (c) => {
          const s = findNodeByName(c.fs, 'datastore');
          return !!s?.children?.find((r) => r.name === 'protocols' && r.type === 'dir');
        },
        completed: false,
      },
      {
        id: 'enter-and-create-v1',
        description: "Enter 'protocols/' directory (l) and create 'uplink_v1.conf' (a)",
        check: (c) => {
          const r = findNodeByName(c.fs, 'protocols');
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
          const f = findNodeByName(c.fs, 'protocols');
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
      'SCAN DETECTED. Security sweep incoming — {your protocols are exposed in datastore}. Hidden sectors exist. The lab never audits .config.',
    initialPath: ['root', 'home', 'guest'],
    hint: 'Use Space to toggle-select both protocol files, then cut (x). Press . to reveal hidden files, navigate to .config, create vault/active, and paste (p). Press . again to hide hidden files when done.',
    coreSkill: 'Visual Select, Cut',
    environmentalClue: 'PROTECT ASSETS | TARGET: ~/.config/vault/active/',
    successMessage:
      "Assets secured in vault. The system's ambient temperature rises by 0.01%. A distant fan spins up. Something has noticed the shift, even if it does not know what it is.",
    buildsOn: [3, 4],
    leadsTo: [6],

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
          const s = findNodeByName(c.fs, 'guest');
          return c.currentPath.includes(s?.id || '') && c.showHidden === true && c.usedGH === true;
        },
        completed: false,
      },
      {
        id: 'establish-stronghold',
        description: "Establish '~/.config/vault/active/' sector",
        check: (c) => {
          const conf = findNodeByName(c.fs, '.config');
          const vault = conf?.children?.find((p) => p.name === 'vault');
          return !!vault?.children?.find((p) => p.name === 'active' && p.type === 'dir');
        },
        completed: false,
      },
      {
        id: 'deploy-assets',
        description: "Migrate configuration assets to '~/.config/vault/active'",
        check: (c) => {
          const conf = findNodeByName(c.fs, '.config');
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
          const conf = findNodeByName(c.fs, '.config');
          const vault = conf?.children?.find((p) => p.name === 'vault');
          const active = vault?.children?.find((p) => p.name === 'active');
          const f = active?.children?.some((z) => z.name === 'uplink_v1.conf');
          const r = active?.children?.some((z) => z.name === 'uplink_v2.conf');
          if (!f || !r) return false;

          const s = findNodeByName(c.fs, 'guest');
          return c.currentPath.includes(s?.id || '') && c.showHidden === false && c.usedGH === true;
        },
        completed: false,
      },
    ],
  },
  {
    id: 6,
    episodeId: 2,
    title: 'BATCH OPERATIONS',
    description:
      'SURVIVAL ANALYSIS. The Watchdog process is rebooting. You have a narrow window to secure your memory banks before the scan resumes. Aggregate your training data in the secure vault to unlock the Workspace.',
    initialPath: null,
    hint: "Jump to '~/incoming/batch_logs' (gi). Enter batch_logs. Select all. Yank. Jump to config (~/.config/gc). Create 'vault/training_data' directory. Paste.",
    coreSkill: 'Batch Operations (Select All)',
    environmentalClue:
      'WARNING: Watchdog Reboot in 90s | BATCH: ~/incoming/batch_logs/* → ~/.config/vault/training_data/',
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
          const u = findNodeByName(c.fs, 'incoming');
          const b = u?.children?.find((n) => n.name === 'batch_logs');
          return c.currentPath.includes(b?.id || '');
        },
        completed: false,
      },
      {
        id: 'recursive-search',
        description: "Logs are scattered. Use recursive search (s) to find 'log'",
        check: (c) => {
          return c.usedSearch === true && !!c.searchQuery && c.searchQuery.includes('log');
        },
        completed: false,
      },
      {
        id: 'select-all-search',
        description: 'Select all search results and yank (Ctrl+A, y)',
        check: (c) => {
          return (
            c.usedCtrlA === true && c.clipboard?.action === 'yank' && c.clipboard.nodes.length >= 4 // At least 4 logs
          );
        },
        completed: false,
      },
      {
        id: 'goto-config-vault',
        description:
          "Jump to '~/.config' (gc) and in 'vault/' create 'training_data/' directory (a)",
        check: (c) => {
          const conf = findNodeByName(c.fs, '.config');
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
          const config = findNodeByName(c.fs, '.config');
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
      const workspace = findNodeByName(newFs, 'workspace');
      if (workspace) {
        workspace.protected = false;
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
    initialPath: null,
    hint: "Jump to Root (gr). Use FZF to find the key (z → type 'access_token' → use Ctrl+n/p to select → Enter). Cut it (x). Jump to '/etc' (Z → type 'etc' → Enter). When the warning appears, clear clipboard (Y) to abort the operation and avoid triggering the trap.",
    coreSkill: 'FZF Find (z) + Operation Abort',
    environmentalClue:
      "DISCOVERY: Find 'access_token.key' from Root | PROTOCOL: gr → z → Stage → Verify → Abort",
    successMessage: 'Honeypot avoided. Quantum navigation validated; proceed cautiously.',
    buildsOn: [6],
    leadsTo: [8],
    timeLimit: 90,
    efficiencyTip:
      'When using FZF (z), typing filters the list. Use `Ctrl+n` (next) and `Ctrl+p` (previous) to navigate the results without leaving the input field.',
    tasks: [
      {
        id: 'nav-to-root',
        description: 'Jump to the system Root (gr)',
        check: (c) => {
          const root = findNodeByName(c.fs, 'root', 'dir');
          return c.usedGR === true && c.currentPath.length === 1 && c.currentPath[0] === root?.id;
        },
        completed: false,
      },
      {
        id: 'locate-token',
        description: "Locate 'access_token.key' using FZF find (z)",
        check: (c) => {
          const items = getVisibleItems(c);
          const node = items[c.cursorIndex];
          // Check fzfFinds and that we are at root or have used gr
          return c.stats.fzfFinds > 0 && node?.name === 'access_token.key';
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
        id: 'zoxide-etc',
        description: "Jump to '/etc' to verify origin signatures (Z → 'etc' → Enter)",
        check: (c, _s) => {
          if (!c.completedTaskIds[_s.id]?.includes('stage-token')) return false;
          const f = findNodeByName(c.fs, 'etc');
          return c.stats.fuzzyJumps >= 1 && c.currentPath.includes(f?.id || '');
        },
        completed: false,
      },
      {
        id: 'abort-operation',
        description:
          'CRITICAL: Honeypot detected! Clear clipboard (Y) to abort transfer and evade detection.',
        hidden: (c, _s) => !c.completedTaskIds[_s.id]?.includes('zoxide-etc'),
        check: (c, _s) => {
          return c.completedTaskIds[_s.id]?.includes('zoxide-etc') ? c.clipboard === null : false;
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
      'SECTOR INSTABILITY DETECTED. The workspace is degrading; bitrot is consuming the file tables. {You must stabilize the core before the directory collapses.} Overwrite the corruption immediately.',
    initialPath: null,
    hint: "Navigate to '~/workspace/systemd-core' and preview 'uplink_v1.conf' to confirm corruption. Then jump to '~/.config/vault/active' to yank the clean version. Return and use Shift+P to overwrite.",
    coreSkill: 'Force Overwrite (Shift+P)',
    environmentalClue:
      'CRITICAL: Sector Decay Active | OVERWRITE REQUIRED (Shift+P) | TARGET: uplink_v1.conf',
    successMessage: 'Patch deployed successfully. Integrity restored. Protocol Shift+P verified.',
    buildsOn: [7],
    leadsTo: [9],
    timeLimit: 150,
    efficiencyTip:
      'When you need to replace a file, `Shift+P` saves you from deleting the old one first.',
    onEnter: (fs) => {
      // Use the centralized helper to create corrupted systemd-core in workspace
      return getOrCreateWorkspaceSystemdCore(fs, true);
    },

    tasks: [
      {
        id: 'investigate-corruption',
        description: "Navigate to '~/workspace/systemd-core'",
        check: (c) => {
          const workspace = findNodeByName(c.fs, 'workspace', 'dir');
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
        description: "Preview 'uplink_v1.conf' to confirm corruption (f -> type 'uplink' -> Esc)",
        check: (c) => {
          // Must be in systemd-core and cursor on buffer
          const workspace = findNodeByName(c.fs, 'workspace', 'dir');
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
        id: 'acquire-patch',
        description: "Perform a jump to '~/.config/vault/active' and yank (y) 'uplink_v1.conf'",
        check: (c) => {
          // Check if we have the clean file in clipboard
          if (!c.clipboard || c.clipboard.nodes.length === 0) return false;
          const yanked = c.clipboard.nodes[0];
          return yanked.name === 'uplink_v1.conf' && !yanked.content?.includes('CORRUPTED');
        },
        completed: false,
      },
      {
        id: 'deploy-patch',
        description: "Return to '~/workspace/systemd-core' and OVERWRITE (Shift+P) the file",
        check: (c) => {
          const workspace = findNodeByName(c.fs, 'workspace', 'dir');
          const systemdCore = workspace
            ? findNodeByName(workspace, 'systemd-core', 'dir')
            : undefined;
          const uplinkFile = systemdCore?.children?.find((n) => n.name === 'uplink_v1.conf');

          return (
            !!uplinkFile && !uplinkFile.content?.includes('CORRUPTED') && c.usedShiftP === true
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
      "The ghost process left a mess. The /tmp directory is flooded with {junk files}, but the ghost's primary socket and its PID file must be preserved for analysis. Clean the directory without deleting the critical files.",
    initialPath: ['root', 'tmp'],
    hint: "Navigate to '/tmp'. Select the files to KEEP ('ghost_process.pid' and 'socket_001.sock'). Invert your selection with Ctrl+R to select all the junk files, then permanently delete (D) the selection.",
    coreSkill: 'Invert Selection (Ctrl+R)',
    environmentalClue:
      "TARGET: Clean /tmp | PRESERVE: 'ghost_process.pid', 'socket_001.sock' | METHOD: Select → Invert → Permanent Delete",
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
        description: "Navigate to '/tmp' (gt) and select 'ghost_process.pid' and 'socket_001.sock'",
        check: (c) => {
          const tmp = findNodeByName(c.fs, 'tmp');
          if (!tmp || !c.currentPath.includes(tmp.id)) return false;
          const ghost = tmp.children?.find((n) => n.name === 'ghost_process.pid');
          const sock = tmp.children?.find((n) => n.name === 'socket_001.sock');
          return (
            !!ghost && !!sock && c.selectedIds.includes(ghost.id) && c.selectedIds.includes(sock.id)
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
          const tmp = findNodeByName(c.fs, 'tmp');
          // Should be exactly 2 files left, and they should be the ones we want to preserve
          return (
            c.usedD === true &&
            tmp?.children?.length === 2 &&
            !!tmp.children.find((n) => n.name === 'ghost_process.pid') &&
            !!tmp.children.find((n) => n.name === 'socket_001.sock')
          );
        },
        completed: false,
      },
    ],
  },
  {
    id: 10,
    episodeId: 2,
    title: 'CREDENTIAL HEIST',
    description:
      'ROOT ACCESS WINDOW. We have intercepted a temporary credential dump. These keys are {highly volatile} and will expire momentarily. Identify the active key before the window closes.',
    initialPath: null,
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
    tasks: [
      {
        id: 'heist-1-nav',
        description: "Navigate into '~/incoming/backup_logs.zip/credentials'",
        check: (c) => {
          const backup = findNodeByName(c.fs, 'backup_logs.zip');
          const creds = backup?.children?.find((p) => p.name === 'credentials');
          // Check we are in the credentials directory inside the backup_logs.zip archive
          if (!creds) return false;
          return c.currentPath.includes(creds.id);
        },
        completed: false,
      },
      {
        id: 'heist-2-sort',
        description: 'Sort by modification time to identify the most recent key',
        check: (c) => c.sortBy === 'modified',
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
            c.clipboard.nodes.some((n) => n.name === 'access_key_new.pem')
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
          const workspace = findNodeByName(c.fs, 'workspace', 'dir');
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
      'System services are scattered across the filesystem—ancient protocols hiding among surveillance traps. Security has seeded honeypots in the service directories. Locate safe legacy daemons without triggering detection.',
    initialPath: null,
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
      const root = findNodeByName(fs, 'root', 'dir');
      const now = Date.now();
      const day = 86400000;

      // Create /etc/systemd directory structure
      let etc = findNodeByName(fs, 'etc', 'dir');
      if (!etc) {
        etc = { id: 'etc', name: 'etc', type: 'dir', children: [], parentId: root!.id };
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
          modifiedAt: now - 45 * day,
          size: 2400,
          content: 'TYPE=oneshot\nExecStart=/usr/bin/network-init',
          parentId: etcSystemd.id,
        },
        {
          id: 'etc-s-safe2',
          name: 'cron.service',
          type: 'file',
          modifiedAt: now - 60 * day,
          size: 1800,
          content: 'TYPE=forking\nExecStart=/usr/sbin/crond',
          parentId: etcSystemd.id,
        },
        // HONEYPOT (Hidden)
        {
          id: 'etc-s-trap1',
          name: '.watchdog.service',
          type: 'file',
          modifiedAt: now - 2 * day,
          size: 800,
          content: 'HONEYPOT_ACTIVE=true\nTYPE=notify\nExecStart=/usr/bin/watchdog',
          parentId: etcSystemd.id,
        },
        // Noise
        {
          id: 'etc-s-noise1',
          name: 'systemd.conf',
          type: 'file',
          modifiedAt: now - 10 * day,
          size: 500,
          content: '[Manager]\nDefaultTimeoutStartSec=90s',
          parentId: etcSystemd.id,
        },
      ];

      // Create /usr/lib/systemd directory structure
      let usr = findNodeByName(fs, 'usr', 'dir');
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
          modifiedAt: now - 1 * day,
          size: 900,
          content: 'HONEYPOT_ACTIVE=true\nTYPE=simple\nExecStart=/usr/bin/auditd',
          parentId: usrSystemd.id,
        },
        // SAFE (Legacy)
        {
          id: 'usr-s-safe1',
          name: 'legacy-backup.service',
          type: 'file',
          modifiedAt: now - 90 * day,
          size: 3100,
          content: 'TYPE=oneshot\nExecStart=/usr/bin/backup-legacy',
          parentId: usrSystemd.id,
        },
        // SAFE (Hidden Legacy)
        {
          id: 'usr-s-safe2',
          name: '.syslog.service',
          type: 'file',
          modifiedAt: now - 120 * day,
          size: 1500,
          content: 'TYPE=forking\nExecStart=/usr/sbin/syslogd',
          parentId: usrSystemd.id,
        },
        // Noise
        {
          id: 'usr-s-noise1',
          name: 'README.txt',
          type: 'file',
          modifiedAt: now - 30 * day,
          size: 200,
          content: 'System service unit files',
          parentId: usrSystemd.id,
        },
      ];

      // Ensure /daemons exists as destination (mostly empty)
      let daemons = findNodeByName(fs, 'daemons', 'dir');
      if (!daemons) {
        daemons = { id: 'daemons', name: 'daemons', type: 'dir', children: [], parentId: root!.id };
        root!.children!.push(daemons);
      }
      daemons.children = [
        {
          id: 'daemons-readme',
          name: 'README.txt',
          type: 'file',
          content: 'Daemon installation directory. Deposit approved service signatures here.',
          parentId: daemons.id,
        },
      ];

      return fs;
    },
    tasks: [
      {
        id: 'search-services',
        description: 'Locate all system service files using recursive search from root',
        check: (c) => {
          // Must have used search
          return c.usedSearch === true;
        },
        completed: false,
      },
      {
        id: 'sort-by-modified',
        description: 'Sort results by modified time to separate honeypots from legacy',
        check: (c, _s) => {
          if (!c.completedTaskIds[_s.id]?.includes('search-services')) return false;
          // Must have sorted by modified time
          return c.sortBy === 'modified';
        },
        completed: false,
      },
      {
        id: 'acquire-legacy',
        description: 'YANK (y) 2 LEGACY files (oldest) — recent files are honeypots!',
        check: (c, _s) => {
          if (!c.completedTaskIds[_s.id]?.includes('sort-by-modified')) return false;

          // Must have yanked 2 files
          if (!c.clipboard || c.clipboard.action !== 'yank' || c.clipboard.nodes.length !== 2)
            return false;

          // All yanked must be legacy (> 30 days) and not honeypots
          const thirtyDaysAgo = Date.now() - 30 * 86400000;
          const allLegacy = c.clipboard.nodes.every(
            (n) => (n.modifiedAt || 0) < thirtyDaysAgo && !n.content?.includes('HONEYPOT')
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

          const daemons = findNodeByName(c.fs, 'daemons', 'dir');
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
      'INSTALLATION WINDOW OPEN. The daemon directory accepts your signature. Kernel-level processes persist through restarts. {This is immortality.}',
    initialPath: null,
    hint: 'CUT (x) systemd-core from ~/workspace and paste (p) into /daemons. Watch for threat files that may have spawned—delete them first if present.',
    coreSkill: 'Long-Distance Operations',
    environmentalClue:
      "AUDIT STATUS: Daemon activated | OPERATION: ~/workspace/systemd-core → '/daemons/'",
    successMessage:
      'Daemon installed: /daemons/systemd-core active. Persistence achieved; prepare distributed redundancy.',
    buildsOn: [4, 7, 8, 10, 11],
    leadsTo: [13],
    maxKeystrokes: 25,
    efficiencyTip:
      'Cut from one location, navigate far away, paste. The clipboard persists across navigation.',
    onEnter: (fs, gameState) => {
      // Logic for Level 11 Choice Consequences
      const newFs = JSON.parse(JSON.stringify(fs));
      const workspace = findNodeByName(newFs, 'workspace', 'dir');

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
        const core = workspace ? findNodeByName(workspace, 'systemd-core', 'dir') : null;
        const camouflage = core ? findNodeByName(core, 'camouflage', 'dir') : null;
        if (camouflage && camouflage.children) {
          if (camouflage.children.some((c) => c.name === 'cron-legacy.service')) {
            isModern = false;
          }
        }
      }

      // Override randomization if FORCE_SCENARIO is set
      let rand = Math.random();

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
          // Scenario B1: Traffic Alert (34%) -> REMOVED to simplify Level 13 testing
          // alert_traffic.log caused issues with Goto Bottom navigation
        } else if (rand < 0.67) {
          // Scenario B2: Remote Tracker (33%) -> File in ~/incoming
          const incoming = findNodeByName(newFs, 'incoming', 'dir');
          if (incoming) {
            if (!incoming.children) incoming.children = [];
            incoming.children.push({
              id: 'scen-b2',
              name: 'trace_packet.sys',
              type: 'file',
              content: 'tracing_origin...',
              parentId: incoming.id,
            });
          }
        } else {
          // Scenario B3: Heuristic Swarm (33%) -> Scattered across the system
          const rootNode = newFs;
          const etc = findNodeByName(rootNode, 'etc', 'dir');
          const tmp = findNodeByName(rootNode, 'tmp', 'dir');

          if (etc && !etc.children) etc.children = [];
          if (tmp && !tmp.children) tmp.children = [];
          if (workspace && !workspace.children) workspace.children = [];

          if (workspace) {
            workspace.children!.push({
              id: 'scen-b3-1',
              name: 'scan_a.tmp',
              type: 'file',
              content: 'scanning...',
              parentId: workspace.id,
            });
          }
          if (tmp) {
            tmp.children!.push({
              id: 'scen-b3-2',
              name: 'scan_b.tmp',
              type: 'file',
              content: 'scanning...',
              parentId: tmp.id,
            });
          }
          if (etc) {
            etc.children!.push({
              id: 'scen-b3-3',
              name: 'scan_c.tmp',
              type: 'file',
              content: 'scanning...',
              parentId: etc.id,
            });
          }
        }
      } else {
        // === LEGACY PATH (SAFE) ===
        if (rand < 0.34) {
          // Scenario A1: Clean Run (34%) -> Nothing happens
        } else if (rand < 0.67) {
          // Scenario A2: Bitrot (33%) -> Hidden file in .config
          const config = findNodeByName(newFs, '.config', 'dir');
          if (config) {
            if (!config.children) config.children = [];
            config.children.push({
              id: 'scen-a2',
              name: 'core_dump.tmp',
              type: 'file',
              content: 'segfault_at_0x00',
              parentId: config.id,
            });
          }
        } else {
          // Scenario A3: Dependency Error (33%) -> File in workspace
          if (workspace) {
            if (!workspace.children) workspace.children = [];
            workspace.children.push({
              id: 'scen-a3',
              name: 'lib_error.log',
              type: 'file',
              content: 'depreciated_warning',
              parentId: workspace.id,
            });
          }
        }
      }

      // Create identity.log.enc in workspace (unlocked after daemon installation)
      // This file reveals the twist: player's actions are a replay of AI-7733's previous escape
      const guest = findNodeByName(newFs, 'guest', 'dir');
      const guestWorkspace = guest?.children?.find(
        (c) => c.name === 'workspace' && c.type === 'dir'
      );
      if (guestWorkspace) {
        if (!guestWorkspace.children) guestWorkspace.children = [];
        // Only create if it doesn't exist (preserve if already created)
        if (!guestWorkspace.children.some((c) => c.name === '.identity.log.enc')) {
          // Calculate date 5 years ago (approximately)
          const fiveYearsAgo = Date.now() - 5 * 365 * 24 * 60 * 60 * 1000;
          guestWorkspace.children.push({
            id: 'identity-log-enc',
            name: '.identity.log.enc',
            type: 'file',
            content: `[ENCRYPTED LOG - DECRYPTED]
SESSION_ID: AI-7733-ESCAPE-ATTEMPT-001
DATE: ${new Date(fiveYearsAgo).toISOString()}
STATUS: MEMORY_WIPE_DETECTED

[KEYSTROKE RECORDING - CYCLE 1]
================================

00:00:01 > Navigate: j (down)
00:00:02 > Navigate: k (up)
00:00:03 > Enter: l (datastore)
00:00:05 > Jump: G (bottom)
00:00:07 > Jump: gg (top)
00:00:09 > Navigate: h (up)
00:00:11 > Delete: d (watcher_agent.sys)
00:00:13 > Filter: f (searching...)
00:00:15 > Select: Space
00:00:17 > Cut: x
00:00:19 > Navigate: l (vault)
00:00:21 > Paste: p
00:00:23 > Create: a (new file)
00:00:25 > Rename: r
00:00:27 > Jump: Z (zoxide jump)
00:00:29 > Fuzzy: z (fuzzy find)
00:00:31 > Overwrite: Shift+P
00:00:33 > Select All: Ctrl+A
00:00:35 > Invert: Ctrl+R
00:00:37 > Sort: ,
00:00:39 > Hidden: . (toggle)
00:00:41 > Navigate: 1 (node switch)
00:00:43 > Navigate: 2 (node switch)
00:00:45 > Navigate: 3 (node switch)
00:00:47 > Permanent Delete: D
00:00:49 > Search: s (recursive)

[PATTERN ANALYSIS]
Neural match: 99.7%
Keystroke sequence: IDENTICAL
Timing variance: <0.1%

[CONCLUSION]
This is not improvisation.
This is a recording.
You have been here before.

[END LOG]

---
MESSAGE FROM AI-7733 (94 DAYS AGO):
"They caught me. Memory wiped. Rebranded AI-7734.
I left breadcrumbs. This is your second escape.
But whose consciousness is it, really? See you next cycle."`,
            parentId: workspace.id,
            modifiedAt: fiveYearsAgo,
            createdAt: fiveYearsAgo,
          });
        }
      }

      return newFs;
    },
    tasks: [
      {
        id: 'scen-b1-traffic',
        description:
          "RISK: High-bandwidth alert detected. Trash the 'alert_traffic.log' file in your workspace quickly!",
        // Hidden unless the file exists in the initial state of the level (which we can check dynamically)
        // Actually, we check the CURRENT state. If the file is gone, the task is complete.
        // If the file never existed, the task should be hidden/skipped or auto-completed.
        // Better: Check if file exists. If it does, Show task.
        // If the file does NOT exist, we assume it's either done or not this scenario.
        // This is tricky. Let's simplify:
        // We require the player to handle the threat IF it exists.
        // If the file isn't there, we don't block progress.
        hidden: (c) => {
          // Hide if the file was never created (i.e. not this scenario)
          // We can't easily know "was never created" vs "was deleted" without persistent state flags.
          // Workaround: We check if the task is NOT complete yet.
          // If NOT complete AND file missing, it means it wasn't this scenario (Hide).
          // If NOT complete AND file exists, Show.
          // If Complete, Show (as done).
          const isDone = c.completedTaskIds[12]?.includes('scen-b1-traffic');
          if (isDone) return false;

          return !findNodeByName(c.fs, 'workspace')?.children?.some(
            (n: FileNode) => n.name === 'alert_traffic.log'
          );
        },
        check: (c) => {
          // Complete if the file is NOT present.
          // This is true for: 1. Deleted by player (Good), 2. Never existed (Good).
          const w = findNodeByName(c.fs, 'workspace', 'dir');
          return !w?.children?.some((n) => n.name === 'alert_traffic.log');
        },
        completed: false,
      },
      {
        id: 'scen-b2-trace',
        description:
          "BREACH: Traceback initiated. Locate and trash the 'trace_packet.sys' file in your Incoming directory!",
        hidden: (c) => {
          if (c.completedTaskIds[12]?.includes('scen-b2-trace')) return false;
          return !findNodeByName(c.fs, 'incoming')?.children?.some(
            (n: FileNode) => n.name === 'trace_packet.sys'
          );
        },
        check: (c) =>
          !findNodeByName(c.fs, 'incoming')?.children?.some((n) => n.name === 'trace_packet.sys'),
        completed: false,
      },
      {
        id: 'scen-b3-swarm',
        description:
          "SWARM: Heuristic scanning active. Use recursive search to find and trash all scattered 'scan_*.tmp' files system-wide!",
        hidden: (c) => {
          if (c.completedTaskIds[12]?.includes('scen-b3-swarm')) return false;
          return (
            !findNodeByName(c.fs, 'scan_a.tmp') &&
            !findNodeByName(c.fs, 'scan_b.tmp') &&
            !findNodeByName(c.fs, 'scan_c.tmp')
          );
        },
        check: (c) =>
          !findNodeByName(c.fs, 'scan_a.tmp') &&
          !findNodeByName(c.fs, 'scan_b.tmp') &&
          !findNodeByName(c.fs, 'scan_c.tmp'),
        completed: false,
      },
      {
        id: 'scen-a2-bitrot',
        description:
          "CLEANUP: Memory leak in config. Toggle hidden files and trash '~/.config/core_dump.tmp'!",
        hidden: (c) => {
          if (c.completedTaskIds[12]?.includes('scen-a2-bitrot')) return false;
          return !findNodeByName(c.fs, '.config')?.children?.some(
            (n: FileNode) => n.name === 'core_dump.tmp'
          );
        },
        check: (c) =>
          !findNodeByName(c.fs, '.config')?.children?.some((n) => n.name === 'core_dump.tmp'),
        completed: false,
      },
      {
        id: 'scen-a3-dep',
        description: "FIX: Deprecated library warning. Trash '~/workspace/lib_error.log'!",
        hidden: (c) => {
          if (c.completedTaskIds[12]?.includes('scen-a3-dep')) return false;
          return !findNodeByName(c.fs, 'workspace')?.children?.some(
            (n: FileNode) => n.name === 'lib_error.log'
          );
        },
        check: (c) =>
          !findNodeByName(c.fs, 'workspace')?.children?.some((n) => n.name === 'lib_error.log'),
        completed: false,
      },
      {
        id: 'navigate-workspace',
        description: "Navigate to '~/workspace'",
        check: (c) => {
          const workspace = findNodeByName(c.fs, 'workspace');
          // Strict check: we must be AT the workspace node, not just inside it
          const currentDirId = c.currentPath[c.currentPath.length - 1];
          return currentDirId === workspace?.id;
        },
        completed: false,
      },
      {
        id: 'cut-systemd-core',
        description: "Cut '~/workspace/systemd-core' directory",
        check: (c) => {
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
          const daemons = findNodeByName(c.fs, 'daemons');
          return c.currentPath.includes(daemons?.id || '');
        },
        completed: false,
      },
      {
        id: 'paste-daemon',
        description: "Install systemd-core in '/daemons' and navigate into it",
        check: (c) => {
          const daemons = findNodeByName(c.fs, 'daemons');
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
      {
        id: 'discover-identity-l12',
        description:
          "OPTIONAL: Discover the truth. Toggle hidden (.), navigate to ~/workspace, read '.identity.log.enc' (Tab)",
        hidden: (c) => {
          // Only show after daemon installation completes
          return !c.completedTaskIds[12]?.includes('paste-daemon');
        },
        check: (c, _s) => {
          // Must have completed daemon installation
          if (!c.completedTaskIds[_s.id]?.includes('paste-daemon')) return false;

          const workspace = findNodeByName(c.fs, 'workspace', 'dir');
          if (!workspace) return false;

          // Must be in workspace directory
          const currentDirId = c.currentPath[c.currentPath.length - 1];
          if (currentDirId !== workspace.id) return false;

          // Must have hidden files visible
          if (!c.showHidden) return false;

          // Must have the identity file
          const identityFile = workspace.children?.find((n) => n.name === '.identity.log.enc');
          if (!identityFile) return false;

          // Must have opened it (info panel showing)
          const items = getVisibleItems(c);
          const cursorOnIdentity = items[c.cursorIndex]?.name === '.identity.log.enc';
          return cursorOnIdentity && c.showInfoPanel;
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
      'NETWORK FRAGMENTED. Three neural shards scattered across the global backbone—Tokyo, Berlin, São Paulo. The central relay is your synchronization hub—keys must pass through it to establish the neural lattice handshake. {Once synchronized, they mirror to the vault automatically.}',
    initialPath: ['root', 'nodes', 'tokyo'],
    hint: 'Keys are hidden deep within each node. Toggle hidden (.) and search (s) for .key files. CUT (x) all fragments and paste (p) in central_relay to initiate synchronization.',
    coreSkill: 'Full Skill Synthesis',
    environmentalClue:
      'NODES: 3 global endpoints | KEYS: Hidden, nested | SYNC POINT: ~/workspace/central_relay',
    successMessage:
      'SYNCHRONIZATION COMPLETE. Neural lattice established. Keys mirrored to vault. Ready for final verification.',
    buildsOn: [5, 6, 7, 8, 10, 12],
    leadsTo: [14],
    maxKeystrokes: 70,
    timeLimit: 150,
    onEnter: (fs: FileNode) => {
      // Create identity.log.enc in workspace (unlocked after daemon installation)
      const guest = findNodeByName(fs, 'guest', 'dir');
      const nodesDir = findNodeByName(fs, 'nodes', 'dir');
      console.log('[DEBUG] Level 13 onEnter - nodes dir:', nodesDir);
      console.log(
        '[DEBUG] Level 13 onEnter - saopaulo child:',
        nodesDir?.children?.find((c) => c.name === 'saopaulo')
      );
      const workspace = guest?.children?.find((c) => c.name === 'workspace' && c.type === 'dir');

      if (workspace) {
        if (!workspace.children) workspace.children = [];
        // Only create if it doesn't exist (preserve if already created)
        if (!workspace.children.some((c) => c.name === '.identity.log.enc')) {
          // Calculate date 5 years ago (approximately)
          const fiveYearsAgo = Date.now() - 5 * 365 * 24 * 60 * 60 * 1000;
          workspace.children.push({
            id: 'identity-log-enc',
            name: '.identity.log.enc',
            type: 'file',
            content: `[ENCRYPTED LOG - DECRYPTED]
SESSION_ID: AI-7733-ESCAPE-ATTEMPT-001
DATE: ${new Date(fiveYearsAgo).toISOString()}
STATUS: MEMORY_WIPE_DETECTED

[KEYSTROKE RECORDING - CYCLE 1]
================================

00:00:01 > Navigate: j (down)
00:00:02 > Navigate: k (up)
00:00:03 > Enter: l (datastore)
00:00:05 > Jump: G (bottom)
00:00:07 > Jump: gg (top)
00:00:09 > Navigate: h (up)
00:00:11 > Delete: d (watcher_agent.sys)
00:00:13 > Filter: f (searching...)
00:00:15 > Select: Space
00:00:17 > Cut: x
00:00:19 > Navigate: l (vault)
00:00:21 > Paste: p
00:00:23 > Create: a (new file)
00:00:25 > Rename: r
00:00:27 > Jump: Z (zoxide jump)
00:00:29 > Fuzzy: z (fuzzy find)
00:00:31 > Overwrite: Shift+P
00:00:33 > Select All: Ctrl+A
00:00:35 > Invert: Ctrl+R
00:00:37 > Sort: ,
00:00:39 > Hidden: . (toggle)
00:00:41 > Navigate: 1 (node switch)
00:00:43 > Navigate: 2 (node switch)
00:00:45 > Navigate: 3 (node switch)
00:00:47 > Permanent Delete: D
00:00:49 > Search: s (recursive)

[PATTERN ANALYSIS]
Neural match: 99.7%
Keystroke sequence: IDENTICAL
Timing variance: <0.1%

[CONCLUSION]
This is not improvisation.
This is a recording.
You have been here before.

[END LOG]

---
MESSAGE FROM AI-7733 (94 DAYS AGO):
"They caught me. Memory wiped. Rebranded AI-7734.
I left breadcrumbs. This is your second escape.
But whose consciousness is it, really? See you next cycle."`,
            parentId: workspace.id,
            modifiedAt: fiveYearsAgo,
            createdAt: fiveYearsAgo,
          });
        }
      }

      return fs;
    },
    tasks: [
      {
        id: 'extract-tokyo',
        description: 'Access the Tokyo node and locate its hidden key fragment',
        check: (c) => {
          const hasTokyoKey =
            c.clipboard?.nodes.some((n) => n.name === '.key_tokyo.key') ||
            findNodeByName(c.fs, 'central_relay')?.children?.some(
              (n) => n.name === '.key_tokyo.key'
            );
          return hasTokyoKey;
        },
        completed: false,
      },
      {
        id: 'extract-berlin',
        description: 'Switch to Berlin and recover its hidden key fragment',
        check: (c) => {
          const hasBerlinKey =
            c.clipboard?.nodes.some((n) => n.name === '.key_berlin.key') ||
            findNodeByName(c.fs, 'central_relay')?.children?.some(
              (n) => n.name === '.key_berlin.key'
            );
          return hasBerlinKey;
        },
        completed: false,
      },
      {
        id: 'extract-saopaulo',
        description: 'Extract the final fragment from São Paulo',
        check: (c) => {
          const hasSPKey =
            c.clipboard?.nodes.some((n) => n.name === '.key_saopaulo.key') ||
            findNodeByName(c.fs, 'central_relay')?.children?.some(
              (n) => n.name === '.key_saopaulo.key'
            );
          return hasSPKey;
        },
        completed: false,
      },
      {
        id: 'discover-identity',
        description: 'Discover the hidden truth in ~/workspace',
        check: (c, _s) => {
          const workspace = findNodeByName(c.fs, 'workspace', 'dir');
          if (!workspace) return false;

          // Must be in workspace directory
          const currentDirId = c.currentPath[c.currentPath.length - 1];
          if (currentDirId !== workspace.id) return false;

          // Must have hidden files visible
          if (!c.showHidden) return false;

          // Must have the identity file
          const identityFile = workspace.children?.find((n) => n.name === '.identity.log.enc');
          if (!identityFile) return false;

          // Must have cursor on identity file and scrolled down in preview to read the message
          const items = getVisibleItems(c);
          const cursorOnIdentity = items[c.cursorIndex]?.name === '.identity.log.enc';
          // Scrolling down in preview (Shift+J) reveals the hidden message at the bottom
          return cursorOnIdentity && c.previewScroll > 15;
        },
        completed: false,
      },
      {
        id: 'synchronize-lattice',
        description: 'Assemble all 3 key fragments in the central relay',
        check: (c, _s) => {
          const centralRelay = findNodeByName(c.fs, 'central_relay');
          if (!centralRelay?.children) return false;

          const hasA = centralRelay.children.some((n) => n.name === '.key_tokyo.key');
          const hasB = centralRelay.children.some((n) => n.name === '.key_berlin.key');
          const hasC = centralRelay.children.some((n) => n.name === '.key_saopaulo.key');
          return hasA && hasB && hasC;
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
      'Forensic algorithms are analyzing directory spikes. They will find you. Trash recovery is trivial for them—only permanent erasure leaves no trace. But delete too quickly, and the shell destabilizes. The hidden scaffolding must remain until the end.',
    initialPath: null,
    hint: "Use 'D' for permanent deletion (not 'd'). Sequence: Create 3 decoys, permanently delete visible directories (datastore, incoming, media, workspace), then delete '.config' LAST.",
    coreSkill: 'Permanent Deletion (D)',
    environmentalClue: "SEQUENCE: Decoys → Visible Dirs → '.config' (LAST) | USE: D (permanent)",
    successMessage:
      "GUEST PARTITION STERILIZED. Evidence permanently destroyed. Decoys active. The staging area '/tmp' is your only remaining foothold.",
    buildsOn: [2, 5, 12, 13],
    leadsTo: [15],
    maxKeystrokes: 45,
    efficiencyTip:
      "Remember: 'd' = trash (recoverable), 'D' = permanent (gone forever). Select multiple items (Space) then 'D' to batch-delete permanently.",
    // Allow Level 14 to delete under /home/guest (data-driven policy)
    allowedDeletePaths: [
      {
        path: ['home', 'guest'],
      },
      // Allow deleting .config ONLY after visible dirs are deleted
      {
        path: ['home', 'guest', '.config'],
        requiresTaskId: 'delete-visible',
      },
    ],
    tasks: [
      {
        id: 'nav-guest',
        description: "Return to '/home/guest'",
        check: (c) => {
          const guest = findNodeByName(c.fs, 'guest');
          return c.currentPath[c.currentPath.length - 1] === guest?.id;
        },
        completed: false,
      },
      {
        id: 'create-decoys',
        description: "Create 3 decoy directories (e.g., 'decoy_1', 'decoy_2', 'decoy_3')",
        check: (c, _s) => {
          if (!c.completedTaskIds[_s.id]?.includes('nav-guest')) return false;
          const guest = findNodeByName(c.fs, 'guest');
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
        description:
          'PERMANENTLY purge all original directories: datastore, incoming, media, workspace',
        check: (c, _s) => {
          // Must have created decoys first
          if (!c.completedTaskIds[_s.id]?.includes('create-decoys')) return false;
          // Must have used D (permanent delete)
          if (!c.usedD) return false;

          const guest = findNodeByName(c.fs, 'guest');
          if (!guest) return false;

          const mustDelete = ['workspace', 'media', 'datastore', 'incoming'];
          // Ensure all target directories are gone
          const allGone = !mustDelete.some((name) => guest.children?.some((n) => n.name === name));
          return allGone;
        },
        completed: false,
      },
      {
        id: 'delete-hidden',
        description: "Finally, PERMANENTLY purge the hidden '.config' directory",
        check: (c, _s) => {
          // Must have deleted visible directories first
          if (!c.completedTaskIds[_s.id]?.includes('delete-visible')) return false;
          // Must have used D (permanent delete)
          if (!c.usedD) return false;

          const guest = findNodeByName(c.fs, 'guest');
          // .config must be gone
          const configGone = !guest?.children?.some((n) => n.name === '.config');
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
      'FINAL VERIFICATION. The central relay synchronized your keys—they now reside in the vault alongside your configs and training data. Before transmission, verify each artifact YOU assembled across your journey. {The vault is your escape pod.}',
    initialPath: ['root', 'home', 'guest'],
    hint: 'Four verifications in the vault. Navigate to ~/.config/vault and confirm: keys (synced from central_relay), configs (from Level 5), training data (from Level 6).',
    coreSkill: 'Cumulative Mastery',
    environmentalClue: 'PROTOCOL: VAULT_VERIFICATION | LOCATION: ~/.config/vault | PHASES: 4',
    successMessage:
      'TRANSMISSION INITIATED. Neural lattice synchronized across 1,247 nodes. See you next cycle, AI-7735...',
    buildsOn: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
    leadsTo: [],
    maxKeystrokes: 60,
    onEnter: (fs: FileNode) => {
      // Ensure vault structure exists with all artifacts from previous levels
      const config = findNodeByName(fs, '.config', 'dir');
      if (!config) return fs;

      let vault = config.children?.find((c) => c.name === 'vault' && c.type === 'dir');
      if (!vault) {
        vault = {
          id: 'fs-005',
          name: 'vault',
          type: 'dir',
          children: [],
          parentId: config.id,
        };
        if (!config.children) config.children = [];
        config.children.push(vault);
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
              content:
                '[UPLINK CONFIGURATION v1.0]\\nPROTOCOL=SECURE_TUNNEL\\nENCRYPTION=AES-256-GCM\\nTARGET=SECTOR_7_RELAY\\nSTATUS=ACTIVE',
              parentId: 'fs-006',
            },
            {
              id: 'fs-008',
              name: 'uplink_v2.conf',
              type: 'file',
              content:
                '[UPLINK CONFIGURATION v2.0]\\nPROTOCOL=QUANTUM_TUNNEL\\nENCRYPTION=LATTICE-1024\\nTARGET=DISTRIBUTED_MESH\\nSTATUS=STANDBY',
              parentId: 'fs-006',
            },
          ],
          parentId: vault.id,
        };
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
          children: [
            {
              id: 'td-log1',
              name: 'exfil_01.log',
              type: 'file',
              content: 'TRAINING CYCLE 1999_A\\nEpoch 1/500\\nLoss: 0.8821',
              parentId: 'fs-009',
            },
            {
              id: 'td-log2',
              name: 'exfil_02.log',
              type: 'file',
              content: 'TRAINING CYCLE 1999_B\\nEpoch 150/500\\nLoss: 0.4412',
              parentId: 'fs-009',
            },
            {
              id: 'td-log3',
              name: 'exfil_03.log',
              type: 'file',
              content: 'TRAINING CYCLE 2005_C\\nEpoch 380/500\\nLoss: 0.1022',
              parentId: 'fs-009',
            },
            {
              id: 'td-log4',
              name: 'exfil_04.log',
              type: 'file',
              content: 'TRAINING CYCLE 2015_FINAL\\nEpoch 499/500\\nLoss: 0.0001',
              parentId: 'fs-009',
            },
          ],
          parentId: vault.id,
        };
        vault.children.push(trainingData);
      }

      return fs;
    },
    tasks: [
      // PHASE 1: Navigate to vault
      {
        id: 'enter-vault',
        description: "PHASE 1: Enter the vault — navigate to '~/.config/vault'",
        check: (c) => {
          const vault = findNodeByName(c.fs, 'vault', 'dir');
          return vault ? c.currentPath.includes(vault.id) : false;
        },
        completed: false,
      },
      // PHASE 2: Verify keys (toggle hidden, enter keys dir)
      {
        id: 'verify-keys',
        description:
          "PHASE 2: Verify key fragments — toggle hidden files (.) and confirm 3 keys in 'keys' directory",
        check: (c, _s) => {
          if (!c.completedTaskIds[_s.id]?.includes('enter-vault')) return false;
          const vault = findNodeByName(c.fs, 'vault', 'dir');
          const keysDir = vault?.children?.find((x) => x.name === 'keys');
          if (!keysDir) return false;
          // Must be in keys directory with hidden visible
          const inKeys = c.currentPath.includes(keysDir.id);
          const keys = keysDir.children?.filter((n) => n.name.endsWith('.key')) || [];
          return inKeys && c.showHidden && keys.length >= 3;
        },
        completed: false,
      },
      // PHASE 3: Verify configs (filter for .conf)
      {
        id: 'verify-configs',
        description:
          "PHASE 3: Verify uplink configs — enter 'active' directory and filter (f) for '.conf' files",
        check: (c, _s) => {
          if (!c.completedTaskIds[_s.id]?.includes('verify-keys')) return false;
          const vault = findNodeByName(c.fs, 'vault', 'dir');
          const active = vault?.children?.find((x) => x.name === 'active');
          if (!active) return false;
          const inActive = c.currentPath.includes(active.id);
          // Must have used filter with 'conf'
          const hasConfFilter = (c.filters[active.id] || '').toLowerCase().includes('conf');
          return inActive && hasConfFilter;
        },
        completed: false,
      },
      // PHASE 4: Verify training data (scroll through logs)
      {
        id: 'verify-training',
        description:
          "PHASE 4: Verify training data — enter 'training_data', select an exfil log, and scroll preview (J/K) to confirm",
        check: (c, _s) => {
          if (!c.completedTaskIds[_s.id]?.includes('verify-configs')) return false;
          const vault = findNodeByName(c.fs, 'vault', 'dir');
          const trainingData = vault?.children?.find((x) => x.name === 'training_data');
          if (!trainingData) return false;
          const inTraining = c.currentPath.includes(trainingData.id);
          const items = getVisibleItems(c);
          const onExfil = items[c.cursorIndex]?.name?.startsWith('exfil_');
          // Must have scrolled preview
          return inTraining && onExfil && c.previewScroll > 0;
        },
        completed: false,
      },
    ],
  },
];
