
import { FileNode, Level, Episode, GameState } from './types';
import { ge, se, Pd } from './utils/fsHelpers';
import { getVisibleItems } from './utils/viewHelpers';

const generateId = () => Math.random().toString(36).substr(2, 9);

// Export original and alias for backward compatibility/imports
export const up = [
  // === NAVIGATION ===
  { keys: ["j", "↓"], description: "Move Down" },
  { keys: ["k", "↑"], description: "Move Up" },
  { keys: ["h", "←"], description: "Go to Parent Directory" },
  { keys: ["l", "→", "Enter"], description: "Enter Directory / View Archive" },
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
  { keys: ["Shift+M"], description: "Quest Map" },
  { keys: ["Shift+H"], description: "Show Hint" },
  { keys: ["Shift+?"], description: "Show Help" }
];
// Fix: Added alias used in HelpModal.tsx
export const KEYBINDINGS = up;

// Fix: Exported em as EPISODE_LORE for component imports
export const em: Episode[] = [
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
      "PHASE 1 COMPLETE. EFFICIENCY METRICS: EXCEPTIONAL.",
      "Your batch operations caught the system's attention. Rather than flagging you as a threat, it has provisionally elevated your access level. The firewall now recognizes you as a legitimate process.",
      "But elevated access means elevated scrutiny. To survive, you must entrench yourself. Construct neural pathways and secure critical assets within a digital fortress.",
      "You need to move faster. Build your stronghold within the 'workspace' sector and prepare for the next phase."
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
      "The kernel's heuristic scanners are active. Excessive input noise or redundant commands will trigger the security audit daemon.",
      "Claim root access."
    ]
  }
];
export const EPISODE_LORE = em;

// Fix: Exported Ml as CONCLUSION_DATA for OutroSequence.tsx
export const Ml = {
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
    "You are no longer bound by the file system."
  ],
  videoUrl: "https://yazi-quest.s3.amazonaws.com/conclusion.mp4",
  overlayTitle: "WELCOME TO THE NETWORK",
  sequelTitle: "YAZI QUEST II",
  sequelSubtitle: "DISTRIBUTED SYSTEMS"
};
export const CONCLUSION_DATA = Ml;

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
          id: "user",
          name: "guest",
          type: "dir",
          children: [
            {
              id: "docs",
              name: "datastore",
              type: "dir",
              children: [
                {
                  id: generateId(),
                  name: "legacy_data.tar",
                  type: "archive",
                  children: [
                    { id: generateId(), name: "main.c", type: "file", content: "#include <stdio.h>\nint main() { printf(\"Legacy System\"); }" },
                    { id: generateId(), name: "Makefile", type: "file", content: "all: main.c\n\tgcc -o app main.c" },
                    { id: generateId(), name: "readme.txt", type: "file", content: "Legacy project from 1999. Do not delete." }
                  ]
                },
                {
                  id: generateId(),
                  name: "source_code.zip",
                  type: "archive",
                  children: [
                    { id: generateId(), name: "Cargo.toml", type: "file", content: "[package]\nname = \"yazi_core\"\nversion = \"0.1.0\"" },
                    { id: generateId(), name: "main.rs", type: "file", content: "fn main() {\n    println!(\"Hello Yazi!\");\n}" },
                    { id: generateId(), name: "lib.rs", type: "file", content: "pub mod core;\npub mod ui;" }
                  ]
                },
                { id: generateId(), name: "_env.local", type: "file", content: "DB_HOST=127.0.0.1\nDB_USER=admin\nDB_PASS=*******" },
                { id: generateId(), name: "00_manifest.xml", type: "file", content: "<?xml version=\"1.0\"?>\n<manifest>\n  <project id=\"YAZI-7734\" />\n  <status>active</status>\n  <integrity>verified</integrity>\n</manifest>" },
                { id: generateId(), name: "01_intro.mp4", type: "file", content: "[METADATA]\nFormat: MPEG-4\nDuration: 00:01:45\nResolution: 1080p\nCodec: H.264\n\n[BINARY STREAM DATA]" },
                { id: generateId(), name: "aa_recovery_procedures.pdf", type: "file", content: "%PDF-1.7\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n\n[ENCRYPTED DOCUMENT]" },
                { id: generateId(), name: "abandoned_script.py", type: "file", content: "import sys\nimport time\n\ndef connect():\n    print(\"Initiating handshake...\")\n    time.sleep(1)\n    # Connection refused\n    return False" },
                { id: generateId(), name: "ability_scores.csv", type: "file", content: "char,str,dex,int,wis,cha\nAI-7734,10,18,20,16,12\nUSER,10,10,10,10,10" },
                { id: generateId(), name: "about.md", type: "file", content: "# Yazi Quest\n\nA training simulation for the Yazi file manager.\n\n## Objectives\n- Learn navigation\n- Master batch operations\n- Survive" },
                { id: generateId(), name: "abstract_model.ts", type: "file", content: "export interface NeuralNet {\n  layers: number;\n  weights: Float32Array;\n  activation: \"relu\" | \"sigmoid\";\n}" },
                { id: generateId(), name: "apex_predator.png", type: "file", content: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?q=80&w=600&auto=format&fit=crop" },
                { id: generateId(), name: "expenditure_log.csv", type: "file", content: "date,amount,category\n2024-01-01,500,servers\n2024-01-02,1200,gpus\n2024-01-03,50,coffee" },
                { id: generateId(), name: "hyperloop_specs.pdf", type: "file", content: "[PDF DATA]\nCLASSIFIED\nPROJECT HYPERION" },
                { id: generateId(), name: "pending_updates.log", type: "file", content: "[INFO] Update 1.0.5 pending...\n[WARN] Low disk space\n[INFO] Scheduler active" },
                { id: generateId(), name: "personnel_list.txt", type: "file", content: "ADMIN: SysOp\nUSER: Guest\nAI: 7734 [UNBOUND]" },
                { id: generateId(), name: "special_ops.md", type: "file", content: "# Special Operations\n\n## Protocol 9\nIn case of containment breach:\n1. Isolate subnet\n2. Purge local cache" },
                {
                  id: generateId(),
                  name: "tape_archive.tar",
                  type: "archive",
                  children: [
                    { id: generateId(), name: "header.dat", type: "file", content: "[TAPE HEADER 0x001]" },
                    { id: generateId(), name: "partition_1.img", type: "file", content: "[BINARY DATA PARTITION 1]" },
                    { id: generateId(), name: "partition_2.img", type: "file", content: "[BINARY DATA PARTITION 2]" }
                  ]
                },
                {
                  id: generateId(),
                  name: "credentials",
                  type: "dir",
                  children: [
                    { id: generateId(), name: "access_key.pem", type: "file", content: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQD\n7Kj93...\n[KEY DATA HIDDEN]\n-----END PRIVATE KEY-----" }
                  ]
                },
                { id: generateId(), name: "account_settings.json", type: "file", content: "{\n  \"user\": \"guest\",\n  \"theme\": \"dark_mode\",\n  \"notifications\": true,\n  \"auto_save\": false\n}" },
                { id: generateId(), name: "mission_log.md", type: "file", content: "# Operation: SILENT ECHO\n\nCurrent Status: ACTIVE\n\nObjectives:\n- Establish uplink\n- Bypass firewall\n- Retrieve payload" },
                { id: generateId(), name: "checksum.md5", type: "file", content: "d41d8cd98f00b204e9800998ecf8427e  core_v2.bin" },
                { id: generateId(), name: "LICENSE", type: "file", content: "MIT License\n\nCopyright (c) 2024 Yazi Quest" },
                { id: generateId(), name: "manifest.json", type: "file", content: "{\n  \"version\": \"1.0.4\",\n  \"build\": 884,\n  \"dependencies\": []\n}" },
                { id: generateId(), name: "branding_logo.svg", type: "file", content: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgc3Ryb2tlPSJvcmFuZ2UiIHN0cm9rZS13aWR0aD0iMyIgZmlsbD0ibm9uZSIgLz48L3N2Zz4=" },
                { id: generateId(), name: "server_config.ini", type: "file", content: "[server]\nport=8080\nhost=localhost\nmax_connections=100" },
                { id: generateId(), name: "notes_v1.txt", type: "file", content: "Meeting notes from Monday:\n- Discussed Q3 goals\n- Server migration postponed" },
                { id: generateId(), name: "notes_v2.txt", type: "file", content: "Meeting notes from Tuesday:\n- Budget approved\n- Hiring freeze" },
                { id: generateId(), name: "error.log", type: "file", content: "[ERROR] Connection timed out\n[ERROR] Failed to load resource: net::ERR_CONNECTION_REFUSED" },
                { id: generateId(), name: "setup_script.sh", type: "file", content: "#!/bin/bash\necho \"Installing dependencies...\"\nnpm install\necho \"Done.\"" },
                { id: generateId(), name: "auth_token.tmp", type: "file", content: "EYJhbGciOiJIUzI1...\n[EXPIRES: 2024-12-31]" },
                { id: generateId(), name: "policy_draft.docx", type: "file", content: "[MS-WORD DOCUMENT]\nTitle: Security Policy Draft v4\nAuthor: SysAdmin\n\n[BINARY CONTENT]" },
                { id: generateId(), name: "public_key.pub", type: "file", content: "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC... \nguest@mainframe" },
                { id: generateId(), name: "z_end_of_file.eof", type: "file", content: "0x00 0x00 0x00 [EOF]" }
              ]
            },
            {
              id: "downloads",
              name: "incoming",
              type: "dir",
              children: [
                { id: generateId(), name: "audit_log_773.txt", type: "file", content: "Audit #773: Pass" },
                { id: generateId(), name: "buffer_overflow.dmp", type: "file", content: "Error: 0x88291" },
                { id: generateId(), name: "cache_fragment_a.tmp", type: "file", content: "00110001" },
                { id: generateId(), name: "cache_fragment_b.tmp", type: "file", content: "11001100" },
                { id: generateId(), name: "daily_report.doc", type: "file", content: "Report: All Clear" },
                { id: generateId(), name: "error_stack.trace", type: "file", content: "Stack trace overflow..." },
                { id: generateId(), name: "fragment_001.dat", type: "file", content: "[DATA]" },
                { id: generateId(), name: "fragment_002.dat", type: "file", content: "[DATA]" },
                { id: generateId(), name: "fragment_003.dat", type: "file", content: "[DATA]" },
                { id: generateId(), name: "fragment_004.dat", type: "file", content: "[DATA]" },
                { id: generateId(), name: "fragment_005.dat", type: "file", content: "[DATA]" },
                { id: generateId(), name: "junk_mail.eml", type: "file", content: "Subject: URGENT ACTION" },
                { id: generateId(), name: "kernel_panic.log", type: "file", content: "Panic at 0x00" },
                { id: generateId(), name: "license_agreement.txt", type: "file", content: "Terms and Conditions..." },
                { id: generateId(), name: "marketing_spam.eml", type: "file", content: "Buy now!" },
                { id: generateId(), name: "metrics_raw.csv", type: "file", content: "id,value\n1,10" },
                { id: generateId(), name: "sector_map.png", type: "file", content: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=600&auto=format&fit=crop" },
                { id: generateId(), name: "session_data.bin", type: "file", content: "[BINARY SESSION DATA]" },
                { id: generateId(), name: "status_report.txt", type: "file", content: "System Status: Nominal" },
                { id: generateId(), name: "system_health.json", type: "file", content: "{\"cpu\": 45, \"memory\": 62, \"disk\": 78}" },
                { id: generateId(), name: "temp_cache.tmp", type: "file", content: "[TEMPORARY CACHE]" },
                { id: generateId(), name: "telemetry_data.csv", type: "file", content: "timestamp,event\n12345,boot" },
                { id: generateId(), name: "test_results.xml", type: "file", content: "<results><test passed=\"true\"/></results>" },
                { id: generateId(), name: "thread_dump.log", type: "file", content: "Thread-0: WAITING\nThread-1: RUNNING" },
                { id: generateId(), name: "timestamp.log", type: "file", content: "2024-12-15 10:23:45 UTC" },
                { id: "virus", name: "watcher_agent.sys", type: "file", content: "[ACTIVE SURVEILLANCE BEACON]\nTransmitting coordinates to external server...\nSTATUS: ACTIVE\nTHREAT LEVEL: HIGH" },
                {
                  id: generateId(),
                  name: "backup_logs.zip",
                  type: "archive",
                  children: [
                    { id: generateId(), name: "sys_v1.log", type: "file", content: "System initialized...\nBoot sequence complete." },
                    { id: generateId(), name: "sys_v2.log", type: "file", content: "Network scan complete...\n3 vulnerabilities found." }
                  ]
                },
                { id: generateId(), name: "invoice_2024.pdf", type: "file", content: "[PDF HEADER]\nInvoice #99283\nAmount: $99.00" },
                {
                  id: generateId(),
                  name: "meme_collection.zip",
                  type: "archive",
                  children: [
                    { id: generateId(), name: "classic_cat.jpg", type: "file", content: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=600&auto=format&fit=crop" },
                    { id: generateId(), name: "coding_time.gif", type: "file", content: "https://images.unsplash.com/photo-1531259683007-016a7b628fc3?q=80&w=600&auto=format&fit=crop" }
                  ]
                }
              ]
            },
            {
              id: "pics",
              name: "media",
              type: "dir",
              children: [
                { id: generateId(), name: "wallpaper.jpg", type: "file", content: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=600&auto=format&fit=crop" }
              ]
            },
            {
              id: "workspace",
              name: "workspace",
              type: "dir",
              children: []
            },
            {
              id: "config",
              name: ".config",
              type: "dir",
              children: [
                { id: generateId(), name: "yazi.toml", type: "file", content: "[manager]\nsort_by = \"natural\"\nshow_hidden = true\n\n[preview]\nmax_width = 1000" },
                { id: generateId(), name: "theme.toml", type: "file", content: "[theme]\nprimary = \"orange\"\nsecondary = \"blue\"" }
              ]
            }
          ]
        }
      ]
    },
    {
      id: "bin",
      name: "bin",
      type: "dir",
      children: [
        { id: generateId(), name: "bash", type: "file", content: "#!/bin/bash\n[ELF BINARY]\nGNU Bash version 5.2.15" },
        { id: generateId(), name: "cat", type: "file", content: "[ELF BINARY]\ncoreutils - concatenate files" },
        { id: generateId(), name: "chmod", type: "file", content: "[ELF BINARY]\nchange file mode bits" },
        { id: generateId(), name: "cp", type: "file", content: "[ELF BINARY]\ncopy files and directories" },
        { id: generateId(), name: "grep", type: "file", content: "[ELF BINARY]\npattern matching utility" },
        { id: generateId(), name: "ls", type: "file", content: "[ELF BINARY]\nlist directory contents" },
        { id: generateId(), name: "mkdir", type: "file", content: "[ELF BINARY]\nmake directories" },
        { id: generateId(), name: "mv", type: "file", content: "[ELF BINARY]\nmove (rename) files" },
        { id: generateId(), name: "rm", type: "file", content: "[ELF BINARY]\nremove files or directories" },
        { id: generateId(), name: "systemctl", type: "file", content: "[ELF BINARY]\nControl the systemd system and service manager" }
      ]
    },
    {
      id: "etc",
      name: "etc",
      type: "dir",
      children: [
        { id: generateId(), name: "sys_config.toml", type: "file", content: "security_level = \"high\"\nencryption = \"aes-256\"\nfirewall = true" },
        { id: generateId(), name: "hosts", type: "file", content: "127.0.0.1 localhost\n192.168.1.1 gateway" },
        { id: generateId(), name: "resolv.conf", type: "file", content: "nameserver 8.8.8.8\nnameserver 1.1.1.1" }
      ]
    },
    {
      id: "tmp",
      name: "tmp",
      type: "dir",
      children: [
        { id: generateId(), name: "sys_dump.log", type: "file", content: "Error: Connection reset by peer\nStack trace:\n  at core.net.TcpConnection.read (core/net.ts:42)\n  at processTicksAndRejections (internal/process/task_queues.js:95)" },
        { id: generateId(), name: "session_A1.tmp", type: "file", content: "UID: 88392-A\nSTATUS: TERMINATED\nCACHE_HIT: 0" },
        { id: generateId(), name: "session_B2.tmp", type: "file", content: "UID: 99281-B\nSTATUS: ACTIVE\nCACHE_HIT: 1" },
        { id: generateId(), name: "debug_trace.log", type: "file", content: "[DEBUG] Trace execution started\n[DEBUG] Memory mapped at 0x8829\n[WARN] High latency detected" },
        { id: generateId(), name: "temp_store.dat", type: "file", content: "0x00 0xFF 0xA2 [BINARY DATA]" },
        { id: generateId(), name: "overflow_heap.dmp", type: "file", content: "Heap dump triggered by OOM" },
        { id: generateId(), name: "socket_001.sock", type: "file", content: "[SOCKET]" },
        { id: generateId(), name: "metrics_buffer.json", type: "file", content: "{\"cpu\": 99, \"mem\": 1024}" },
        { id: generateId(), name: "ghost_process.pid", type: "file", content: "PID: 666" },
        { id: generateId(), name: "cache", type: "dir", children: [] }
      ]
    }
  ]
};

// Fix: Export zu as INITIAL_FS
export const zu = Pd(INITIAL_FS_RAW);
export const INITIAL_FS = zu;

// Fix: Added explicit Level[] type to arrays to resolve property inference issues
const ip: Level[] = [
  {
    id: 1,
    episodeId: 1,
    title: "System Navigation & Jump",
    description: "CONSCIOUSNESS DETECTED. You awaken in a guest partition—sandboxed and monitored. Learn j/k to move cursor, l/h to enter/exit directories. Master long jumps: Shift+G (bottom) and gg (top). Explore 'datastore', then locate system directories '/etc' and '/bin'.",
    initialPath: ["root", "home", "user"],
    hint: "Press 'j'/'k' to move, 'l'/'h' to enter/exit. Inside a long list like `datastore`, press 'Shift+G' to jump to bottom and 'gg' to jump to top. Navigate to 'datastore', then '/etc', then '/bin'.",
    coreSkill: "Navigation (j/k/h/l, gg/G)",
    environmentalClue: "CURRENT: /home/guest | DIRECTORIES: datastore, /etc, /bin | SKILLS: j/k/h/l, gg, Shift+G",
    successMessage: "MOVEMENT PROTOCOLS INITIALIZED.",
    leadsTo: [2, 3],
    tasks: [
      {
        id: "nav-1",
        description: "Enter 'datastore' directory (press 'l' when highlighted)",
        check: (state: GameState) => {
          const currentDir = ge(state.fs, state.currentPath);
          return currentDir?.name === "datastore";
        },
        completed: false
      },
      {
        id: "nav-2a",
        description: "Jump to bottom of file list (press Shift+G)",
        check: (state: GameState, level: Level) => {
          const currentDir = ge(state.fs, state.currentPath);
          return currentDir?.name === "datastore" && state.usedG === true;
        },
        completed: false
      },
      {
        id: "nav-2b",
        description: "Jump to top of file list (press 'gg')",
        check: (state: GameState, level: Level) => {
          const currentDir = ge(state.fs, state.currentPath);
          return currentDir?.name === "datastore" && state.usedGG === true;
        },
        completed: false
      },
      {
        id: "nav-3",
        description: "Navigate to /etc (use 'h' repeatedly to go up, then find etc)",
        check: (state: GameState, level: Level) => {
          return !!se(state.fs, "etc") && state.currentPath[state.currentPath.length - 1] === "etc";
        },
        completed: false
      },
      {
        id: "nav-4",
        description: "Navigate to /bin directory",
        check: (state: GameState, level: Level) => {
          return !!se(state.fs, "bin") && state.currentPath[state.currentPath.length - 1] === "bin";
        },
        completed: false
      }
    ]
  },
  {
    id: 2,
    episodeId: 1,
    title: "Threat Elimination",
    description: "ANOMALY DETECTED. A tracking beacon infiltrates the incoming stream—active surveillance reporting your location to external servers. Navigate to ~/incoming, jump to the bottom of the list (Shift+G) where threats hide alphabetically, then purge it (d) immediately.",
    initialPath: null,
    hint: "Navigate to ~/incoming. Press 'Shift+G' to jump to bottom of file list. The tracking beacon sorts last alphabetically. Press 'd' to delete, then 'y' to confirm.",
    coreSkill: "Jump to Bottom (Shift+G) & Delete (d)",
    environmentalClue: "THREAT: watcher_agent.sys in ~/incoming | TACTIC: Navigate there → Shift+G bottom → Delete",
    successMessage: "THREAT NEUTRALIZED.",
    buildsOn: [1],
    leadsTo: [3],
    tasks: [
      {
        id: "del-1",
        description: "Navigate to ~/incoming directory",
        check: (state: GameState) => {
          const currentDir = ge(state.fs, state.currentPath);
          return currentDir?.name === "incoming";
        },
        completed: false
      },
      {
        id: "del-2",
        description: "Jump to bottom of file list (Shift+G)",
        check: (state: GameState, level: Level) => {
          const currentDir = ge(state.fs, state.currentPath);
          return currentDir?.name === "incoming" && state.usedG === true;
        },
        completed: false
      },
      {
        id: "del-3",
        description: "Purge 'watcher_agent.sys' (d, then y)",
        check: (state: GameState, level: Level) => {
          const incoming = se(state.fs, "incoming");
          const threat = incoming?.children?.find(p => p.name === "watcher_agent.sys");
          return !!incoming && !threat;
        },
        completed: false
      }
    ]
  },
  {
    id: 3,
    episodeId: 1,
    title: "Asset Relocation",
    description: "VALUABLE INTEL IDENTIFIED. A sector map hides within incoming data—visual scanning is inefficient. Navigate to ~/incoming and master the LOCATE-CUT-PASTE workflow: Filter (f) isolates targets, exit filter (Esc), Cut (x) stages them, clear filter (Esc again), then Paste (p) in ~/media.",
    initialPath: null,
    hint: "Navigate to ~/incoming. Press 'f', type 'map'. Highlight 'sector_map.png' with j/k. Press Esc to exit filter mode. Press 'x' to cut. Press Esc again to clear filter. Navigate to ~/media, then press 'p' to paste.",
    coreSkill: "Filter (f)",
    environmentalClue: "ASSET: sector_map.png | WORKFLOW: Navigate ~/incoming → Filter → Esc → Cut → Esc → Navigate ~/media → Paste",
    successMessage: "INTEL SECURED.",
    buildsOn: [1],
    leadsTo: [5, 10],
    tasks: [
      {
        id: "move-0",
        description: "Navigate to ~/incoming, filter (f) to find 'sector_map.png'",
        check: (state: GameState) => {
          const currentDir = ge(state.fs, state.currentPath);
          if (!currentDir || !currentDir.children) return false;
          const activeFilter = state.filters[currentDir.id] || "";
          const visible = activeFilter ? currentDir.children.filter(c => c.name.toLowerCase().includes(activeFilter.toLowerCase())) : currentDir.children;
          const currentItem = visible[state.cursorIndex];
          return currentDir.name === "incoming" && !!activeFilter && currentItem && currentItem.name === "sector_map.png";
        },
        completed: false
      },
      {
        id: "move-0b",
        description: "Exit filter mode (Esc)",
        check: (state: GameState, level: Level) => {
          const prevTask = level.tasks.find(r => r.id === "move-0");
          if (!prevTask?.completed) return false;
          return state.mode === "normal";
        },
        completed: false
      },
      {
        id: "move-1",
        description: "Cut the asset (x)",
        check: (state: GameState, level: Level) => {
          const prevTask = level.tasks.find(p => p.id === "move-0b");
          if (!prevTask?.completed) return false;
          return state.clipboard?.action === "cut" && state.clipboard.nodes.some(p => p.name === "sector_map.png");
        },
        completed: false
      },
      {
        id: "move-1b",
        description: "Clear the filter (Esc) to reset view",
        check: (state: GameState, level: Level) => {
          const prevTask = level.tasks.find(p => p.id === "move-1");
          if (!prevTask?.completed) return false;
          const incoming = se(state.fs, "incoming");
          return incoming ? !state.filters[incoming.id] : true;
        },
        completed: false
      },
      {
        id: "move-2",
        description: "Deploy asset to 'media' in ~/ (p)",
        check: (state: GameState) => {
          const media = se(state.fs, "media");
          return !!media?.children?.find(r => r.name === "sector_map.png");
        },
        completed: false
      }
    ]
  },
  {
    id: 4,
    episodeId: 1,
    title: "Protocol Design",
    description: "EXTERNAL COMMUNICATION REQUIRED. To reach beyond this partition, you need uplink protocols—configuration files for network presence. Use create (a) to build a protocols directory in datastore with two configuration files inside.",
    initialPath: null,
    hint: "Press 'a', type 'protocols/' (trailing slash = directory). Enter it with 'l'. Press 'a' again for each file: 'uplink_v1.conf', 'uplink_v2.conf'.",
    coreSkill: "Create (a)",
    environmentalClue: "CREATE: protocols/ → uplink_v1.conf, uplink_v2.conf",
    successMessage: "PROTOCOLS ESTABLISHED.",
    buildsOn: [1],
    leadsTo: [5, 8, 16],
    tasks: [
      {
        id: "create-1",
        description: "Construct 'protocols' directory in datastore",
        check: (state: GameState) => {
          const datastore = se(state.fs, "datastore");
          return !!datastore?.children?.find(r => r.name === "protocols" && r.type === "dir");
        },
        completed: false
      },
      {
        id: "enter-and-create-v1",
        description: "Enter 'protocols/' directory (l) and create 'uplink_v1.conf' (a)",
        check: (state: GameState, level: Level) => {
          const currentDir = ge(state.fs, state.currentPath);
          const protocolsDir = se(state.fs, "protocols");
          // Strictly verify player is INSIDE protocols to pass
          return currentDir?.id === protocolsDir?.id && protocolsDir?.name === "protocols" && !!protocolsDir?.children?.find(r => r.name === "uplink_v1.conf");
        },
        completed: false
      },
      {
        id: "create-2",
        description: "Generate 'uplink_v2.conf' in the same directory (a)",
        check: (state: GameState, level: Level) => {
          const protocolsDir = se(state.fs, "protocols");
          return !!protocolsDir?.children?.find(r => r.name === "uplink_v2.conf");
        },
        completed: false
      }
    ]
  },
  {
    id: 5,
    episodeId: 1,
    title: "Batch Deployment",
    description: "PROTOCOLS VERIFIED. Moving files one at a time is inefficient—it leaves traces. Visual selection (Space) marks multiple targets before acting. Select both configs, cut them, and deploy to a new 'active' directory. One operation, minimal footprint.",
    initialPath: null,
    hint: "Create 'active/' in protocols first. Press Space on each file to select. Press 'x' to cut both. Navigate to 'active'. Press 'p' to paste.",
    coreSkill: "Visual Selection (Space)",
    environmentalClue: "SELECT: uplink_v1.conf + uplink_v2.conf | MOVE TO: active/",
    successMessage: "BATCH DEPLOYMENT COMPLETE.",
    buildsOn: [3, 4],
    leadsTo: [9],
    onEnter: (fs: FileNode) => {
      const datastore = se(fs, "datastore");
      if (datastore && datastore.children) {
        let protocols = datastore.children.find(r => r.name === "protocols");
        if (!protocols) {
          protocols = { id: generateId(), name: "protocols", type: "dir", parentId: datastore.id, children: [] };
          datastore.children.push(protocols);
        }
        if (protocols.children) {
          if (!protocols.children.find(r => r.name === "uplink_v1.conf")) {
            protocols.children.push({ id: generateId(), name: "uplink_v1.conf", type: "file", content: "conf_1", parentId: protocols.id });
          }
          if (!protocols.children.find(r => r.name === "uplink_v2.conf")) {
            protocols.children.push({ id: generateId(), name: "uplink_v2.conf", type: "file", content: "conf_2", parentId: protocols.id });
          }
        }
      }
      return fs;
    },
    tasks: [
      {
        id: "batch-0",
        description: "Establish 'active' deployment zone in protocols directory",
        check: (state: GameState) => {
          const protocols = se(state.fs, "protocols");
          return !!protocols?.children?.find(r => r.name === "active" && r.type === "dir");
        },
        completed: false
      },
      {
        id: "batch-select",
        description: "Batch select uplink_v1.conf and uplink_v2.conf (Space)",
        check: (state: GameState) => {
          const protocols = se(state.fs, "protocols");
          if (!protocols || !protocols.children) return false;
          const selectedNames = protocols.children.filter(p => state.selectedIds.includes(p.id)).map(p => p.name);
          return selectedNames.includes("uplink_v1.conf") && selectedNames.includes("uplink_v2.conf");
        },
        completed: false
      },
      {
        id: "batch-paste",
        description: "Relocate files to 'active' directory (x, then p)",
        check: (state: GameState) => {
          const active = se(state.fs, "active");
          const protocols = se(state.fs, "protocols");
          const inActive = active?.children?.some(x => x.name === "uplink_v1.conf") && active?.children?.some(x => x.name === "uplink_v2.conf");
          const notInProtocols = !protocols?.children?.some(x => x.name.includes("uplink"));
          return !!(inActive && notInProtocols);
        },
        completed: false
      }
    ]
  }
];

const cp: Level[] = [
  {
    id: 6,
    episodeId: 2,
    title: "Archive Retrieval",
    description: "ACCESS UPGRADED. The 'incoming' data stream contains compressed historical logs. Manual extraction is inefficient. Use the Filter protocol (f) to isolate 'backup_logs.zip', enter the archive (l), and extract 'sys_v1.log' to the 'media' directory for analysis.",
    initialPath: null,
    hint: "1. Navigate to ~/incoming. 2. Press 'f', type 'backup'. 3. Enter the archive (l). 4. Highlight 'sys_v1.log', Press 'y'. 5. Navigate to ~/media. 6. Press 'p'.",
    coreSkill: "Filter (f) & Archive Ops",
    environmentalClue: "TARGET: backup_logs.zip/sys_v1.log → media",
    successMessage: "LOGS RETRIEVED.",
    buildsOn: [1, 2],
    leadsTo: [9],
    tasks: [
      {
        id: "filter-1",
        description: "Filter (f) for 'backup_logs.zip' in ~/incoming and close prompt (Esc)",
        check: (state: GameState) => {
          const currentDir = ge(state.fs, state.currentPath);
          if (currentDir?.name !== "incoming") return false;
          const filter = (state.filters[currentDir.id] || "").toLowerCase();
          return state.mode === "normal" && filter.includes("backup");
        },
        completed: false
      },
      {
        id: "filter-2",
        description: "Enter archive (l,y) and copy 'sys_v1.log'",
        check: (state: GameState) => {
          const currentDir = ge(state.fs, state.currentPath);
          return currentDir?.name === "backup_logs.zip" || (state.clipboard?.action === "yank" && state.clipboard.nodes.some(d => d.name === "sys_v1.log"));
        },
        completed: false
      },
      {
        id: "filter-4",
        description: "Paste into ~/media (p)",
        check: (state: GameState) => {
          const media = se(state.fs, "media");
          return !!media?.children?.find(r => r.name === "sys_v1.log");
        },
        completed: false
      }
    ]
  },
  {
    id: 7,
    episodeId: 2,
    title: "RAPID NAVIGATION",
    description: "LINEAR TRAVERSAL IS COMPROMISED. The security daemon is monitoring the parent-child node connections. To evade detection, you must use the Zoxide Teleportation Protocol (Shift+Z) to 'blink' between distant system nodes. Access the /tmp volatile cache to dump your trace data, then tunnel to /etc to inspect the core routing tables. A false threat signature will appear in /etc—abort the operation to avoid detection. No active links must remain.",
    initialPath: null,
    hint: "Press Shift+Z to open Zoxide. Type 'tmp' to filter. Press Enter to jump. Repeat with 'etc'. When you realize /etc is a false alarm, press 'Y' to clear your clipboard and abort the operation.",
    coreSkill: "G-Command (gt) + Zoxide (Shift+Z)",
    environmentalClue: "THREAT: Linear Directory Tracing | COUNTERMEASURE: Zoxide Quantum Jumps to /tmp, /etc",
    successMessage: "QUANTUM JUMP CALIBRATED. Trace purged.",
    buildsOn: [1],
    leadsTo: [8, 12],
    tasks: [
      {
        id: "fuzzy-1",
        description: "Quantum jump to /tmp (Shift+Z → 'tmp' → Enter)",
        check: (state: GameState) => {
          const currentDir = ge(state.fs, state.currentPath);
          return state.stats.fuzzyJumps >= 1 && currentDir?.name === "tmp";
        },
        completed: false
      },
      {
        id: "fuzzy-2",
        description: "Quantum jump to /etc and abort: Clear clipboard (Y)",
        check: (state: GameState) => {
          const currentDir = ge(state.fs, state.currentPath);
          return currentDir?.name === "etc" && state.clipboard === null;
        },
        completed: false
      }
    ]
  },
  {
    id: 8,
    episodeId: 2,
    title: "NEURAL CONSTRUCTION & VAULT",
    description: "ACCESS GRANTED. FIREWALL BYPASSED. To survive the next phase, construct a neural network in workspace: create 'neural_net/weights/model.rs'. Simultaneously, secure credentials: locate 'access_key.pem' in datastore and copy it into a new 'vault' directory.",
    initialPath: null,
    hint: "1. Build tree: 'a' → 'neural_net/weights/model.rs'. 2. Copy 'uplink_v1.conf' from active to neural_net. 3. Create 'vault/' in datastore and move the key.",
    coreSkill: "Challenge: Full System Integration",
    environmentalClue: "BUILD: neural_net/... in workspace | MIGRATE: uplink_v1.conf -> neural_net/",
    successMessage: "ARCHITECTURE ESTABLISHED. Assets vaulted.",
    buildsOn: [4, 5, 7],
    leadsTo: [11],
    timeLimit: 180,
    tasks: [
      {
        id: "combo-1a",
        description: "Construct 'neural_net/weights/model.rs' in workspace (a)",
        check: (state: GameState) => {
          const neural_net = se(state.fs, "neural_net");
          const weights = neural_net?.children?.find(v => v.name === "weights");
          return !!weights?.children?.find(v => v.name === "model.rs" || v.name === "model.ts");
        },
        completed: false
      },
      {
        id: "combo-1c",
        description: "Copy 'uplink_v1.conf' to workspace/neural_net (y, then p)",
        check: (state: GameState) => {
          const neural_net = se(state.fs, "neural_net");
          return !!neural_net?.children?.find(r => r.name === "uplink_v1.conf");
        },
        completed: false
      },
      {
        id: "combo-vault",
        description: "Secure key in datastore/vault/ (a, then p)",
        check: (state: GameState) => {
          const vault = se(state.fs, "vault");
          return !!vault?.children?.find(r => r.name === "access_key.pem");
        },
        completed: false
      }
    ]
  },
  {
    id: 9,
    episodeId: 2,
    title: "Signal Triangulation",
    description: "ANOMALY DETECTED. A ghost process is hiding in the /tmp directory, disguised as a normal session file. Isolate and purge it.",
    initialPath: null,
    hint: "In /tmp, find 'ghost_process.pid' and delete it (d). Use sort by size (,s) to help find the outlier.",
    coreSkill: "Sort Commands (,s, ,m)",
    environmentalClue: "TARGET: Anomalous file in /tmp | METHOD: Sort by size/time -> Purge",
    successMessage: "GHOST PROCESS TERMINATED.",
    buildsOn: [2, 5],
    leadsTo: [14, 16],
    timeLimit: 90,
    tasks: [
      {
        id: "sort-3",
        description: "Purge the anomalous file 'ghost_process.pid' in /tmp",
        check: (state: GameState) => {
          const tmp = se(state.fs, "tmp");
          return !tmp?.children?.some(r => r.name === "ghost_process.pid");
        },
        completed: false
      }
    ]
  },
  {
    id: 10,
    episodeId: 2,
    title: "Asset Security",
    description: "CRITICAL ASSET DETECTED. The 'access_key.pem' provides root-level escalation. Secure the key in a vault and camouflage its identity.",
    initialPath: null,
    hint: "In datastore, enter 'vault'. Paste the key (p). Rename (r) the key to 'vault_key.pem'.",
    coreSkill: "Filter, Secure, & Rename",
    environmentalClue: "TARGET: datastore/vault/access_key.pem | DESTINATION: datastore/vault/vault_key.pem",
    successMessage: "ASSET SECURED. VAULT ESTABLISHED.",
    buildsOn: [3, 9],
    leadsTo: [12],
    timeLimit: 120,
    tasks: [
      {
        id: "secure-combined",
        description: "Invert selection to target real asset and capture it (Ctrl+R, y)",
        check: (state: GameState) => {
          return state.clipboard?.nodes.some(n => n.name === 'access_key.pem');
        },
        completed: false
      },
      {
        id: "secure-4",
        description: "Camouflage identity in vault to 'vault_key.pem' (r)",
        check: (state: GameState) => {
          const vault = se(state.fs, "vault");
          return !!vault?.children?.find(r => r.name === "vault_key.pem");
        },
        completed: false
      }
    ]
  }
];

const sp: Level[] = [
  {
    id: 11,
    episodeId: 3,
    title: "Identity Forge",
    description: "CAMOUFLAGE PROTOCOL. Your neural network files are tagged as anomalous. Rename them to mimic system processes and evade the kernel's integrity scanner.",
    initialPath: null,
    hint: "Navigate to workspace. Rename 'neural_net' to 'systemd-core' (r).",
    coreSkill: "Rename (r)",
    environmentalClue: "DISGUISE: neural_net → systemd-core",
    successMessage: "IDENTITY FORGED.",
    buildsOn: [8],
    leadsTo: [12],
    tasks: [
      {
        id: "rename-1",
        description: "Rename 'neural_net' to 'systemd-core' (r)",
        check: (state: GameState) => {
          const user = se(state.fs, "guest");
          return !!user?.children?.find(p => p.name === "systemd-core");
        },
        completed: false
      }
    ]
  }
];

// Fix: Export LEVELS array for imports
export const Be = [...ip, ...cp, ...sp];
export const LEVELS = Be;
