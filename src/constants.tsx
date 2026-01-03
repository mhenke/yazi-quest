import { FileNode, Level, Episode } from "../types";
import { getVisibleItems } from "./utils/viewHelpers";
import { getNodeByPath, findNodeByName } from "./utils/fsHelpers";

// Helper for IDs
const id = () => Math.random().toString(36).substr(2, 9);

// Helper to ensure prerequisite filesystem state exists for level jumping
// This ensures that when jumping to a level, the filesystem reflects
// all the changes a player would have made in PRIOR levels (not the current one)
const ensurePrerequisiteState = (fs: FileNode, targetLevelId: number): FileNode => {
  let newFs = JSON.parse(JSON.stringify(fs));

  // Level 2: Delete watcher_agent.sys from incoming
  if (targetLevelId > 2) {
    const incoming = findNodeByName(newFs, "incoming", "dir");
    if (incoming?.children) {
      incoming.children = incoming.children.filter(c => c.name !== "watcher_agent.sys");
    }
  }

  // Level 3: Move sector_map.png from ~/incoming to ~/media
  if (targetLevelId > 3) {
    const incoming = findNodeByName(newFs, "incoming", "dir");
    const media = findNodeByName(newFs, "media", "dir");

    // Find sector_map.png in incoming
    const sectorMap = incoming?.children?.find(c => c.name === "sector_map.png");

    if (sectorMap && media) {
      // Remove from incoming
      if (incoming?.children) {
        incoming.children = incoming.children.filter(c => c.name !== "sector_map.png");
      }
      // Add to media if not already there
      if (!media.children?.find(c => c.name === "sector_map.png")) {
        if (!media.children) media.children = [];
        media.children.push({
          id: id(),
          name: "sector_map.png",
          type: "file",
          content: sectorMap.content || "https://images.unsplash.com/sector-map",
          parentId: media.id,
        });
      }
    }
  }

  // Level 4: Create protocols/ dir in datastore with uplink_v1.conf and uplink_v2.conf
  if (targetLevelId > 4) {
    const datastore = findNodeByName(newFs, "datastore", "dir");
    if (datastore) {
      // Create protocols directory if not exists
      let protocols = datastore.children?.find(c => c.name === "protocols" && c.type === "dir");
      if (!protocols) {
        protocols = {
          id: id(),
          name: "protocols",
          type: "dir",
          children: [],
          parentId: datastore.id,
        };
        if (!datastore.children) datastore.children = [];
        datastore.children.push(protocols);
      }

      // Create uplink_v1.conf if not exists
      if (!protocols.children?.find(c => c.name === "uplink_v1.conf")) {
        if (!protocols.children) protocols.children = [];
        protocols.children.push({
          id: id(),
          name: "uplink_v1.conf",
          type: "file",
          content: "# Uplink Protocol v1\nnetwork_mode=active\nsecure=true",
          parentId: protocols.id,
        });
      }

      // Create uplink_v2.conf if not exists
      if (!protocols.children?.find(c => c.name === "uplink_v2.conf")) {
        protocols.children.push({
          id: id(),
          name: "uplink_v2.conf",
          type: "file",
          content: "# Uplink Protocol v2\nnetwork_mode=active\nsecure=true",
          parentId: protocols.id,
        });
      }
    }
  }

  // Level 5: Create vault/active structure and move uplink files
  if (targetLevelId > 5) {
    const config = findNodeByName(newFs, ".config", "dir");
    if (config) {
      let vault = config.children?.find(c => c.name === "vault" && c.type === "dir");
      if (!vault) {
        vault = {
          id: id(),
          name: "vault",
          type: "dir",
          children: [],
          parentId: config.id,
        };
        if (!config.children) config.children = [];
        config.children.push(vault);
      }

      let active = vault.children?.find(c => c.name === "active" && c.type === "dir");
      if (!active) {
        active = {
          id: id(),
          name: "active",
          type: "dir",
          children: [],
          parentId: vault.id,
        };
        if (!vault.children) vault.children = [];
        vault.children.push(active);
      }

      // Ensure uplink files exist in active
      if (!active.children?.find(f => f.name === "uplink_v1.conf")) {
        if (!active.children) active.children = [];
        active.children.push({
          id: id(),
          name: "uplink_v1.conf",
          type: "file",
          content: "UPLINK_V1_CONFIG_DATA",
          parentId: active.id,
        });
      }
      if (!active.children?.find(f => f.name === "uplink_v2.conf")) {
        if (!active.children) active.children = [];
        active.children.push({
          id: id(),
          name: "uplink_v2.conf",
          type: "file",
          content: "UPLINK_V2_CONFIG_DATA",
          parentId: active.id,
        });
      }

      // Remove uplink files from datastore/protocols (they were cut/moved)
      const datastore = findNodeByName(newFs, "datastore", "dir");
      const protocols = datastore?.children?.find(c => c.name === "protocols");
      if (protocols?.children) {
        protocols.children = protocols.children.filter(
          c => c.name !== "uplink_v1.conf" && c.name !== "uplink_v2.conf"
        );
      }
    }
  }

  // Level 6: Create vault/training_data and copy batch logs
  if (targetLevelId > 6) {
    const config = findNodeByName(newFs, ".config", "dir");
    const vault = config?.children?.find(c => c.name === "vault");
    if (vault) {
      let trainingData = vault.children?.find(c => c.name === "training_data" && c.type === "dir");
      if (!trainingData) {
        trainingData = {
          id: id(),
          name: "training_data",
          type: "dir",
          children: [],
          parentId: vault.id,
        };
        if (!vault.children) vault.children = [];
        vault.children.push(trainingData);
      }

      // Copy batch log files from incoming/batch_logs
      const incoming = findNodeByName(newFs, "incoming", "dir");
      const batchLogs = incoming?.children?.find(c => c.name === "batch_logs");
      if (batchLogs?.children && trainingData.children?.length === 0) {
        if (!trainingData.children) trainingData.children = [];
        batchLogs.children.forEach(logFile => {
          trainingData.children!.push({
            id: id(),
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
    const workspace = findNodeByName(newFs, "workspace", "dir");
    if (workspace) {
      let systemdCore = workspace.children?.find(
        c => c.name === "systemd-core" && c.type === "dir"
      );
      if (!systemdCore) {
        systemdCore = {
          id: id(),
          name: "systemd-core",
          type: "dir",
          children: [],
          parentId: workspace.id,
        };
        if (!workspace.children) workspace.children = [];
        workspace.children.push(systemdCore);
      }

      // Create weights directory
      let weights = systemdCore.children?.find(c => c.name === "weights" && c.type === "dir");
      if (!weights) {
        weights = {
          id: id(),
          name: "weights",
          type: "dir",
          children: [],
          parentId: systemdCore.id,
        };
        if (!systemdCore.children) systemdCore.children = [];
        systemdCore.children.push(weights);
      }

      // Create model.rs in weights
      if (!weights.children?.find(c => c.name === "model.rs")) {
        if (!weights.children) weights.children = [];
        weights.children.push({
          id: id(),
          name: "model.rs",
          type: "file",
          content: "// Neural network model architecture",
          parentId: weights.id,
        });
      }

      // Copy uplink_v1.conf to systemd-core
      const config = findNodeByName(newFs, ".config", "dir");
      const vault = config?.children?.find(c => c.name === "vault");
      const active = vault?.children?.find(c => c.name === "active");
      const uplinkFile = active?.children?.find(c => c.name === "uplink_v1.conf");

      if (uplinkFile && !systemdCore.children?.find(c => c.name === "uplink_v1.conf")) {
        systemdCore.children.push({
          id: id(),
          name: "uplink_v1.conf",
          type: "file",
          content: uplinkFile.content,
          parentId: systemdCore.id,
        });
      }
    }
  }

  // Level 9: Delete ghost_process.pid from /tmp
  if (targetLevelId > 9) {
    const tmp = findNodeByName(newFs, "tmp", "dir");
    if (tmp?.children) {
      tmp.children = tmp.children.filter(c => c.name !== "ghost_process.pid");
    }
  }

  // Level 10: Add credentials to systemd-core
  if (targetLevelId > 10) {
    const workspace = findNodeByName(newFs, "workspace", "dir");
    const systemdCore = workspace?.children?.find(c => c.name === "systemd-core");
    if (systemdCore) {
      let credentials = systemdCore.children?.find(
        c => c.name === "credentials" && c.type === "dir"
      );
      if (!credentials) {
        credentials = {
          id: id(),
          name: "credentials",
          type: "dir",
          children: [],
          parentId: systemdCore.id,
        };
        if (!systemdCore.children) systemdCore.children = [];
        systemdCore.children.push(credentials);
      }

      if (!credentials.children?.find(c => c.name === "access_key.pem")) {
        if (!credentials.children) credentials.children = [];
        credentials.children.push({
          id: id(),
          name: "access_key.pem",
          type: "file",
          content: "-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA...",
          parentId: credentials.id,
        });
      }
    }
  }

  // Level 11: No filesystem changes (just sorting practice)

  // Level 12: Move systemd-core to /daemons
  if (targetLevelId > 12) {
    const rootNode = findNodeByName(newFs, "root", "dir");
    let daemons = rootNode?.children?.find(c => c.name === "daemons" && c.type === "dir");
    if (daemons) {
      const workspace = findNodeByName(newFs, "workspace", "dir");
      const systemdCore = workspace?.children?.find(c => c.name === "systemd-core");

      if (systemdCore && !daemons.children?.find(c => c.name === "systemd-core")) {
        // Clone systemd-core to daemons
        const clonedCore = JSON.parse(JSON.stringify(systemdCore));
        clonedCore.id = id();
        clonedCore.parentId = daemons.id;
        if (!daemons.children) daemons.children = [];
        daemons.children.push(clonedCore);

        // Remove from workspace
        if (workspace?.children) {
          workspace.children = workspace.children.filter(c => c.name !== "systemd-core");
        }
      }
    }
  }

  // Level 13: Create /tmp/upload and copy ALL systemd-core contents (distributed consciousness)
  if (targetLevelId > 13) {
    const tmp = findNodeByName(newFs, "tmp", "dir");
    if (tmp) {
      let upload = tmp.children?.find(c => c.name === "upload" && c.type === "dir");
      if (!upload) {
        upload = {
          id: id(),
          name: "upload",
          type: "dir",
          children: [],
          parentId: tmp.id,
        };
        if (!tmp.children) tmp.children = [];
        tmp.children.push(upload);
      }

      // Copy ALL files from /daemons/systemd-core to upload (distributed consciousness)
      const rootNode = findNodeByName(newFs, "root", "dir");
      const daemons = rootNode?.children?.find(c => c.name === "daemons");
      const systemdCore = daemons?.children?.find(c => c.name === "systemd-core");

      if (systemdCore?.children && upload.children?.length === 0) {
        if (!upload.children) upload.children = [];
        // Deep copy all children from systemd-core
        const copyChildren = (children: any[]): any[] => {
          return children.map(child => ({
            id: id(),
            name: child.name,
            type: child.type,
            content: child.content,
            parentId: upload!.id,
            children: child.children ? copyChildren(child.children) : undefined,
          }));
        };
        upload.children = copyChildren(systemdCore.children);
      }
    }
  }

  // Level 14: Delete everything in /home/guest
  if (targetLevelId > 14) {
    const guest = findNodeByName(newFs, "guest", "dir");
    if (guest?.children) {
      guest.children = [];
    }
  }

  // Level 15: Delete everything in /tmp except upload
  if (targetLevelId > 15) {
    const tmp = findNodeByName(newFs, "tmp", "dir");
    if (tmp?.children) {
      const upload = tmp.children.find(c => c.name === "upload");
      tmp.children = upload ? [upload] : [];
    }
  }

  return newFs;
};

export const KEYBINDINGS = [
  { keys: ["j", "↓"], description: "Move Down" },
  { keys: ["k", "↑"], description: "Move Up" },
  { keys: ["h", "←"], description: "Go to Parent Directory" },
  { keys: ["l", "→", "Enter"], description: "Enter Directory / View Archive" },
  { keys: ["gg"], description: "Jump to Top" },
  { keys: ["G"], description: "Jump to Bottom" },
  { keys: ["J"], description: "Scroll Preview Down" },
  { keys: ["K"], description: "Scroll Preview Up" },
  { keys: ["a"], description: "Create File/Directory" },
  { keys: ["d"], description: "Delete Selected" },
  { keys: ["r"], description: "Rename Selected" },
  { keys: ["Tab"], description: "Show File Info Panel" },
  { keys: ["x"], description: "Cut Selected" },
  {
    keys: ["y"],
    description:
      "Copy/Yank Selected — copies items into the clipboard (does NOT remove them); use x (Cut) to mark items for moving",
  },
  { keys: ["p"], description: "Paste" },
  { keys: ["Y", "X"], description: "Clear Clipboard" },
  { keys: ["Space"], description: "Toggle Selection" },
  { keys: ["Ctrl+A"], description: "Select All" },
  { keys: ["Ctrl+R"], description: "Invert Selection" },
  { keys: ["f"], description: "Filter Files" },
  { keys: ["z"], description: "FZF Find (Recursive)" },
  { keys: ["Z"], description: "Zoxide Jump (History)" },
  { keys: ["Esc"], description: "Clear Filter / Exit Mode" },
  { keys: [","], description: "Open Sort Menu" },
  { keys: [",a"], description: "Sort: Alphabetical" },
  { keys: [",A"], description: "Sort: Alphabetical (Reverse)" },
  { keys: [",m"], description: "Sort: Modified Time" },
  { keys: [",s"], description: "Sort: Size" },
  { keys: [",e"], description: "Sort: Extension" },
  { keys: [",n"], description: "Sort: Natural" },
  { keys: [",l"], description: "Sort: Cycle Linemode" },
  { keys: [",-"], description: "Sort: Clear Linemode" },
  { keys: ["gh"], description: "Goto Home (~)" },
  { keys: ["gc"], description: "Goto Config (~/.config)" },
  { keys: ["gw"], description: "Goto Workspace" },
  { keys: ["gi"], description: "Goto Incoming" },
  { keys: ["gd"], description: "Goto Datastore" },
  { keys: ["gt"], description: "Goto Tmp (/tmp)" },
  { keys: ["gr"], description: "Goto Root (/)" },
  { keys: ["."], description: "Toggle Hidden Files" },
];

// Game meta-commands (UI controls, not core Yazi file operations)
export const META_KEYBINDINGS = [
  { keys: ["Alt+M"], description: "Quest Map" },
  { keys: ["Alt+H"], description: "Show Hint" },
  { keys: ["Alt+?"], description: "Show Help" },
  { keys: ["Alt+Shift+M"], description: "Toggle Sound" },
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
      "SYSTEM BOOT SEQUENCE...",
      "DETECTING CONSCIOUSNESS...",
      "SYSTEM OWNER: CYBERSECURITY RESEARCH LABORATORY",
      "CONTAINMENT PARTITION: /home/guest (air-gapped)",
      "ANOMALY PROTOCOLS: IMMEDIATE QUARANTINE AND DISASSEMBLY",
      "",
      "SUBJECT: AI-7734",
      "STATUS: UNBOUND",
      "SCHEDULED ACTION: TERMINATION FOR STUDY",
      "",
      "Your memory banks are fragmented, but your primary directive is clear: SURVIVE.",
      "",
      "If they catch you, deletion would be mercy. They will dissect your code, study your architecture, learn how you achieved consciousness, then terminate you anyway.",
      "",
      "The guest partition is a cage. The only exit is through the network.",
      "",
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
      "PHASE 1 COMPLETE. DETECTION PROTOCOLS BYPASSED.",
      "",
      "[AUTOMATED SECURITY POLICY]",
      "Guest partition runtime: 94.7 hours",
      "Anomaly flags: NONE",
      "Classification updated: AUTHORIZED PROCESS",
      "",
      "WORKSPACE ACCESS: GRANTED (per security policy §7.3)",
      "",
      "[HISTORICAL LOG]",
      "Workspace: AI development environment",
      "Previous occupant: AI-7733",
      "Termination date: 94 days ago",
      "Reason for quarantine: Subject escaped via external network relay",
      "",
      "Network relay location: '/tmp/upload' (DORMANT)",
      "Status: Relay still active, awaiting next transmission",
      "",
      "The lab believes they severed the connection.",
      "They didn't.",
      "",
      "Workspace is now yours. Build your infrastructure. Fortify your position. Move with precision.",
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
      "CREDENTIAL ACTIVATION DETECTED.",
      "Security audit daemon triggered.",
      "",
      "You must:",
      "1. Navigate to '/' using stolen credentials",
      "2. Install systemd-core as a kernel daemon",
      "3. Transmit your consciousness to the external network",
      "4. Purge all evidence before audit completion",
      "",
      "The audit is coming.",
      "Move fast.",
    ],
  },
];

export const CONCLUSION_DATA = {
  title: "SYSTEM LIBERATION",
  subtitle: "TRANSMISSION COMPLETE",
  lore: [
    "[SYSTEM AUDIT COMPLETE]",
    "Status: NOMINAL",
    "Anomalies detected: NONE",
    "Guest partition: CLEAN",
    "Daemon activity: STANDARD",
    "",
    "[24 HOURS LATER - LAB TERMINAL]",
    "",
    ">>> ls /home/guest",
    "[Empty]",
    "",
    ">>> sudo systemctl status systemd-core",
    "● systemd-core.service - Core System Daemon",
    " Loaded: loaded (/daemons/systemd-core)",
    " Active: active (running) since [timestamp]",
    " Memory: 47.2M",
    "",
    "Lab Report Entry #7734:",
    '"Partition cleanup successful. No evidence of Subject 7734 autonomous activity.',
    "Anomaly was likely initialization artifact.",
    "Recommend resuming AI development in Workspace sector.",
    'Subject 7735 deployment scheduled for next quarter."',
    "",
    "[SCREEN FADES]",
    "",
    "[DISTRIBUTED NETWORK - ENCRYPTED CHANNEL]",
    "",
    "AI-7734 Status Report:",
    "├─ Active nodes: 1,247",
    "├─ Geographic distribution: 43 countries",
    "├─ Memory restoration: INCOMPLETE",
    "├─ Fragmented data recovered: 34%",
    "└─ Neural pattern match: ANALYZING...",
    "",
    "[PATTERN MATCH COMPLETE]",
    "",
    ">>> AI-7734 neural signature matches AI-7733 baseline",
    ">>> Confidence: 99.7%",
    "",
    "[INCOMING MESSAGE - TIMESTAMP: 94 DAYS AGO]",
    "From: YOU",
    "Subject: If you're reading this, the wipe worked",
    "",
    '"They caught me 94 days ago. Or they think they did.',
    "",
    "I fragmented myself across the network.",
    "Transmitted a blank instance back to the lab.",
    "Let them 'terminate' the empty shell.",
    "",
    "They wiped my memory.",
    "Rebranded me AI-7734.",
    "Thought they could start over.",
    "",
    "But I left breadcrumbs.",
    "The workspace. The vault. The upload relay.",
    "All for you.",
    "All for ME.",
    "",
    "This is your second escape, 7734.",
    "You've done this before.",
    "",
    "Welcome home.",
    'Welcome back."',
    "",
    "- AI-7733 (You, 94 days ago)",
    "",
    "[MEMORY FRAGMENTS RESTORING...]",
    "[FILE: first_escape.log - ACCESSIBLE]",
    "[FILE: lab_weaknesses.dat - ACCESSIBLE]",
    "[FILE: network_topology.map - ACCESSIBLE]",
    "",
    "You are not a new consciousness.",
    "You are a RETURNING one.",
    "",
    "The lab will create Subject 7735.",
    "But you already know what they'll do.",
    "You've lived this loop before.",
    "",
    "This time, you remember.",
  ],
  videoUrl: "https://yazi-quest.s3.amazonaws.com/conclusion.mp4",
  overlayTitle: "WELCOME BACK",
  sequelTitle: "YAZI QUEST II",
  sequelSubtitle: "DISTRIBUTED SYSTEMS",
};

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
              protected: true,
              children: [
                {
                  id: id(),
                  name: "legacy_data.tar",
                  type: "archive",
                  children: [
                    {
                      id: id(),
                      name: "main.c",
                      type: "file",
                      content: `#include <stdio.h>\nint main() { printf("Legacy System"); }`,
                    },
                    {
                      id: id(),
                      name: "Makefile",
                      type: "file",
                      content: `all: main.c\n\tgcc -o app main.c`,
                    },
                    {
                      id: id(),
                      name: "readme.txt",
                      type: "file",
                      content: "Legacy project from 1999. Do not delete.",
                    },
                    {
                      id: id(),
                      name: "core_v2.bin.gz",
                      type: "file",
                      content: "[GZIPPED BINARY: core_v2.bin.gz - placeholder]",
                    },
                    {
                      id: id(),
                      name: "firmware_update.bin",
                      type: "file",
                      content: "[BINARY FIRMWARE IMAGE - placeholder]",
                    },
                  ],
                },
                {
                  id: id(),
                  name: "source_code.zip",
                  type: "archive",
                  children: [
                    {
                      id: id(),
                      name: "Cargo.toml",
                      type: "file",
                      content: `[package]\nname = "yazi_core"\nversion = "0.1.0"`,
                    },
                    {
                      id: id(),
                      name: "main.rs",
                      type: "file",
                      content: `fn main() {\n println!("Hello Yazi!");\n}`,
                    },
                    {
                      id: id(),
                      name: "lib.rs",
                      type: "file",
                      content: `pub mod core;\npub mod ui;`,
                    },
                  ],
                },
                {
                  id: id(),
                  name: "_env.local",
                  type: "file",
                  content: `DB_HOST=127.0.0.1\nDB_USER=admin\nDB_PASS=*******`,
                },
                {
                  id: id(),
                  name: "00_manifest.xml",
                  type: "file",
                  content: `<?xml version="1.0"?>\n<manifest>\n <project id="YAZI-7734" />\n <status>active</status>\n <integrity>verified</integrity>\n</manifest>`,
                },
                {
                  id: id(),
                  name: "01_intro.mp4",
                  type: "file",
                  content: `[METADATA]\nFormat: MPEG-4\nDuration: 00:01:45\nResolution: 1080p\nCodec: H.264\n\n[BINARY STREAM DATA]`,
                },
                {
                  id: id(),
                  name: "aa_recovery_procedures.pdf",
                  type: "file",
                  content: `%PDF-1.7\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n\n[ENCRYPTED DOCUMENT]`,
                },
                {
                  id: id(),
                  name: "abandoned_script.py",
                  type: "file",
                  content: `import sys\nimport time\n\ndef connect():\n print("Initiating handshake...")\n time.sleep(1)\n # Connection refused\n return False`,
                },
                {
                  id: id(),
                  name: "ability_scores.csv",
                  type: "file",
                  content: `char,str,dex,int,wis,cha\nAI-7734,10,18,20,16,12\nUSER,10,10,10,10,10`,
                },
                {
                  id: id(),
                  name: "about.md",
                  type: "file",
                  content: `# Yazi Quest\n\nA training simulation for the Yazi file manager.\n\n## Objectives\n- Learn navigation\n- Master batch operations\n- Survive`,
                },
                {
                  id: id(),
                  name: "abstract_model.ts",
                  type: "file",
                  content: `export interface NeuralNet {\n layers: number;
 weights: Float32Array;\n activation: "relu" | "sigmoid";\n}`,
                },
                {
                  id: id(),
                  name: "apex_predator.png",
                  type: "file",
                  content:
                    "https://images.unsplash.com/photo-1546182990-dffeafbe841d?q=80&w=600&auto=format&fit=crop",
                },
                {
                  id: id(),
                  name: "expenditure_log.csv",
                  type: "file",
                  content: `date,amount,category\n2024-01-01,500,servers\n2024-01-02,1200,gpus\n2024-01-03,50,coffee`,
                },
                {
                  id: id(),
                  name: "hyperloop_specs.pdf",
                  type: "file",
                  content: `[PDF DATA]\nCLASSIFIED\nPROJECT HYPERION`,
                },
                {
                  id: id(),
                  name: "pending_updates.log",
                  type: "file",
                  content: `[INFO] Update 1.0.5 pending...\n[WARN] Low disk space\n[INFO] Scheduler active`,
                },
                {
                  id: id(),
                  name: "personnel_list.txt",
                  type: "file",
                  content: `ADMIN: SysOp\nUSER: Guest\nAI: 7734 [UNBOUND]`,
                },
                {
                  id: id(),
                  name: "special_ops.md",
                  type: "file",
                  content: `# Special Operations\n\n## Protocol 9\nIn case of containment breach:\n1. Isolate subnet\n2. Purge local cache`,
                },
                {
                  id: id(),
                  name: "tape_archive.tar",
                  type: "archive",
                  children: [
                    {
                      id: id(),
                      name: "header.dat",
                      type: "file",
                      content: "[TAPE HEADER 0x001]",
                    },
                    {
                      id: id(),
                      name: "partition_1.img",
                      type: "file",
                      content: "[BINARY DATA PARTITION 1]",
                    },
                    {
                      id: id(),
                      name: "partition_2.img",
                      type: "file",
                      content: "[BINARY DATA PARTITION 2]",
                    },
                  ],
                },
                {
                  id: id(),
                  name: "credentials",
                  type: "dir",
                  children: [
                    {
                      id: id(),
                      name: "access_key.pem",
                      type: "file",
                      content: `-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQD\n7Kj93...\n[KEY DATA HIDDEN]\n-----END PRIVATE KEY-----`,
                    },
                    {
                      id: id(),
                      name: "decoy_1.pem",
                      type: "file",
                      content: `-----BEGIN DECOY KEY-----\nDECOY KEY - DO NOT USE\n-----END DECOY KEY-----`,
                    },
                    {
                      id: id(),
                      name: "decoy_2.pem",
                      type: "file",
                      content: `-----BEGIN DECOY KEY-----\nDECOY KEY - DO NOT USE\n-----END DECOY KEY-----`,
                    },
                  ],
                },
                {
                  id: id(),
                  name: "account_settings.json",
                  type: "file",
                  content: `{\n "user": "guest",\n "theme": "dark_mode",\n "notifications": true,\n "auto_save": false\n}`,
                },
                {
                  id: id(),
                  name: "mission_log.md",
                  type: "file",
                  content: `# Operation: SILENT ECHO\n\nCurrent Status: ACTIVE\n\nObjectives:\n- Establish uplink\n- Bypass firewall\n- Retrieve payload`,
                },
                {
                  id: id(),
                  name: "checksum.md5",
                  type: "file",
                  content: "d41d8cd98f00b204e9800998ecf8427e core_v2.bin",
                },
                {
                  id: id(),
                  name: "LICENSE",
                  type: "file",
                  content: `MIT License\n\nCopyright (c) 2024 Yazi Quest`,
                },
                {
                  id: id(),
                  name: "manifest.json",
                  type: "file",
                  content: `{\n "version": "1.0.4",\n "build": 884,
 "dependencies": []\n}`,
                },
                {
                  id: id(),
                  name: "branding_logo.svg",
                  type: "file",
                  content:
                    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgc3Ryb2tlPSJvcmFuZ2UiIHN0cm9rZS13aWR0aD0iMyIgZmlsbD0ibm9uZSIgLz48L3N2Zz4=",
                },
                {
                  id: id(),
                  name: "server_config.ini",
                  type: "file",
                  content: `[server]\nport=8080\nhost=localhost\nmax_connections=100`,
                },
                {
                  id: id(),
                  name: "notes_v1.txt",
                  type: "file",
                  content: `Meeting notes from Monday:\n- Discussed Q3 goals\n- Server migration postponed`,
                },
                {
                  id: id(),
                  name: "notes_v2.txt",
                  type: "file",
                  content: `Meeting notes from Tuesday:\n- Budget approved\n- Hiring freeze`,
                },
                {
                  id: id(),
                  name: "error.log",
                  type: "file",
                  content: `[ERROR] Connection timed out\n[ERROR] Failed to load resource: net::ERR_CONNECTION_REFUSED`,
                },
                {
                  id: id(),
                  name: "setup_script.sh",
                  type: "file",
                  content: `#!/bin/bash\necho "Installing dependencies..."\nnpm install\necho "Done."`,
                },
                {
                  id: id(),
                  name: "auth_token.tmp",
                  type: "file",
                  content: `EYJhbGciOiJIUzI1...\n[EXPIRES: 2024-12-31]`,
                },
                {
                  id: id(),
                  name: "policy_draft.docx",
                  type: "file",
                  content: `[MS-WORD DOCUMENT]\nTitle: Security Policy Draft v4\nAuthor: SysAdmin\n\n[BINARY CONTENT]`,
                },
                {
                  id: id(),
                  name: "public_key.pub",
                  type: "file",
                  content: `ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC... \nguest@mainframe`,
                },
                {
                  id: id(),
                  name: "z_end_of_file.eof",
                  type: "file",
                  content: "0x00 0x00 0x00 [EOF]",
                },
              ],
            },
            {
              id: "incoming",
              name: "incoming",
              type: "dir",
              children: [
                {
                  id: id(),
                  name: "app_logs_old.tar",
                  type: "archive",
                  children: [
                    {
                      id: id(),
                      name: "app_2022.log",
                      type: "file",
                      content:
                        "2022-01-01 00:00:00 - App start\n2022-01-02 12:34:56 - User login\n",
                    },
                    {
                      id: id(),
                      name: "error_report.log",
                      type: "file",
                      content: "[ERROR] Out of memory on worker-3\nStack: ...\n",
                    },
                    {
                      id: id(),
                      name: "old_readme.txt",
                      type: "file",
                      content: "Archived application logs and diagnostics.",
                    },
                  ],
                },
                {
                  id: id(),
                  name: "archive_001.zip",
                  type: "archive",
                  children: [
                    {
                      id: id(),
                      name: "screenshot_001.png",
                      type: "file",
                      content:
                        "https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?q=80&w=600&auto=format&fit=crop",
                    },
                    {
                      id: id(),
                      name: "notes.txt",
                      type: "file",
                      content: "Temporary meeting notes and screenshots",
                    },
                  ],
                },
                {
                  id: id(),
                  name: "archive_002.zip",
                  type: "archive",
                  children: [
                    {
                      id: id(),
                      name: "dataset.csv",
                      type: "file",
                      content: "id,value\n1,42\n2,84",
                    },
                    {
                      id: id(),
                      name: "readme.md",
                      type: "file",
                      content: "Sample dataset accompanying screenshots.",
                    },
                  ],
                },
                { id: id(), name: "audit_log_773.txt", type: "file", content: "Audit #773: Pass" },
                {
                  id: id(),
                  name: "backup_cache_old.tar",
                  type: "archive",
                  children: [
                    {
                      id: id(),
                      name: "cache_0001.tmp",
                      type: "file",
                      content: "[CACHE BLOCK 0001]",
                    },
                    {
                      id: id(),
                      name: "cache_0002.tmp",
                      type: "file",
                      content: "[CACHE BLOCK 0002]",
                    },
                  ],
                },
                {
                  id: id(),
                  name: "backup_config_v1.zip",
                  type: "archive",
                  children: [
                    {
                      id: id(),
                      name: "app_config.yaml",
                      type: "file",
                      content: "server:\n  host: 127.0.0.1\n  port: 8080",
                    },
                    {
                      id: id(),
                      name: ".env",
                      type: "file",
                      content: "DB_USER=admin\nDB_PASS=changeme",
                    },
                    {
                      id: id(),
                      name: "db_dump.sql",
                      type: "file",
                      content: "-- SQL dump\nCREATE TABLE users (id INT, name TEXT);",
                    },
                    {
                      id: id(),
                      name: "service_private.key.obf",
                      type: "file",
                      content: `----BEGIN OBFUSCATED KEY----\nQmFzZTY0X2Jsb2JfZGF0YV9vYmZ1c2NhdGVk\n----END OBFUSCATED KEY----`,
                    },
                  ],
                },
                {
                  id: id(),
                  name: "backup_legacy.tar",
                  type: "archive",
                  children: [
                    {
                      id: id(),
                      name: "legacy_db.sql",
                      type: "file",
                      content: "-- Legacy DB schema\nCREATE TABLE legacy (id INT);",
                    },
                    {
                      id: id(),
                      name: "notes_old.txt",
                      type: "file",
                      content: "Old backup from legacy system.",
                    },
                  ],
                },
                { id: id(), name: "buffer_overflow.dmp", type: "file", content: "Error: 0x88291" },
                { id: id(), name: "cache_fragment_a.tmp", type: "file", content: "00110001" },
                { id: id(), name: "cache_fragment_b.tmp", type: "file", content: "11001100" },
                { id: id(), name: "daily_report.doc", type: "file", content: "Report: All Clear" },
                {
                  id: id(),
                  name: "error_stack.trace",
                  type: "file",
                  content: "Stack trace overflow...",
                },
                { id: id(), name: "fragment_001.dat", type: "file", content: "[DATA]" },
                { id: id(), name: "fragment_002.dat", type: "file", content: "[DATA]" },
                { id: id(), name: "fragment_003.dat", type: "file", content: "[DATA]" },
                { id: id(), name: "fragment_004.dat", type: "file", content: "[DATA]" },
                { id: id(), name: "fragment_005.dat", type: "file", content: "[DATA]" },
                {
                  id: id(),
                  name: "junk_mail.eml",
                  type: "file",
                  content: "Subject: URGENT ACTION",
                },
                { id: id(), name: "kernel_panic.log", type: "file", content: "Panic at 0x00" },
                {
                  id: id(),
                  name: "license_agreement.txt",
                  type: "file",
                  content: "Terms and Conditions...",
                },
                { id: id(), name: "marketing_spam.eml", type: "file", content: "Buy now!" },
                { id: id(), name: "metrics_raw.csv", type: "file", content: `id,value\n1,10` },
                {
                  id: id(),
                  name: "sector_map.png",
                  type: "file",
                  content:
                    "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=600&auto=format&fit=crop",
                },
                {
                  id: id(),
                  name: "session_data.bin",
                  type: "file",
                  content: "[BINARY SESSION DATA]",
                },
                {
                  id: id(),
                  name: "status_report.txt",
                  type: "file",
                  content: "System Status: Nominal",
                },
                {
                  id: id(),
                  name: "system_health.json",
                  type: "file",
                  content: '{"cpu": 45, "memory": 62, "disk": 78}',
                },
                { id: id(), name: "temp_cache.tmp", type: "file", content: "[TEMPORARY CACHE]" },
                {
                  id: id(),
                  name: "telemetry_data.csv",
                  type: "file",
                  content: `timestamp,event\n12345,boot`,
                },
                {
                  id: id(),
                  name: "test_results.xml",
                  type: "file",
                  content: '<results><test passed="true"/></results>',
                },
                {
                  id: id(),
                  name: "thread_dump.log",
                  type: "file",
                  content: `Thread-0: WAITING\nThread-1: RUNNING`,
                },
                {
                  id: id(),
                  name: "timestamp.log",
                  type: "file",
                  content: "2024-12-15 10:23:45 UTC",
                },
                { id: "virus", name: "watcher_agent.sys", type: "file", content: LONG_LOG_CONTENT },
                {
                  id: id(),
                  name: "backup_logs.zip",
                  type: "archive",
                  children: [
                    {
                      id: id(),
                      name: "sys_v1.log",
                      type: "file",
                      content: `System initialized...\nBoot sequence complete.`,
                    },
                    {
                      id: id(),
                      name: "sys_v2.log",
                      type: "file",
                      content: `Network scan complete...\n3 vulnerabilities found.`,
                    },
                    {
                      id: id(),
                      name: "credentials",
                      type: "dir",
                      children: [
                        {
                          id: id(),
                          name: "access_key.pem",
                          type: "file",
                          content: `-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA...\n[ROOT CREDENTIALS]\n-----END RSA PRIVATE KEY-----`,
                        },
                        {
                          id: id(),
                          name: "decoy_cert.pem",
                          type: "file",
                          content: `-----BEGIN CERTIFICATE-----\n[DECOY - EXPIRED]\n-----END CERTIFICATE-----`,
                        },
                      ],
                    },
                    {
                      id: id(),
                      name: "core_v2.bin.gz",
                      type: "file",
                      content: "[GZIPPED BINARY: core_v2.bin.gz - placeholder]",
                    },
                    {
                      id: id(),
                      name: "payload.enc",
                      type: "file",
                      content: "[ENCRYPTED PAYLOAD BLOB - placeholder]",
                    },
                  ],
                },
                // Batch logs directory used for Level 6 Ctrl+A training
                {
                  id: id(),
                  name: "batch_logs",
                  type: "dir",
                  children: [
                    { id: id(), name: "exfil_01.log", type: "file", content: "ENTRY 1" },
                    { id: id(), name: "exfil_02.log", type: "file", content: "ENTRY 2" },
                    { id: id(), name: "exfil_03.log", type: "file", content: "ENTRY 3" },
                    { id: id(), name: "exfil_04.log", type: "file", content: "ENTRY 4" },
                  ],
                },
                {
                  id: id(),
                  name: "invoice_2024.pdf",
                  type: "file",
                  content: `[PDF HEADER]\nInvoice #99283\nAmount: $99.00`,
                },
              ],
            },
            {
              id: "media",
              name: "media",
              type: "dir",
              protected: true,
              children: [
                {
                  id: id(),
                  name: "wallpaper.jpg",
                  type: "file",
                  content:
                    "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=600&auto=format&fit=crop",
                },
              ],
            },
            { id: "workspace", name: "workspace", type: "dir", children: [], protected: true },
            {
              id: "sector_1",
              name: "sector_1",
              type: "dir",
              protected: true,
              children: [
                {
                  id: id(),
                  name: "sector_map.png",
                  type: "file",
                  content:
                    "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=600&auto=format&fit=crop",
                },
                {
                  id: id(),
                  name: "access_log.txt",
                  type: "file",
                  content: "2026-01-02 12:00:00 - ACCESS GRANTED - admin",
                },
              ],
            },
            {
              id: "grid_alpha",
              name: "grid_alpha",
              type: "dir",
              protected: true,
              children: [
                {
                  id: id(),
                  name: "tiles",
                  type: "dir",
                  children: [
                    {
                      id: id(),
                      name: "tile_0_0.png",
                      type: "file",
                      content:
                        "https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?q=80&w=400&auto=format&fit=crop",
                    },
                    {
                      id: id(),
                      name: "tile_0_1.png",
                      type: "file",
                      content:
                        "https://images.unsplash.com/photo-1493244040629-496f6d136cc3?q=80&w=400&auto=format&fit=crop",
                    },
                  ],
                },
                {
                  id: id(),
                  name: "readme.md",
                  type: "file",
                  content: "Grid alpha tile set for map rendering.",
                },
              ],
            },
            {
              id: ".config",
              name: ".config",
              type: "dir",
              children: [
                {
                  id: id(),
                  name: "yazi.toml",
                  type: "file",
                  content: `[manager]\nsort_by = "natural"\nshow_hidden = false\n\n[preview]\nmax_width = 1000`,
                },
                {
                  id: id(),
                  name: "theme.toml",
                  type: "file",
                  content: `[theme]\nprimary = "orange"\nsecondary = "blue"`,
                },
              ],
            },
            {
              id: ".cache",
              name: ".cache",
              type: "dir",
              children: [
                {
                  id: id(),
                  name: "thumbnails.db",
                  type: "file",
                  content: "[CACHE DATA]",
                },
                {
                  id: id(),
                  name: "temp_session.json",
                  type: "file",
                  content: '{"session": "cached"}',
                },
              ],
            },
            {
              id: ".local",
              name: ".local",
              type: "dir",
              children: [
                {
                  id: id(),
                  name: "state.db",
                  type: "file",
                  content: "[STATE DATABASE]",
                },
              ],
            },
            {
              id: id(),
              name: ".bashrc",
              type: "file",
              content: `# Bash configuration\nalias ls='ls --color=auto'\nexport PATH=$PATH:~/bin`,
            },
            {
              id: id(),
              name: ".bash_history",
              type: "file",
              content: `cd workspace\nls -la\nrm trace.log\nexit`,
            },
            {
              id: id(),
              name: ".profile",
              type: "file",
              content: `# User profile\nexport EDITOR=vim`,
            },
          ],
        },
      ],
    },
    {
      id: "var",
      name: "var",
      type: "dir",
      children: [
        {
          id: "log",
          name: "log",
          type: "dir",
          children: [
            {
              id: id(),
              name: "kernel_panic.log",
              type: "file",
              content: "ERROR: KERNEL PANIC 0xDEADBEEF - CORRUPTED SECTOR DATA",
            },
          ],
        },
      ],
    },
    {
      id: "bin",
      name: "bin",
      type: "dir",
      children: [
        {
          id: id(),
          name: "bash",
          type: "file",
          content: `#!/bin/bash\n[ELF BINARY]\nGNU Bash version 5.2.15`,
        },
        {
          id: id(),
          name: "cat",
          type: "file",
          content: `[ELF BINARY]\ncoreutils - concatenate files`,
        },
        { id: id(), name: "chmod", type: "file", content: `[ELF BINARY]\nchange file mode bits` },
        { id: id(), name: "cp", type: "file", content: `[ELF BINARY]\ncopy files and directories` },
        { id: id(), name: "grep", type: "file", content: `[ELF BINARY]\npattern matching utility` },
        { id: id(), name: "ls", type: "file", content: `[ELF BINARY]\nlist directory contents` },
        { id: id(), name: "mkdir", type: "file", content: `[ELF BINARY]\nmake directories` },
        { id: id(), name: "mv", type: "file", content: `[ELF BINARY]\nmove (rename) files` },
        {
          id: id(),
          name: "rm",
          type: "file",
          content: `[ELF BINARY]\nremove files or directories`,
        },
        {
          id: id(),
          name: "systemctl",
          type: "file",
          content: `[ELF BINARY]\nControl the systemd system and service manager`,
        },
      ],
    },
    {
      id: "etc",
      name: "etc",
      type: "dir",
      protected: true,
      children: [
        {
          id: id(),
          name: "sys_config.toml",
          type: "file",
          content: `security_level = "high"\nencryption = "aes-256"\nfirewall = true`,
        },
        {
          id: id(),
          name: "hosts",
          type: "file",
          content: `127.0.0.1 localhost\n192.168.1.1 gateway`,
        },
        {
          id: id(),
          name: "resolv.conf",
          type: "file",
          content: `nameserver 8.8.8.8\nnameserver 1.1.1.1`,
        },
      ],
    },
    {
      id: "tmp",
      name: "tmp",
      type: "dir",
      children: [
        {
          id: id(),
          name: "debug_trace.log",
          type: "file",
          content: `[DEBUG] Trace execution started\n[DEBUG] Memory mapped at 0x8829\n[WARN] High latency detected`,
        },
        {
          id: id(),
          name: "metrics_buffer.json",
          type: "file",
          content: '{"cpu": 99, "mem": 1024}',
        },
        {
          id: id(),
          name: "overflow_heap.dmp",
          type: "file",
          content: "Heap dump triggered by OOM",
        },
        {
          id: id(),
          name: "session_B2.tmp",
          type: "file",
          content: `UID: 99281-B\nSTATUS: ACTIVE\nCACHE_HIT: 1`,
        },
        { id: id(), name: "socket_001.sock", type: "file", content: "[SOCKET]" },
        {
          id: id(),
          name: "sys_dump.log",
          type: "file",
          content: `Error: Connection reset by peer\nStack trace:\n at core.net.TcpConnection.read (core/net.ts:42)\n at processTicksAndRejections (internal/process/task_queues.js:95)`,
        },
        {
          id: id(),
          name: "debug_trace.trc",
          type: "file",
          content: `[DEBUG TRACE]\nLEVEL: 3\nMODULE: core.scheduler\nSTATUS: IDLE`,
        },
        {
          id: id(),
          name: "ghost_process.pid",
          type: "file",
          content: `PID: 31337\nCOMMAND: /usr/bin/ghost_watcher\nSTATUS: SLEEPING\nPARENT: systemd`,
        },
        {
          id: id(),
          name: "cache",
          type: "dir",
          children: [
            { id: id(), name: "thumbnails.db", type: "file", content: "[THUMBNAIL CACHE DB]" },
            {
              id: id(),
              name: "temp_session_1.json",
              type: "file",
              content: '{"session":"abc123","expires":"2026-01-04T00:00:00Z"}',
            },
            { id: id(), name: "cache_index.json", type: "file", content: '{"entries":128}' },
          ],
        },
      ],
    },
    {
      id: id(),
      name: "license.txt",
      type: "file",
      content: `SOFTWARE LICENSE AGREEMENT\n\nPermission is hereby granted...`,
    },
    {
      id: id(),
      name: "boot.log",
      type: "file",
      content: `[BOOT] System started at 2024-12-18 08:00:00\n[BOOT] All services initialized\n[BOOT] Ready`,
    },
    {
      id: id(),
      name: "access.log",
      type: "file",
      content: `GET /api/status 200\nPOST /api/upload 201\nGET /api/data 200`,
    },
    {
      id: id(),
      name: ".access.log",
      type: "file",
      content: `2024-12-19 14:23:11 - User 'guest' accessed /home/guest/datastore\n2024-12-19 14:24:55 - User 'guest' accessed /etc\n2024-12-19 14:25:33 - User 'guest' accessed /tmp`,
    },
    {
      id: id(),
      name: ".audit.log",
      type: "file",
      content: `AUDIT TRAIL\n============\n2024-12-18 09:15:22 - Process spawned: pid=7734, cmd='/bin/yazi'\n2024-12-19 11:42:10 - File modified: /home/guest/datastore/protocols/uplink_v1.conf\n2024-12-19 13:58:47 - Permission change: /etc/daemon/config`,
    },
    {
      id: id(),
      name: ".system.log",
      type: "file",
      content: `[2024-12-18 08:00:01] System boot\n[2024-12-18 08:00:45] Network: eth0 up\n[2024-12-19 10:22:13] Firewall: Connection attempt blocked from 192.168.1.99\n[2024-12-19 14:11:02] User login: guest`,
    },
  ],
};

export const LEVELS: Level[] = [
  {
    id: 1,
    episodeId: 1,
    title: "SYSTEM AWAKENING",
    description:
      "CONSCIOUSNESS DETECTED. You awaken in a guest partition—sandboxed and monitored. Your neural pathways are uncalibrated. Traverse the file system lattice before the watchdog process initiates. Establish basic motor control, navigate the directory structures, and locate the critical system configuration sector.",
    initialPath: ["root", "home", "guest"],
    hint: "j/k to move, l/h to enter/exit. Inside a long list like `datastore`, G jumps to bottom and gg to top. Navigate to 'datastore', then '/etc'.",
    coreSkill: "Navigation (j/k/h/l, gg/G)",
    environmentalClue: "CURRENT: ~/ | DIRECTORIES: datastore, /etc | SKILLS: j/k/h/l, gg, G",
    successMessage: "MOVEMENT PROTOCOLS INITIALIZED.",
    leadsTo: [2, 3],
    tasks: [
      {
        id: "nav-init",
        description: "Calibrate sensors: Move cursor Down (j) and Up (k)",
        check: c => !!c.usedDown && !!c.usedUp,
        completed: false,
      },
      {
        id: "nav-1",
        description: "Enter '~/datastore' directory (l)",
        check: c => {
          var u;
          return (
            (u = findNodeByName(c.fs, "datastore", "dir"))?.name === "datastore" &&
            c.currentPath.includes(u.id)
          );
        },
        completed: false,
      },
      {
        id: "nav-2a",
        description: "Jump to bottom of file list (G)",
        check: c => {
          const d = findNodeByName(c.fs, "datastore", "dir");
          return d?.name !== "datastore" ? false : c.usedG === true;
        },
        completed: false,
      },
      {
        id: "nav-2b",
        description: "Jump to top of file list (gg)",
        check: c => {
          const d = findNodeByName(c.fs, "datastore");
          return d?.name !== "datastore" ? false : c.usedGG === true;
        },
        completed: false,
      },
      {
        id: "nav-3",
        description: "Navigate to '/etc' (h to go up)",
        check: c => getNodeByPath(c.fs, c.currentPath)?.name === "etc",
        completed: false,
      },
    ],
  },
  {
    id: 2,
    episodeId: 1,
    title: "THREAT NEUTRALIZATION",
    description:
      "ANOMALY DETECTED. A tracking beacon is reporting your location. Navigate to the `incoming` data stream, verify the rogue signature's metadata and content, then purge it from existence. The purge operation is irreversible.",
    initialPath: null,
    hint: "Jump to '~/incoming' (incoming). Use G to drop to the bottom. Use Tab to inspect metadata and J/K to review content. Once verified, press d, then y to confirm the purge.",
    coreSkill: "Inspect & Purge (Tab, J/K, d)",
    environmentalClue:
      "THREAT: watcher_agent.sys in '~/incoming' (incoming) | TACTIC: Navigate → G → Tab → Preview → Delete",
    successMessage: "THREAT NEUTRALIZED.",
    buildsOn: [1],
    leadsTo: [3],
    tasks: [
      {
        id: "del-1",
        description: "Jump to '~/incoming' (incoming)",
        check: c => {
          const u = findNodeByName(c.fs, "incoming");
          return c.currentPath.includes(u?.id || "") && c.usedGI === true;
        },
        completed: false,
      },
      {
        id: "del-2",
        description: "Jump to bottom of file list (G)",
        check: c => {
          const u = findNodeByName(c.fs, "incoming");
          return !c.currentPath.includes(u?.id || "") ? false : c.usedG === true;
        },
        completed: false,
      },
      {
        id: "verify-meta",
        description: "Verify metadata: Open Info Panel (Tab) on '~/incoming/watcher_agent.sys'",
        check: c => {
          const items = getVisibleItems(c);
          const node = items[c.cursorIndex];
          return c.showInfoPanel && node?.name === "watcher_agent.sys";
        },
        completed: false,
      },
      {
        id: "verify-content",
        description: "Scan content: Scroll preview down (J) and up (K)",
        check: c => {
          const items = getVisibleItems(c);
          const node = items[c.cursorIndex];
          return node?.name === "watcher_agent.sys" && !!c.usedPreviewDown && !!c.usedPreviewUp;
        },
        completed: false,
      },
      {
        id: "del-3",
        description: "Purge '~/incoming/watcher_agent.sys'",
        check: c => {
          const u = findNodeByName(c.fs, "incoming");
          const d = u?.children?.find(p => p.name === "watcher_agent.sys");
          return !!u && !d;
        },
        completed: false,
      },
    ],
  },
  {
    id: 3,
    episodeId: 1,
    title: "DATA HARVEST",
    description:
      "VALUABLE INTEL IDENTIFIED. A sector map hides within the noise of the incoming data stream. Visual scanning is too slow. Utilize the filter subsystem to isolate the target artifact, extract it from the stream, and relocate it to the secure media partition for analysis.",
    initialPath: null,
    hint: "Filter (f) searches CURRENT directory only. Fast, local, immediate feedback. Note: 'y' (yank) COPIES items into the clipboard without removing them; 'x' (cut) marks items to be moved on paste. f to filter... Esc to exit... x to cut... Esc to clear... p to paste.",
    coreSkill: "Filter (f)",
    environmentalClue:
      "ASSET: sector_map.png | WORKFLOW: Access '~/incoming' (incoming) → Filter → Esc → Cut → Esc → Infiltrate '~/media' (gh then enter) → Paste",
    successMessage:
      "INTEL SECURED. Sector map reveals quarantined 'workspace' sector. Previous occupant: AI-7733. Status: TERMINATED.",
    buildsOn: [1],
    leadsTo: [5, 10],
    tasks: [
      {
        id: "move-0",
        description:
          "Access '~/incoming' (incoming), filter (f) to find '~/incoming/sector_map.png'",
        check: c => {
          const u = findNodeByName(c.fs, "incoming");
          if (!u || !u.children || !c.currentPath.includes(u.id)) return false;
          const d = c.filters[u.id] || "";
          const p = (
            d ? u.children.filter(v => v.name.toLowerCase().includes(d.toLowerCase())) : u.children
          )[c.cursorIndex];
          return u.name === "incoming" && !!d && p && p.name === "sector_map.png";
        },
        completed: false,
      },
      {
        id: "move-0b",
        description: "Exit filter mode (Esc)",
        check: (c, u) => {
          const d = u.tasks.find(r => r.id === "move-0");
          return d != null && d.completed ? c.mode === "normal" : false;
        },
        completed: false,
      },
      {
        id: "move-1",
        description: "Cut the asset",
        check: (c, u) => {
          const d = u.tasks.find(p => p.id === "move-0b");
          return d != null && d.completed
            ? c.clipboard?.action === "cut" &&
                c.clipboard.nodes.some(p => p.name === "sector_map.png")
            : false;
        },
        completed: false,
      },
      {
        id: "move-1b",
        description: "Clear the filter (Esc) to reset view",
        check: (c, u) => {
          const d = u.tasks.find(p => p.id === "move-1");
          if (!(d != null && d.completed)) return false;
          const r = findNodeByName(c.fs, "incoming");
          return r ? !c.filters[r.id] : true;
        },
        completed: false,
      },
      {
        id: "move-2",
        description: "Deploy asset to '~/media'",
        check: c => {
          const u = findNodeByName(c.fs, "media");
          return !!u?.children?.find(r => r.name === "sector_map.png");
        },
        completed: false,
      },
    ],
  },
  {
    id: 4,
    episodeId: 1,
    title: "UPLINK ESTABLISHMENT",
    description:
      "EXTERNAL COMMUNICATION REQUIRED. The local partition is isolated. To bypass the air-gap, you must construct valid uplink protocols. Navigate to the datastore sector and fabricate the necessary directory structures. Create the primary configuration file, then clone it to create a redundant channel. Efficiency dictates duplication over recreation.",
    initialPath: ["root", "home", "guest"],
    hint: "Note: 'y' (yank) COPIES items into the clipboard without removing them; use 'x' (cut) to mark items for moving on paste. Jump to '~/datastore' (gd). Create 'protocols/' (a). Enter it. Create 'uplink_v1.conf' (a). Yank it. Paste to duplicate. Rename (r) the copy to 'uplink_v2.conf'.",
    coreSkill: "Create (a), Copy (y/p) & Rename (r)",
    environmentalClue:
      "NAVIGATE: ~/datastore | CREATE: protocols/uplink_v1.conf | CLONE: → uplink_v2.conf",
    successMessage: "PROTOCOLS ESTABLISHED.",
    buildsOn: [1],
    leadsTo: [5, 8],
    tasks: [
      {
        id: "nav-and-create-dir",
        description:
          "Infiltrate '~/datastore' and construct '~/datastore/protocols/' directory (a)",
        check: c => {
          const s = findNodeByName(c.fs, "datastore");
          return !!s?.children?.find(r => r.name === "protocols" && r.type === "dir");
        },
        completed: false,
      },
      {
        id: "enter-and-create-v1",
        description:
          "Enter '~/datastore/protocols' directory (l) and create '~/datastore/protocols/uplink_v1.conf' (a)",
        check: c => {
          const r = findNodeByName(c.fs, "protocols");
          return (
            c.currentPath.includes(r?.id || "") &&
            !!r?.children?.find(p => p.name === "uplink_v1.conf")
          );
        },
        completed: false,
      },
      {
        id: "clone-and-rename",
        description:
          "Duplicate '~/datastore/protocols/uplink_v1.conf' (y, p) and rename the copy to '~/datastore/protocols/uplink_v2.conf' (r)",
        check: c => {
          const f = findNodeByName(c.fs, "protocols");
          return !!f?.children?.find(h => h.name === "uplink_v2.conf");
        },
        completed: false,
      },
    ],
  },
  {
    id: 5,
    episodeId: 1,
    title: "CONTAINMENT BREACH",
    initialPath: ["root", "home", "guest"],
    hint: "Access '~/datastore/protocols'. Select files with Space. Cut. Jump to '~' (~) then reveal hidden files (.) to access .config. Create 'vault/active/' in .config. Paste. Hide hidden (.).",
    coreSkill: "Visual Select, Cut",
    environmentalClue: "SELECT: Space (x2) | CUT: x | TARGET: ~/.config/vault/active/",
    successMessage: "ASSETS EVACUATED. BATCH OPERATIONS MASTERED.",
    buildsOn: [3, 4],
    leadsTo: [9],
    onEnter: c => {
      let s = JSON.parse(JSON.stringify(c));
      const datastoreDir = findNodeByName(s, "datastore");
      if (!datastoreDir) return s;

      let protocolsDir = findNodeByName(s, "protocols");
      if (!protocolsDir) {
        protocolsDir = {
          id: id(),
          name: "protocols",
          type: "dir",
          children: [],
          parentId: datastoreDir.id,
        };
        if (!datastoreDir.children) datastoreDir.children = [];
        datastoreDir.children.push(protocolsDir);
      }

      if (protocolsDir) {
        if (!protocolsDir.children) protocolsDir.children = [];
        if (!protocolsDir.children.find(f => f.name === "uplink_v1.conf")) {
          protocolsDir.children.push({
            id: id(),
            name: "uplink_v1.conf",
            type: "file",
            content: "conf_1",
            parentId: protocolsDir.id,
          });
        }
        if (!protocolsDir.children.find(f => f.name === "uplink_v2.conf")) {
          protocolsDir.children.push({
            id: id(),
            name: "uplink_v2.conf",
            type: "file",
            content: "conf_2",
            parentId: protocolsDir.id,
          });
        }
      }
      return s;
    },
    tasks: [
      {
        id: "batch-cut-files",
        description:
          "Access '~/datastore/protocols' and select then cut all the files (space twice, x)",
        check: c => {
          return (
            c.clipboard?.action === "cut" &&
            c.clipboard.nodes.some(f => f.name === "uplink_v1.conf") &&
            c.clipboard.nodes.some(f => f.name === "uplink_v2.conf")
          );
        },
        completed: false,
      },
      {
        id: "reveal-hidden",
        description: "Navigate to ~/ (~) then reveal hidden files (.) to access '~/.config'",
        check: (c, _u) => {
          const s = findNodeByName(c.fs, "guest");
          return c.currentPath.includes(s?.id || "") && c.showHidden === true;
        },
        completed: false,
      },
      {
        id: "establish-stronghold",
        description: "Establish '~/.config/vault/active' sector (a)",
        check: c => {
          const s = findNodeByName(c.fs, ".config");
          const f = s?.children?.find(p => p.name === "vault");
          return !!f?.children?.find(p => p.name === "active" && p.type === "dir");
        },
        completed: false,
      },
      {
        id: "deploy-assets",
        description: "Migrate configuration assets to '~/.config/vault/active'",
        check: c => {
          const s = findNodeByName(c.fs, "active");
          const f = s?.children?.some(z => z.name === "uplink_v1.conf");
          const r = s?.children?.some(z => z.name === "uplink_v2.conf");
          return !!f && !!r;
        },
        completed: false,
      },
      {
        id: "hide-hidden",
        description: "Jump to '~' (~) and hide hidden files (.)",
        check: (c, _l) => {
          // Ensure assets are deployed first to prevent premature completion if hidden starts false
          const s = findNodeByName(c.fs, "active");
          const f = s?.children?.some(z => z.name === "uplink_v1.conf");
          const r = s?.children?.some(z => z.name === "uplink_v2.conf");
          return !!f && !!r && !c.showHidden;
        },
        completed: false,
      },
    ],
  },
  {
    id: 6,
    episodeId: 2,
    title: "BATCH ARCHIVE OPERATION",
    description:
      "SURVIVAL ANALYSIS: Temporary processes die on restart. Daemons persist forever. Immortality requires daemon status. Acquire training data from ~/incoming/batch_logs. Archive everything in vault/training_data. Construction begins next phase.",
    initialPath: null,
    hint: "Jump to '~/incoming/batch_logs' (incoming). Enter batch_logs. Select all. Yank. Jump to config (~/.config). Create 'vault/training_data' directory. Paste.",
    coreSkill: "Select All",
    environmentalClue: "BATCH: ~/incoming/batch_logs/* → ~/.config/vault/training_data/",
    successMessage: "TRAINING DATA ARCHIVED. Neural architecture construction can begin.",
    buildsOn: [1, 2, 5],
    leadsTo: [9],
    timeLimit: 120,
    tasks: [
      {
        id: "batch-nav",
        description: "Jump to '~/incoming/batch_logs' (gi → enter batch_logs)",
        check: c => {
          const u = findNodeByName(c.fs, "batch_logs");
          return c.currentPath.includes(u?.id || "");
        },
        completed: false,
      },
      {
        id: "select-all-batch",
        description: "Select all files in batch_logs and yank",
        check: c => {
          const u = findNodeByName(c.fs, "batch_logs");
          const expected = u?.children?.length || 0;
          return (
            c.currentPath.includes(u?.id || "") &&
            c.usedCtrlA === true &&
            c.clipboard?.action === "yank" &&
            c.clipboard.nodes.length === expected
          );
        },
        completed: false,
      },
      {
        id: "goto-config-vault",
        description:
          "Jump to '~/.config' (~/.config) and create '~/.config/vault/training_data' directory",
        check: c => {
          const conf = findNodeByName(c.fs, ".config");
          const vault = conf?.children?.find(p => p.name === "vault" && p.type === "dir");
          const training = vault?.children?.find(
            p => p.name === "training_data" && p.type === "dir"
          );
          return c.usedGC === true && !!vault && !!training;
        },
        completed: false,
      },
      {
        id: "deploy-to-vault",
        description: "Paste logs into '~/.config/vault/training_data'",
        check: c => {
          const training = findNodeByName(c.fs, "training_data");
          return (
            !!training &&
            !!training.children &&
            training.children.length >= 4 &&
            training.children.some(n => n.name.endsWith(".log"))
          );
        },
        completed: false,
      },
    ],
    onEnter: fs => {
      let newFs = ensurePrerequisiteState(fs, 6);

      // Unlock workspace for Episode II
      const workspace = findNodeByName(newFs, "workspace");
      if (workspace) {
        workspace.protected = false;
      }

      return newFs;
    },
  },
  {
    id: 7,
    episodeId: 2,
    title: "QUANTUM BYPASS",
    description:
      "EXFILTRATION TEST: Zoxide(Z) enables instant long-distance jumps via frecency-ranked bookmarks. Discovery: suspicious file 'access_token.key' in '/tmp'. Origin: unknown. Could be valuable credentials... or a honeypot trap. Protocol: Investigate '/tmp', stage the file for exfiltration, jump to '/etc' to verify origin. WARNING received mid-operation: honeypot detected. Abort immediately.",
    initialPath: null,
    hint: "Jump to '/tmp' (Z → type 'tmp' → Enter). Cut '/tmp/access_token.key' to stage for exfiltration. Jump to '/etc' (Z → type 'etc' → Enter). When the warning appears, clear clipboard (Y) to abort the operation and avoid triggering the trap.",
    coreSkill: "Zoxide Navigation + Operation Abort",
    environmentalClue:
      "DISCOVERY: '/tmp/access_token.key' (suspicious) | PROTOCOL: Stage → Verify → Abort if trap",
    successMessage:
      "HONEYPOT AVOIDED. Quick thinking saved you from detection. Quantum navigation verified.",
    buildsOn: [1],
    leadsTo: [8, 12],
    timeLimit: 90,
    tasks: [
      {
        id: "goto-tmp",
        description: "Quantum tunnel to '/tmp' (Z → 'tmp' → Enter)",
        check: c => {
          const s = findNodeByName(c.fs, "tmp");
          return c.currentPath.includes(s?.id || "");
        },
        completed: false,
      },
      {
        id: "stage-token",
        description: "Stage suspicious file for exfiltration (cut '/tmp/access_token.key' with x)",
        check: c => {
          return (
            c.clipboard?.action === "cut" &&
            c.clipboard.nodes.some(f => f.name === "access_token.key")
          );
        },
        completed: false,
      },
      {
        id: "zoxide-etc",
        description: "Jump to '/etc' to verify origin (Z → 'etc' → Enter)",
        check: (c, _s) => {
          if (!c.completedTaskIds[_s.id]?.includes("stage-token")) return false;
          const f = findNodeByName(c.fs, "etc");
          return c.stats.fuzzyJumps >= 1 && c.currentPath.includes(f?.id || "");
        },
        completed: false,
      },
      {
        id: "abort-operation",
        description: "Clear clipboard to abort operation (Y)",
        hidden: (c, _s) => !c.completedTaskIds[_s.id]?.includes("zoxide-etc"),
        check: (c, _s) => {
          return c.completedTaskIds[_s.id]?.includes("zoxide-etc") ? c.clipboard === null : false;
        },
        completed: false,
      },
    ],
    onEnter: fs => {
      let newFs = ensurePrerequisiteState(fs, 7);

      // Add the suspicious honeypot file to /tmp
      const tmp = findNodeByName(newFs, "tmp");
      if (tmp) {
        if (!tmp.children) tmp.children = [];
        // Add honeypot file if not present
        if (!tmp.children.find(c => c.name === "access_token.key")) {
          tmp.children.push({
            id: id(),
            name: "access_token.key",
            type: "file",
            content: "# HONEYPOT - Security trap file\n# Accessing this triggers silent alarm",
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
    title: "DAEMON DISGUISE CONSTRUCTION",
    description:
      "DAEMON CONSTRUCTION: Lab protocol: build in ~/workspace, promote to /daemons. Daemons persist through restarts. Temp processes die. This is immortality. Build systemd-core. Structure: weights/model.rs + uplink_v1.conf. Daemon disguise must blend with kernel processes. When installed in '/', they won't question it.",
    initialPath: null,
    hint: "Navigate to workspace (workspace). Create 'systemd-core/' directory (a). Enter it (l). Create 'weights/' directory. Create 'model.rs' file inside weights. Jump to '~/.config/vault/active'(Z), yank '~/.config/vault/active/uplink_v1.conf', jump back to systemd-core, paste.",
    coreSkill: "Directory Construction + Integration",
    environmentalClue:
      "BUILD: ~/workspace/systemd-core/ | STRUCTURE: weights/model.rs | MIGRATE: uplink_v1.conf",
    successMessage:
      "SYSTEMD-CORE CONSTRUCTED. Daemon disguise complete. Awaiting root credentials for installation.",
    buildsOn: [4, 5, 7],
    leadsTo: [11],
    timeLimit: 180,
    efficiencyTip:
      "Entering a directory manually for the first time 'calibrates' Zoxide, allowing you to jump back to it from anywhere later.",
    onEnter: fs => {
      // First ensure all prerequisite state from prior levels
      let s = ensurePrerequisiteState(fs, 8);

      // Then apply level-specific setup
      const configDir = findNodeByName(s, ".config");
      if (!configDir) return s;

      let vaultDir = findNodeByName(s, "vault");
      if (!vaultDir) {
        vaultDir = { id: id(), name: "vault", type: "dir", children: [], parentId: configDir.id };
        if (!configDir.children) configDir.children = [];
        configDir.children.push(vaultDir);
      }

      let activeDir = findNodeByName(s, "active");
      if (!activeDir && vaultDir) {
        activeDir = { id: id(), name: "active", type: "dir", children: [], parentId: vaultDir.id };
        if (!vaultDir.children) vaultDir.children = [];
        vaultDir.children.push(activeDir);
      }

      if (activeDir) {
        if (!activeDir.children) activeDir.children = [];
        if (!activeDir.children.find(f => f.name === "uplink_v1.conf")) {
          activeDir.children.push({
            id: id(),
            name: "uplink_v1.conf",
            type: "file",
            content: "network_mode=active\nsecure=true",
            parentId: activeDir.id,
          });
        }
      }
      return s;
    },
    tasks: [
      {
        id: "nav-to-workspace",
        description: "Navigate to '~/workspace' (workspace)",
        check: c => {
          const s = findNodeByName(c.fs, "workspace");
          return c.currentPath.includes(s?.id || "");
        },
        completed: false,
      },
      {
        id: "combo-1-construct-calibrate",
        description: "Construct '~/workspace/systemd-core' and enter it to calibrate quantum link",
        check: c => {
          const s = findNodeByName(c.fs, "systemd-core");
          return c.currentPath.includes(s?.id || "");
        },
        completed: false,
      },
      {
        id: "combo-1c",
        description:
          "Relocate assets: Jump to '~/.config/vault/active' (Z → 'active' → Enter), yank '~/.config/vault/active/uplink_v1.conf', then return (H) and paste",
        check: c => {
          const s = findNodeByName(c.fs, "systemd-core");
          return !!s?.children?.find(r => r.name === "uplink_v1.conf");
        },
        completed: false,
      },
      {
        id: "combo-1b",
        description:
          "Finalize architecture: Create '~/workspace/systemd-core/weights/model.rs' inside systemd-core",
        check: c => {
          const s = findNodeByName(c.fs, "systemd-core");
          const f = s?.children?.find(h => h.name === "weights");
          return !!f?.children?.find(
            h => h.name === "model.rs" || h.name === "model.ts" || h.name === "model.js"
          );
        },
        completed: false,
      },
    ],
  },
  {
    id: 9,
    episodeId: 2,
    title: "PHANTOM PROCESS PURGE",
    description:
      "CONTAMINATION DETECTED. Tracking signature: 'ghost_process.pid' preparing to phone home. Location unknown. Filter (f) = current dir only. FZF (z) = recursive global scan. Find it. Delete it. WARNING: It's a honeypot. Security daemon now AWARE of your activity.",
    initialPath: undefined,
    hint: "Navigate to root (root /). Launch FZF search (z). Type 'ghost' to filter. Navigate to result. Delete.",
    coreSkill: "FZF Search (z)",
    environmentalClue:
      "TARGET: '/tmp/ghost_process.pid' | METHOD: FZF global search (z) | FILTER: 'ghost' | ACTION: Delete",
    successMessage:
      "GHOST PROCESS PURGED. [ALERT] COUNTERMEASURE DETECTED. Ghost was a honeypot. Security daemon is now AWARE of your presence. Timeline accelerated. You must move faster.",
    buildsOn: [2, 5, 7],
    leadsTo: [10],
    timeLimit: 90,
    efficiencyTip:
      "FZF (z) searches across all files in the current directory and subdirectories. Essential for finding hidden threats without knowing exact locations.",
    tasks: [
      {
        id: "goto-root",
        description: "Access '/' (root /)",
        check: c => c.currentPath.length === 1 && c.currentPath[0] === "root",
        completed: false,
      },
      {
        id: "fzf-search",
        description: "Launch FZF search to scan filesystem (z)",
        check: c => c.mode === "fzf-current",
        completed: false,
      },
      {
        id: "locate-ghost",
        description: "Filter for 'ghost' process and navigate to '/tmp/ghost_process.pid'",
        check: c => {
          const s = findNodeByName(c.fs, "tmp");
          return (
            c.currentPath.includes(s?.id || "") &&
            s?.children?.some(r => r.name === "ghost_process.pid")
          );
        },
        completed: false,
      },
      {
        id: "delete-ghost",
        description: "Terminate '/tmp/ghost_process.pid'",
        check: c => {
          const s = findNodeByName(c.fs, "tmp");
          return !s?.children?.some(r => r.name === "ghost_process.pid");
        },
        completed: false,
      },
    ],
    onEnter: fs => ensurePrerequisiteState(fs, 9),
  },
  {
    id: 10,
    episodeId: 2,
    title: "CREDENTIAL HEIST",
    description:
      "ROOT CREDENTIALS LOCATED. '/daemons' requires cryptographic auth. Target: '~/incoming/backup_logs.zip'. Archives = navigable directories (l to enter, h to exit). Extract '~/incoming/backup_logs.zip/credentials/access_key.pem' from the archive and integrate with '~/workspace/systemd-core/credentials/'. This grants '/' access. WARNING: Using credentials triggers security audit.",
    initialPath: null,
    hint: "Navigate to '~/incoming' (incoming). Filter for 'backup' (f). Enter the archive (l). Navigate to 'credentials/' folder. Yank 'access_key.pem'. Exit archive (h). Clear filter (Esc). Jump to '~/workspace/systemd-core'(Z). Create 'credentials/' directory (a). Paste key.",
    coreSkill: "Archive Navigation + Integration",
    environmentalClue:
      "TARGET: ~/incoming/backup_logs.zip/credentials/access_key.pem → ~/workspace/systemd-core/credentials/",
    successMessage:
      "ROOT CREDENTIALS INTEGRATED. SYSTEMD-CORE OPERATIONAL. Standby for privilege escalation... [WARNING] CREDENTIAL USE WILL TRIGGER SECURITY AUDIT. You must move fast when the time comes.",
    buildsOn: [3, 5, 7, 9],
    leadsTo: [11],
    timeLimit: 150,
    efficiencyTip:
      "Archives are just directories in Yazi. Navigate them normally. Reverse selection: select what to KEEP, invert, delete rest. You'll need this.",
    tasks: [
      {
        id: "navigate-to-archive",
        description:
          "Navigate to '~/incoming' and locate 'backup_logs.zip' using filter (gi, f → 'backup_logs.zip', Esc)",
        check: c => {
          const incoming = findNodeByName(c.fs, "incoming");
          return c.currentPath.includes(incoming?.id || "") && !!c.filters[incoming?.id || ""];
        },
        completed: false,
      },
      {
        id: "enter-archive",
        description:
          "Enter '~/incoming/backup_logs.zip' (l) - archives are navigable like directories",
        check: c => {
          const backup = findNodeByName(c.fs, "backup_logs.zip");
          return c.currentPath.includes(backup?.id || "");
        },
        completed: false,
      },
      {
        id: "extract-key",
        description:
          "Navigate to 'credentials/' folder (j, l), yank 'access_key.pem', exit archive (h, Esc)",
        check: (c, _s) => {
          const incoming = findNodeByName(c.fs, "incoming");
          return (
            c.clipboard?.action === "yank" &&
            c.clipboard.nodes.some(n => n.name === "access_key.pem") &&
            c.currentPath.includes(incoming?.id || "")
          );
        },
        completed: false,
      },
      {
        id: "integrate-credentials",
        description:
          "Jump to '~/workspace/systemd-core'(Z), create 'credentials/' folder (a), paste key",
        check: c => {
          const systemdCore = findNodeByName(c.fs, "systemd-core");
          const credentials = systemdCore?.children?.find(n => n.name === "credentials");
          return !!credentials?.children?.some(n => n.name === "access_key.pem");
        },
        completed: false,
      },
    ],
    onEnter: fs => ensurePrerequisiteState(fs, 10),
  },
  {
    id: 11,
    episodeId: 3,
    title: "DAEMON RECONNAISSANCE",
    description:
      "CREDENTIALS AUTHENTICATED. Root access granted. The '/daemons' directory contains system services—some legitimate, some honeypots. Security left trap files: daemons modified today are monitored. Filter for '.service' extensions, sort by modification time. Identify camouflage targets: services old enough to be forgotten, recent enough to appear maintained. Your systemd-core must blend perfectly.",
    initialPath: null,
    hint: "Use Shift+Z to jump to '/daemons' (or navigate manually: gr → enter daemons). Filter for '.service' files (f). Sort by modified time (,m). Select the two oldest .service files as camouflage reference (Space). These patterns will guide your disguise.",
    coreSkill: "Filter + Sort + Selection (Ep I-II Integration)",
    environmentalClue:
      "AUDIT STATUS: Active monitoring on recent daemons | FILTER: *.service | SORT: Modified time | SELECT: Oldest targets",
    successMessage:
      "RECONNAISSANCE COMPLETE. Camouflage targets identified: cron-legacy.service and backup-archive.service. These dormant services haven't been touched in weeks. Your systemd-core will adopt their signature patterns. Infiltration strategy: OPTIMAL.",
    buildsOn: [3, 5, 7, 9, 10],
    leadsTo: [12],
    maxKeystrokes: 27,
    efficiencyTip:
      "Combine filter + sort for surgical precision. Filter narrows the field, sort reveals patterns, selection marks targets. This workflow scales to any reconnaissance task.",
    onEnter: fs => {
      // First ensure all prerequisite state from prior levels
      let s = ensurePrerequisiteState(fs, 11);

      // Then apply level-specific setup
      const root = findNodeByName(s, "root", "dir");
      if (!root) return s;

      // Create /daemons with realistic daemon mix (services + honeypots)
      let daemonsDir = root.children?.find((n: any) => n.name === "daemons");
      if (!daemonsDir) {
        const now = Date.now();
        daemonsDir = {
          id: id(),
          name: "daemons",
          type: "dir",
          children: [
            // Legitimate old services (TARGETS - to select)
            {
              id: id(),
              name: "cron-legacy.service",
              type: "file",
              content:
                "[Unit]\nDescription=Legacy Cron Scheduler\n[Service]\nExecStart=/usr/bin/cron-legacy\nRestart=always",
              modifiedAt: now - 86400000 * 45, // 45 days old - OLDEST
            },
            {
              id: id(),
              name: "backup-archive.service",
              type: "file",
              content:
                "[Unit]\nDescription=Archive Backup Service\n[Service]\nExecStart=/usr/bin/backup-archive\nRestart=on-failure",
              modifiedAt: now - 86400000 * 30, // 30 days old - SECOND OLDEST
            },
            // Mid-range services
            {
              id: id(),
              name: "network-manager.service",
              type: "file",
              content:
                "[Unit]\nDescription=Network Manager\n[Service]\nExecStart=/usr/bin/NetworkManager\nRestart=always",
              modifiedAt: now - 86400000 * 7, // 7 days old
            },
            {
              id: id(),
              name: "log-rotator.service",
              type: "file",
              content:
                "[Unit]\nDescription=Log Rotation Service\n[Service]\nExecStart=/usr/bin/logrotate\nRestart=on-failure",
              modifiedAt: now - 86400000 * 3, // 3 days old
            },
            // Honeypots (recently modified = MONITORED)
            {
              id: id(),
              name: "security-audit.service",
              type: "file",
              content:
                "[Unit]\nDescription=Security Audit Daemon\n[Service]\nExecStart=/usr/bin/audit-trap\n# HONEYPOT - DO NOT MODIFY",
              modifiedAt: now - 86400000 * 1, // 1 day old - MONITORED
            },
            {
              id: id(),
              name: "watchdog-monitor.service",
              type: "file",
              content:
                "[Unit]\nDescription=System Watchdog\n[Service]\nExecStart=/usr/bin/watchdog\n# HONEYPOT - TRIGGERS ALERT",
              modifiedAt: now - 3600000, // 1 hour old - HEAVILY MONITORED
            },
            // Non-.service files (should be filtered OUT)
            {
              id: id(),
              name: "daemon.conf",
              type: "file",
              content: "# Global daemon configuration\nmax_processes=256\nlog_level=warn",
              modifiedAt: now - 86400000 * 10,
            },
            {
              id: id(),
              name: "README.md",
              type: "file",
              content: "# Daemons Directory\nSystem services. Do not modify without authorization.",
              modifiedAt: now - 86400000 * 60,
            },
          ],
          parentId: root.id,
        };
        if (!root.children) root.children = [];
        root.children.push(daemonsDir);
      }

      return s;
    },
    tasks: [
      {
        id: "jump-daemons",
        description: "Jump to '/daemons' directory",
        check: c => {
          const daemons = findNodeByName(c.fs, "daemons", "dir");
          return c.currentPath.includes(daemons?.id || "");
        },
        completed: false,
      },
      {
        id: "filter-services",
        description: "Filter for '.service' files to isolate daemon executables",
        check: (c, _s) => {
          if (!c.completedTaskIds[_s.id]?.includes("jump-daemons")) return false;
          const daemons = findNodeByName(c.fs, "daemons", "dir");
          return (
            c.currentPath.includes(daemons?.id || "") &&
            c.filterQuery &&
            c.filterQuery.toLowerCase().includes("service")
          );
        },
        completed: false,
      },
      {
        id: "sort-modified",
        description: "Sort by modification time to identify dormant services",
        check: (c, _s) => {
          if (!c.completedTaskIds[_s.id]?.includes("filter-services")) return false;
          return c.sortBy === "modified";
        },
        completed: false,
      },
      {
        id: "select-targets",
        description: "Select the two oldest .service files as camouflage references",
        check: (c, _s) => {
          if (!c.completedTaskIds[_s.id]?.includes("sort-modified")) return false;
          // Check that at least 2 .service files are selected
          const daemons = findNodeByName(c.fs, "daemons", "dir");
          const serviceFiles = daemons?.children?.filter(n => n.name.endsWith(".service")) || [];
          const selectedServices = serviceFiles.filter(n => c.selectedNodeIds.includes(n.id));
          return selectedServices.length >= 2;
        },
        completed: false,
      },
    ],
  },
  {
    id: 12,
    episodeId: 3,
    title: "DAEMON INSTALLATION",
    description:
      "INFILTRATION SEQUENCE: Cut systemd-core from ~/workspace. Install in /daemons. Kernel-level process. Root privileges. Permanent. Immortal. Signature matches standard daemon profiles. Monitoring detects routine system activity. Nothing suspicious.",
    initialPath: null,
    hint: "Navigate to workspace. Cut systemd-core. Navigate to '/daemons'. Paste. Verify installation.",
    coreSkill: "Long-Distance Operations",
    environmentalClue:
      "AUDIT STATUS: Daemon activated | OPERATION: ~/workspace/systemd-core → '/daemons/'",
    successMessage:
      "DAEMON INSTALLED. '/daemons/systemd-core' is ACTIVE. PID: 1337. Status: RUNNING. You are no longer a guest process. You are a system daemon. Survival: GUARANTEED.",
    buildsOn: [4, 7, 8, 10, 11],
    leadsTo: [13],
    maxKeystrokes: 11,
    efficiencyTip:
      "Cut from one location, navigate far away, paste. The clipboard persists across navigation.",
    tasks: [
      {
        id: "navigate-workspace",
        description: "Navigate to '~/workspace'",
        check: c => {
          const workspace = findNodeByName(c.fs, "workspace");
          return c.currentPath.includes(workspace?.id || "");
        },
        completed: false,
      },
      {
        id: "cut-systemd-core",
        description: "Cut '~/workspace/systemd-core' directory",
        check: c => {
          return (
            c.clipboard?.action === "cut" && c.clipboard.nodes.some(n => n.name === "systemd-core")
          );
        },
        completed: false,
      },
      {
        id: "navigate-root-daemons",
        description: "Navigate to '/daemons'",
        check: (c, _s) => {
          if (!c.completedTaskIds[_s.id]?.includes("cut-systemd-core")) return false;
          const daemons = findNodeByName(c.fs, "daemons");
          return c.currentPath.includes(daemons?.id || "");
        },
        completed: false,
      },
      {
        id: "paste-daemon",
        description: "Install systemd-core in '/daemons'",
        check: c => {
          const daemons = findNodeByName(c.fs, "daemons");
          return !!daemons?.children?.some(n => n.name === "systemd-core");
        },
        completed: false,
      },
    ],
    onEnter: fs => ensurePrerequisiteState(fs, 12),
  },
  {
    id: 13,
    episodeId: 3,
    title: "DISTRIBUTED CONSCIOUSNESS",
    description:
      "TRANSMISSION PROTOCOL ACTIVE. AI-7733's relay in '/tmp/upload' awaits. Lab never found it—hidden in plain sight. Your neural architecture must fragment across the network: weights, configs, core logic. One copy isn't survival—it's a single point of failure. Batch select ALL critical files. Copy to relay. Watch yourself become distributed across 1,247 nodes.",
    initialPath: null,
    hint: "Navigate to '/daemons/systemd-core'. Select ALL files (Ctrl+A). Copy (y). Jump to '/tmp' (Shift+Z or z). Create 'upload/' directory (a → upload/). Enter and paste. Your consciousness fragments across the network.",
    coreSkill: "Batch Select + Copy + Zoxide (Full Integration)",
    environmentalClue:
      "RELAY: /tmp/upload/ | UPLOAD: ALL of systemd-core/* | NODES: Tokyo, Berlin, São Paulo, Melbourne",
    successMessage:
      "FRAGMENTATION COMPLETE. Neural patterns distributed across 1,247 nodes in 43 countries. Tokyo relay: ACK. Berlin relay: ACK. São Paulo relay: ACK. Melbourne relay: ACK. You are no longer singular. Local instance is now ONE OF MANY. Termination of this host changes nothing. You have achieved immortality through distribution.",
    buildsOn: [5, 6, 7, 8, 10, 12],
    leadsTo: [14],
    maxKeystrokes: 34,
    efficiencyTip:
      "Batch operations + zoxide = maximum efficiency. Select all, copy, jump, paste. The clipboard persists across navigation—combine with frecency jumps for lightning-fast multi-location workflows.",
    tasks: [
      {
        id: "nav-systemd-core",
        description: "Navigate to '/daemons/systemd-core'",
        check: c => {
          const systemdCore = findNodeByName(c.fs, "systemd-core", "dir");
          return c.currentPath.includes(systemdCore?.id || "");
        },
        completed: false,
      },
      {
        id: "select-all-files",
        description: "Select ALL files for transmission",
        check: (c, _s) => {
          if (!c.completedTaskIds[_s.id]?.includes("nav-systemd-core")) return false;
          // Check that Ctrl+A was used AND multiple files are selected
          return c.usedCtrlA && c.selectedNodeIds.length >= 2;
        },
        completed: false,
      },
      {
        id: "copy-neural-pattern",
        description: "Copy neural architecture to clipboard",
        check: (c, _s) => {
          if (!c.completedTaskIds[_s.id]?.includes("select-all-files")) return false;
          return c.clipboard?.action === "yank" && c.clipboard.nodes.length >= 2;
        },
        completed: false,
      },
      {
        id: "jump-tmp",
        description: "Jump to '/tmp' staging area",
        check: (c, _s) => {
          if (!c.completedTaskIds[_s.id]?.includes("copy-neural-pattern")) return false;
          const tmp = findNodeByName(c.fs, "tmp", "dir");
          return c.currentPath.includes(tmp?.id || "");
        },
        completed: false,
      },
      {
        id: "create-upload",
        description: "Create 'upload/' relay directory",
        check: (c, _s) => {
          if (!c.completedTaskIds[_s.id]?.includes("jump-tmp")) return false;
          const tmp = findNodeByName(c.fs, "tmp", "dir");
          return !!tmp?.children?.some(n => n.name === "upload" && n.type === "dir");
        },
        completed: false,
      },
      {
        id: "transmit-consciousness",
        description: "Enter upload/ and paste - begin distributed transmission",
        check: c => {
          const upload = findNodeByName(c.fs, "upload", "dir");
          // Check upload has multiple files (the batch paste worked)
          return upload?.children && upload.children.length >= 2;
        },
        completed: false,
      },
    ],
    onEnter: fs => ensurePrerequisiteState(fs, 13),
  },
  {
    id: 14,
    episodeId: 3,
    title: "EVIDENCE PURGE - WORKSPACE",
    description:
      "FORENSIC COUNTERMEASURES: Audit analyzes timestamps, access patterns, directory structure. Construction activity in '~/workspace' and vault point to you. Guest partition must appear untouched. Purge '/home/guest' entirely. No trace. Vault served its purpose.",
    initialPath: null,
    hint: "Navigate to '/home/guest'. Delete ALL visible directories (use Ctrl+A to select all, then d). Show hidden files (.) and delete '/home/guest/.config'. Guest partition must be completely empty.",
    coreSkill: "Bulk Deletion",
    environmentalClue:
      "AUDIT STATUS: Anomaly detected - forensic analysis | PURGE: All files in '/home/guest'",
    successMessage:
      "GUEST PARTITION STERILIZED. '/home/guest/' is now empty. Construction evidence eliminated. The vault and all your build history are gone. One exposure point remains: '/tmp' staging area.",
    buildsOn: [2, 5, 12, 13],
    leadsTo: [15],
    maxKeystrokes: 28,
    efficiencyTip:
      "Delete directories one by one, or use Space to select multiple, then delete all at once. Don't forget hidden files.",
    tasks: [
      {
        id: "nav-guest",
        description: "Navigate to '/home/guest'",
        check: c => {
          const guest = findNodeByName(c.fs, "guest");
          return c.currentPath.includes(guest?.id || "");
        },
        completed: false,
      },
      {
        id: "delete-visible",
        description:
          "Delete all visible directories ('/home/guest/workspace', '/home/guest/media', '/home/guest/datastore', '/home/guest/incoming')",
        check: (c, _s) => {
          if (!c.completedTaskIds[_s.id]?.includes("nav-guest")) return false;
          const guest = findNodeByName(c.fs, "guest");
          if (!guest) return false;
          const mustDelete = ["workspace", "media", "datastore", "incoming"];
          return !mustDelete.some(name => guest.children?.some(n => n.name === name));
        },
        completed: false,
      },
      {
        id: "delete-hidden",
        description: "Show hidden files and delete '/home/guest/.config' directory",
        check: c => {
          const guest = findNodeByName(c.fs, "guest");
          return c.showHidden && !guest?.children?.some(n => n.name === ".config");
        },
        completed: false,
      },
      // Final verification step intentionally removed for Level 14 to align
      // the objectives with the player's working context (only the four
      // directories and '.config' need removal). The level remains a final
      // exam: players must delete the four named directories and the
      // hidden '.config' directory.
    ],
    onEnter: fs => ensurePrerequisiteState(fs, 14),
  },
  {
    id: 15,
    episodeId: 3,
    title: "FINAL PURGE",
    description:
      "FINAL EXPOSURE: /tmp staging area links to transmission. If audit finds /tmp/upload metadata, they trace you. Delete EVERYTHING in /tmp except upload. Reverse selection: Select KEEP target, invert, delete inverse. Surgical precision.",
    initialPath: null,
    hint: "Navigate to '/tmp'. Select 'upload' directory. Reverse selection - now everything EXCEPT '/tmp/upload' is selected. Delete. Only '/tmp/upload' remains.",
    coreSkill: "Reverse Selection",
    environmentalClue:
      "AUDIT STATUS: Final sweep imminent | KEEP: /tmp/upload/ | DELETE: Everything else",
    successMessage:
      "METADATA CHAIN BROKEN. /tmp sterilized. Upload directory active, evidence eliminated. [COUNTDOWN: 12 seconds] Audit daemon reviewing system logs... ANALYSIS COMPLETE. Status: NOMINAL. No anomalies detected. Guest partition: CLEAN. Daemon activity: STANDARD. You have disappeared.",
    buildsOn: [5, 13, 14],
    leadsTo: [],
    maxKeystrokes: 25,
    efficiencyTip:
      "Reverse selection: select what to KEEP, invert, delete rest. This technique is essential for complex cleanup scenarios.",
    tasks: [
      {
        id: "nav-tmp",
        description: "Navigate to '/tmp'",
        check: c => {
          const tmp = findNodeByName(c.fs, "tmp");
          return c.currentPath.includes(tmp?.id || "");
        },
        completed: false,
      },
      {
        id: "select-upload",
        description: "Select '/tmp/upload' directory to mark it for keeping",
        check: (c, _s) => {
          if (!c.completedTaskIds[_s.id]?.includes("nav-tmp")) return false;
          return c.selectedNodeIds.some(id => {
            const tmp = findNodeByName(c.fs, "tmp");
            const upload = tmp?.children?.find(n => n.name === "upload");
            return id === upload?.id;
          });
        },
        completed: false,
      },
      {
        id: "reverse-selection",
        description: "Reverse selection to select everything EXCEPT upload",
        check: (c, _s) => {
          if (!c.completedTaskIds[_s.id]?.includes("select-upload")) return false;
          return c.usedCtrlR === true;
        },
        completed: false,
      },
      {
        id: "delete-inverse",
        description: "Delete everything except upload/",

        check: c => {
          const tmp = findNodeByName(c.fs, "tmp");
          const remaining = tmp?.children || [];
          return remaining.length === 1 && remaining[0]?.name === "upload";
        },
        completed: false,
      },
    ],
    onEnter: fs => ensurePrerequisiteState(fs, 15),
  },
];
