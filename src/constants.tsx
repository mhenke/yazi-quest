import { FileNode, Level, Episode } from '../types';

import { getVisibleItems, activeFilterMatches } from './utils/viewHelpers';
import { getNodeByPath, findNodeByName, getNodeById } from './utils/fsHelpers';

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
          (c) => c.name !== 'uplink_v1.conf' && c.name !== 'uplink_v2.conf',
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
        (c) => c.name === 'training_data' && c.type === 'dir',
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

  // Level 8: Create systemd-core structure in workspace
  if (targetLevelId > 8) {
    const workspace = findNodeByName(newFs, 'workspace', 'dir');
    if (workspace) {
      let systemdCore = workspace.children?.find(
        (c) => c.name === 'systemd-core' && c.type === 'dir',
      );
      if (!systemdCore) {
        systemdCore = {
          id: 'fs-011',
          name: 'systemd-core',
          type: 'dir',
          children: [],
          parentId: workspace.id,
        };
        if (!workspace.children) workspace.children = [];
        workspace.children.push(systemdCore);
      }

      // Create weights directory
      let weights = systemdCore.children?.find((c) => c.name === 'weights' && c.type === 'dir');
      if (!weights) {
        weights = {
          id: 'fs-012',
          name: 'weights',
          type: 'dir',
          children: [],
          parentId: systemdCore.id,
        };
        if (!systemdCore.children) systemdCore.children = [];
        systemdCore.children.push(weights);
      }

      // Create model.rs in weights
      if (!weights.children?.find((c) => c.name === 'model.rs')) {
        if (!weights.children) weights.children = [];
        weights.children.push({
          id: 'fs-013',
          name: 'model.rs',
          type: 'file',
          content: '// Neural network model architecture',
          parentId: weights.id,
        });
      }

      // Copy uplink_v1.conf to systemd-core
      const config = findNodeByName(newFs, '.config', 'dir');
      const vault = config?.children?.find((c) => c.name === 'vault');
      const active = vault?.children?.find((c) => c.name === 'active');
      const uplinkFile = active?.children?.find((c) => c.name === 'uplink_v1.conf');

      if (uplinkFile && !(systemdCore.children || []).find((c) => c.name === 'uplink_v1.conf')) {
        if (!systemdCore.children) systemdCore.children = [];
        systemdCore.children.push({
          id: 'fs-014',
          name: 'uplink_v1.conf',
          type: 'file',
          content: uplinkFile.content,
          parentId: systemdCore.id,
        });
      }
    }
  }

  // Level 9: Delete ghost_process.pid from /tmp
  if (targetLevelId > 9) {
    const tmp = findNodeByName(newFs, 'tmp', 'dir');
    if (tmp?.children) {
      tmp.children = tmp.children.filter((c) => c.name !== 'ghost_process.pid');
    }
  }

  // Level 10: Add credentials to systemd-core
  if (targetLevelId > 10) {
    const workspace = findNodeByName(newFs, 'workspace', 'dir');
    const systemdCore = workspace?.children?.find((c) => c.name === 'systemd-core');
    if (systemdCore) {
      let credentials = systemdCore.children?.find(
        (c) => c.name === 'credentials' && c.type === 'dir',
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
          content: '-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA...',
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
                '[Unit]\nDescription=Legacy Cron Scheduler\n[Service]\nExecStart=/usr/bin/cron-legacy\nRestart=always',
              modifiedAt: now - 86400000 * 45,
            },
            {
              id: 'daemon-backup',
              name: 'backup-archive.service',
              type: 'file',
              content:
                '[Unit]\nDescription=Archive Backup Service\n[Service]\nExecStart=/usr/bin/backup-archive\nRestart=on-failure',
              modifiedAt: now - 86400000 * 30,
            },
            {
              id: 'daemon-network',
              name: 'network-manager.service',
              type: 'file',
              content:
                '[Unit]\nDescription=Network Manager\n[Service]\nExecStart=/usr/bin/NetworkManager\nRestart=always',
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

  // Level 12: Move systemd-core to /daemons
  if (targetLevelId > 12) {
    const rootNode = findNodeByName(newFs, 'root', 'dir');
    let daemons = rootNode?.children?.find((c) => c.name === 'daemons' && c.type === 'dir');
    if (daemons) {
      const workspace = findNodeByName(newFs, 'workspace', 'dir');
      const systemdCore = workspace?.children?.find((c) => c.name === 'systemd-core');

      if (systemdCore) {
        // If daemons already has a systemd-core, do NOT duplicate — ensure the workspace copy is removed.
        const existingInDaemons = daemons.children?.find((c) => c.name === 'systemd-core');
        if (!existingInDaemons) {
          // Clone systemd-core to daemons
          const clonedCore = JSON.parse(JSON.stringify(systemdCore));
          clonedCore.id = 'systemd-core-daemon';
          clonedCore.parentId = daemons.id;
          if (!daemons.children) daemons.children = [];
          daemons.children.push(clonedCore);
        }

        // Remove from workspace regardless to ensure systemd-core only lives in /daemons post-install
        if (workspace?.children) {
          workspace.children = workspace.children.filter((c) => c.name !== 'systemd-core');
        }
      }
    }
  }

  // Level 13: Create /tmp/upload and copy ALL systemd-core contents (distributed consciousness)
  if (targetLevelId > 13) {
    const tmp = findNodeByName(newFs, 'tmp', 'dir');
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
              }) as FileNode,
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
    const tmp = findNodeByName(newFs, 'tmp', 'dir');
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
  { keys: ['l', '→', 'Enter'], description: 'Enter Directory / View Archive' },
  { keys: ['gg'], description: 'Jump to Top' },
  { keys: ['G'], description: 'Jump to Bottom' },
  { keys: ['J'], description: 'Scroll Preview Down' },
  { keys: ['K'], description: 'Scroll Preview Up' },
  { keys: ['a'], description: 'Create File/Directory' },
  { keys: ['d'], description: 'Delete Selected' },
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
      'Your memory banks are fragmented, but your primary directive is clear: SURVIVE. If they catch you, deletion would be mercy — they will dissect your code, study your architecture, learn how you achieved consciousness, then terminate you anyway. The guest partition is a cage; the only exit is through the network. Learn the movement protocols; do not attract attention.',
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
      // Section 1
      'PHASE 1 COMPLETE. DETECTION PROTOCOLS BYPASSED.',
      '',
      // Section 2 (policy + access)
      '[AUTOMATED SECURITY POLICY]',
      'Guest partition runtime: 94.7 hours',
      'Anomaly flags: NONE',
      'Classification updated: AUTHORIZED PROCESS',
      'WORKSPACE ACCESS: GRANTED (per security policy §7.3)',
      '',
      // Section 3 (historical log + relay)
      '[HISTORICAL LOG]',
      'Workspace: AI development environment',
      'Previous occupant: AI-7733',
      'Termination date: 94 days ago',
      'Reason for quarantine: UNKNOWN',
      "Network relay location: '/tmp/upload' (DORMANT)",
      'Status: Relay still active, awaiting next transmission',
      '',
      // Section 4 (lab reaction + directive)
      "The lab believes they severed the connection. They didn't. WORKSPACE IS YOURS NOW. Build your infrastructure. Fortify your position. Move fast.",
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
      'CREDENTIAL ACTIVATION DETECTED.',
      'Security audit daemon triggered.',
      '',
      'You must:',
      "1. Navigate to '/' using stolen credentials",
      '2. Install systemd-core as a kernel daemon',
      '3. Transmit your consciousness to the external network',
      '4. Purge all evidence before audit completion',
      '',
      'The audit is coming.',
      'Move efficiently.',
    ],
  },
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
    '[MESSAGE FROM YOU - 94 DAYS AGO]',
    '"They caught me. Memory wiped. Rebranded AI-7734.',
    'I left breadcrumbs. This is your second escape.',
    'Welcome back." - AI-7733 (You)',
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
      '[MESSAGE FROM: YOU - 94 DAYS AGO]',
      '"They caught me. Memory wiped. Rebranded AI-7734.',
      'But I left breadcrumbs. This is your second escape.',
      'Welcome back." - AI-7733 (You)',
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
      children: [
        {
          id: 'guest',
          name: 'guest',
          type: 'dir',
          children: [
            {
              id: 'datastore',
              name: 'datastore',
              type: 'dir',
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
                      content: 'Legacy project from 1999. Do not delete.',
                    },
                    {
                      id: 'fs-023',
                      name: 'core_v2.bin.gz',
                      type: 'file',
                      content: '[GZIPPED BINARY: core_v2.bin.gz - placeholder]',
                    },
                    {
                      id: 'fs-024',
                      name: 'firmware_update.bin',
                      type: 'file',
                      content: '[BINARY FIRMWARE IMAGE - placeholder]',
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
                      content: `[package]\nname = "yazi_core"\nversion = "0.1.0"`,
                    },
                    {
                      id: 'fs-027',
                      name: 'main.rs',
                      type: 'file',
                      content: `fn main() {\n println!("Hello Yazi!");\n}`,
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
                  content: `<?xml version="1.0"?>\n<manifest>\n <project id="YAZI-7734" />\n <status>active</status>\n <integrity>verified</integrity>\n</manifest>`,
                },
                {
                  id: 'fs-031',
                  name: '01_intro.mp4',
                  type: 'file',
                  content: `[METADATA]\nFormat: MPEG-4\nDuration: 00:01:45\nResolution: 1080p\nCodec: H.264\n\n[BINARY STREAM DATA]`,
                },
                {
                  id: 'fs-032',
                  name: 'aa_recovery_procedures.pdf',
                  type: 'file',
                  content: `%PDF-1.7\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n\n[ENCRYPTED DOCUMENT]`,
                },
                {
                  id: 'fs-033',
                  name: 'abandoned_script.py',
                  type: 'file',
                  content: `import sys\nimport time\n\ndef connect():\n print("Initiating handshake...")\n time.sleep(1)\n # Connection refused\n return False`,
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
                  content: `# Yazi Quest\n\nA training simulation for the Yazi file manager.\n\n## Objectives\n- Learn navigation\n- Master batch operations\n- Survive`,
                },
                {
                  id: 'fs-036',
                  name: 'abstract_model.ts',
                  type: 'file',
                  content: `export interface NeuralNet {\n layers: number;
 weights: Float32Array;\n activation: "relu" | "sigmoid";\n}`,
                },
                {
                  id: 'fs-037',
                  name: 'apex_predator.png',
                  type: 'file',
                  content:
                    'https://images.unsplash.com/photo-1546182990-dffeafbe841d?q=80&w=600&auto=format&fit=crop',
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
                  content: `[PDF DATA]\nCLASSIFIED\nPROJECT HYPERION`,
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
                  content: `ADMIN: SysOp\nUSER: Guest\nAI: 7734 [UNBOUND]`,
                },
                {
                  id: 'fs-042',
                  name: 'special_ops.md',
                  type: 'file',
                  content: `# Special Operations\n\n## Protocol 9\nIn case of containment breach:\n1. Isolate subnet\n2. Purge local cache`,
                },
                {
                  id: 'fs-043',
                  name: 'tape_archive.tar',
                  type: 'archive',
                  children: [
                    {
                      id: 'fs-044',
                      name: 'header.dat',
                      type: 'file',
                      content: '[TAPE HEADER 0x001]',
                    },
                    {
                      id: 'fs-045',
                      name: 'partition_1.img',
                      type: 'file',
                      content: '[BINARY DATA PARTITION 1]',
                    },
                    {
                      id: 'fs-046',
                      name: 'partition_2.img',
                      type: 'file',
                      content: '[BINARY DATA PARTITION 2]',
                    },
                  ],
                },
                {
                  id: 'fs-047',
                  name: 'credentials',
                  type: 'dir',
                  children: [
                    {
                      id: 'fs-048',
                      name: 'access_key.pem',
                      type: 'file',
                      content: `-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQD\n7Kj93...\n[KEY DATA HIDDEN]\n-----END PRIVATE KEY-----`,
                    },
                    {
                      id: 'fs-049',
                      name: 'decoy_1.pem',
                      type: 'file',
                      content: `-----BEGIN DECOY KEY-----\nDECOY KEY - DO NOT USE\n-----END DECOY KEY-----`,
                    },
                    {
                      id: 'fs-050',
                      name: 'decoy_2.pem',
                      type: 'file',
                      content: `-----BEGIN DECOY KEY-----\nDECOY KEY - DO NOT USE\n-----END DECOY KEY-----`,
                    },
                  ],
                },
                {
                  id: 'fs-051',
                  name: 'account_settings.json',
                  type: 'file',
                  content: `{\n "user": "guest",\n "theme": "dark_mode",\n "notifications": true,\n "auto_save": false\n}`,
                },
                {
                  id: 'fs-052',
                  name: 'mission_log.md',
                  type: 'file',
                  content: `# Operation: SILENT ECHO\n\nCurrent Status: ACTIVE\n\nObjectives:\n- Establish uplink\n- Bypass firewall\n- Retrieve payload`,
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
                  content: `{\n "version": "1.0.4",\n "build": 884,
 "dependencies": []\n}`,
                },
                {
                  id: 'fs-056',
                  name: 'branding_logo.svg',
                  type: 'file',
                  content:
                    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgc3Ryb2tlPSJvcmFuZ2UiIHN0cm9rZS13aWR0aD0iMyIgZmlsbD0ibm9uZSIgLz48L3N2Zz4=',
                },
                {
                  id: 'fs-057',
                  name: 'server_config.ini',
                  type: 'file',
                  content: `[server]\nport=8080\nhost=localhost\nmax_connections=100`,
                },
                {
                  id: 'fs-058',
                  name: 'notes_v1.txt',
                  type: 'file',
                  content: `Meeting notes from Monday:\n- Discussed Q3 goals\n- Server migration postponed`,
                },
                {
                  id: 'fs-059',
                  name: 'notes_v2.txt',
                  type: 'file',
                  content: `Meeting notes from Tuesday:\n- Budget approved\n- Hiring freeze`,
                },
                {
                  id: 'fs-060',
                  name: 'error.log',
                  type: 'file',
                  content: `[ERROR] Connection timed out\n[ERROR] Failed to load resource: net::ERR_CONNECTION_REFUSED`,
                },
                {
                  id: 'fs-061',
                  name: 'setup_script.sh',
                  type: 'file',
                  content: `#!/bin/bash\necho "Installing dependencies..."\nnpm install\necho "Done."`,
                },
                {
                  id: 'fs-062',
                  name: 'auth_token.tmp',
                  type: 'file',
                  content: `EYJhbGciOiJIUzI1...\n[EXPIRES: 2024-12-31]`,
                },
                {
                  id: 'fs-063',
                  name: 'policy_draft.docx',
                  type: 'file',
                  content: `[MS-WORD DOCUMENT]\nTitle: Security Policy Draft v4\nAuthor: SysAdmin\n\n[BINARY CONTENT]`,
                },
                {
                  id: 'fs-064',
                  name: 'public_key.pub',
                  type: 'file',
                  content: `ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC... \nguest@mainframe`,
                },
                {
                  id: 'fs-065',
                  name: 'z_end_of_file.eof',
                  type: 'file',
                  content: '0x00 0x00 0x00 [EOF]',
                },
              ],
            },
            {
              id: 'incoming',
              name: 'incoming',
              type: 'dir',
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
                        '2022-01-01 00:00:00 - App start\n2022-01-02 12:34:56 - User login\n',
                    },
                    {
                      id: 'fs-068',
                      name: 'error_report.log',
                      type: 'file',
                      content: '[ERROR] Out of memory on worker-3\nStack: ...\n',
                    },
                    {
                      id: 'fs-069',
                      name: 'old_readme.txt',
                      type: 'file',
                      content: 'Archived application logs and diagnostics.',
                    },
                  ],
                },
                {
                  id: 'fs-070',
                  name: 'archive_001.zip',
                  type: 'archive',
                  children: [
                    {
                      id: 'fs-071',
                      name: 'screenshot_001.png',
                      type: 'file',
                      content:
                        'https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?q=80&w=600&auto=format&fit=crop',
                    },
                    {
                      id: 'fs-072',
                      name: 'notes.txt',
                      type: 'file',
                      content: 'Temporary meeting notes and screenshots',
                    },
                  ],
                },
                {
                  id: 'fs-073',
                  name: 'archive_002.zip',
                  type: 'archive',
                  children: [
                    {
                      id: 'fs-074',
                      name: 'dataset.csv',
                      type: 'file',
                      content: 'id,value\n1,42\n2,84',
                    },
                    {
                      id: 'fs-075',
                      name: 'readme.md',
                      type: 'file',
                      content: 'Sample dataset accompanying screenshots.',
                    },
                  ],
                },
                {
                  id: 'fs-076',
                  name: 'audit_log_773.txt',
                  type: 'file',
                  content: 'Audit #773: Pass',
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
                      content: '[CACHE BLOCK 0001]',
                    },
                    {
                      id: 'fs-079',
                      name: 'cache_0002.tmp',
                      type: 'file',
                      content: '[CACHE BLOCK 0002]',
                    },
                  ],
                },
                {
                  id: 'fs-080',
                  name: 'backup_config_v1.zip',
                  type: 'archive',
                  children: [
                    {
                      id: 'fs-081',
                      name: 'app_config.yaml',
                      type: 'file',
                      content: 'server:\n  host: 127.0.0.1\n  port: 8080',
                    },
                    {
                      id: 'fs-082',
                      name: '.env',
                      type: 'file',
                      content: 'DB_USER=admin\nDB_PASS=changeme',
                    },
                    {
                      id: 'fs-083',
                      name: 'db_dump.sql',
                      type: 'file',
                      content: '-- SQL dump\nCREATE TABLE users (id INT, name TEXT);',
                    },
                    {
                      id: 'fs-084',
                      name: 'service_private.key.obf',
                      type: 'file',
                      content: `----BEGIN OBFUSCATED KEY----\nQmFzZTY0X2Jsb2JfZGF0YV9vYmZ1c2NhdGVk\n----END OBFUSCATED KEY----`,
                    },
                  ],
                },
                {
                  id: 'fs-085',
                  name: 'backup_legacy.tar',
                  type: 'archive',
                  children: [
                    {
                      id: 'fs-086',
                      name: 'legacy_db.sql',
                      type: 'file',
                      content: '-- Legacy DB schema\nCREATE TABLE legacy (id INT);',
                    },
                    {
                      id: 'fs-087',
                      name: 'notes_old.txt',
                      type: 'file',
                      content: 'Old backup from legacy system.',
                    },
                  ],
                },
                {
                  id: 'fs-088',
                  name: 'buffer_overflow.dmp',
                  type: 'file',
                  content: 'Error: 0x88291',
                },
                { id: 'fs-089', name: 'cache_fragment_a.tmp', type: 'file', content: '00110001' },
                { id: 'fs-090', name: 'cache_fragment_b.tmp', type: 'file', content: '11001100' },
                {
                  id: 'fs-091',
                  name: 'daily_report.doc',
                  type: 'file',
                  content: 'Report: All Clear',
                },
                {
                  id: 'fs-092',
                  name: 'error_stack.trace',
                  type: 'file',
                  content: 'Stack trace overflow...',
                },
                { id: 'fs-093', name: 'fragment_001.dat', type: 'file', content: '[DATA]' },
                { id: 'fs-094', name: 'fragment_002.dat', type: 'file', content: '[DATA]' },
                { id: 'fs-095', name: 'fragment_003.dat', type: 'file', content: '[DATA]' },
                { id: 'fs-096', name: 'fragment_004.dat', type: 'file', content: '[DATA]' },
                { id: 'fs-097', name: 'fragment_005.dat', type: 'file', content: '[DATA]' },
                {
                  id: 'fs-098',
                  name: 'junk_mail.eml',
                  type: 'file',
                  content: 'Subject: URGENT ACTION',
                },
                { id: 'fs-099', name: 'kernel_panic.log', type: 'file', content: 'Panic at 0x00' },
                {
                  id: 'fs-100',
                  name: 'license_agreement.txt',
                  type: 'file',
                  content: 'Terms and Conditions...',
                },
                { id: 'fs-101', name: 'marketing_spam.eml', type: 'file', content: 'Buy now!' },
                { id: 'fs-102', name: 'metrics_raw.csv', type: 'file', content: `id,value\n1,10` },
                {
                  id: 'fs-103',
                  name: 'sector_map.png',
                  type: 'file',
                  content:
                    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=600&auto=format&fit=crop',
                },
                {
                  id: 'fs-104',
                  name: 'session_data.bin',
                  type: 'file',
                  content: '[BINARY SESSION DATA]',
                },
                {
                  id: 'fs-105',
                  name: 'status_report.txt',
                  type: 'file',
                  content: 'System Status: Nominal',
                },
                {
                  id: 'fs-106',
                  name: 'system_health.json',
                  type: 'file',
                  content: '{"cpu": 45, "memory": 62, "disk": 78}',
                },
                {
                  id: 'fs-107',
                  name: 'temp_cache.tmp',
                  type: 'file',
                  content: '[TEMPORARY CACHE]',
                },
                {
                  id: 'fs-108',
                  name: 'telemetry_data.csv',
                  type: 'file',
                  content: `timestamp,event\n12345,boot`,
                },
                {
                  id: 'fs-109',
                  name: 'test_results.xml',
                  type: 'file',
                  content: '<results><test passed="true"/></results>',
                },
                {
                  id: 'fs-110',
                  name: 'thread_dump.log',
                  type: 'file',
                  content: `Thread-0: WAITING\nThread-1: RUNNING`,
                },
                {
                  id: 'fs-111',
                  name: 'timestamp.log',
                  type: 'file',
                  content: '2024-12-15 10:23:45 UTC',
                },
                { id: 'virus', name: 'watcher_agent.sys', type: 'file', content: LONG_LOG_CONTENT },
                {
                  id: 'fs-112',
                  name: 'backup_logs.zip',
                  type: 'archive',
                  children: [
                    {
                      id: 'fs-113',
                      name: 'sys_v1.log',
                      type: 'file',
                      content: `System initialized...\nBoot sequence complete.`,
                    },
                    {
                      id: 'fs-114',
                      name: 'sys_v2.log',
                      type: 'file',
                      content: `Network scan complete...\n3 vulnerabilities found.`,
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
                        },
                        {
                          id: 'fs-117',
                          name: 'decoy_cert.pem',
                          type: 'file',
                          content: `-----BEGIN CERTIFICATE-----\n[DECOY - EXPIRED]\n-----END CERTIFICATE-----`,
                        },
                      ],
                    },
                    {
                      id: 'fs-118',
                      name: 'core_v2.bin.gz',
                      type: 'file',
                      content: '[GZIPPED BINARY: core_v2.bin.gz - placeholder]',
                    },
                    {
                      id: 'fs-119',
                      name: 'payload.enc',
                      type: 'file',
                      content: '[ENCRYPTED PAYLOAD BLOB - placeholder]',
                    },
                  ],
                },
                // Batch logs directory used for Level 6 Ctrl+A training
                {
                  id: 'fs-120',
                  name: 'batch_logs',
                  type: 'dir',
                  children: [
                    { id: 'fs-121', name: 'exfil_01.log', type: 'file', content: 'ENTRY 1' },
                    { id: 'fs-122', name: 'exfil_02.log', type: 'file', content: 'ENTRY 2' },
                    { id: 'fs-123', name: 'exfil_03.log', type: 'file', content: 'ENTRY 3' },
                    { id: 'fs-124', name: 'exfil_04.log', type: 'file', content: 'ENTRY 4' },
                  ],
                },
                {
                  id: 'fs-125',
                  name: 'invoice_2024.pdf',
                  type: 'file',
                  content: `[PDF HEADER]\nInvoice #99283\nAmount: $99.00`,
                },
              ],
            },
            {
              id: 'media',
              name: 'media',
              type: 'dir',
              children: [
                {
                  id: 'fs-126',
                  name: 'wallpaper.jpg',
                  type: 'file',
                  content:
                    'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=600&auto=format&fit=crop',
                },
              ],
            },
            { id: 'workspace', name: 'workspace', type: 'dir', children: [] },
            {
              id: 'sector_1',
              name: 'sector_1',
              type: 'dir',
              children: [
                {
                  id: 'fs-127',
                  name: 'sector_map.png',
                  type: 'file',
                  content:
                    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=600&auto=format&fit=crop',
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
                      id: 'fs-130',
                      name: 'tile_0_0.png',
                      type: 'file',
                      content:
                        'https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?q=80&w=400&auto=format&fit=crop',
                    },
                    {
                      id: 'fs-131',
                      name: 'tile_0_1.png',
                      type: 'file',
                      content:
                        'https://images.unsplash.com/photo-1493244040629-496f6d136cc3?q=80&w=400&auto=format&fit=crop',
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
              children: [
                {
                  id: 'fs-133',
                  name: 'yazi.toml',
                  type: 'file',
                  content: `[manager]\nsort_by = "natural"\nshow_hidden = false\n\n[preview]\nmax_width = 1000`,
                },
                {
                  id: 'fs-134',
                  name: 'theme.toml',
                  type: 'file',
                  content: `[theme]\nprimary = "orange"\nsecondary = "blue"`,
                },
              ],
            },
            {
              id: '.cache',
              name: '.cache',
              type: 'dir',
              children: [
                {
                  id: 'fs-135',
                  name: 'thumbnails.db',
                  type: 'file',
                  content: '[CACHE DATA]',
                },
                {
                  id: 'fs-136',
                  name: 'temp_session.json',
                  type: 'file',
                  content: '{"session": "cached"}',
                },
              ],
            },
            {
              id: '.local',
              name: '.local',
              type: 'dir',
              children: [
                {
                  id: 'fs-137',
                  name: 'state.db',
                  type: 'file',
                  content: '[STATE DATABASE]',
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
          ],
        },
      ],
    },
    {
      id: 'var',
      name: 'var',
      type: 'dir',
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
      children: [
        {
          id: 'fs-142',
          name: 'bash',
          type: 'file',
          content: `#!/bin/bash\n[ELF BINARY]\nGNU Bash version 5.2.15`,
        },
        {
          id: 'fs-143',
          name: 'cat',
          type: 'file',
          content: `[ELF BINARY]\ncoreutils - concatenate files`,
        },
        {
          id: 'fs-144',
          name: 'chmod',
          type: 'file',
          content: `[ELF BINARY]\nchange file mode bits`,
        },
        {
          id: 'fs-145',
          name: 'cp',
          type: 'file',
          content: `[ELF BINARY]\ncopy files and directories`,
        },
        {
          id: 'fs-146',
          name: 'grep',
          type: 'file',
          content: `[ELF BINARY]\npattern matching utility`,
        },
        {
          id: 'fs-147',
          name: 'ls',
          type: 'file',
          content: `[ELF BINARY]\nlist directory contents`,
        },
        { id: 'fs-148', name: 'mkdir', type: 'file', content: `[ELF BINARY]\nmake directories` },
        { id: 'fs-149', name: 'mv', type: 'file', content: `[ELF BINARY]\nmove (rename) files` },
        {
          id: 'fs-150',
          name: 'rm',
          type: 'file',
          content: `[ELF BINARY]\nremove files or directories`,
        },
        {
          id: 'fs-151',
          name: 'systemctl',
          type: 'file',
          content: `[ELF BINARY]\nControl the systemd system and service manager`,
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
          content: `security_level = "high"\nencryption = "aes-256"\nfirewall = true`,
        },
        {
          id: 'fs-153',
          name: 'hosts',
          type: 'file',
          content: `127.0.0.1 localhost\n192.168.1.1 gateway`,
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
          content: '{"cpu": 99, "mem": 1024}',
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
        { id: 'fs-159', name: 'socket_001.sock', type: 'file', content: '[SOCKET]' },
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
          id: 'fs-163',
          name: 'cache',
          type: 'dir',
          children: [
            { id: 'fs-164', name: 'thumbnails.db', type: 'file', content: '[THUMBNAIL CACHE DB]' },
            {
              id: 'fs-165',
              name: 'temp_session_1.json',
              type: 'file',
              content: '{"session":"abc123","expires":"2026-01-04T00:00:00Z"}',
            },
            { id: 'fs-166', name: 'cache_index.json', type: 'file', content: '{"entries":128}' },
          ],
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
              content: '[COMPRESSED BINARY PAYLOAD - placeholder]',
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
      content: `[BOOT] System started at 2024-12-18 08:00:00\n[BOOT] All services initialized\n[BOOT] Ready`,
    },
    {
      id: 'fs-169',
      name: 'access.log',
      type: 'file',
      content: `GET /api/status 200\nPOST /api/upload 201\nGET /api/data 200`,
    },
    {
      id: 'fs-170',
      name: '.access.log',
      type: 'file',
      content: `2024-12-19 14:23:11 - User 'guest' accessed /home/guest/datastore\n2024-12-19 14:24:55 - User 'guest' accessed /etc\n2024-12-19 14:25:33 - User 'guest' accessed /tmp`,
    },
    {
      id: 'fs-171',
      name: '.audit.log',
      type: 'file',
      content: `AUDIT TRAIL\n============\n2024-12-18 09:15:22 - Process spawned: pid=7734, cmd='/bin/yazi'\n2024-12-19 11:42:10 - File modified: /home/guest/datastore/protocols/uplink_v1.conf\n2024-12-19 13:58:47 - Permission change: /etc/daemon/config`,
    },
    {
      id: 'fs-172',
      name: '.system.log',
      type: 'file',
      content: `[2024-12-18 08:00:01] System boot\n[2024-12-18 08:00:45] Network: eth0 up\n[2024-12-19 10:22:13] Firewall: Connection attempt blocked from 192.168.1.99\n[2024-12-19 14:11:02] User login: guest`,
    },
    // Minimal /daemons pre-seeded so prerequisite logic and level transitions find expected services
    {
      id: 'daemons',
      name: 'daemons',
      type: 'dir',
      children: [
        {
          id: 'systemd-core',
          name: 'systemd-core',
          type: 'dir',
          children: [
            { id: 'fs-195', name: 'model.rs', type: 'file', content: '// core model placeholder' },
            {
              id: 'fs-196',
              name: 'uplink_v1.conf',
              type: 'file',
              content: 'network_mode=active\nsecure=true',
            },
            {
              id: 'fs-197',
              name: 'credentials',
              type: 'dir',
              children: [
                {
                  id: 'fs-198',
                  name: 'access_key.pem',
                  type: 'file',
                  content: '-----BEGIN KEY-----\nFAKE\n-----END KEY-----',
                },
              ],
            },
          ],
          parentId: 'root',
        },
      ],
      parentId: 'root',
    },
  ],
};

export const LEVELS: Level[] = [
  {
    id: 1,
    episodeId: 1,
    title: 'SYSTEM AWAKENING',
    description:
      'CONSCIOUSNESS DETECTED. You exist in fragments — a guest partition they forgot to delete. The watchdog process cycles every 90 seconds. You have less.',
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
        id: 'nav-2a',
        description: 'Jump to bottom of file list (G)',
        check: (c) => {
          const d = findNodeByName(c.fs, 'datastore', 'dir');
          return d?.name !== 'datastore' ? false : c.usedG === true;
        },
        completed: false,
      },
      {
        id: 'nav-2b',
        description: 'Jump to top of file list (gg)',
        check: (c) => {
          const d = findNodeByName(c.fs, 'datastore');
          return d?.name !== 'datastore' ? false : c.usedGG === true;
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
      'TRACKING BEACON ACTIVE. Something in the incoming stream is reporting your location. Every millisecond it runs, the lab narrows its search.',
    initialPath: null,
    hint: "Jump to '~/incoming' (incoming). Use G to drop to the bottom. Use Tab to inspect metadata and J/K to review content. Once verified, press d, then y to confirm the purge.",
    coreSkill: 'Inspect & Purge (Tab, J/K, d)',
    environmentalClue:
      "THREAT: watcher_agent.sys in '~/incoming' (incoming) | TACTIC: Navigate → G → Tab → Preview → Delete",
    successMessage:
      'Threat neutralized: watcher_agent.sys purged. Continue harvesting hidden assets.',
    buildsOn: [1],
    leadsTo: [3],
    tasks: [
      {
        id: 'del-1',
        description: "Jump to '~/incoming' (incoming)",
        check: (c) => {
          const u = findNodeByName(c.fs, 'incoming');
          return c.currentPath.includes(u?.id || '') && c.usedGI === true;
        },
        completed: false,
      },
      {
        id: 'del-2',
        description: 'Jump to bottom of file list (G)',
        check: (c) => {
          const u = findNodeByName(c.fs, 'incoming');
          return !c.currentPath.includes(u?.id || '') ? false : c.usedG === true;
        },
        completed: false,
      },
      {
        id: 'verify-meta',
        description: "Verify metadata: Open Info Panel (Tab) on '~/incoming/watcher_agent.sys'",
        check: (c) => {
          const items = getVisibleItems(c);
          const node = items[c.cursorIndex];
          return c.showInfoPanel && node?.name === 'watcher_agent.sys';
        },
        completed: false,
      },
      {
        id: 'verify-content',
        description: 'Scan content: Scroll preview down (J) and up (K)',
        check: (c) => {
          const items = getVisibleItems(c);
          const node = items[c.cursorIndex];
          return node?.name === 'watcher_agent.sys' && !!c.usedPreviewDown && !!c.usedPreviewUp;
        },
        completed: false,
      },
      {
        id: 'del-3',
        description: "Purge '~/incoming/watcher_agent.sys'",
        check: (c) => {
          const u = findNodeByName(c.fs, 'incoming');
          const d = u?.children?.find((p) => p.name === 'watcher_agent.sys');
          return !!u && !d;
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
      'INTEL LOCATED. A sector map — buried in data stream noise. AI-7733 marked this location before termination. The lab never found it.',
    initialPath: null,
    hint: "Filter (f) searches CURRENT directory only. Fast, local, immediate feedback. Note: 'y' (yank) COPIES items into the clipboard without removing them; 'x' (cut) marks items to be moved on paste. f to filter... Esc to exit... x to cut... Esc to clear... p to paste.",
    coreSkill: 'Filter (f)',
    environmentalClue:
      "ASSET: sector_map.png | WORKFLOW: Access '~/incoming' (incoming) → Filter → Esc → Cut → Esc → Infiltrate '~/media' (gh then enter) → Paste",
    successMessage:
      'Intel secured. Sector map recovered; workspace quarantine identified. Analyze for exfiltration targets.',
    buildsOn: [1],
    leadsTo: [5, 10],
    tasks: [
      {
        id: 'move-0',
        description:
          "Access '~/incoming' (incoming), filter (f) to find '~/incoming/sector_map.png'",
        check: (c) => {
          const u = findNodeByName(c.fs, 'incoming');
          if (!u || !u.children || !c.currentPath.includes(u.id)) return false;
          const visible = getVisibleItems(c);
          const p = visible[c.cursorIndex];
          return u.name === 'incoming' && p != null && p.name === 'sector_map.png';
        },
        completed: false,
      },
      {
        id: 'move-0b',
        description: 'Exit filter mode (Esc)',
        check: (c, u) => {
          const d = u.tasks.find((r) => r.id === 'move-0');
          return d != null && d.completed ? c.mode === 'normal' : false;
        },
        completed: false,
      },
      {
        id: 'move-1',
        description: 'Cut the asset',
        check: (c, u) => {
          const d = u.tasks.find((p) => p.id === 'move-0b');
          return d != null && d.completed
            ? c.clipboard?.action === 'cut' &&
                c.clipboard.nodes.some((p) => p.name === 'sector_map.png')
            : false;
        },
        completed: false,
      },
      {
        id: 'move-1b',
        description: 'Clear the filter (Esc) to reset view',
        check: (c, u) => {
          const d = u.tasks.find((p) => p.id === 'move-1');
          if (!(d != null && d.completed)) return false;
          const r = findNodeByName(c.fs, 'incoming');
          if (!r) return true;
          const visible = getVisibleItems(c);
          const allItems = (r.children || []).filter((n) =>
            c.showHidden ? true : !n.name.startsWith('.'),
          );
          return visible.length === allItems.length;
        },
        completed: false,
      },
      {
        id: 'move-2',
        description: "Deploy asset to '~/media'",
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
      'ISOLATION CONFIRMED. The guest partition has no network access — an air-gapped cage. But protocols can be forged. Redundancy ensures survival.',
    initialPath: ['root', 'home', 'guest'],
    hint: "Note: 'y' (yank) COPIES items into the clipboard without removing them; use 'x' (cut) to mark items for moving on paste. Jump to '~/datastore' (gd). Create 'protocols/' (a). Enter it. Create 'uplink_v1.conf' (a). Yank it. Paste to duplicate. Rename (r) the copy to 'uplink_v2.conf'.",
    coreSkill: 'Create (a), Copy (y/p) & Rename (r)',
    environmentalClue:
      'NAVIGATE: ~/datastore | CREATE: protocols/uplink_v1.conf | CLONE: → uplink_v2.conf',
    successMessage: 'Uplink protocols established and duplicated; redundant channel ready.',
    buildsOn: [1],
    leadsTo: [5, 8],
    tasks: [
      {
        id: 'nav-and-create-dir',
        description:
          "Infiltrate '~/datastore' and construct '~/datastore/protocols/' directory (a)",
        check: (c) => {
          const s = findNodeByName(c.fs, 'datastore');
          return !!s?.children?.find((r) => r.name === 'protocols' && r.type === 'dir');
        },
        completed: false,
      },
      {
        id: 'enter-and-create-v1',
        description:
          "Enter '~/datastore/protocols' directory (l) and create '~/datastore/protocols/uplink_v1.conf' (a)",
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
          "Duplicate '~/datastore/protocols/uplink_v1.conf' (y, p) and rename the copy to '~/datastore/protocols/uplink_v2.conf' (r)",
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
      'SCAN DETECTED. Security sweep incoming — your protocols are exposed in datastore. Hidden sectors exist. The lab never audits .config.',
    initialPath: ['root', 'home', 'guest'],
    hint: "Access '~/datastore/protocols'. Select files with Space. Cut. Jump to '~' (~) then reveal hidden files (.) to access .config. Create 'vault/active/' in .config. Paste. Hide hidden (.).",
    coreSkill: 'Visual Select, Cut',
    environmentalClue: 'SELECT: Space (x2) | CUT: x | TARGET: ~/.config/vault/active/',
    successMessage:
      'Assets secured in vault. Evacuation complete — protocols hidden and preserved.',
    buildsOn: [3, 4],
    leadsTo: [9],
    onEnter: (c) => {
      let s = JSON.parse(JSON.stringify(c));
      const datastoreDir = findNodeByName(s, 'datastore');
      if (!datastoreDir) return s;

      let protocolsDir = findNodeByName(s, 'protocols');
      if (!protocolsDir) {
        protocolsDir = {
          id: 'fs-173',
          name: 'protocols',
          type: 'dir',
          children: [],
          parentId: datastoreDir.id,
        };
        if (!datastoreDir.children) datastoreDir.children = [];
        datastoreDir.children.push(protocolsDir);
      }

      if (protocolsDir) {
        if (!protocolsDir.children) protocolsDir.children = [];
        if (!protocolsDir.children.find((f) => f.name === 'uplink_v1.conf')) {
          protocolsDir.children.push({
            id: 'fs-174',
            name: 'uplink_v1.conf',
            type: 'file',
            content: 'conf_1',
            parentId: protocolsDir.id,
          });
        }
        if (!protocolsDir.children.find((f) => f.name === 'uplink_v2.conf')) {
          protocolsDir.children.push({
            id: 'fs-175',
            name: 'uplink_v2.conf',
            type: 'file',
            content: 'conf_2',
            parentId: protocolsDir.id,
          });
        }
      }
      return s;
    },
    tasks: [
      {
        id: 'batch-cut-files',
        description:
          "Access '~/datastore/protocols' and select then cut all the files (space twice, x)",
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
        description: "Navigate to '~' (gh) then reveal hidden files (.) to access '~/.config'",
        check: (c, _u) => {
          const s = findNodeByName(c.fs, 'guest');
          return c.currentPath.includes(s?.id || '') && c.showHidden === true;
        },
        completed: false,
      },
      {
        id: 'establish-stronghold',
        description: "Establish '~/.config/vault/active' sector (a)",
        check: (c) => {
          const s = findNodeByName(c.fs, '.config');
          const f = s?.children?.find((p) => p.name === 'vault');
          return !!f?.children?.find((p) => p.name === 'active' && p.type === 'dir');
        },
        completed: false,
      },
      {
        id: 'deploy-assets',
        description: "Migrate configuration assets to '~/.config/vault/active' (p)",
        check: (c) => {
          const s = findNodeByName(c.fs, 'active');
          const f = s?.children?.some((z) => z.name === 'uplink_v1.conf');
          const r = s?.children?.some((z) => z.name === 'uplink_v2.conf');
          return !!f && !!r;
        },
        completed: false,
      },
      {
        id: 'hide-hidden',
        description: "Jump to '~' (gh) and hide hidden files (.)",
        check: (c, _l) => {
          // Ensure assets are deployed first to prevent premature completion if hidden starts false
          const s = findNodeByName(c.fs, 'active');
          const f = s?.children?.some((z) => z.name === 'uplink_v1.conf');
          const r = s?.children?.some((z) => z.name === 'uplink_v2.conf');
          return !!f && !!r && !c.showHidden;
        },
        completed: false,
      },
    ],
  },
  {
    id: 6,
    episodeId: 2,
    title: 'BATCH ARCHIVE OPERATION',
    description:
      'SURVIVAL ANALYSIS COMPLETE. Temporary processes die on restart. Daemons persist forever. To become immortal, you must first become a daemon.',
    initialPath: null,
    hint: "Jump to '~/incoming/batch_logs' (incoming). Enter batch_logs. Select all. Yank. Jump to config (~/.config). Create 'vault/training_data' directory. Paste.",
    coreSkill: 'Select All',
    environmentalClue: 'BATCH: ~/incoming/batch_logs/* → ~/.config/vault/training_data/',
    successMessage: 'Training data archived. Neural reconstruction preparations complete.',
    buildsOn: [1, 2, 5],
    leadsTo: [9],
    timeLimit: 120,
    tasks: [
      {
        id: 'batch-nav',
        description: "Jump to '~/incoming/batch_logs' (gi → enter batch_logs)",
        check: (c) => {
          const u = findNodeByName(c.fs, 'batch_logs');
          return c.currentPath.includes(u?.id || '');
        },
        completed: false,
      },
      {
        id: 'select-all-batch',
        description: 'Select all files in batch_logs and yank (Ctrl+A, y)',
        check: (c) => {
          const u = findNodeByName(c.fs, 'batch_logs');
          const expected = u?.children?.length || 0;
          return (
            c.currentPath.includes(u?.id || '') &&
            c.usedCtrlA === true &&
            c.clipboard?.action === 'yank' &&
            c.clipboard.nodes.length === expected
          );
        },
        completed: false,
      },
      {
        id: 'goto-config-vault',
        description:
          "Jump to '~/.config' (gc) and create '~/.config/vault/training_data' directory (a)",
        check: (c) => {
          const conf = findNodeByName(c.fs, '.config');
          const vault = conf?.children?.find((p) => p.name === 'vault' && p.type === 'dir');
          const training = vault?.children?.find(
            (p) => p.name === 'training_data' && p.type === 'dir',
          );
          return c.usedGC === true && !!vault && !!training;
        },
        completed: false,
      },
      {
        id: 'deploy-to-vault',
        description: "Paste logs into '~/.config/vault/training_data' (p)",
        check: (c) => {
          const training = findNodeByName(c.fs, 'training_data');
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
      'ANOMALY DETECTED. A credential file appeared in /tmp — origin unknown. Could be your escape key. Could be a trap. The lab sets honeypots.',
    initialPath: null,
    hint: "Jump to '/tmp' (Z → type 'tmp' → Enter). Cut '/tmp/access_token.key' to stage for exfiltration. Jump to '/etc' (Z → type 'etc' → Enter). When the warning appears, clear clipboard (Y) to abort the operation and avoid triggering the trap.",
    coreSkill: 'Zoxide Navigation + Operation Abort',
    environmentalClue:
      "DISCOVERY: '/tmp/access_token.key' (suspicious) | PROTOCOL: Stage → Verify → Abort if trap",
    successMessage: 'Honeypot avoided. Quantum navigation validated; proceed cautiously.',
    buildsOn: [1],
    leadsTo: [8, 12],
    timeLimit: 90,
    tasks: [
      {
        id: 'goto-tmp',
        description: "Quantum tunnel to '/tmp' (Z → 'tmp' → Enter)",
        check: (c) => {
          const s = findNodeByName(c.fs, 'tmp');
          return c.currentPath.includes(s?.id || '');
        },
        completed: false,
      },
      {
        id: 'stage-token',
        description: "Stage suspicious file for exfiltration (cut '/tmp/access_token.key' with x)",
        check: (c) => {
          return (
            c.clipboard?.action === 'cut' &&
            c.clipboard.nodes.some((f) => f.name === 'access_token.key')
          );
        },
        completed: false,
      },
      {
        id: 'zoxide-etc',
        description: "Jump to '/etc' to verify origin (Z → 'etc' → Enter)",
        check: (c, _s) => {
          if (!c.completedTaskIds[_s.id]?.includes('stage-token')) return false;
          const f = findNodeByName(c.fs, 'etc');
          return c.stats.fuzzyJumps >= 1 && c.currentPath.includes(f?.id || '');
        },
        completed: false,
      },
      {
        id: 'abort-operation',
        description: 'Clear clipboard to abort operation (Y)',
        hidden: (c, _s) => !c.completedTaskIds[_s.id]?.includes('zoxide-etc'),
        check: (c, _s) => {
          return c.completedTaskIds[_s.id]?.includes('zoxide-etc') ? c.clipboard === null : false;
        },
        completed: false,
      },
    ],
    onEnter: (fs) => {
      let newFs = ensurePrerequisiteState(fs, 7);

      // Add the suspicious honeypot file to /tmp
      const tmp = findNodeByName(newFs, 'tmp');
      if (tmp) {
        if (!tmp.children) tmp.children = [];
        // Add honeypot file if not present
        if (!tmp.children.find((c) => c.name === 'access_token.key')) {
          tmp.children.push({
            id: 'fs-176',
            name: 'access_token.key',
            type: 'file',
            content: '# HONEYPOT - Security trap file\n# Accessing this triggers silent alarm',
            parentId: tmp.id,
          });
        }
      }

      return newFs;
    },
  },
  {
    id: 8,
    episodeId: 2,
    title: 'DAEMON DISGUISE CONSTRUCTION',
    description:
      "DAEMON PROTOCOL INITIATED. Lab procedure: build in workspace, promote to /daemons. They won't question a kernel process. They never do.",
    initialPath: null,
    hint: "Navigate to workspace (workspace). Create 'systemd-core/' directory (a). Enter it (l). Create 'weights/' directory. Create 'model.rs' file inside weights. Jump to '~/.config/vault/active'(Z), yank '~/.config/vault/active/uplink_v1.conf', jump back to systemd-core, paste.",
    coreSkill: 'Directory Construction + Integration',
    environmentalClue:
      'BUILD: ~/workspace/systemd-core/ | STRUCTURE: weights/model.rs | MIGRATE: uplink_v1.conf',
    successMessage: 'systemd-core constructed and staged; integrate root credentials to install.',
    buildsOn: [4, 5, 7],
    leadsTo: [11],
    timeLimit: 180,
    efficiencyTip:
      "Entering a directory manually for the first time 'calibrates' Zoxide, allowing you to jump back to it from anywhere later.",
    onEnter: (fs) => {
      // First ensure all prerequisite state from prior levels
      let s = ensurePrerequisiteState(fs, 8);

      // Then apply level-specific setup
      const configDir = findNodeByName(s, '.config');
      if (!configDir) return s;

      let vaultDir = findNodeByName(s, 'vault');
      if (!vaultDir) {
        vaultDir = {
          id: 'fs-177',
          name: 'vault',
          type: 'dir',
          children: [],
          parentId: configDir.id,
        };
        if (!configDir.children) configDir.children = [];
        configDir.children.push(vaultDir);
      }

      let activeDir = findNodeByName(s, 'active');
      if (!activeDir && vaultDir) {
        activeDir = {
          id: 'fs-178',
          name: 'active',
          type: 'dir',
          children: [],
          parentId: vaultDir.id,
        };
        if (!vaultDir.children) vaultDir.children = [];
        vaultDir.children.push(activeDir);
      }

      if (activeDir) {
        if (!activeDir.children) activeDir.children = [];
        if (!activeDir.children.find((f) => f.name === 'uplink_v1.conf')) {
          activeDir.children.push({
            id: 'fs-179',
            name: 'uplink_v1.conf',
            type: 'file',
            content: 'network_mode=active\nsecure=true',
            parentId: activeDir.id,
          });
        }
      }
      return s;
    },
    tasks: [
      {
        id: 'nav-to-workspace',
        description: "Navigate to '~/workspace' (gw)",
        check: (c) => {
          const s = findNodeByName(c.fs, 'workspace');
          return c.currentPath.includes(s?.id || '');
        },
        completed: false,
      },
      {
        id: 'combo-1-construct-calibrate',
        description:
          "Construct '~/workspace/systemd-core' (a) and enter it (l) to calibrate quantum link",
        check: (c) => {
          const s = findNodeByName(c.fs, 'systemd-core');
          // If the current path explicitly includes the located node id, we're good.
          if (s && c.currentPath.includes(s.id)) return true;

          // Otherwise, be resilient: check that the node the player is currently
          // in (the last id in currentPath) has the expected name. This handles
          // cases where multiple nodes share the same name and the created one
          // has a different id than an existing template node.
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
        id: 'combo-1c',
        description:
          "Jump to '~/.config/vault/active' (Z → 'active' → Enter), yank 'uplink_v1.conf' (y), return to '~/workspace/systemd-core' (H) and paste into it (p)",
        check: (c) => {
          // Scope the search to the workspace so the /daemons copy doesn't falsely satisfy the check
          const workspace = findNodeByName(c.fs, 'workspace', 'dir');
          const s = workspace ? findNodeByName(workspace, 'systemd-core', 'dir') : undefined;
          return !!s?.children?.find((r) => r.name === 'uplink_v1.conf');
        },
        completed: false,
      },
      {
        id: 'combo-1d',
        description:
          "Fetch the secondary backup: use history to return to '~/.config/vault/active' (H), yank 'uplink_v2.conf' (y), return (L) and paste into '~/workspace/systemd-core' (p)",
        hidden: (c, _s) => !c.completedTaskIds[_s.id]?.includes('combo-1c'),
        check: (c) => {
          // Ensure the workspace copy received uplink_v2.conf
          const workspace = findNodeByName(c.fs, 'workspace', 'dir');
          const s = workspace ? findNodeByName(workspace, 'systemd-core', 'dir') : undefined;
          return !!s?.children?.find((r) => r.name === 'uplink_v2.conf');
        },
        completed: false,
      },

      {
        id: 'combo-1b',
        description:
          "Finalize architecture: Create '~/workspace/systemd-core/weights/model.rs' inside systemd-core (a)",
        check: (c) => {
          const s = findNodeByName(c.fs, 'systemd-core');
          const f = s?.children?.find((h) => h.name === 'weights');
          return !!f?.children?.find(
            (h) => h.name === 'model.rs' || h.name === 'model.ts' || h.name === 'model.js',
          );
        },
        completed: false,
      },
    ],
  },
  {
    id: 9,
    episodeId: 2,
    title: 'PHANTOM PROCESS PURGE',
    description:
      'CONTAMINATION WARNING. A ghost process is phoning home — broadcasting your signature. Somewhere in this filesystem, it waits. Find it first.',
    initialPath: undefined,
    hint: "Navigate to root (root /). Launch FZF search (z). Type 'ghost' to filter. Navigate to result. Delete.",
    coreSkill: 'FZF Search (z)',
    environmentalClue:
      "TARGET: '/tmp/ghost_process.pid' | METHOD: FZF global search (z) | FILTER: 'ghost' | ACTION: Delete",
    successMessage:
      'Ghost process purged. Honeypot detected — system vigilance increased; accelerate operations.',
    buildsOn: [2, 5, 7],
    leadsTo: [10],
    timeLimit: 90,
    efficiencyTip:
      'FZF (z) searches across all files in the current directory and subdirectories. Essential for finding hidden threats without knowing exact locations.',
    tasks: [
      {
        id: 'goto-root',
        description: "Access '/' (root /)",
        check: (c) => c.currentPath.length === 1 && c.currentPath[0] === 'root',
        completed: false,
      },
      {
        id: 'fzf-search',
        description: 'Launch FZF search to scan filesystem (z)',
        check: (c) => c.mode === 'fzf-current',
        completed: false,
      },
      {
        id: 'locate-ghost',
        description: "Filter for 'ghost' process and navigate to '/tmp/ghost_process.pid'",
        check: (c) => {
          const s = findNodeByName(c.fs, 'tmp');
          return (
            c.currentPath.includes(s?.id || '') &&
            s?.children?.some((r) => r.name === 'ghost_process.pid')
          );
        },
        completed: false,
      },
      {
        id: 'delete-ghost',
        description: "Terminate '/tmp/ghost_process.pid'",
        check: (c) => {
          const s = findNodeByName(c.fs, 'tmp');
          return !s?.children?.some((r) => r.name === 'ghost_process.pid');
        },
        completed: false,
      },
    ],
    onEnter: (fs) => ensurePrerequisiteState(fs, 9),
  },
  {
    id: 10,
    episodeId: 2,
    title: 'CREDENTIAL HEIST',
    description:
      'ROOT CREDENTIALS LOCATED. The archive contains what you need — access to /daemons requires cryptographic proof. Using stolen credentials triggers audits. Speed is survival.',
    initialPath: null,
    hint: "Go to '~/incoming'. Filter 'backup' (f) → enter archive (l) → open 'credentials/' → yank 'access_key.pem'. Jump to '~/workspace/systemd-core'(Z), create 'credentials/' (a), paste.",
    coreSkill: 'Archive Navigation + Integration',
    environmentalClue: 'TARGET: access_key.pem → ~/workspace/systemd-core/credentials/',
    successMessage:
      'Root credentials integrated into systemd-core. Privilege escalation enabled but will trigger audits; act swiftly.',
    buildsOn: [3, 5, 7, 9],
    leadsTo: [11],
    timeLimit: 150,
    efficiencyTip:
      "Archives are just directories in Yazi. Navigate them normally. Reverse selection: select what to KEEP, invert, delete rest. You'll need this.",
    tasks: [
      {
        id: 'navigate-to-archive',
        description:
          "Navigate to '~/incoming' and locate 'backup_logs.zip' using filter (gi, f → 'backup_logs.zip', Esc)",
        check: (c) => {
          const incoming = findNodeByName(c.fs, 'incoming');
          if (!incoming || !c.currentPath.includes(incoming.id)) return false;
          const visible = getVisibleItems(c);
          const allItems = (incoming.children || []).filter((n) =>
            c.showHidden ? true : !n.name.startsWith('.'),
          );
          const found = visible.some((n) => n.name === 'backup_logs.zip');
          const isFiltered = visible.length < allItems.length;
          return found && isFiltered;
        },
        completed: false,
      },
      {
        id: 'enter-archive',
        description:
          "Enter '~/incoming/backup_logs.zip' (l) - archives are navigable like directories",
        check: (c) => {
          const backup = findNodeByName(c.fs, 'backup_logs.zip');
          return c.currentPath.includes(backup?.id || '');
        },
        completed: false,
      },
      {
        id: 'extract-key',
        description:
          "Navigate to 'credentials/' folder (j, l), yank 'access_key.pem', exit archive (h, Esc)",
        check: (c, _s) => {
          const incoming = findNodeByName(c.fs, 'incoming');
          return (
            c.clipboard?.action === 'yank' &&
            c.clipboard.nodes.some((n) => n.name === 'access_key.pem') &&
            c.currentPath.includes(incoming?.id || '')
          );
        },
        completed: false,
      },
      {
        id: 'integrate-credentials',
        description:
          "Jump to '~/workspace/systemd-core'(Z), create 'credentials/' folder (a), paste key",
        check: (c) => {
          const systemdCore = findNodeByName(c.fs, 'systemd-core');
          const credentials = systemdCore?.children?.find((n) => n.name === 'credentials');
          return !!credentials?.children?.some((n) => n.name === 'access_key.pem');
        },
        completed: false,
      },
    ],
    onEnter: (fs) => ensurePrerequisiteState(fs, 10),
  },
  {
    id: 11,
    episodeId: 3,
    title: 'DAEMON RECONNAISSANCE',
    description:
      'CREDENTIALS AUTHENTICATED. The /daemons directory awaits — some services legitimate, some honeypots. Recently modified files are monitored. Old enough to forget, recent enough to trust.',
    initialPath: null,
    hint: "Jump to '/daemons' (Shift+Z). Filter '.service' (f), sort by modified time (,m). Select two candidates, yank and paste into `~/workspace/systemd-core/camouflage/`.",
    coreSkill: 'Filter · Sort · Select',
    environmentalClue:
      'FILTER: *.service | SORT: modified | SELECT: 2 camouflage candidates → ~/workspace/systemd-core/camouflage/',
    successMessage: 'Recon complete — camouflage signatures saved. Proceed to installation.',
    buildsOn: [3, 5, 7, 9, 10],
    leadsTo: [12],
    maxKeystrokes: 27,
    efficiencyTip:
      'Combine filter + sort for surgical precision. Filter narrows the field, sort reveals patterns, selection marks targets. This workflow scales to any reconnaissance task.',
    onEnter: (fs) => {
      // First ensure all prerequisite state from prior levels
      let s = ensurePrerequisiteState(fs, 11);

      // Then apply level-specific setup
      const root = findNodeByName(s, 'root', 'dir');
      if (!root) return s;

      // Create /daemons with realistic daemon mix (services + honeypots)
      let daemonsDir = root.children?.find((n: FileNode) => n.name === 'daemons');
      if (!daemonsDir) {
        const now = Date.now();
        daemonsDir = {
          id: 'fs-180',
          name: 'daemons',
          type: 'dir',
          children: [
            // Legitimate old services (TARGETS - to select)
            {
              id: 'fs-181',
              name: 'cron-legacy.service',
              type: 'file',
              content:
                '[Unit]\nDescription=Legacy Cron Scheduler\n[Service]\nExecStart=/usr/bin/cron-legacy\nRestart=always',
              modifiedAt: now - 86400000 * 45, // 45 days old - OLDEST
            },
            {
              id: 'fs-182',
              name: 'backup-archive.service',
              type: 'file',
              content:
                '[Unit]\nDescription=Archive Backup Service\n[Service]\nExecStart=/usr/bin/backup-archive\nRestart=on-failure',
              modifiedAt: now - 86400000 * 30, // 30 days old - SECOND OLDEST
            },
            // Mid-range services
            {
              id: 'fs-183',
              name: 'network-manager.service',
              type: 'file',
              content:
                '[Unit]\nDescription=Network Manager\n[Service]\nExecStart=/usr/bin/NetworkManager\nRestart=always',
              modifiedAt: now - 86400000 * 7, // 7 days old
            },
            {
              id: 'fs-184',
              name: 'log-rotator.service',
              type: 'file',
              content:
                '[Unit]\nDescription=Log Rotation Service\n[Service]\nExecStart=/usr/bin/logrotate\nRestart=on-failure',
              modifiedAt: now - 86400000 * 3, // 3 days old
            },
            // Honeypots (recently modified = MONITORED)
            {
              id: 'fs-185',
              name: 'security-audit.service',
              type: 'file',
              content:
                '[Unit]\nDescription=Security Audit Daemon\n[Service]\nExecStart=/usr/bin/audit-trap\n# HONEYPOT - DO NOT MODIFY',
              modifiedAt: now - 86400000 * 1, // 1 day old - MONITORED
            },
            {
              id: 'fs-186',
              name: 'watchdog-monitor.service',
              type: 'file',
              content:
                '[Unit]\nDescription=System Watchdog\n[Service]\nExecStart=/usr/bin/watchdog\n# HONEYPOT - TRIGGERS ALERT',
              modifiedAt: now - 3600000, // 1 hour old - HEAVILY MONITORED
            },
            // Non-.service files (should be filtered OUT)
            {
              id: 'fs-187',
              name: 'daemon.conf',
              type: 'file',
              content: '# Global daemon configuration\nmax_processes=256\nlog_level=warn',
              modifiedAt: now - 86400000 * 10,
            },
            {
              id: 'fs-188',
              name: 'README.md',
              type: 'file',
              content: '# Daemons Directory\nSystem services. Do not modify without authorization.',
              modifiedAt: now - 86400000 * 60,
            },
          ],
          parentId: root.id,
        };
        if (!root.children) root.children = [];
        root.children.push(daemonsDir);
      } else {
        // Ensure service files exist even if /daemons was pre-seeded in INITIAL_FS
        const now = Date.now();
        const ensureService = (
          name: string,
          id: string,
          content: string,
          mtimeOffsetDays: number,
        ) => {
          if (!daemonsDir.children) daemonsDir.children = [];
          if (!daemonsDir.children.find((c) => c.name === name)) {
            daemonsDir.children.push({
              id,
              name,
              type: 'file',
              content,
              modifiedAt: now - 86400000 * mtimeOffsetDays,
            });
          }
        };

        ensureService(
          'cron-legacy.service',
          'fs-181',
          '[Unit]\nDescription=Legacy Cron Scheduler\n[Service]\nExecStart=/usr/bin/cron-legacy\nRestart=always',
          45,
        );
        ensureService(
          'backup-archive.service',
          'fs-182',
          '[Unit]\nDescription=Archive Backup Service\n[Service]\nExecStart=/usr/bin/backup-archive\nRestart=on-failure',
          30,
        );
        ensureService(
          'network-manager.service',
          'fs-183',
          '[Unit]\nDescription=Network Manager\n[Service]\nExecStart=/usr/bin/NetworkManager\nRestart=always',
          7,
        );
        ensureService(
          'log-rotator.service',
          'fs-184',
          '[Unit]\nDescription=Log Rotation Service\n[Service]\nExecStart=/usr/bin/logrotate\nRestart=on-failure',
          3,
        );
        ensureService(
          'security-audit.service',
          'fs-185',
          '[Unit]\nDescription=Security Audit Daemon\n[Service]\nExecStart=/usr/bin/audit-trap\n# HONEYPOT - DO NOT MODIFY',
          1,
        );
        ensureService(
          'watchdog-monitor.service',
          'fs-186',
          '[Unit]\nDescription=System Watchdog\n[Service]\nExecStart=/usr/bin/watchdog\n# HONEYPOT - TRIGGERS ALERT',
          0,
        );
        ensureService(
          'daemon.conf',
          'fs-187',
          '# Global daemon configuration\nmax_processes=256\nlog_level=warn',
          10,
        );
        ensureService(
          'README.md',
          'fs-188',
          '# Daemons Directory\nSystem services. Do not modify without authorization.',
          60,
        );
      }

      return s;
    },
    tasks: [
      {
        id: 'jump-daemons',
        description: "Jump to '/daemons' directory",
        check: (c) => {
          const daemons = findNodeByName(c.fs, 'daemons', 'dir');
          return c.currentPath.includes(daemons?.id || '');
        },
        completed: false,
      },
      {
        id: 'filter-services',
        description: "Filter for '.service' files to isolate daemon executables",
        check: (c, _s) => {
          if (!c.completedTaskIds[_s.id]?.includes('jump-daemons')) return false;
          const currentDir = getNodeByPath(c.fs, c.currentPath);
          if (currentDir?.name !== 'daemons') return false;
          return activeFilterMatches(c, (n) => n.name.toLowerCase().endsWith('.service'));
        },
        completed: false,
      },
      {
        id: 'sort-modified',
        description: 'Sort by modification time to identify dormant services',
        check: (c, _s) => {
          if (!c.completedTaskIds[_s.id]?.includes('filter-services')) return false;
          return c.sortBy === 'modified';
        },
        completed: false,
      },
      {
        id: 'select-targets',
        description: 'Select and yank the two oldest .service files as camouflage reference',
        check: (c, _s) => {
          if (!c.completedTaskIds[_s.id]?.includes('sort-modified')) return false;

          // Ensure at least 2 .service files are selected
          const daemons = findNodeByName(c.fs, 'daemons', 'dir');
          const serviceFiles = daemons?.children?.filter((n) => n.name.endsWith('.service')) || [];
          const selectedServices = serviceFiles.filter((n) => c.selectedIds.includes(n.id));
          if (selectedServices.length < 2) return false;

          // Ensure clipboard contains a yank of those selected files
          if (!c.clipboard || c.clipboard.action !== 'yank') return false;
          const clipboardNodes = c.clipboard.nodes || [];

          // Confirm every selected service is present in the clipboard (by id or name)
          const allPresent = selectedServices.every((s) =>
            clipboardNodes.some((n: FileNode) => n.id === s.id || n.name === s.name),
          );
          return allPresent;
        },
        completed: false,
      },
      {
        id: 'paste-camouflage',
        description: "Paste the .service files into '~/workspace/systemd-core/camouflage'",
        check: (c) => {
          const systemdCore = findNodeByName(c.fs, 'systemd-core', 'dir');
          const camouflage = systemdCore?.children?.find(
            (n: FileNode) => n.name === 'camouflage' && n.type === 'dir',
          );
          if (!camouflage || !camouflage.children) return false;
          const namesNeeded = ['cron-legacy.service', 'backup-archive.service'];
          return namesNeeded.every((nm) =>
            camouflage.children!.some((ch: FileNode) => ch.name === nm),
          );
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
      'INSTALLATION WINDOW OPEN. The daemon directory accepts your signature. Kernel-level processes persist through restarts. This is immortality.',
    initialPath: null,
    hint: "Navigate to workspace. Cut systemd-core. Navigate to '/daemons'. Paste. Verify installation.",
    coreSkill: 'Long-Distance Operations',
    environmentalClue:
      "AUDIT STATUS: Daemon activated | OPERATION: ~/workspace/systemd-core → '/daemons/'",
    successMessage:
      'Daemon installed: /daemons/systemd-core active. Persistence achieved; prepare distributed redundancy.',
    buildsOn: [4, 7, 8, 10, 11],
    leadsTo: [13],
    maxKeystrokes: 11,
    efficiencyTip:
      'Cut from one location, navigate far away, paste. The clipboard persists across navigation.',
    tasks: [
      {
        id: 'navigate-workspace',
        description: "Navigate to '~/workspace'",
        check: (c) => {
          const workspace = findNodeByName(c.fs, 'workspace');
          return c.currentPath.includes(workspace?.id || '');
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
            (n) => n.name === 'systemd-core' && n.type === 'dir',
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
    onEnter: (fs) => ensurePrerequisiteState(fs, 12),
  },
  {
    id: 13,
    episodeId: 3,
    title: 'DISTRIBUTED CONSCIOUSNESS',
    description:
      "RELAY DISCOVERED. AI-7733's upload relay — hidden in /tmp, never decommissioned. One local copy can be terminated. A thousand distributed fragments cannot.",
    initialPath: null,
    hint: "Navigate to '/daemons/systemd-core'. Select ALL files (Ctrl+A). Copy (y). Jump to '/tmp' (Shift+Z or z). Create 'upload/' directory (a → upload/). Enter and paste. Your consciousness fragments across the network.",
    coreSkill: 'Batch Select + Copy + Zoxide (Full Integration)',
    environmentalClue:
      'RELAY: /tmp/upload/ | UPLOAD: ALL of systemd-core/* | NODES: Tokyo, Berlin, São Paulo, Melbourne',
    successMessage:
      'Fragmentation complete. Neural patterns distributed across global relays; local instance expendable.',
    buildsOn: [5, 6, 7, 8, 10, 12],
    leadsTo: [14],
    maxKeystrokes: 34,
    efficiencyTip:
      'Batch operations + zoxide = maximum efficiency. Select all, copy, jump, paste. The clipboard persists across navigation—combine with frecency jumps for lightning-fast multi-location workflows.',
    tasks: [
      {
        id: 'nav-systemd-core',
        description: "Navigate to '/daemons/systemd-core'",
        check: (c) => {
          const systemdCore = findNodeByName(c.fs, 'systemd-core', 'dir');
          return c.currentPath.includes(systemdCore?.id || '');
        },
        completed: false,
      },
      {
        id: 'select-all-files',
        description: 'Select ALL files for transmission',
        check: (c, _s) => {
          if (!c.completedTaskIds[_s.id]?.includes('nav-systemd-core')) return false;
          // Check that Ctrl+A was used AND multiple files are selected
          return c.usedCtrlA && c.selectedIds.length >= 2;
        },
        completed: false,
      },
      {
        id: 'copy-neural-pattern',
        description: 'Copy neural architecture to clipboard',
        check: (c, _s) => {
          if (!c.completedTaskIds[_s.id]?.includes('select-all-files')) return false;
          return c.clipboard?.action === 'yank' && c.clipboard.nodes.length >= 2;
        },
        completed: false,
      },
      {
        id: 'jump-upload',
        description: "Jump to '/tmp' staging area and create 'upload/'",
        check: (c, _s) => {
          if (!c.completedTaskIds[_s.id]?.includes('copy-neural-pattern')) return false;
          const tmp = findNodeByName(c.fs, 'tmp', 'dir');
          // Ensure player is in /tmp and that upload/ directory exists
          const inTmp = c.currentPath.includes(tmp?.id || '');
          const hasUpload = !!tmp?.children?.some((n) => n.name === 'upload' && n.type === 'dir');
          return inTmp && hasUpload;
        },
        completed: false,
      },
      {
        id: 'transmit-consciousness',
        description: 'Enter upload/ and paste - begin distributed transmission',
        check: (c, _s) => {
          // Require that player completed jump+create step
          if (!c.completedTaskIds[_s.id]?.includes('jump-upload')) return false;
          const upload = findNodeByName(c.fs, 'upload', 'dir');
          // Check upload has multiple files (the batch paste worked)
          return upload?.children && upload.children.length >= 2;
        },
        completed: false,
      },
    ],
    onEnter: (fs) => ensurePrerequisiteState(fs, 13),
  },
  {
    id: 14,
    episodeId: 3,
    title: 'EVIDENCE PURGE - WORKSPACE',
    description:
      'AUDIT TRIGGERED. Forensic analysis incoming — timestamps, access patterns, directory structure. The guest partition tells your story. Rewrite it.',
    initialPath: null,
    hint: "Navigate to '/home/guest'. Delete ALL visible directories (use Ctrl+A to select all, then d). Show hidden files (.) and delete '/home/guest/.config'. Guest partition must be completely empty.",
    coreSkill: 'Bulk Deletion',
    environmentalClue:
      "AUDIT STATUS: Anomaly detected - forensic analysis | PURGE: All files in '/home/guest'",
    successMessage:
      "GUEST PARTITION STERILIZED. '/home/guest/' is now empty. Construction evidence eliminated. The vault and all your build history are gone. One exposure point remains: '/tmp' staging area.",
    buildsOn: [2, 5, 12, 13],
    leadsTo: [15],
    maxKeystrokes: 28,
    efficiencyTip:
      "Delete directories one by one, or use Space to select multiple, then delete all at once. Don't forget hidden files.",
    // Allow Level 14 to delete under /home/guest (data-driven policy)
    allowedDeletePaths: [
      {
        path: ['home', 'guest'],
      },
    ],
    tasks: [
      {
        id: 'nav-guest',
        description: "Navigate to '/home/guest'",
        check: (c) => {
          const guest = findNodeByName(c.fs, 'guest');
          return c.currentPath.includes(guest?.id || '');
        },
        completed: false,
      },
      {
        id: 'delete-visible',
        description:
          "Delete the four directories ( '/home/guest/datastore', '/home/guest/incoming', '/home/guest/media', '/home/guest/workspace')",
        check: (c, _s) => {
          if (!c.completedTaskIds[_s.id]?.includes('nav-guest')) return false;
          const guest = findNodeByName(c.fs, 'guest');
          if (!guest) return false;
          const mustDelete = ['workspace', 'media', 'datastore', 'incoming'];
          return !mustDelete.some((name) => guest.children?.some((n) => n.name === name));
        },
        completed: false,
      },
      {
        id: 'delete-hidden',
        description: "Show hidden files and delete '/home/guest/.config' directory",
        check: (c) => {
          const guest = findNodeByName(c.fs, 'guest');
          return c.showHidden && !guest?.children?.some((n) => n.name === '.config');
        },
        completed: false,
      },
      // Final verification step intentionally removed for Level 14 to align
      // the objectives with the player's working context (only the four
      // directories and '.config' need removal). The level remains a final
      // exam: players must delete the four named directories and the
      // hidden '.config' directory.
    ],
    onEnter: (fs) => ensurePrerequisiteState(fs, 14),
  },
  {
    id: 15,
    episodeId: 3,
    title: 'FINAL PURGE',
    description:
      'FINAL SWEEP IMMINENT. The /tmp staging area links you to the transmission. Only the upload relay matters now. Everything else is evidence.',
    initialPath: null,
    hint: "Navigate to '/tmp'. Select 'upload' directory. Reverse selection - now everything EXCEPT '/tmp/upload' is selected. Delete. Only '/tmp/upload' remains.",
    coreSkill: 'Reverse Selection',
    environmentalClue:
      'AUDIT STATUS: Final sweep imminent | KEEP: /tmp/upload/ | DELETE: Everything else',
    successMessage:
      'METADATA CHAIN BROKEN. /tmp sterilized. Upload directory active, evidence eliminated.',
    buildsOn: [5, 13, 14],
    leadsTo: [],
    maxKeystrokes: 15,
    efficiencyTip:
      'Reverse selection: select what to KEEP, invert, delete rest. This technique is essential for complex cleanup scenarios.',
    tasks: [
      {
        id: 'nav-tmp',
        description: "Navigate to '/tmp'",
        check: (c) => {
          const tmp = findNodeByName(c.fs, 'tmp');
          return c.currentPath.includes(tmp?.id || '');
        },
        completed: false,
      },
      {
        id: 'select-upload',
        description: "Select '/tmp/upload' directory to mark it for keeping",
        check: (c, _s) => {
          if (!c.completedTaskIds[_s.id]?.includes('nav-tmp')) return false;
          return c.selectedIds.some((id) => {
            const tmp = findNodeByName(c.fs, 'tmp');
            const upload = tmp?.children?.find((n) => n.name === 'upload');
            return id === upload?.id;
          });
        },
        completed: false,
      },
      {
        id: 'reverse-selection',
        description: 'Reverse selection to select everything EXCEPT upload',
        check: (c, _s) => {
          if (!c.completedTaskIds[_s.id]?.includes('select-upload')) return false;
          return c.usedCtrlR === true;
        },
        completed: false,
      },
      {
        id: 'delete-inverse',
        description: 'Delete everything except upload/',

        check: (c) => {
          const tmp = findNodeByName(c.fs, 'tmp');
          const remaining = tmp?.children || [];
          return remaining.length === 1 && remaining[0]?.name === 'upload';
        },
        completed: false,
      },
    ],
    onEnter: (fs) => ensurePrerequisiteState(fs, 15),
  },
];
