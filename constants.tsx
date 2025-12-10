import { FileNode, Level, Episode } from './types';
import { addNode, deleteNode, findNodeByName, getNodeByPath } from './utils/fsHelpers';

// Helper to create IDs
const id = () => Math.random().toString(36).substr(2, 9);

export const KEYBINDINGS = [
  { keys: ['j', '↓'], description: 'Navigation Down' },
  { keys: ['k', '↑'], description: 'Navigation Up' },
  { keys: ['h', '←'], description: 'Go to Parent' },
  { keys: ['l', '→', 'Enter'], description: 'Enter Directory' },
  { keys: ['Space'], description: 'Toggle Selection' },
  { keys: ['d'], description: 'Delete Selected' },
  { keys: ['x'], description: 'Cut Selected' },
  { keys: ['y'], description: 'Copy/Yank Selected' },
  { keys: ['p'], description: 'Paste' },
  { keys: ['a'], description: 'Create File/Dir' },
  { keys: ['H'], description: 'Show System Hint' },
  { keys: ['?'], description: 'Toggle Help' },
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
    videoUrl: "/videos/welcome_to_network.mp4", // Local video file in public/videos/
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

// Levels designed with continuity in mind.
// The state of the FS persists between levels.

export const LEVELS: Level[] = [
  // --- EPISODE 1: AWAKENING ---
  {
    id: 1,
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
    title: "Asset Relocation",
    description: "Secure the target intel. Move the map file from 'incoming' to 'media'.",
    initialPath: ['root', 'home', 'user'],
    hint: "Go to 'incoming'. Select 'target_map.png' (x). Go to 'media'. Paste (p).",
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
    title: "Protocol Design",
    description: "Establish new network protocols. Generate the directory structure and configuration files.",
    initialPath: ['root', 'home', 'user', 'docs'],
    hint: "Create dir 'protocols/'. Enter it. Create 'uplink_v1.conf' and 'uplink_v2.conf'.",
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

  // --- EPISODE 2: FORTIFICATION ---
  {
    id: 6,
    title: "Neural Construction",
    description: "Build the AI subsystem and inject the primary uplink protocol.",
    initialPath: ['root', 'home', 'user', 'workspace'],
    hint: "Create 'neural_net/weights/model.rs'. Copy 'uplink_v1.conf' from 'datastore/active' to 'neural_net'.",
    timeLimit: 120, // 2 minutes
    tasks: [
      {
         id: 'ep2-1a',
         description: "Create directory 'neural_net'",
         check: (state) => {
             const ws = findNodeByName(state.fs, 'workspace');
             return !!ws?.children?.find(c => c.name === 'neural_net');
         },
         completed: false
      },
      {
         id: 'ep2-1b',
         description: "Create directory 'weights' in 'neural_net'",
         check: (state) => {
             const net = findNodeByName(state.fs, 'neural_net');
             return !!net?.children?.find(c => c.name === 'weights');
         },
         completed: false
      },
      {
        id: 'ep2-1c',
        description: "Initialize 'model.rs' in 'weights'",
        check: (state) => {
           const weights = findNodeByName(state.fs, 'weights');
           return !!weights?.children?.find(c => c.name === 'model.rs');
        },
        completed: false
      },
      {
        id: 'ep2-1d',
        description: "Copy 'uplink_v1.conf' to 'neural_net'",
        check: (state) => {
            const net = findNodeByName(state.fs, 'neural_net');
            return !!net?.children?.find(c => c.name === 'uplink_v1.conf');
        },
        completed: false
      }
    ]
  },
  {
    id: 7,
    title: "Secure Vault",
    description: "Redundancy required. Archive the private access key.",
    initialPath: ['root', 'home', 'user', 'docs'],
    hint: "Create 'vault/' in datastore. Select 'access_key.pem', copy (y). Enter 'vault', paste (p).",
    timeLimit: 90,
    tasks: [
      {
        id: 'ep2-2a',
        description: "Create 'vault' directory in datastore",
        check: (state) => {
           const docs = findNodeByName(state.fs, 'datastore');
           return !!docs?.children?.find(c => c.name === 'vault');
        },
        completed: false
      },
      {
        id: 'ep2-2b',
        description: "Archive 'access_key.pem' into 'vault'",
        check: (state) => {
           const vault = findNodeByName(state.fs, 'vault');
           return !!vault?.children?.find(c => c.name === 'access_key.pem');
        },
        completed: false
      }
    ]
  },
  {
    id: 8,
    title: "Cache Flush",
    description: "Performance critical. Purge system temporary files.",
    initialPath: ['root', 'home', 'user', 'docs'],
    hint: "Navigate to 'root/tmp'. Delete all contents to free memory.",
    timeLimit: 60,
    tasks: [
      {
          id: 'ep2-3a',
          description: "Navigate to 'tmp' sector",
          check: (state) => getNodeByPath(state.fs, state.currentPath)?.name === 'tmp',
          completed: false
      },
      {
        id: 'ep2-3b',
        description: "Purge all temporary data",
        check: (state) => {
            const tmp = findNodeByName(state.fs, 'tmp');
            return tmp?.children?.length === 0;
        },
        completed: false
      }
    ]
  },
  {
    id: 9,
    title: "Live Migration",
    description: "Transfer critical system files to the workspace for modification.",
    initialPath: ['root', 'home', 'user', 'docs'],
    hint: "Select 'access_key.pem' and 'mission_log.md'. Cut (x). Move to 'workspace'. Paste (p).",
    timeLimit: 90,
    tasks: [
      {
        id: 'ep2-4a',
        description: "Migrate 'access_key.pem' to workspace",
        check: (state) => {
           const ws = findNodeByName(state.fs, 'workspace');
           return !!ws?.children?.find(c => c.name === 'access_key.pem');
        },
        completed: false
      },
      {
        id: 'ep2-4b',
        description: "Migrate 'mission_log.md' to workspace",
        check: (state) => {
            const ws = findNodeByName(state.fs, 'workspace');
            return !!ws?.children?.find(c => c.name === 'mission_log.md');
        },
        completed: false
      }
    ]
  },
  {
    id: 10,
    title: "Rollback",
    description: "Modification complete. Return system files to the datastore.",
    initialPath: ['root', 'home', 'user'],
    hint: "In workspace: Select the files. Cut (x). Return to datastore. Paste (p).",
    timeLimit: 90,
    tasks: [
       {
        id: 'ep2-5',
        description: "Return 'access_key.pem' to datastore",
        check: (state) => {
           const docs = findNodeByName(state.fs, 'datastore');
           return !!docs?.children?.find(c => c.name === 'access_key.pem');
        },
        completed: false
       },
       {
        id: 'ep2-5b',
        description: "Return 'mission_log.md' to datastore",
        check: (state) => {
            const docs = findNodeByName(state.fs, 'datastore');
            return !!docs?.children?.find(c => c.name === 'mission_log.md');
        },
        completed: false
       }
    ]
  },

  // --- EPISODE 3: MASTERY ---
  {
    id: 11,
    title: "Root Access",
    description: "Configure the daemon and offload the vault to temporary storage.",
    initialPath: ['root'],
    hint: "Create 'etc/daemon/config'. Move 'datastore/vault' to 'root/tmp'.",
    maxKeystrokes: 60,
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
           const etc = findNodeByName(state.fs, 'etc');
           const daemon = etc?.children?.find(c => c.name === 'daemon');
           return !!daemon?.children?.find(c => c.name === 'config');
        },
        completed: false
      },
      {
        id: 'ep3-1c',
        description: "Relocate 'vault' to 'tmp'",
        check: (state) => {
            const tmp = findNodeByName(state.fs, 'tmp');
            return !!tmp?.children?.find(c => c.name === 'vault');
        },
        completed: false
      }
    ]
  },
  {
    id: 12,
    title: "Shadow Copy",
    description: "Fork the daemon process for redundancy.",
    initialPath: ['root', 'etc'],
    hint: "Select 'daemon'. Copy (y). Paste (p) to spawn a duplicate process.",
    maxKeystrokes: 30,
    tasks: [
      {
        id: 'ep3-2',
        description: "Spawn a copy of 'daemon' directory",
        check: (state) => {
           const etc = findNodeByName(state.fs, 'etc');
           const sysDirs = etc?.children?.filter(c => c.name === 'daemon' && c.type === 'dir');
           return (sysDirs?.length || 0) >= 2;
        },
        completed: false
      }
    ]
  },
  {
    id: 13,
    title: "Trace Removal",
    description: "Operation complete. Destroy the mission log and return to root.",
    initialPath: ['root'],
    hint: "Navigate to datastore. Delete 'mission_log.md'. Return to root.",
    maxKeystrokes: 45,
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
    id: 14,
    title: "Grid Expansion",
    description: "Stress test the filesystem. Construct deep nested sectors.",
    initialPath: ['root', 'home', 'user'],
    hint: "Create 'sector_1/zone_A/node_X/'. Create 'grid_alpha/relay_9/proxy/'.",
    maxKeystrokes: 120,
    tasks: [
      {
        id: 'ep3-4a',
        description: "Construct directory chain 'sector_1/zone_A/node_X'",
        check: (state) => {
           const user = findNodeByName(state.fs, 'guest');
           const s1 = user?.children?.find(c => c.name === 'sector_1');
           return s1?.children?.[0]?.children?.[0]?.name === 'node_X';
        },
        completed: false
      },
      {
        id: 'ep3-4b',
        description: "Construct directory chain 'grid_alpha/relay_9/proxy'",
        check: (state) => {
            const user = findNodeByName(state.fs, 'guest');
            const g1 = user?.children?.find(c => c.name === 'grid_alpha');
            return g1?.children?.[0]?.children?.[0]?.name === 'proxy';
        },
        completed: false
      }
    ]
  },
  {
    id: 15,
    title: "System Reset",
    description: "The final purge. Wipe all user data sectors except the active workspace.",
    initialPath: ['root', 'home', 'user'],
    hint: "Delete 'datastore', 'incoming', 'media', and all sectors. ONLY 'workspace' must survive.",
    maxKeystrokes: 60,
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
        description: "Verify ONLY 'workspace' remains",
        check: (state) => {
           const user = findNodeByName(state.fs, 'guest');
           const children = user?.children || [];
           const hasWorkspace = children.some(c => c.name === 'workspace');
           // Ensure nothing else exists in 'guest'
           const others = children.filter(c => c.name !== 'workspace');
           return hasWorkspace && others.length === 0;
        },
        completed: false
      }
    ]
  }
];