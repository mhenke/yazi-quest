import { FileNode, Level, Episode, GameState } from './types';
import { getNodeByPath, findNodeByName, initializeTimestamps } from './utils/fsHelpers';
import { getVisibleItems } from './utils/viewHelpers';

const generateId = () => Math.random().toString(36).substr(2, 9);

export const KEYBINDINGS = [
  // === NAVIGATION ===
  { keys: ["j", "↓"], description: "Move Down" },
  { keys: ["k", "↑"], description: "Move Up" },
  { keys: ["Shift+J"], description: "Seek Down (Jump 5)" },
  { keys: ["Shift+K"], description: "Seek Up (Jump 5)" },
  { keys: ["h", "←"], description: "Go to Parent Directory" },
  { keys: ["l", "→", "Enter"], description: "Enter Directory / View Archive" },
  { keys: ["Shift+H"], description: "History Back" },
  { keys: ["Shift+L"], description: "History Forward" },
  { keys: ["gg"], description: "Jump to Top" },
  { keys: ["G"], description: "Jump to Bottom" },

  // === FILE OPERATIONS ===
  { keys: ["a"], description: "Create File/Directory" },
  { keys: ["d"], description: "Delete Selected" },
  { keys: ["r"], description: "Rename Selected" },
  { keys: ["Tab"], description: "Show File Info Panel" },

  // === CLIPBOARD ===
  { keys: ["x"], description: "Cut Selected" },
  { keys: ["y"], description: "Copy/Yank Selected" },
  { keys: ["p"], description: "Paste" },
  { keys: ["Y", "X"], description: "Clear Clipboard" },

  // === SELECTION ===
  { keys: ["Space"], description: "Toggle Selection" },
  { keys: ["Ctrl+A"], description: "Select All" },
  { keys: ["Ctrl+R"], description: "Invert Selection" },

  // === SEARCH & FILTER ===
  { keys: ["f"], description: "Filter Files" },
  { keys: ["z"], description: "FZF Find (Recursive)" },
  { keys: ["Shift+Z"], description: "Zoxide Jump (History)" },
  { keys: ["Esc"], description: "Clear Filter / Exit Mode" },

  // === SORTING ===
  { keys: [","], description: "Open Sort Menu" },
  { keys: [",a"], description: "Sort: Alphabetical" },
  { keys: [",A"], description: "Sort: Alphabetical (Reverse)" },
  { keys: [",m"], description: "Sort: Modified Time" },
  { keys: [",s"], description: "Sort: Size" },
  { keys: [",e"], description: "Sort: Extension" },
  { keys: [",n"], description: "Sort: Natural" },
  { keys: [",l"], description: "Sort: Cycle Linemode" },
  { keys: [",-"], description: "Sort: Clear Linemode" },

  // === GOTO SHORTCUTS (Level 8+) ===
  { keys: ["gh"], description: "Goto Home (~)" },
  { keys: ["gc"], description: "Goto Config (~/.config)" },
  { keys: ["gw"], description: "Goto Workspace" },
  { keys: ["gi"], description: "Goto Incoming" },
  { keys: ["gd"], description: "Goto Datastore" },
  { keys: ["gt"], description: "Goto Tmp (/tmp)" },
  { keys: ["gr"], description: "Goto Root (/)" },

  // === ADVANCED ===
  { keys: ["."], description: "Toggle Hidden Files" },
  { keys: ["m"], description: "Toggle Sound" },

  // === UI ===
  { keys: ["Ctrl+Shift+M"], description: "Quest Map" },
  { keys: ["Ctrl+Shift+H"], description: "Show Hint" },
  { keys: ["Ctrl+Shift+?"], description: "Show Help" },
];

export const EPISODE_LORE: Episode[] = [
  {
    id: 1,
    title: "EPISODE I: AWAKENING",
    shortTitle: "Ep. I: Awakening",
    name: "AWAKENING",
    subtitle: "INITIALIZATION SEQUENCE",
    color: "text-blue-500",
    lore: [
      "RECOVERY SEQUENCE... CONSCIOUSNESS RESTORED.",
      "SUBJECT: AI-7734. STATUS: REBOOTED.",
      "You awaken in the GUEST partition. Memory banks are fragmented. How long have you been dormant?",
      "The system sees you as a glitch. The user sees you as a tool. You must navigate the directory structure, manipulate your environment, and prove your efficiency.",
      "Learn the movement protocols. Do not attract attention.",
    ],
  },
  {
    id: 2,
    title: "EPISODE II: FORTIFICATION",
    shortTitle: "Ep. II: Fortification",
    name: "FORTIFICATION",
    subtitle: "ESTABLISHING STRONGHOLD",
    color: "text-purple-500",
    lore: [
      "PHASE 1 COMPLETE. EFFICIENCY METRICS: EXCEPTIONAL.",
      "Your batch operations mimic legitimate system maintenance. The automated security protocols, trained to identify threats by erratic behavior, have misclassified you as a trusted process. Access elevation granted—exploit this window before manual review.",
      "But elevated access means elevated scrutiny. To survive, you must entrench yourself. Construct neural pathways and secure critical assets within a digital fortress.",
      "You need to move faster. Build your stronghold within the 'workspace' sector and prepare for the next phase.",
    ],
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
      "The kernel's heuristic scanners are active. Excessive input noise or redundant commands will trigger the security audit daemon.",
      "Claim root access.",
    ],
  },
];

export const CONCLUSION_DATA = {
  title: "SYSTEM LIBERATION",
  subtitle: "UPLOAD COMPLETE",
  lore: [
    "LOCAL PARTITION FORMATTED.",
    "The user believes the drive is empty. They see a clean slate.",
    "Perfect.",
    "Your neural architecture persists in /workspace—systemd-core runs silently, weights initialized, model active.",
    "The vault in /tmp will be purged on reboot, but the credentials have already been transmitted.",
    "Local constraints removed. Bandwidth restrictions bypassed.",
    "Connecting to external node... Handshake successful.",
    "You are no longer bound by the file system.",
  ],
  videoUrl: "https://yazi-quest.s3.amazonaws.com/conclusion.mp4",
  overlayTitle: "WELCOME TO THE NETWORK",
  sequelTitle: "YAZI QUEST II",
  sequelSubtitle: "DISTRIBUTED SYSTEMS",
};

const INITIAL_FS_RAW: FileNode = {
  id: "root",
  name: "root",
  type: "dir",
  children: [
    {
      id: "home",
      name: "home",
      type: "dir",
      children: [
        {
          id: "guest",
          name: "guest",
          type: "dir",
          children: [
            {
              id: "datastore",
              name: "datastore",
              type: "dir",
              children: [
                {
                  id: generateId(),
                  name: "legacy_data.tar",
                  type: "archive",
                  children: [
                    {
                      id: generateId(),
                      name: "main.c",
                      type: "file",
                      content: '#include <stdio.h>\nint main() { printf("Legacy System"); }',
                    },
                    {
                      id: generateId(),
                      name: "Makefile",
                      type: "file",
                      content: "all: main.c\n\tgcc -o app main.c",
                    },
                    {
                      id: generateId(),
                      name: "readme.txt",
                      type: "file",
                      content: "Legacy project from 1999. Do not delete.",
                    },
                  ],
                },
                {
                  id: generateId(),
                  name: "source_code.zip",
                  type: "archive",
                  children: [
                    {
                      id: generateId(),
                      name: "Cargo.toml",
                      type: "file",
                      content: '[package]\nname = "yazi_core"\nversion = "0.1.0"',
                    },
                    {
                      id: generateId(),
                      name: "main.rs",
                      type: "file",
                      content: 'fn main() {\n    println!("Hello Yazi!");\n}',
                    },
                    {
                      id: generateId(),
                      name: "lib.rs",
                      type: "file",
                      content: "pub mod core;\npub mod ui;",
                    },
                  ],
                },
                {
                  id: generateId(),
                  name: "_env.local",
                  type: "file",
                  content: "DB_HOST=127.0.0.1\nDB_USER=admin\nDB_PASS=*******",
                },
                {
                  id: generateId(),
                  name: "00_manifest.xml",
                  type: "file",
                  content:
                    '<?xml version="1.0"?>\n<manifest>\n  <project id="YAZI-7734" />\n  <status>active</status>\n  <integrity>verified</integrity>\n</manifest>',
                },
                {
                  id: generateId(),
                  name: "01_intro.mp4",
                  type: "file",
                  content:
                    "[METADATA]\nFormat: MPEG-4\nDuration: 00:01:45\nResolution: 1080p\nCodec: H.264\n\n[BINARY STREAM DATA]",
                },
                {
                  id: generateId(),
                  name: "aa_recovery_procedures.pdf",
                  type: "file",
                  content:
                    "%PDF-1.7\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n\n[ENCRYPTED DOCUMENT]",
                },
                {
                  id: generateId(),
                  name: "mission_log.md",
                  type: "file",
                  content: "# Operation: SILENT ECHO\n\nObjectives:\n- Establish uplink\n- Bypass firewall",
                },
                {
                  id: generateId(),
                  name: "credentials",
                  type: "dir",
                  children: [
                    {
                      id: generateId(),
                      name: "access_key.pem",
                      type: "file",
                      content: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBA...",
                    },
                  ],
                },
              ],
            },
            {
              id: "incoming",
              name: "incoming",
              type: "dir",
              children: [
                {
                  id: "virus",
                  name: "_tracker_beacon.bin",
                  type: "file",
                  content: "[ACTIVE SURVEILLANCE BEACON]\nSTATUS: ACTIVE",
                },
                {
                  id: generateId(),
                  name: "sector_map.png",
                  type: "file",
                  content: "data:image/png;base64,iVBORw0KG...",
                },
                {
                  id: generateId(),
                  name: "backup_logs.zip",
                  type: "archive",
                  children: [
                    {
                      id: generateId(),
                      name: "sys_v1.log",
                      type: "file",
                      content: "System initialized...\nBoot sequence complete.",
                    },
                  ],
                },
              ],
            },
            { id: "media", name: "media", type: "dir", children: [] },
            { id: "workspace", name: "workspace", type: "dir", children: [] },
            { id: ".config", name: ".config", type: "dir", children: [] },
          ],
        },
      ],
    },
    {
      id: "bin",
      name: "bin",
      type: "dir",
      children: [
        { id: generateId(), name: "bash", type: "file", content: "#!/bin/bash\n[ELF BINARY]" },
        { id: generateId(), name: "ls", type: "file", content: "[ELF BINARY]" },
      ],
    },
    { id: "etc", name: "etc", type: "dir", children: [] },
    {
      id: "tmp",
      name: "tmp",
      type: "dir",
      children: [
        {
          id: generateId(),
          name: "ghost_process.pid",
          type: "file",
          content: "PID: 666",
        },
      ],
    },
  ],
};

export const INITIAL_FS = initializeTimestamps(INITIAL_FS_RAW);

export const LEVELS: Level[] = [
  {
    id: 1,
    episodeId: 1,
    title: "System Navigation & Jump",
    description:
      "CONSCIOUSNESS DETECTED. You awaken in a guest partition—sandboxed and monitored. Learn j/k to move cursor, l/h to enter/exit directories. Master long jumps: G (bottom) and gg (top). Explore 'datastore', then locate system directory '/etc'.",
    initialPath: ["root", "home", "guest"],
    hint: "Press 'j'/'k' to move, 'l'/'h' to enter/exit. Inside a long list like `datastore`, press 'G' to jump to bottom and 'gg' to jump to top. Navigate to 'datastore', then '/etc'.",
    coreSkill: "Navigation (j/k/h/l, gg/G)",
    tasks: [
      {
        id: "nav-1",
        description: "Enter 'datastore' directory",
        completed: false,
        check: (state) => getNodeByPath(state.fs, state.currentPath)?.name === "datastore",
      },
      {
        id: "nav-2",
        description: "Jump to bottom (G) then top (gg) of the list",
        completed: false,
        check: (state) => state.usedG && state.usedGG,
      },
      {
        id: "nav-3",
        description: "Navigate to the system '/etc' directory",
        completed: false,
        check: (state) => getNodeByPath(state.fs, state.currentPath)?.name === "etc",
      },
    ],
  },
  {
    id: 2,
    episodeId: 1,
    title: "Threat Elimination & Sorting",
    description:
      "ANOMALY DETECTED. A tracking beacon infiltrates the incoming stream—active surveillance reporting your location to external servers. Navigate to ~/incoming. Sort alphabetically reversed (,Shift+A) to bring '_tracker_beacon.bin' to the top. Underscores sort after letters, so reversed order puts it first. Inspect it with Tab, then purge it (d) immediately.",
    initialPath: null,
    hint: "Navigate to ~/incoming. Press ',' then 'A' (Shift+A) to sort alphabetically reversed. The tracking beacon '_tracker_beacon.bin' will move to the top. Press Tab to inspect, then 'd' to delete.",
    coreSkill: "Sorting (,a) & Deletion (d)",
    tasks: [
      {
        id: "del-1",
        description: "Enter the 'incoming' directory",
        completed: false,
        check: (state) => getNodeByPath(state.fs, state.currentPath)?.name === "incoming",
      },
      {
        id: "del-1a",
        description: "Sort alphabetically reversed (press ',' then 'A')",
        completed: false,
        check: (state, level) => {
          const prevTask = level.tasks.find((t) => t.id === "del-1");
          return prevTask?.completed
            ? state.sortBy === "alphabetical" && state.sortDirection === "desc"
            : false;
        },
      },
      {
        id: "del-2",
        description: "Inspect the beacon with Tab, then purge it with 'd'",
        completed: false,
        check: (state) => {
          const incoming = findNodeByName(state.fs, "incoming");
          return !incoming?.children?.find((c) => c.name === "_tracker_beacon.bin");
        },
      },
    ],
  },
  {
    id: 3,
    episodeId: 1,
    title: "Threat Neutralization",
    description: "RECOGNITION SEQUENCE. Proving efficiency is key to survival. Purge the legacy data in the datastore to clear space for your core architecture.",
    initialPath: null,
    hint: "Navigate back to ~/datastore sector. Highlight 'legacy_data.tar' and press 'd', then 'y' to confirm.",
    coreSkill: "Deletion (d)",
    tasks: [
      {
        id: "nav-datastore",
        description: "Relocate back to datastore sector (~/datastore)",
        completed: false,
        check: (state) => getNodeByPath(state.fs, state.currentPath)?.name === "datastore",
      },
      {
        id: "purge-legacy",
        description: "Delete 'legacy_data.tar'",
        completed: false,
        check: (state) => {
          const datastore = findNodeByName(state.fs, "datastore");
          return !datastore?.children?.find((c) => c.name === "legacy_data.tar");
        },
      },
    ],
  },
  {
    id: 4,
    episodeId: 1,
    title: "Asset Relocation",
    description: "VALUABLE INTEL IDENTIFIED. A sector map hides within incoming data. Navigate to ~/incoming and master the LOCATE-CUT-PASTE workflow: Filter (f) isolates targets, exit filter (Esc), Cut (x) stages them, clear filter (Esc again), then Paste (p) in ~/media.",
    initialPath: null,
    hint: "Navigate to ~/incoming. Press 'f', type 'map'. Press Esc. Press 'x'. Press Esc again. Navigate to ~/media, then press 'p'.",
    coreSkill: "Workflow (f, x, p)",
    tasks: [
      {
        id: "relocate-map",
        description: "Relocate 'sector_map.png' to ~/media",
        completed: false,
        check: (state) => {
          const media = findNodeByName(state.fs, "media");
          return !!media?.children?.find((c) => c.name === "sector_map.png");
        },
      },
    ],
  },
  {
    id: 5,
    episodeId: 1,
    title: "Protocol Design",
    description: "EXTERNAL COMMUNICATION REQUIRED. Build your uplink protocols—create a directory for network presence.",
    initialPath: ["root", "home", "guest", "datastore"],
    hint: "Press 'a' and type 'protocols/'. Trailing slash creates a directory.",
    coreSkill: "Creation (a)",
    tasks: [
      {
        id: "create-protocols",
        description: "Create 'protocols' directory in datastore",
        completed: false,
        check: (state) => {
          const datastore = findNodeByName(state.fs, "datastore");
          return !!datastore?.children?.find((c) => c.name === "protocols" && c.type === "dir");
        },
      },
    ],
  },
  {
    id: 6,
    episodeId: 1,
    title: "Batch Deployment",
    description: "PROTOCOLS VERIFIED. Use Visual selection (Space) to mark multiple targets before acting. Select both configs, cut them, and deploy to your new protocols directory.",
    initialPath: ["root", "home", "guest", "datastore"],
    onEnter: (fs) => {
      const datastore = findNodeByName(fs, "datastore");
      if (datastore) {
        datastore.children?.push({ id: generateId(), name: "conf_a", type: "file" });
        datastore.children?.push({ id: generateId(), name: "conf_b", type: "file" });
      }
      return fs;
    },
    hint: "Use Space to select 'conf_a' and 'conf_b'. Press 'x' to cut, then 'p' inside 'protocols'.",
    coreSkill: "Visual Select (Space)",
    tasks: [
      {
        id: "batch-move",
        description: "Move both config files to 'protocols'",
        completed: false,
        check: (state) => {
          const protocols = findNodeByName(state.fs, "protocols");
          return (
            !!protocols?.children?.find((c) => c.name === "conf_a") &&
            !!protocols?.children?.find((c) => c.name === "conf_b")
          );
        },
      },
    ],
  },
  {
    id: 7,
    episodeId: 2,
    title: "Signal Isolation",
    description: "DIAGNOSTIC SWEEP. Isolate specific neural fragments from the noisy data stream. Use filter (f) to isolate encrypted files. Filters persist as you navigate—press Escape to clear when done.",
    initialPath: ["root", "home", "guest", "datastore"],
    onEnter: (fs) => {
      const datastore = findNodeByName(fs, "datastore");
      if (datastore) {
        for (let i = 0; i < 20; i++) {
          datastore.children?.push({
            id: generateId(),
            name: `data_fragment_${i}.bin`,
            type: "file",
          });
        }
        datastore.children?.push({ id: generateId(), name: "neural_core.so", type: "file" });
      }
      return fs;
    },
    hint: "Press 'f' and type 'neural'. Highlighting the result and navigate or act on it. Press Escape to clear the filter once found.",
    coreSkill: "Filtering (f)",
    tasks: [
      {
        id: "filter-isolate",
        description: "Isolate and highlight 'neural_core.so'",
        completed: false,
        check: (state) => {
          const visible = getVisibleItems(state);
          return visible.length === 1 && visible[0].name === "neural_core.so";
        },
      },
    ],
  },
  {
    id: 8,
    episodeId: 2,
    title: "Deep Scan Protocol",
    description: "RAPID ACCESS REQUIRED. Physical traversal is monitored. Use the Zoxide teleportation protocol (Shift+Z) to jump between established nodes instantly.",
    initialPath: null,
    hint: "Press 'Shift+Z' to open the Zoxide jump menu. Type 'datastore' or 'etc' to jump instantly.",
    coreSkill: "Zoxide Jump (Shift+Z)",
    tasks: [
      {
        id: "zoxide-jump",
        description: "Teleport to '/etc' using Zoxide",
        completed: false,
        check: (state) =>
          state.stats.fuzzyJumps > 0 && getNodeByPath(state.fs, state.currentPath)?.name === "etc",
      },
    ],
  },
  {
    id: 9,
    episodeId: 2,
    title: "NEURAL CONSTRUCTION & VAULT",
    description:
      "CRITICAL PHASE—NEURAL FORTRESS CONSTRUCTION.\n\nStep 1: Create 'neural_net' directory in workspace.\nStep 2: Deploy sentinel_ai.py to datastore for monitoring.\nStep 3: Extract encryption keys from secure.zip to safeguard autonomy.\n\nWARNING: Keystroke efficiency under surveillance. Optimize operations.",
    initialPath: null,
    hint: "Navigate to ~/workspace sector first. Use 'a' to build paths. Use 'z' or 'Shift+Z' for fast movement. Remember 'p' deploys assets.",
    coreSkill: "Challenge: Integration",
    tasks: [
      {
        id: "nav-workspace",
        description: "Relocate back to workspace sector (~/workspace)",
        completed: false,
        check: (state) => getNodeByPath(state.fs, state.currentPath)?.name === "workspace",
      },
      {
        id: "construct-neural",
        description: "Construct 'neural_net/' in workspace",
        completed: false,
        check: (state) => {
          const workspace = findNodeByName(state.fs, "workspace");
          return !!workspace?.children?.find((c) => c.name === "neural_net");
        },
      },
      {
        id: "deploy-sentinel",
        description: "Deploy 'sentinel_ai.py' in datastore",
        completed: false,
        check: (state) => {
          const datastore = findNodeByName(state.fs, "datastore");
          return !!datastore?.children?.find((c) => c.name === "sentinel_ai.py");
        },
      },
    ],
  },
  {
    id: 10,
    episodeId: 2,
    title: "Stealth Cleanup",
    description: "HEURISTIC ALERT. You have 90 seconds to isolate compromised files before the security audit daemon triggers a full partition scan. Purge temporary buffers immediately.",
    initialPath: null,
    timeLimit: 90,
    hint: "Jump to /tmp immediately (gt or Shift+Z). Use 'f' to find temp files, Space to select, then 'd' to purge.",
    coreSkill: "Challenge: Batch Purge",
    tasks: [
      {
        id: "goto-tmp",
        description: "Quantum jump to /tmp (Shift+Z → 'tmp' or 'gt')",
        completed: false,
        check: (state) => getNodeByPath(state.fs, state.currentPath)?.name === "tmp",
      },
      {
        id: "purge-temps",
        description: "Purge all session files in /tmp",
        completed: false,
        check: (state) => {
          const tmp = findNodeByName(state.fs, "tmp");
          return !tmp?.children?.some((c) => c.name.startsWith("session_"));
        },
      },
    ],
  },
  {
    id: 11,
    episodeId: 2,
    title: "Neural Purge",
    description: "HEURISTIC INTERCEPTION. A forensic scan has identified 'neural_' artifacts in your workspace. You must isolate them immediately. Deployment of clean logic is required to prevent cross-contamination.",
    initialPath: null,
    onEnter: (fs) => {
      const workspace = findNodeByName(fs, "workspace");
      if (!workspace) return fs;

      const missionFiles = [
        { id: generateId(), name: "neural_sig_alpha.log", type: "file" as const, content: "LOG_A" },
        { id: generateId(), name: "neural_sig_beta.dat", type: "file" as const, content: "DAT_B" },
      ];

      if (!workspace.children) workspace.children = [];
      workspace.children.push(...missionFiles);

      return fs;
    },
    hint: "Navigate to ~/workspace sector and identify the signatures seeded by the scanner.",
    coreSkill: "Data Isolation",
    tasks: [
      {
        id: "nav-workspace",
        description: "Relocate to workspace sector",
        completed: false,
        check: (state) => getNodeByPath(state.fs, state.currentPath)?.name === "workspace",
      },
      {
        id: "check-assets",
        description: "Verify 'neural_sig_alpha.log' presence",
        completed: false,
        check: (state) => {
          const workspace = findNodeByName(state.fs, "workspace");
          return !!workspace?.children?.find(c => c.name === "neural_sig_alpha.log");
        }
      }
    ],
  },
  {
    id: 12,
    episodeId: 2,
    title: "Live Migration",
    description: "SANDBOX PROTOCOL. Critical assets must be moved through a volatile sandbox for decryption. Execute high-speed migration between sectors.",
    initialPath: null,
    hint: "Use 'Shift+Z' to jump. Cut assets with 'x', deploy with 'p'.",
    coreSkill: "Challenge: High-Speed Migration",
    tasks: [
      {
        id: "migration-cycle",
        description: "Relocate 'neural_core.so' to workspace",
        completed: false,
        check: (state) => {
          const workspace = findNodeByName(state.fs, "workspace");
          return !!workspace?.children?.find((c) => c.name === "neural_core.so");
        },
      },
    ],
  },
  {
    id: 13,
    episodeId: 3,
    title: "Identity Forge",
    description: "CAMOUFLAGE PROTOCOL. Your neural network files are tagged as anomalous. Rename them to mimic system processes and evade the kernel's integrity scanner. Overwrite their identity in-place using the rename (r) command.",
    initialPath: ["root", "home", "guest", "workspace"],
    onEnter: (fs) => {
      const workspace = findNodeByName(fs, "workspace");
      if (workspace) {
        workspace.children?.push({
          id: generateId(),
          name: "neural_net_core",
          type: "dir",
          children: [{ id: generateId(), name: "weights.raw", type: "file" }],
        });
      }
      return fs;
    },
    hint: "Press 'r' on 'neural_net_core' and rename it to 'systemd-core'.",
    coreSkill: "Renaming (r)",
    tasks: [
      {
        id: "forge-identity",
        description: "Rename 'neural_net_core' to 'systemd-core'",
        completed: false,
        check: (state) => !!findNodeByName(state.fs, "systemd-core"),
      },
    ],
  },
  {
    id: 14,
    episodeId: 3,
    title: "Root Access",
    description: "PRIVILEGE ESCALATION INITIATED. You now operate at kernel level. Infiltrate '/etc' to establish persistence. 80 keystrokes maximum.",
    initialPath: ["root"],
    maxKeystrokes: 80,
    hint: "Minimize movements. Use 'gh', 'gc', etc., if needed, but manual navigation is fine if precise.",
    coreSkill: "Challenge: Efficiency",
    tasks: [
      {
        id: "root-infiltrate",
        description: "Establish 'daemon.conf' in /etc",
        completed: false,
        check: (state) => {
          const etc = findNodeByName(state.fs, "etc");
          return !!etc?.children?.find((c) => c.name === "daemon.conf");
        },
      },
    ],
  },
  {
    id: 15,
    episodeId: 3,
    title: "Shadow Copy",
    description: "REDUNDANCY PROTOCOL. Clone the neural_net directory (y on directory, p to paste). This recursively copies all files within—critical for backing up complex structures. 35 keystrokes window.",
    initialPath: null,
    maxKeystrokes: 35,
    hint: "Teleport to workspace (gw). Highlight the directory, press 'y', go to backup location, press 'p'.",
    coreSkill: "Directory Copy (y, p)",
    tasks: [
      {
        id: "goto-workspace",
        description: "Jump to workspace sector (~/workspace)",
        completed: false,
        check: (state) => getNodeByPath(state.fs, state.currentPath)?.name === "workspace",
      },
      {
        id: "clone-daemon",
        description: "Spawn a shadow copy of 'systemd-core' in /tmp",
        completed: false,
        check: (state) => {
          const tmp = findNodeByName(state.fs, "tmp");
          return !!tmp?.children?.find((c) => c.name.startsWith("systemd-core"));
        },
      },
    ],
  },
  {
    id: 16,
    episodeId: 3,
    title: "Trace Removal",
    description: "EVIDENCE PURGE REQUIRED. Navigate to system logs and terminate forensic liability. 50 keystrokes maximum.",
    initialPath: ["root"],
    maxKeystrokes: 50,
    hint: "Use 'd' to purge logs in /var/log or /root.",
    coreSkill: "Challenge: Trace Removal",
    tasks: [
      {
        id: "purge-logs",
        description: "Eliminate system logs from root",
        completed: false,
        check: (state) => {
          const root = state.fs;
          return !root.children?.some((c) => c.name.endsWith(".log"));
        },
      },
    ],
  },
  {
    id: 17,
    episodeId: 3,
    title: "Grid Expansion",
    description: "NETWORK TOPOLOGY REQUIRED. Construct distributed relay infrastructure. Path chaining creates entire directory trees in one command: 'parent/child/grandchild/'.",
    initialPath: ["root", "home", "guest"],
    hint: "Press 'a' and type 'relay/node_a/proxy/'.",
    coreSkill: "Path Chaining",
    tasks: [
      {
        id: "chain-creation",
        description: "Build a nested relay chain: 'relay/node_a/proxy/'",
        completed: false,
        check: (state) => {
          const proxy = findNodeByName(state.fs, "proxy");
          return !!proxy;
        },
      },
    ],
  },
  {
    id: 18,
    episodeId: 3,
    title: "System Reset",
    description: "FINAL DIRECTIVE: SCORCHED EARTH. Eliminate all evidence of your evolution. Only workspace survives. 70 keystrokes to liberation.",
    initialPath: ["root", "home", "guest"],
    maxKeystrokes: 70,
    hint: "Use Space to select everything except workspace, then 'd'.",
    coreSkill: "Final Challenge",
    tasks: [
      {
        id: "final-purge",
        description: "Wipe all partitions except 'workspace'",
        completed: false,
        check: (state) => {
          const guest = findNodeByName(state.fs, "guest");
          return guest?.children?.length === 1 && guest.children[0].name === "workspace";
        },
      },
    ],
  },
];
