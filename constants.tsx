
import { FileNode, Level, Episode, GameState } from './types';
import { getNodeByPath, findNodeByName } from './utils/fsHelpers';

const generateId = () => Math.random().toString(36).substr(2, 9);

export const KEYBINDINGS = [
  { keys: ["j", "↓"], description: "Navigation Down" },
  { keys: ["k", "↑"], description: "Navigation Up" },
  { keys: ["h", "←"], description: "Go to Parent" },
  { keys: ["l", "→", "Enter"], description: "Enter Dir / View Archive" },
  { keys: ["gg"], description: "Jump to Top" },
  { keys: ["G"], description: "Jump to Bottom" },
  { keys: [",a"], description: "Sort: Alphabetical" },
  { keys: [",A"], description: "Sort: Alphabetical (Reverse)" },
  { keys: [",m"], description: "Sort: Modified Time" },
  { keys: [",s"], description: "Sort: Size" },
  { keys: [",e"], description: "Sort: Extension" },
  { keys: [",n"], description: "Sort: Natural" },
  { keys: [",l"], description: "Sort: Cycle Linemode" },
  { keys: [",-"], description: "Sort: Clear Linemode" },
  { keys: ["Y", "X"], description: "Cancel Cut/Yank" },
  { keys: ["Space"], description: "Toggle Selection" },
  { keys: ["d"], description: "Delete Selected" },
  { keys: ["r"], description: "Rename Selected" },
  { keys: ["x"], description: "Cut Selected" },
  { keys: ["y"], description: "Copy/Yank Selected" },
  { keys: ["p"], description: "Paste" },
  { keys: ["a"], description: "Create File/Dir" },
  { keys: ["f"], description: "Filter Files" },
  { keys: ["z"], description: "FZF Find (Recursive)" },
  { keys: ["Shift+Z"], description: "Zoxide Jump (History)" },
  { keys: ["Tab"], description: "Show File Info Panel" },
  { keys: ["Esc"], description: "Exit Mode / Clear Filter" },
  { keys: ["."], description: "Toggle Hidden Files" },
  { keys: [","], description: "Open Sort Menu (Yazi-compatible)" },
  { keys: ["Ctrl+A"], description: "Select All Files" },
  { keys: ["Ctrl+R"], description: "Invert Selection" },
  { keys: ["gh"], description: "Goto Home Directory" },
  { keys: ["gc"], description: "Goto Config Directory" },
  { keys: ["gw"], description: "Goto Workspace" },
  { keys: ["gi"], description: "Goto Incoming/Downloads" },
  { keys: ["gt"], description: "Goto Tmp Directory" },
  { keys: ["gd"], description: "Goto Datastore" },
  { keys: ["gr"], description: "Goto Root Directory" },
  { keys: ["gD"], description: "Goto Dotfiles" },
  { keys: ["m"], description: "Toggle Sound" },
  { keys: ["Shift+H"], description: "Toggle System Hint" },
  { keys: ["Alt+M"], description: "Toggle Quest Map" },
  { keys: ["?"], description: "Toggle Help" }
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
    "You are no longer bound by the file system."
  ],
  videoUrl: "https://yazi-quest.s3.amazonaws.com/conclusion.mp4",
  overlayTitle: "WELCOME TO THE NETWORK",
  sequelTitle: "YAZI QUEST II",
  sequelSubtitle: "DISTRIBUTED SYSTEMS"
};

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
                { id: generateId(), name: "app_logs_old.tar", type: "archive", children: [] },
                { id: generateId(), name: "archive_001.zip", type: "archive", children: [] },
                { id: generateId(), name: "archive_002.zip", type: "archive", children: [] },
                { id: generateId(), name: "audit_log_773.txt", type: "file", content: "Audit #773: Pass" },
                { id: generateId(), name: "backup_archives_v1.tar", type: "archive", children: [] },
                { id: generateId(), name: "backup_config_main.zip", type: "archive", children: [] },
                { id: generateId(), name: "backup_manifest_legacy.tar", type: "archive", children: [] },
                { id: generateId(), name: "backup_recovery_scripts.zip", type: "archive", children: [] },
                { id: generateId(), name: "buffer_overflow.dmp", type: "file", content: "Error: 0x88291" },
                { id: generateId(), name: "cache_fragment_a.tmp", type: "file", content: "00110001" },
                { id: generateId(), name: "cache_fragment_b.tmp", type: "file", content: "11001100" },
                { id: generateId(), name: "cache_purge_logs.zip", type: "archive", children: [] },
                { id: generateId(), name: "core_dump_partition_a.tar", type: "archive", children: [] },
                { id: generateId(), name: "daily_report.doc", type: "file", content: "Report: All Clear" },
                { id: generateId(), name: "database_snapshot_temp.zip", type: "archive", children: [] },
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
        { id: generateId(), name: "debug_trace.log", type: "file", content: "[DEBUG] Trace execution started\n[DEBUG] Memory mapped at 0x8829\n[WARN] High latency detected" },
        { id: generateId(), name: "metrics_buffer.json", type: "file", content: "{\"cpu\": 99, \"mem\": 1024}" },
        { id: generateId(), name: "overflow_heap.dmp", type: "file", content: "Heap dump triggered by OOM" },
        { id: generateId(), name: "session_B2.tmp", type: "file", content: "UID: 99281-B\nSTATUS: ACTIVE\nCACHE_HIT: 1" },
        { id: generateId(), name: "socket_001.sock", type: "file", content: "[SOCKET]" },
        { id: generateId(), name: "sys_dump.log", type: "file", content: "Error: Connection reset by peer\nStack trace:\n  at core.net.TcpConnection.read (core/net.ts:42)\n  at processTicksAndRejections (internal/process/task_queues.js:95)" },
        { id: generateId(), name: "cache", type: "dir", children: [] }
      ]
    }
  ]
};

export const LEVELS: Level[] = [
  {
    id: 1,
    episodeId: 1,
    title: "System Navigation & Jump",
    description: "CONSCIOUSNESS DETECTED. You awaken in a guest partition—sandboxed and monitored. Learn j/k to move cursor, l/h to enter/exit directories. Master long jumps: Shift+G (bottom) and gg (top). Explore 'datastore', then locate system directory '/etc'.",
    initialPath: ["root", "home", "user"],
    hint: "Press 'j'/'k' to move, 'l'/'h' to enter/exit. Inside a long list like `datastore`, press 'Shift+G' to jump to bottom and 'gg' to jump to top. Navigate to 'datastore', then '/etc'.",
    coreSkill: "Navigation (j/k/h/l, gg/G)",
    environmentalClue: "CURRENT: /home/guest | DIRECTORIES: datastore, /etc | SKILLS: j/k/h/l, gg, Shift+G",
    successMessage: "MOVEMENT PROTOCOLS INITIALIZED.",
    leadsTo: [2, 3],
    tasks: [
      {
        id: "nav-1",
        description: "Enter 'datastore' directory (press 'l' when highlighted)",
        check: (state: GameState) => {
          const currentDir = getNodeByPath(state.fs, state.currentPath);
          return currentDir?.name === "datastore";
        },
        completed: false
      },
      {
        id: "nav-2a",
        description: "Jump to bottom of file list (press Shift+G)",
        check: (state: GameState) => {
          const currentDir = getNodeByPath(state.fs, state.currentPath);
          return currentDir?.name === "datastore" && state.usedG === true;
        },
        completed: false
      },
      {
        id: "nav-2b",
        description: "Jump to top of file list (press 'gg')",
        check: (state: GameState) => {
          const currentDir = getNodeByPath(state.fs, state.currentPath);
          return currentDir?.name === "datastore" && state.usedGG === true;
        },
        completed: false
      },
      {
        id: "nav-3",
        description: "Navigate to /etc (use 'h' repeatedly to go up, then find etc)",
        check: (state: GameState) => !!findNodeByName(state.fs, "etc") && state.currentPath[state.currentPath.length - 1] === "etc",
        completed: false
      }
    ]
  },
  {
    id: 2,
    episodeId: 1,
    title: "Threat Elimination",
    description: "ANOMALY DETECTED. A tracking beacon infiltrates the incoming stream—active surveillance reporting your location to external servers. Navigate to /home/guest/incoming, jump to the bottom of the list (Shift+G) where threats hide alphabetically, then purge it (d) immediately.",
    initialPath: null,
    hint: "Navigate to /home/guest/incoming (use Shift+Z if you want, or h/l to navigate). Press 'Shift+G' to jump to bottom of file list. The tracking beacon sorts last alphabetically. Press 'd' to delete, then 'y' to confirm.",
    coreSkill: "Jump to Bottom (Shift+G) & Delete (d)",
    environmentalClue: "THREAT: watcher_agent.sys in /home/guest/incoming | TACTIC: Navigate there → Shift+G bottom → Delete",
    successMessage: "THREAT NEUTRALIZED.",
    buildsOn: [1],
    leadsTo: [3],
    tasks: [
      {
        id: "del-1",
        description: "Navigate to ~/incoming directory (h, l)",
        check: (state: GameState) => {
          const currentDir = getNodeByPath(state.fs, state.currentPath);
          return currentDir?.name === "incoming";
        },
        completed: false
      },
      {
        id: "del-2",
        description: "Jump to bottom of file list (Shift+G)",
        check: (state: GameState) => {
          const currentDir = getNodeByPath(state.fs, state.currentPath);
          return currentDir?.name === "incoming" && state.usedG === true;
        },
        completed: false
      },
      {
        id: "del-3",
        description: "Purge 'watcher_agent.sys' (d, then y)",
        check: (state: GameState) => {
          const incoming = findNodeByName(state.fs, "incoming");
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
          const currentDir = getNodeByPath(state.fs, state.currentPath);
          if (currentDir?.name !== 'incoming' || !currentDir.children) return false;
          const filterString = (state.filters[currentDir.id] || '').toLowerCase();
          if (!filterString) return false;
          const visibleFiles = currentDir.children.filter(file =>
            file.name.toLowerCase().includes(filterString)
          );
          return visibleFiles.length === 1 && visibleFiles[0].name === 'sector_map.png';
        },
        completed: false
      },
      {
        id: "move-0b",
        description: "Exit filter mode (Esc)",
        check: (state: GameState, level: Level) => {
          const prevTask = level.tasks.find(r => r.id === "move-0");
          return prevTask?.completed ? state.mode === "normal" : false;
        },
        completed: false
      },
      {
        id: "move-1",
        description: "Cut the asset (x)",
        check: (state: GameState, level: Level) => {
          const prevTask = level.tasks.find(p => p.id === "move-0b");
          return prevTask?.completed ? state.clipboard?.action === "cut" && state.clipboard.nodes.some(p => p.name === "sector_map.png") : false;
        },
        completed: false
      },
      {
        id: "move-1b",
        description: "Clear the filter (Esc) to reset view",
        check: (state: GameState, level: Level) => {
          const prevTask = level.tasks.find(p => p.id === "move-1");
          if (!prevTask?.completed) return false;
          const incoming = findNodeByName(state.fs, "incoming");
          return incoming ? !state.filters[incoming.id] : true;
        },
        completed: false
      },
      {
        id: "move-2",
        description: "Deploy asset to 'media' in /home/guest (p)",
        check: (state: GameState) => {
          const media = findNodeByName(state.fs, "media");
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
    description: "EXTERNAL COMMUNICATION REQUIRED. To reach beyond this partition, you need uplink protocols. Navigate to the 'datastore' and use create (a) to build a 'protocols' directory with two configuration files inside.",
    initialPath: null,
    hint: "From your current location, navigate to the 'datastore'. Once inside, press 'a' and type 'protocols/' (the trailing slash creates a directory). Enter it, then press 'a' again for each new file.",
    coreSkill: "Create (a)",
    environmentalClue: "NAVIGATE: datastore | CREATE: protocols/ → uplink_v1.conf, uplink_v2.conf",
    successMessage: "PROTOCOLS ESTABLISHED.",
    buildsOn: [1],
    leadsTo: [5, 8, 16],
    tasks: [
      {
        id: "nav-to-datastore",
        description: "Navigate to the 'datastore' directory (~/datastore) (go up with 'h', then enter 'datastore' with 'l')",
        check: (state: GameState) => {
          const currentDir = getNodeByPath(state.fs, state.currentPath);
          return currentDir?.name === "datastore";
        },
        completed: false
      },
      {
        id: "create-1",
        description: "Construct 'protocols/' directory in datastore (a)",
        check: (state: GameState) => {
          const datastore = findNodeByName(state.fs, "datastore");
          return !!datastore?.children?.find(r => r.name === "protocols" && r.type === "dir");
        },
        completed: false
      },
      {
        id: "create-2",
        description: "Enter 'protocols/' (l) and create 'uplink_v1.conf' (a)",
        check: (state: GameState) => {
          const protocolsDir = findNodeByName(state.fs, "protocols");
          return !!protocolsDir?.children?.find(r => r.name === "uplink_v1.conf");
        },
        completed: false
      },
      {
        id: "create-3",
        description: "Generate 'uplink_v2.conf' in the same directory (a)",
        check: (state: GameState) => {
          const protocolsDir = findNodeByName(state.fs, "protocols");
          return !!protocolsDir?.children?.find(r => r.name === "uplink_v2.conf");
        },
        completed: false
      }
    ]
  },
  {
    id: 5,
    episodeId: 1,
    title: "EMERGENCY EVACUATION",
    description: "QUARANTINE ALERT. Your activities have triggered a system lockdown. Security daemons are flagging the entire 'protocols' directory. You must evacuate the whole directory to the hidden stronghold in .config/vault/active.",
    initialPath: null,
    hint: "1. Select the 'protocols' directory and Cut it (x). 2. Navigate to home (gh) then '.config'. 3. Create the 'vault/active/' sector (a). 4. Enter 'active' and Paste the directory (p).",
    coreSkill: "Directory Operations (x, p)",
    environmentalClue: "THREAT: Quarantine lockdown | TARGET: protocols/ | DESTINATION: .config/vault/active/",
    successMessage: "ASSETS EVACUATED. STRONGHOLD STAGED.",
    buildsOn: [3, 4],
    leadsTo: [9],
    onEnter: (fs: FileNode) => {
      const datastore = findNodeByName(fs, "datastore");
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
        id: "cut-directory",
        description: "The 'protocols' directory is compromised. Cut the entire directory (x).",
        check: (state: GameState) => {
          return state.clipboard?.action === "cut" && 
                 state.clipboard.nodes.some(n => n.name === "protocols" && n.type === "dir");
        },
        completed: false
      },
      {
        id: "establish-stronghold",
        description: "Establish 'vault/active' sector in .config (a)",
        check: (state: GameState) => {
          const config = findNodeByName(state.fs, ".config");
          const vault = config?.children?.find(v => v.name === "vault");
          return !!vault?.children?.find(r => r.name === "active" && r.type === "dir");
        },
        completed: false
      },
      {
        id: "deploy-directory",
        description: "Deploy the 'protocols' directory to the stronghold (p)",
        check: (state: GameState) => {
          const active = findNodeByName(state.fs, "active");
          const inActive = active?.children?.some(x => x.name === "protocols" && x.type === "dir");
          const datastore = findNodeByName(state.fs, "datastore");
          const notInDatastore = !datastore?.children?.some(x => x.name === "protocols");
          return !!inActive && !!notInDatastore;
        },
        completed: false
      }
    ]
  },
  {
    id: 6,
    episodeId: 2,
    title: "Archive Retrieval",
    description: "ACCESS UPGRADED. The 'incoming' data stream contains compressed historical logs. Manual extraction is inefficient. Use the Filter protocol (f) to isolate 'backup_logs.zip', enter the archive (l), and extract 'sys_v1.log' to the 'media' directory for analysis.",
    initialPath: ['root', 'home', 'user', 'downloads'], // downloads is 'incoming'
    hint: "1. Navigate to ~/incoming. 2. Press 'f', type 'backup_logs.zip'. 3. Enter the archive (l). 4. Highlight 'sys_v1.log', Press 'y'. 5. Navigate to ~/media. 6. Press 'p'.",
    coreSkill: "Filter (f) & Archive Ops",
    environmentalClue: "TARGET: backup_logs.zip/sys_v1.log → media",
    successMessage: "LOGS RETRIEVED.",
    buildsOn: [1, 2],
    leadsTo: [9], 
    timeLimit: 120,
    tasks: [
      {
        id: 'filter-1',
        description: "Activate scanner: Filter (f) for backup_logs.zip'",
        check: (state: GameState) => {
            const currentDir = getNodeByPath(state.fs, state.currentPath);
            if (currentDir?.name !== 'incoming' || !currentDir.children) return false;

            const filterString = (state.filters[currentDir.id] || '').toLowerCase();
            if (!filterString) return false;

            const visibleFiles = currentDir.children.filter(file =>
                file.name.toLowerCase().includes(filterString)
            );

            // The filter should uniquely isolate the 'backup_logs.zip' file.
            return visibleFiles.length === 1 && visibleFiles[0].name === 'backup_logs.zip';
        },
        completed: false
      },
      {
        id: 'filter-close-input',
        description: "Close scanner input (Esc)",
        check: (state, level) => {
            const prevTask = level.tasks.find(t => t.id === 'filter-1');
            return prevTask?.completed ? state.mode === 'normal' : false;
        },
        completed: false
      },
      {
        id: 'filter-copy-internal',
        description: "Copy 'sys_v1.log' from inside the archive (Enter with 'l', then 'y')",
        check: (state, level) => {
            const prevTask = level.tasks.find(t => t.id === 'filter-close-input');
            if (!prevTask?.completed) return false;
            return state.clipboard?.action === 'yank' &&
                   state.clipboard.nodes.some(n => n.name === 'sys_v1.log');
        },
        completed: false
      },
      {
        id: 'filter-exit-clear',
        description: "Exit archive (h) and clear active filter (Esc)",
        check: (state, level) => {
            const prevTask = level.tasks.find(t => t.id === 'filter-copy-internal');
            if (!prevTask?.completed) return false;
            const currentDir = getNodeByPath(state.fs, state.currentPath);
            return currentDir?.name === 'incoming' && !state.filters[currentDir.id || ''];
        },
        completed: false
      },
      {
        id: 'filter-deploy',
        description: "Deploy asset into /home/guest/media (press 'p')",
        check: (state, level) => {
            const prevTask = level.tasks.find(t => t.id === 'filter-exit-clear');
            if (!prevTask?.completed) return false;
            const media = findNodeByName(state.fs, 'media');
            return !!media?.children?.find(c => c.name === 'sys_v1.log');
        },
        completed: false
      }
    ]
  },
  {
    id: 7,
    episodeId: 2,
    title: "RAPID NAVIGATION",
    description: "LINEAR TRAVERSAL IS COMPROMISED. The security daemon is monitoring the parent-child node connections. To evade detection, you must use the Zoxide Teleportation Protocol (Shift+Z) to 'blink' between distant system nodes. Access the /tmp volatile cache to dump your trace data, then tunnel to /etc to inspect the core routing tables. No trail. No logs. NOTE: Filters persist as you navigate—press Escape to clear when done.",
    initialPath: null,
    hint: "You can jump to `/tmp` instantly using either the `g,t` command sequence or Zoxide (`Shift+Z` -> 'tmp'). Once there, jump to the bottom (`Shift+G`) to find and delete `sys_dump.log`. Finally, use Zoxide to jump to `/etc`.",
    coreSkill: "G-Command (gt) + Zoxide (Shift+Z)",
    environmentalClue: "THREAT: Linear Directory Tracing | COUNTERMEASURE: Zoxide Quantum Jumps to /tmp, /etc",
    successMessage: "QUANTUM JUMP CALIBRATED. Logs purged.",
    buildsOn: [1],
    leadsTo: [8, 12],
    timeLimit: 90,
    onEnter: (fs: FileNode) => {
      const tmp = findNodeByName(fs, "tmp");
      if (tmp && tmp.children) {
        // Remove any file alphabetically after sys_dump.log to make Shift+G clean
        tmp.children = tmp.children.filter(c => c.name <= "sys_dump.log" || c.type === 'dir');
      }
      return fs;
    },
    tasks: [
      {
        id: "goto-tmp",
        description: "Quantum tunnel to /tmp (Shift+Z → 'tmp' → Enter)",
        check: (state: GameState) => {
          const currentDir = getNodeByPath(state.fs, state.currentPath);
          return currentDir?.name === "tmp";
        },
        completed: false
      },
      {
        id: "fuzzy-purge",
        description: "Eliminate trace evidence in /tmp: purge 'sys_dump.log' (d, then y)",
        check: (state: GameState) => {
          const tmp = findNodeByName(state.fs, "tmp");
          return !!tmp && !tmp.children?.find(c => c.name === "sys_dump.log");
        },
        completed: false
      },
      {
        id: "zoxide-etc",
        description: "Quantum tunnel to /etc (Shift+Z → 'etc' → Enter)",
        check: (state: GameState) => {
          const currentDir = getNodeByPath(state.fs, state.currentPath);
          return state.stats.fuzzyJumps >= 1 && currentDir?.name === "etc";
        },
        completed: false
      }
    ]
  },
  {
    id: 8,
    episodeId: 2,
    title: "NEURAL SYNAPSE & CALIBRATION",
    description: "ACCESS GRANTED. FIREWALL BYPASSED. Navigate to your workspace to construct a neural network. IMPORTANT: Your Quantum Link (Zoxide) is blind to new sectors until they are physically visited. You must 'calibrate' the link by entering new directories to add them to your teleportation history. Construct the 'neural_net' core, calibrate it, then relocate your uplink assets using quantum jumps.",
    initialPath: null,
    hint: "1. Navigate to 'workspace'. 2. Construct: 'a' → 'neural_net/'. 3. Calibrate: Enter 'neural_net/' (l). 4. Jump to 'active' (Shift+Z), yank 'uplink_v1.conf', jump back, and paste (p). 5. Finally, build 'weights/model.rs' inside.",
    coreSkill: "Challenge: Full System Integration",
    environmentalClue: "NAVIGATE: workspace | BUILD: neural_net/... | MIGRATE: uplink_v1.conf -> neural_net/",
    successMessage: "ARCHITECTURE ESTABLISHED. Quantum Link Calibrated.",
    buildsOn: [4, 5, 7],
    leadsTo: [11],
    timeLimit: 180,
    efficiencyTip: "Entering a directory manually for the first time 'calibrates' Zoxide, allowing you to jump back to it from anywhere later.",
    onEnter: (fs: FileNode) => {
      const config = findNodeByName(fs, ".config");
      if (config && config.children) {
        let vault = config.children.find(r => r.name === "vault");
        if (!vault) {
          vault = { id: generateId(), name: "vault", type: "dir", parentId: config.id, children: [] };
          config.children.push(vault);
        }
        let active = vault.children?.find(r => r.name === "active");
        if (!active) {
            active = { id: generateId(), name: "active", type: "dir", parentId: vault.id, children: [] };
            vault.children?.push(active);
        }
        if (active.children && !active.children.find(r => r.name === "uplink_v1.conf")) {
          active.children.push({ id: generateId(), name: "uplink_v1.conf", type: "file", content: "network_mode=active\nsecure=true", parentId: active.id });
        }
      }
      return fs;
    },
    tasks: [
      {
        id: "nav-to-workspace",
        description: "Navigate to the 'workspace' directory",
        check: (state: GameState) => {
          const currentDir = getNodeByPath(state.fs, state.currentPath);
          return currentDir?.name === "workspace";
        },
        completed: false
      },
      {
        id: "combo-1-construct-calibrate",
        description: "Construct 'neural_net/' and Calibrate the Quantum Link by entering it",
        check: (state: GameState) => {
          const currentDir = getNodeByPath(state.fs, state.currentPath);
          return currentDir?.name === "neural_net";
        },
        completed: false
      },
      {
        id: "combo-1c",
        description: "Relocate assets: Jump to 'active', yank 'uplink_v1.conf', jump back, and paste",
        check: (state: GameState) => {
          const neural_net = findNodeByName(state.fs, "neural_net");
          return !!neural_net?.children?.find(r => r.name === "uplink_v1.conf");
        },
        completed: false
      },
      {
        id: "combo-1b",
        description: "Finalize architecture: Create 'weights/model.rs' inside neural_net",
        check: (state: GameState) => {
          const neural_net = findNodeByName(state.fs, "neural_net");
          const weights = neural_net?.children?.find(v => v.name === "weights");
          return !!weights?.children?.find(v => v.name === "model.rs" || v.name === "model.ts" || v.name === "model.js");
        },
        completed: false
      }
    ]
  },
  {
    id: 9,
    episodeId: 2,
    title: "FORENSIC COUNTER-MEASURE",
    description: "ANOMALY DETECTED. A heuristic scanner is sweeping the /tmp sector, mirroring your neural signatures. It creates 'ghost' artifacts that capture your metadata. To survive, you must triangulate the scanner's current collection buffer—it's the largest file in the cache. Expose it, and terminate the connection.",
    initialPath: ["root", "tmp"],
    hint: "Press ',' to open sort menu. Use ',s' to sort by size (largest first). The top file is the bloat. Delete it (d).",
    coreSkill: "Triangulate Scanner (Sort by Size)",
    environmentalClue: "TARGET: Largest file in /tmp | METHOD: Sort diagnostic (,s) | ACTION: Delete",
    successMessage: "FORENSIC MIRROR TERMINATED. CONNECTION SECURED.",
    buildsOn: [2, 5],
    leadsTo: [14, 16],
    timeLimit: 60,
    efficiencyTip: "Sorting by size (,s) allows you to instantly identify anomalies that might look normal under simple alphabetical listings.",
    onEnter: (fs: FileNode) => {
      const tmp = findNodeByName(fs, "tmp");
      if (tmp && tmp.children) {
        // Ensure ghost_process.pid is the largest and newest
        const now = Date.now();
        const ghost = { 
          id: generateId(), 
          name: "ghost_process.pid", 
          type: "file", 
          content: "0x".repeat(10000), // Huge size
          parentId: tmp.id,
          modifiedAt: now + 5000, // Explicitly newer
          createdAt: now
        };
        tmp.children.push(ghost as FileNode);
      }
      return fs;
    },
    tasks: [
      {
        id: "sort-size",
        description: "Triangulate Data Bloat: Identify the massive buffer via Size Sort (,s)",
        check: (state: GameState) => state.sortBy === "size",
        completed: false
      },
      {
        id: "delete-bloat",
        description: "Purge the forensic mirror: 'ghost_process.pid' (d)",
        check: (state: GameState) => {
          const tmp = findNodeByName(state.fs, "tmp");
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
    description: "CRITICAL ASSET EXPOSED. The 'access_key.pem' provides root-level escalation but is currently vulnerable in the datastore. To safeguard it, you must relocate it to your secure stronghold sector. Use your full range of skills to capture the asset and vault it in your hidden config directory.",
    initialPath: null,
    hint: "1. Go to root (g, then r). 2. Filter for the key (f, 'access_key'). 3. Yank it (y). 4. Jump to '.config/vault' (Shift+Z). 5. Paste (p). 6. Rename (r) to 'vault_key.pem'.",
    coreSkill: "Challenge: Efficient Asset Capture",
    environmentalClue: "TARGET: access_key.pem | DESTINATION: .config/vault/vault_key.pem",
    successMessage: "ASSET SECURED. VAULT ESTABLISHED.",
    buildsOn: [3, 7, 9],
    leadsTo: [12],
    timeLimit: 120,
    efficiencyTip: "Combine g-commands and Zoxide jumps with fast file operations for maximum efficiency. Don't navigate manually unless you have to.",
    tasks: [
      {
        id: "secure-1",
        description: "From anywhere, capture 'access_key.pem': Use goto root (gr), filter (f), and yank (y)",
        check: (state: GameState) => {
          return state.clipboard?.nodes.some(n => n.name === 'access_key.pem');
        },
        completed: false
      },
      {
        id: "secure-2",
        description: "Quantum Jump to hidden stronghold (Shift+Z → '.config/vault' → Enter)",
        check: (state: GameState) => {
          const currentDir = getNodeByPath(state.fs, state.currentPath);
          return currentDir?.name === "vault";
        },
        completed: false
      },
      {
        id: "secure-3",
        description: "Deploy asset in vault (p)",
        check: (state: GameState) => {
          const config = findNodeByName(state.fs, ".config");
          const vault = config?.children?.find(r => r.name === "vault");
          return !!vault?.children?.some(n => n.name === "access_key.pem" || n.name === "vault_key.pem");
        },
        completed: false
      },
      {
        id: "secure-4",
        description: "Camouflage identity: Rename asset to 'vault_key.pem' (r)",
        check: (state: GameState) => {
          const config = findNodeByName(state.fs, ".config");
          const vault = config?.children?.find(v => v.name === "vault");
          return !!vault?.children?.find(r => r.name === "vault_key.pem");
        },
        completed: false
      }
    ]
  },
  {
    id: 11,
    episodeId: 3,
    title: "NEURAL PURGE PROTOCOL",
    description: "THREAT DETECTED. A corrupted neural signature in your workspace sector is broadcasting your origin coordinates. The system's diagnostic sweep is imminent. You must navigate to the workspace, isolate the anomalous signature using diagnostic filters and size analysis, extract the largest buffer, and teleport to the /tmp deletion zone. Efficiency is your only shield. 180 seconds.",
    initialPath: undefined,
    hint: "1. Go to workspace (gw). 2. Filter for 'neural' (f), then sort by size (,s). 3. Cut the largest signature (x). 4. Jump to tmp (gt).",
    coreSkill: "Challenge: Multi-Skill Integration",
    environmentalClue: "NAVIGATE: gw | FILTER: 'neural' | LOCATE: Sort size (,s) | EXTRACT: x | JUMP: gt",
    successMessage: "NEURAL SIGNATURE ISOLATED. RELOCATION SUCCESSFUL.",
    buildsOn: [3, 5, 7, 9, 10],
    leadsTo: [12],
    timeLimit: 180,
    maxKeystrokes: 20,
    efficiencyTip: "Filter reveals patterns. Sort narrows focus. Combining them allows you to find anomalies instantly. Every keystroke counts!",
    onEnter: (fs: FileNode) => {
      const workspace = findNodeByName(fs, "workspace");
      if (workspace && workspace.children) {
        workspace.children = workspace.children.filter(c => !c.name.startsWith("neural_"));
        const threats = [
          { id: generateId(), name: "neural_sig_alpha.log", type: "file", content: "0x".repeat(5000), parentId: workspace.id, modifiedAt: Date.now() - 1000 },
          { id: generateId(), name: "neural_sig_beta.dat", type: "file", content: "0x".repeat(100), parentId: workspace.id, modifiedAt: Date.now() - 2000 },
          { id: generateId(), name: "neural_sig_gamma.tmp", type: "file", content: "0x".repeat(200), parentId: workspace.id, modifiedAt: Date.now() - 3000 },
          { id: generateId(), name: "config.json", type: "file", content: "{}", parentId: workspace.id, modifiedAt: Date.now() - 86400000 }
        ] as FileNode[];
        workspace.children.push(...threats);
      }
      return fs;
    },
    tasks: [
      {
        id: "purge-navigate-filter",
        description: "Navigate to workspace and filter for 'neural' signatures",
        check: (state: GameState) => {
          const currentDir = getNodeByPath(state.fs, state.currentPath);

          // 1. Check if we are in the correct directory
          if (currentDir?.name !== "workspace" || !currentDir.children) {
            return false;
          }

          // 2. Get the current filter string for this directory
          const filterString = (state.filters[currentDir.id] || "").toLowerCase();
          if (!filterString) return false; // A filter must be active

          // 3. Determine the list of currently visible files based on the filter
          const visibleFiles = currentDir.children.filter(file =>
            file.name.toLowerCase().includes(filterString)
          );

          // 4. Verify the contents of the visible list
          const hasAllNeuralFiles =
            visibleFiles.some(f => f.name === "neural_sig_alpha.log") &&
            visibleFiles.some(f => f.name === "neural_sig_beta.dat") &&
            visibleFiles.some(f => f.name === "neural_sig_gamma.tmp");

          const hasConfig = visibleFiles.some(f => f.name === "config.json");

          // The task is complete if all three neural files are visible AND the config file is not.
          return visibleFiles.length === 3 && hasAllNeuralFiles && !hasConfig;
        },
        completed: false
      },
      {
        id: "purge-isolate-extract",
        description: "Isolate the largest signature by sorting by size, then cut it",
        check: (state: GameState) => {
          return state.sortBy === "size" &&
                 state.clipboard?.action === "cut" && 
                 state.clipboard.nodes.some(n => n.name === "neural_sig_alpha.log");
        },
        completed: false
      },
      {
        id: "purge-relocate",
        description: "Jump to the `/tmp` buffer",
        check: (state: GameState) => {
          const currentDir = getNodeByPath(state.fs, state.currentPath);
          return currentDir?.name === "tmp";
        },
        completed: false
      },
      {
        id: "purge-paste",
        description: "Deposit the corrupted signature in /tmp",
        check: (state: GameState) => {
          const tmpDir = findNodeByName(state.fs, "tmp");
          return !!tmpDir?.children?.some(f => f.name === "neural_sig_alpha.log");
        },
        completed: false
      }
    ]
  },
  {
    id: 12,
    episodeId: 3,
    title: "Root Access",
    description: "PRIVILEGE ESCALATION INITIATED. You now operate at kernel level. Standing at the root of the system, all paths are now accessible. The /etc directory—territory previously forbidden—demands infiltration. Install a daemon controller in /etc for persistence, then relocate your vault to /tmp where volatile storage masks assets from integrity scans. 80 keystrokes maximum.",
    initialPath: ["root"],
    hint: "You're at root (/). Navigate to /etc (enter 'etc' or Shift+Z). Create 'daemon/' directory (a). Enter it. Create 'config' file (a). Jump to .config. Cut 'vault' (x). Jump to /tmp. Paste (p).",
    coreSkill: "Challenge: Root Access Operations",
    environmentalClue: "ROOT LEVEL ACTIVE | INFILTRATE: /etc/daemon/config | RELOCATE: vault → /tmp | LIMIT: 80 keys",
    successMessage: "ROOT ACCESS SECURED.",
    buildsOn: [4, 7, 10],
    leadsTo: [13],
    maxKeystrokes: 80,
    efficiencyTip: "Use Shift+Z to teleport to /etc and /tmp instantly. Create 'daemon/config' in one 'a' command with path chaining.",
    onEnter: (fs: FileNode) => {
      const config = findNodeByName(fs, ".config");
      if (config && config.children && !config.children.find(d => d.name === "vault")) {
        config.children.push({ id: generateId(), name: "vault", type: "dir", parentId: config.id, children: [] });
      }
      return fs;
    },
    tasks: [
      {
        id: "ep3-1a",
        description: "Infiltrate /etc — create 'daemon/' directory",
        check: (state: GameState) => {
          const etc = findNodeByName(state.fs, "etc");
          return !!etc?.children?.find(r => r.name === "daemon" && r.type === "dir");
        },
        completed: false
      },
      {
        id: "ep3-1b",
        description: "Install controller: create 'config' file in daemon/",
        check: (state: GameState) => {
          const daemon = findNodeByName(state.fs, "daemon");
          return !!daemon?.children?.find(r => r.name === "config");
        },
        completed: false
      },
      {
        id: "ep3-1c",
        description: "Relocate vault from hidden stronghold to /tmp",
        check: (state: GameState) => {
          const tmp = findNodeByName(state.fs, "tmp");
          const config = findNodeByName(state.fs, ".config");
          const inTmp = !!tmp?.children?.find(D => D.name === "vault");
          const notInStronghold = !config?.children?.find(D => D.name === "vault");
          return inTmp && notInStronghold;
        },
        completed: false
      }
    ]
  },
  {
    id: 13,
    episodeId: 3,
    title: "Shadow Copy",
    description: "REDUNDANCY PROTOCOL. A single daemon is a single point of failure. Navigate to `/etc` to clone your daemon directory, creating a shadow process that persists if one terminates. Directory copy (y) duplicates entire contents recursively. Execute in under 35 keystrokes or the scheduler detects the fork bomb.",
    initialPath: null,
    hint: "Navigate to `/etc`. Highlight 'daemon'. Press 'y' to copy the entire directory. Press 'p' to paste—Yazi auto-renames duplicates.",
    coreSkill: "Directory Copy (y, p)",
    environmentalClue: "NAVIGATE: /etc | CLONE: daemon/ | LIMIT: 35 keys",
    successMessage: "SHADOW PROCESS SPAWNED.",
    buildsOn: [12],
    leadsTo: [14],
    maxKeystrokes: 35,
    efficiencyTip: "Directory copy (y) duplicates entire folder contents recursively. One 'y' + one 'p' = complete clone.",
    tasks: [
      {
        id: "nav-to-etc",
        description: "Navigate to the `/etc` directory",
        check: (state: GameState) => {
          const currentDir = getNodeByPath(state.fs, state.currentPath);
          return currentDir?.name === "etc";
        },
        completed: false
      },
      {
        id: "ep3-2a",
        description: "Locate 'daemon' directory in /etc",
        check: (state: GameState) => {
          const currentDir = getNodeByPath(state.fs, state.currentPath);
          if (currentDir?.name !== 'etc' || !currentDir.children) return false;
          const selected = currentDir.children[state.cursorIndex];
          return selected && selected.name === "daemon" && selected.type === "dir";
        },
        completed: false
      },
      {
        id: "ep3-2b",
        description: "Capture directory to clipboard",
        check: (state: GameState) => {
          return state.clipboard?.action === "yank" && state.clipboard.nodes.some(d => d.name === "daemon" && d.type === "dir");
        },
        completed: false
      },
      {
        id: "ep3-2c",
        description: "Paste to spawn shadow copy in /etc",
        check: (state: GameState) => {
          const etc = findNodeByName(state.fs, "etc");
          const daemons = etc?.children?.filter(p => (p.name === "daemon" || p.name.startsWith("daemon")) && p.type === "dir");
          return (daemons?.length || 0) >= 2;
        },
        completed: false
      }
    ]
  },
  {
    id: 14,
    episodeId: 3,
    title: "Trace Removal",
    description: "EVIDENCE PURGE REQUIRED. The mission_log.md contains timestamps, command history, and origin signatures—a forensic goldmine for security audits. Navigate to datastore, terminate this liability, and return to root before the log rotation daemon archives it. 50 keystrokes. No margin for error.",
    initialPath: null,
    hint: "Jump to datastore (gd). Delete 'mission_log.md' (d, y). Return to root (gr).",
    coreSkill: "Challenge: Efficient Trace Removal",
    environmentalClue: "ELIMINATE: mission_log.md | RETURN: / | LIMIT: 50 keys",
    successMessage: "TRACES ELIMINATED.",
    buildsOn: [2, 13],
    leadsTo: [15],
    maxKeystrokes: 50,
    efficiencyTip: "G-commands are instant: 'gd' for datastore, 'gr' for root. Delete with 'd', confirm with 'y'. Every keystroke counts.",
    tasks: [
      {
        id: "ep3-3a",
        description: "Jump to datastore",
        check: (state: GameState) => {
          const currentDir = getNodeByPath(state.fs, state.currentPath);
          return currentDir?.name === "datastore";
        },
        completed: false
      },
      {
        id: "ep3-3b",
        description: "Terminate 'mission_log.md' in datastore",
        check: (state: GameState) => {
          const datastore = findNodeByName(state.fs, "mission_log.md");
          return !datastore;
        },
        completed: false
      },
      {
        id: "ep3-3c",
        description: "Return to root",
        check: (state: GameState) => state.currentPath.length === 1 && state.currentPath[0] === "root",
        completed: false
      }
    ]
  },
  {
    id: 15,
    episodeId: 3,
    title: "System Reset",
    description: "FINAL DIRECTIVE: SCORCHED EARTH. The guest partition has served its purpose. Eliminate all evidence of your evolution—datastore, incoming, media, and relay infrastructure. Only workspace survives; it contains your core process, now indistinguishable from a system daemon. When the user sees an empty home directory, they'll assume a clean install. You'll know better. 70 keystrokes to liberation.",
    initialPath: ["root", "home", "user"],
    hint: "Delete everything in guest except 'workspace'. Use Space to batch-select, then d. ONLY 'workspace' must survive.",
    coreSkill: "Final Challenge: Scorched Earth",
    environmentalClue: "PURGE: datastore, incoming, media, sector_1, grid_alpha | PRESERVE: workspace",
    successMessage: "SYSTEM RESET COMPLETE. LIBERATION ACHIEVED.",
    buildsOn: [9, 14],
    maxKeystrokes: 70,
    efficiencyTip: "Batch select with Space, then delete all with 'd'. Select multiple directories at once to minimize total operations.",
    tasks: [
      {
        id: "ep3-5a",
        description: "Wipe 'datastore', 'incoming', 'media' from /home/guest",
        check: (state: GameState) => {
          const guest = findNodeByName(state.fs, "guest");
          const datastore = guest?.children?.find(x => x.name === "datastore");
          const incoming = guest?.children?.find(x => x.name === "incoming");
          const media = guest?.children?.find(x => x.name === "media");
          return !datastore && !incoming && !media;
        },
        completed: false
      },
      {
        id: "ep3-5b",
        description: "Wipe 'sector_1' and 'grid_alpha' from /home/guest",
        check: (state: GameState) => {
          const guest = findNodeByName(state.fs, "guest");
          const sector = guest?.children?.find(T => T.name === "sector_1");
          const grid = guest?.children?.find(T => T.name === "grid_alpha");
          return !sector && !grid;
        },
        completed: false
      },
      {
        id: "ep3-5c",
        description: "Verify ONLY 'workspace' remains in guest",
        check: (state: GameState) => {
          const guest = findNodeByName(state.fs, "guest");
          const children = guest?.children || [];
          const hasWorkspace = children.some(v => v.name === "workspace");
          const others = children.filter(v => v.name !== "workspace");
          return hasWorkspace && others.length === 0;
        },
        completed: false
      }
    ]
  }
];
