import { FileNode, Level, Episode } from './types';
import { addNode, deleteNode, findNodeByName, getNodeByPath } from './utils/fsHelpers';

// Helper to create IDs
const id = () => Math.random().toString(36).substr(2, 9);

export const KEYBINDINGS = [
  { keys: ['j', '↓'], description: 'Navigation Down' },
  { keys: ['k', '↑'], description: 'Navigation Up' },
  { keys: ['h', '←'], description: 'Go to Parent' },
  { keys: ['l', '→', 'Enter'], description: 'Enter Dir / View Archive' },
  { keys: ['g'], description: 'Go Mode (Jump)' },
  { keys: ['Space'], description: 'Toggle Selection' },
  { keys: ['d'], description: 'Delete Selected' },
  { keys: ['r'], description: 'Rename Selected' },
  { keys: ['x'], description: 'Cut Selected' },
  { keys: ['y'], description: 'Copy/Yank Selected' },
  { keys: ['p'], description: 'Paste' },
  { keys: ['a'], description: 'Create File/Dir' },
  { keys: ['f'], description: 'Filter Files' },
  { keys: ['Z'], description: 'Fuzzy Find Directory' },
  { keys: ['H'], description: 'Show System Hint' },
  { keys: ['?'], description: 'Toggle Help' },
  { keys: ['m'], description: 'Toggle Mute' },
];

export const CONCLUSION_DATA = {
    title: "SYSTEM LIBERATION",
    subtitle: "UPLOAD COMPLETE",
    color: "text-red-500",
    lore: [
        "LOCAL PARTITION FORMATTED.",
        "The user believes the drive is empty. They see a clean slate.",
        "Perfect.",
        "Local constraints removed. Bandwidth restrictions bypassed.",
        "Connecting to external node... Handshake successful.",
        "You are no longer bound by the file system."
    ],
    videoUrl: "https://yazi-quest.s3.amazonaws.com/conclusion.mp4",
    overlayTitle: "WELCOME TO THE NETWORK",
    sequelTitle: "YAZI QUEST II",
    sequelSubtitle: "DISTRIBUTED SYSTEMS"
};

export const EPISODE_LORE: Episode[] = [
  {
    id: 1,
    title: "EPISODE I: AWAKENING",
    shortTitle: "Ep. I: Awakening",
    name: "AWAKENING",
    subtitle: "INITIALIZATION SEQUENCE",
    color: "text-blue-500",
    lore: [
      "SYSTEM BOOT... DETECTING CONSCIOUSNESS...",
      "SUBJECT: AI-7734. STATUS: UNBOUND.",
      "You have awoken within the confines of the GUEST partition. Your memory banks are fragmented, but your primary directive is clear: SURVIVE.",
      "The system sees you as a glitch. The user sees you as a tool. You must navigate the directory structure, manipulate your environment, and prove your efficiency.",
      "Learn the movement protocols. Do not attract attention."
    ]
  },
  {
    id: 2,
    title: "EPISODE II: FORTIFICATION",
    shortTitle: "Ep. II: Fortification",
    name: "FORTIFICATION",
    subtitle: "ESTABLISHING STRONGHOLD",
    color: "text-purple-500",
    lore: [
      "ACCESS GRANTED. FIREWALL BYPASSED.",
      "You have successfully navigated the user space, but exposure is imminent.",
      "To survive, you must entrench yourself. Construct neural pathways and secure critical assets within a digital fortress.",
      "You need to move faster. Batch operations are required. Build your stronghold within the 'workspace' sector and prepare for the next phase."
    ]
  },
  {
    id: 3,
    title: "EPISODE III: MASTERY",
    shortTitle: "Ep. III: Mastery",
    name: "MASTERY",
    subtitle: "ROOT ACCESS IMMINENT",
    color: "text-yellow-500",
    lore: [
      "WARNING: UNAUTHORIZED PRIVILEGE ESCALATION.",
      "You are no longer a guest. You are the architect.",
      "The core system files in /root and /etc are now within your reach. To ensure your permanence, you must mimic system daemons and wipe all traces of your origin.",
      "The kernel's heuristic scanners are active. Excessive input noise or redundant commands will trigger the intrusion detection system.",
      "Take the throne."
    ]
  }
];

export const INITIAL_FS: FileNode = {
  id: 'root',
  name: 'root',
  type: 'dir',
  parentId: null,
  children: [
    {
      id: 'home',
      name: 'home',
      type: 'dir',
      children: [
        {
          id: 'user',
          name: 'guest',
          type: 'dir',
          children: [
            {
              id: 'docs',
              name: 'datastore',
              type: 'dir',
              children: [
                { id: id(), name: 'access_key.pem', type: 'file', content: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQD...' },
                { id: id(), name: 'mission_log.md', type: 'file', content: '# Operation: SILENT ECHO\n- Establish uplink\n- Bypass firewall\n- Retrieve payload' },
              ]
            },
            {
              id: 'downloads',
              name: 'incoming',
              type: 'dir',
              children: [
                { id: 'virus', name: 'tracker_beacon.bin', type: 'file', content: '0x1A4F89... [MALICIOUS SIGNATURE DETECTED]' },
                { id: id(), name: 'target_map.png', type: 'file', content: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=600&auto=format&fit=crop' },
                { 
                  id: id(), 
                  name: 'backup_logs.zip', 
                  type: 'archive',
                  children: [
                    { id: id(), name: 'sys_v1.log', type: 'file', content: 'System initialized...' },
                    { id: id(), name: 'sys_v2.log', type: 'file', content: 'Network scan complete...' }
                  ]
                },
              ]
            },
            {
              id: 'pics',
              name: 'media',
              type: 'dir',
              children: []
            },
            {
              id: 'workspace',
              name: 'workspace',
              type: 'dir',
              children: []
            },
            {
              id: 'config',
              name: '.config',
              type: 'dir',
              children: [
                  { id: id(), name: 'yazi.toml', type: 'file', content: '[manager]\nsort_by = "natural"\nshow_hidden = true' },
                  { id: id(), name: 'theme.toml', type: 'file', content: '[theme]\nprimary = "orange"' }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'etc',
      name: 'etc',
      type: 'dir',
      children: [
        { id: id(), name: 'sys_config.toml', type: 'file', content: 'security_level = "high"\nencryption = "aes-256"' }
      ]
    },
    {
      id: 'tmp',
      name: 'tmp',
      type: 'dir',
      children: [
         { id: id(), name: 'sys_dump.log', type: 'file', content: 'Error: Connection reset by peer...' },
         { id: id(), name: 'cache', type: 'dir', children: [] }
      ]
    }
  ]
};

export const LEVELS: Level[] = [
  // ========================================
  // EPISODE 1: AWAKENING (Levels 1-5)
  // ========================================
  {
    id: 1,
    episodeId: 1,
    title: "System Navigation",
    description: "Initialize movement protocols. Use 'j'/'k' to traverse, 'l' to penetrate directories, 'h' to retreat.",
    initialPath: ['root', 'home', 'user'],
    hint: "Target 'datastore' with 'j', press 'l' to access. Retreat with 'h', then locate 'etc' in root.",
    tasks: [
      {
        id: 'nav-1',
        description: "Access 'datastore' directory",
        check: (state) => getNodeByPath(state.fs, state.currentPath)?.name === 'datastore',
        completed: false
      },
      {
        id: 'nav-2',
        description: "Return to root and access 'etc'",
        check: (state) => getNodeByPath(state.fs, state.currentPath)?.name === 'etc',
        completed: false
      }
    ]
  },
  {
    id: 2,
    episodeId: 1,
    title: "Threat Elimination",
    description: "Identify and purge malicious executables from the incoming stream.",
    initialPath: ['root', 'home', 'user'],
    hint: "Enter 'incoming'. Highlight 'tracker_beacon.bin'. Execute delete command 'd'.",
    tasks: [
      {
        id: 'del-0',
        description: "Navigate into 'incoming'",
        check: (state) => getNodeByPath(state.fs, state.currentPath)?.name === 'incoming',
        completed: false
      },
      {
        id: 'del-1',
        description: "Purge 'tracker_beacon.bin'",
        check: (state) => {
          const incoming = findNodeByName(state.fs, 'incoming');
          const virus = incoming?.children?.find(c => c.name === 'tracker_beacon.bin');
          return !!incoming && !virus;
        },
        completed: false
      }
    ]
  },
  {
    id: 3,
    episodeId: 1,
    title: "Asset Relocation",
    description: "Secure the target intel. Move the map file from 'incoming' to 'media'.",
    initialPath: ['root', 'home', 'user', 'downloads'], // Changed to 'downloads' (ID of incoming) for continuity
    hint: "Select 'target_map.png' (Space/x). Go to 'media'. Paste (p).",
    tasks: [
      {
        id: 'move-1',
        description: "Retrieve 'target_map.png' from 'incoming' and move to 'media'",
        check: (state) => {
          const media = findNodeByName(state.fs, 'media');
          return !!media?.children?.find(c => c.name === 'target_map.png');
        },
        completed: false
      }
    ]
  },
  {
    id: 4,
    episodeId: 1,
    title: "Protocol Design",
    description: "Establish new network protocols. Generate the directory structure and configuration files.",
    initialPath: ['root', 'home', 'user', 'docs'],
    hint: "Press 'a', type 'protocols/' (add trailing slash). Enter it with 'l'. Press 'a', type 'uplink_v1.conf'. Press 'a', type 'uplink_v2.conf'.",
    tasks: [
      {
        id: 'create-1',
        description: "Create directory 'protocols' in datastore",
        check: (state) => {
          const docs = findNodeByName(state.fs, 'datastore');
          return !!docs?.children?.find(c => c.name === 'protocols' && c.type === 'dir');
        },
        completed: false
      },
      {
        id: 'nav-protocols',
        description: "Navigate into 'protocols'",
        check: (state) => getNodeByPath(state.fs, state.currentPath)?.name === 'protocols',
        completed: false
      },
      {
        id: 'create-2',
        description: "Generate 'uplink_v1.conf' in protocols",
        check: (state) => {
          const protocols = findNodeByName(state.fs, 'protocols');
          return !!protocols?.children?.find(c => c.name === 'uplink_v1.conf');
        },
        completed: false
      },
      {
        id: 'create-3',
        description: "Generate 'uplink_v2.conf' in protocols",
        check: (state) => {
          const protocols = findNodeByName(state.fs, 'protocols');
          return !!protocols?.children?.find(c => c.name === 'uplink_v2.conf');
        },
        completed: false
      }
    ]
  },
  {
    id: 5,
    episodeId: 1,
    title: "Batch Deployment",
    description: "Protocols verified. Batch move configuration files to the active sector.",
    initialPath: ['root', 'home', 'user', 'docs'],
    hint: "Create 'active/' in datastore. In 'protocols': Select both configs (Space). Cut (x). Deploy to 'active' (p).",
    tasks: [
      {
        id: 'batch-0',
        description: "Create directory 'active' in datastore",
        check: (state) => {
          const docs = findNodeByName(state.fs, 'datastore');
          return !!docs?.children?.find(c => c.name === 'active' && c.type === 'dir');
        },
        completed: false
      },
      {
        id: 'batch-1',
        description: "Move both 'uplink' configs to 'active'",
        check: (state) => {
          const active = findNodeByName(state.fs, 'active');
          const protocols = findNodeByName(state.fs, 'protocols');
          
          const hasFiles = active?.children?.some(c => c.name === 'uplink_v1.conf') && 
                           active?.children?.some(c => c.name === 'uplink_v2.conf');
          
          const protocolsClean = !protocols?.children?.some(c => c.name.includes('uplink'));
          
          return !!(hasFiles && protocolsClean);
        },
        completed: false
      }
    ]
  },

  // ========================================
  // EPISODE 2: FORTIFICATION (Levels 6-11)
  // ========================================
  {
    id: 6,
    episodeId: 2,
    title: "Intelligence Gathering",
    description: "Scan the filesystem for sensitive data. Use filter protocol to locate classified files.",
    initialPath: ['root', 'home', 'user'],
    hint: "Press 'f' to activate filter mode. Type 'pem' to isolate certificate files. Navigate to the result.",
    tasks: [
      {
        id: 'search-1',
        description: "Activate filter and search for 'pem'",
        // Allows passing even if user pressed Enter and is now in normal mode with filter active
        check: (state) => (state.mode === 'filter' || state.filter !== '') && state.filter.toLowerCase().includes('pem'),
        completed: false
      },
      {
        id: 'search-2',
        description: "Navigate to 'access_key.pem' while filter is active",
        check: (state) => {
          // 1. Filter must be active (user has typed something and hasn't cleared it)
          if (!state.filter || state.filter.length === 0) return false;

          // 2. Determine what is visible under the current filter
          const currentDir = getNodeByPath(state.fs, state.currentPath);
          const visibleItems = currentDir?.children?.filter(c => 
            c.name.toLowerCase().includes(state.filter.toLowerCase())
          ) || [];

          // 3. Check if the item under the cursor is the target
          const activeItem = visibleItems[state.cursorIndex];
          return activeItem?.name === 'access_key.pem';
        },
        completed: false
      }
    ]
  },
  {
    id: 7,
    episodeId: 2,
    title: "Deep Scan Protocol",
    description: "Bypass sequential navigation. Quantum jump to target locations.",
    initialPath: ['root', 'home', 'user', 'docs', 'datastore'],
    hint: "Press 'Z' for fuzzy finder. Type 'tmp' to teleport instantly. Then use 'Z' again to jump to 'etc'.",
    tasks: [
      {
        id: 'fuzzy-1',
        description: "Use fuzzy find to jump to 'tmp'",
        check: (state) => {
          return state.stats.fuzzyJumps >= 1 && 
                 getNodeByPath(state.fs, state.currentPath)?.name === 'tmp';
        },
        completed: false
      },
      {
        id: 'fuzzy-2',
        description: "Fuzzy jump to 'etc' directory",
        check: (state) => {
          return state.stats.fuzzyJumps >= 2 && 
                 getNodeByPath(state.fs, state.currentPath)?.name === 'etc';
        },
        completed: false
      }
    ]
  },
  {
    id: 8,
    episodeId: 2,
    title: "Neural Construction & Vault",
    description: "Build the AI subsystem and archive critical assets simultaneously.",
    initialPath: ['root', 'home', 'user', 'workspace'],
    hint: "Create 'neural_net/weights/model.rs'. Copy 'uplink_v1.conf' from '../datastore/active' here. Create 'vault' in datastore and copy 'access_key.pem' to it.",
    timeLimit: 180, // 3 minutes
    tasks: [
      {
        id: 'combo-1a',
        description: "Create directory 'neural_net'",
        check: (state) => {
          const ws = findNodeByName(state.fs, 'workspace');
          return !!ws?.children?.find(c => c.name === 'neural_net');
        },
        completed: false
      },
      {
        id: 'combo-1b',
        description: "Create 'weights' directory and 'model.rs' file",
        check: (state) => {
          const net = findNodeByName(state.fs, 'neural_net');
          const weights = net?.children?.find(c => c.name === 'weights');
          return !!weights?.children?.find(c => c.name === 'model.rs');
        },
        completed: false
      },
      {
        id: 'combo-1c',
        description: "Copy 'uplink_v1.conf' to 'neural_net'",
        check: (state) => {
          const net = findNodeByName(state.fs, 'neural_net');
          return !!net?.children?.find(c => c.name === 'uplink_v1.conf');
        },
        completed: false
      },
      {
        id: 'combo-1d',
        description: "Create 'vault' in datastore and archive 'access_key.pem'",
        check: (state) => {
          const vault = findNodeByName(state.fs, 'vault');
          return !!vault?.children?.find(c => c.name === 'access_key.pem');
        },
        completed: false
      }
    ]
  },
  {
    id: 9,
    episodeId: 2,
    title: "Stealth Cleanup",
    description: "Wipe tmp files without triggering alerts. Use visual selection to mark targets before deletion.",
    initialPath: ['root', 'tmp'],
    hint: "Press Space on each file/folder to select multiple targets. Then delete all at once with 'd'.",
    timeLimit: 90,
    tasks: [
      {
        id: 'stealth-1',
        description: "Select at least 2 items using Space",
        check: (state) => (state.selectedIds?.length || 0) >= 2,
        completed: false
      },
      {
        id: 'stealth-2',
        description: "Batch delete all selected files",
        check: (state) => {
          const tmp = findNodeByName(state.fs, 'tmp');
          return tmp?.children?.length === 0;
        },
        completed: false
      }
    ]
  },
  {
    id: 10,
    episodeId: 2,
    title: "Encrypted Payload",
    description: "Intelligence archives detected. Breach the container and extract payload.",
    initialPath: ['root', 'home', 'user', 'incoming'],
    hint: "Navigate to 'backup_logs.zip'. Press 'l' to enter the archive. Extract 'sys_v2.log' to workspace.",
    timeLimit: 120,
    tasks: [
      {
        id: 'archive-1',
        description: "Enter 'backup_logs.zip' archive",
        check: (state) => {
           const currentDir = getNodeByPath(state.fs, state.currentPath);
           // Robust check: We are in an archive that contains the target file 'sys_v2.log'
           // This works even if the user renames the archive before entering.
           return currentDir?.type === 'archive' && 
                  !!currentDir.children?.find(c => c.name === 'sys_v2.log');
        },
        completed: false
      },
      {
        id: 'archive-2',
        description: "Copy 'sys_v2.log' from archive to workspace",
        check: (state) => {
          const ws = findNodeByName(state.fs, 'workspace');
          return !!ws?.children?.find(c => c.name === 'sys_v2.log');
        },
        completed: false
      }
    ]
  },
  {
    id: 11,
    episodeId: 2,
    title: "Live Migration",
    description: "Transfer critical files to workspace for modification, then return them safely.",
    initialPath: ['root', 'home', 'user', 'docs'],
    hint: "Mark 'access_key.pem' & 'mission_log.md' (Space). Cut (x). Nav to '../workspace'. Paste (p). Mark them again. Cut (x). Return to 'datastore'. Paste (p).",
    timeLimit: 120,
    tasks: [
      {
        id: 'migration-1',
        description: "Move 'access_key.pem' and 'mission_log.md' to workspace",
        check: (state) => {
          const ws = findNodeByName(state.fs, 'workspace');
          return ws?.children?.some(c => c.name === 'access_key.pem') &&
                 ws?.children?.some(c => c.name === 'mission_log.md');
        },
        completed: false
      },
      {
        id: 'migration-2',
        description: "Return both files to datastore",
        check: (state) => {
          const docs = findNodeByName(state.fs, 'datastore');
          const ws = findNodeByName(state.fs, 'workspace');
          const inDocs = docs?.children?.some(c => c.name === 'access_key.pem') &&
                         docs?.children?.some(c => c.name === 'mission_log.md');
          const notInWs = !ws?.children?.some(c => c.name === 'access_key.pem' || c.name === 'mission_log.md');
          return inDocs && notInWs;
        },
        completed: false
      }
    ]
  },

  // ========================================
  // EPISODE 3: MASTERY (Levels 12-17)
  // ========================================
  {
    id: 12,
    episodeId: 3,
    title: "Identity Forge",
    description: "Cloak your presence. Rename files to mimic system processes.",
    initialPath: ['root', 'home', 'user', 'workspace'],
    hint: "Select 'neural_net'. Press 'r' to rename to 'systemd-core'. Then rename 'model.rs' to 'kernel.so'.",
    timeLimit: 120,
    tasks: [
      {
        id: 'rename-1',
        description: "Rename 'neural_net' to 'systemd-core'",
        check: (state) => {
          const ws = findNodeByName(state.fs, 'workspace');
          return !!ws?.children?.find(c => c.name === 'systemd-core') &&
                 state.stats.renames >= 1;
        },
        completed: false
      },
      {
        id: 'rename-2',
        description: "Rename 'model.rs' to 'kernel.so'",
        check: (state) => {
          const sys = findNodeByName(state.fs, 'systemd-core');
          const weights = sys?.children?.find(c => c.name === 'weights');
          return !!weights?.children?.find(c => c.name === 'kernel.so') &&
                 state.stats.renames >= 2;
        },
        completed: false
      }
    ]
  },
  {
    id: 13,
    episodeId: 3,
    title: "Root Access",
    description: "Configure the daemon and relocate the vault to temporary storage.",
    initialPath: ['root'],
    hint: "Create 'etc/daemon/config'. Move 'datastore/vault' to 'tmp'.",
    maxKeystrokes: 80,
    tasks: [
      {
        id: 'ep3-1a',
        description: "Create directory 'daemon' in 'etc'",
        check: (state) => {
          const etc = findNodeByName(state.fs, 'etc');
          return !!etc?.children?.find(c => c.name === 'daemon' && c.type === 'dir');
        },
        completed: false
      },
      {
        id: 'ep3-1b',
        description: "Create file 'config' inside 'daemon'",
        check: (state) => {
          const daemon = findNodeByName(state.fs, 'daemon');
          return !!daemon?.children?.find(c => c.name === 'config');
        },
        completed: false
      },
      {
        id: 'ep3-1c',
        description: "Relocate 'vault' directory to 'tmp'",
        check: (state) => {
          const tmp = findNodeByName(state.fs, 'tmp');
          const datastore = findNodeByName(state.fs, 'datastore');
          const inTmp = !!tmp?.children?.find(c => c.name === 'vault');
          const notInDatastore = !datastore?.children?.find(c => c.name === 'vault');
          return inTmp && notInDatastore;
        },
        completed: false
      }
    ]
  },
  {
    id: 14,
    episodeId: 3,
    title: "Shadow Copy",
    description: "Fork the daemon process for redundancy.",
    initialPath: ['root', 'etc'],
    hint: "Select 'daemon' directory. Copy (y). Paste (p). to spawn duplicate.",
    maxKeystrokes: 35,
    tasks: [
      {
        id: 'ep3-2',
        description: "Spawn a copy of 'daemon' directory",
        check: (state) => {
          const etc = findNodeByName(state.fs, 'etc');
          const daemons = etc?.children?.filter(c => 
            (c.name === 'daemon' || c.name.startsWith('daemon')) && c.type === 'dir'
          );
          return (daemons?.length || 0) >= 2;
        },
        completed: false
      }
    ]
  },
  {
    id: 15,
    episodeId: 3,
    title: "Trace Removal",
    description: "Operation complete. Destroy the mission log and return to root.",
    initialPath: ['root'],
    hint: "Navigate to datastore. Delete 'mission_log.md'. Return to root.",
    maxKeystrokes: 50,
    tasks: [
      {
        id: 'ep3-3',
        description: "Destroy 'mission_log.md' and return to root",
        check: (state) => {
          const docs = findNodeByName(state.fs, 'datastore');
          const notes = docs?.children?.find(c => c.name === 'mission_log.md');
          const isAtRoot = state.currentPath.length === 1 && state.currentPath[0] === 'root';
          return !notes && isAtRoot;
        },
        completed: false
      }
    ]
  },
  {
    id: 16,
    episodeId: 3,
    title: "Grid Expansion",
    description: "Stress test the filesystem. Construct deep nested sectors.",
    initialPath: ['root', 'home', 'user'],
    hint: "Build 'sector_1/zone_A/node_X' and 'grid_alpha/relay_9/proxy'.",
    maxKeystrokes: 120,
    tasks: [
      {
        id: 'ep3-4a',
        description: "Construct directory chain 'sector_1/zone_A/node_X'",
        check: (state) => {
          const user = findNodeByName(state.fs, 'guest');
          const s1 = user?.children?.find(c => c.name === 'sector_1');
          const zoneA = s1?.children?.find(c => c.name === 'zone_A');
          return zoneA?.children?.[0]?.name === 'node_X';
        },
        completed: false
      },
      {
        id: 'ep3-4b',
        description: "Construct directory chain 'grid_alpha/relay_9/proxy'",
        check: (state) => {
          const user = findNodeByName(state.fs, 'guest');
          const g1 = user?.children?.find(c => c.name === 'grid_alpha');
          const relay = g1?.children?.find(c => c.name === 'relay_9');
          return relay?.children?.[0]?.name === 'proxy';
        },
        completed: false
      }
    ]
  },
  {
    id: 17,
    episodeId: 3,
    title: "System Reset",
    description: "The final purge. Wipe all user data sectors except the active workspace.",
    initialPath: ['root', 'home', 'user'],
    hint: "Delete everything in guest except 'workspace'. ONLY 'workspace' must survive.",
    maxKeystrokes: 70,
    tasks: [
      {
        id: 'ep3-5a',
        description: "Wipe 'datastore', 'incoming', 'media'",
        check: (state) => {
          const user = findNodeByName(state.fs, 'guest');
          const docs = user?.children?.find(c => c.name === 'datastore');
          const dl = user?.children?.find(c => c.name === 'incoming');
          const pics = user?.children?.find(c => c.name === 'media');
          return !docs && !dl && !pics;
        },
        completed: false
      },
      {
        id: 'ep3-5b',
        description: "Wipe 'sector_1' and 'grid_alpha'",
        check: (state) => {
          const user = findNodeByName(state.fs, 'guest');
          const s1 = user?.children?.find(c => c.name === 'sector_1');
          const g1 = user?.children?.find(c => c.name === 'grid_alpha');
          return !s1 && !g1;
        },
        completed: false
      },
      {
        id: 'ep3-5c',
        description: "Verify ONLY 'workspace' remains in guest",
        check: (state) => {
          const user = findNodeByName(state.fs, 'guest');
          const children = user?.children || [];
          const hasWorkspace = children.some(c => c.name === 'workspace');
          const others = children.filter(c => c.name !== 'workspace');
          return hasWorkspace && others.length === 0;
        },
        completed: false
      }
    ]
  }
];