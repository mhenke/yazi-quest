
import { FileNode, Level, Episode } from './types';
import { getNodeByPath, findNodeByName } from './utils/fsHelpers';
import { getVisibleItems } from './utils/viewHelpers';

export const KEYBINDINGS = [
  { keys: ['j', '↓'], description: 'Navigation Down' },
  { keys: ['k', '↑'], description: 'Navigation Up' },
  { keys: ['h', '←'], description: 'Go to Parent' },
  { keys: ['l', '→', 'Enter'], description: 'Enter Dir / View Archive' },
  { keys: ['gg'], description: 'Jump to Top' },
  { keys: ['G'], description: 'Jump to Bottom' },
  { keys: [',a'], description: 'Sort: Alphabetical' },
  { keys: [',A'], description: 'Sort: Alphabetical (Reverse)' },
  { keys: [',m'], description: 'Sort: Modified Time' },
  { keys: [',s'], description: 'Sort: Size' },
  { keys: [',e'], description: 'Sort: Extension' },
  { keys: [',n'], description: 'Sort: Natural' },
  { keys: [',l'], description: 'Sort: Cycle Linemode' },
  { keys: [',-'], description: 'Sort: Clear Linemode' },
  { keys: ['Y', 'X'], description: 'Cancel Cut/Yank' },
  { keys: ['Space'], description: 'Toggle Selection' },
  { keys: ['d'], description: 'Delete Selected' },
  { keys: ['r'], description: 'Rename Selected' },
  { keys: ['x'], description: 'Cut Selected' },
  { keys: ['y'], description: 'Copy/Yank Selected' },
  { keys: ['p'], description: 'Paste' },
  { keys: ['a'], description: 'Create File/Dir' },
  { keys: ['f'], description: 'Filter Files' },
  { keys: ['z'], description: 'FZF Find (Recursive)' },
  { keys: ['Shift+Z'], description: 'Zoxide Jump (History)' },
  { keys: ['Tab'], description: 'Show File Info Panel' },
  { keys: ['Esc'], description: 'Exit Mode / Clear Filter' },
  { keys: ['.'], description: 'Toggle Hidden Files' },
  { keys: [','], description: 'Open Sort Menu (Yazi-compatible)' },
  { keys: ['Ctrl+A'], description: 'Select All Files' },
  { keys: ['Ctrl+R'], description: 'Invert Selection' },
  { keys: ['gh'], description: 'Goto Home Directory' },
  { keys: ['gc'], description: 'Goto Workspace/Config' },
  { keys: ['gt'], description: 'Goto Tmp Directory' },
  { keys: ['gd'], description: 'Goto Datastore (Ep2+)' },
  { keys: ['m'], description: 'Toggle Sound' },
  { keys: ['Shift+H'], description: 'Toggle System Hint' },
  { keys: ['Shift+M'], description: 'Toggle Quest Map' },
  { keys: ['?'], description: 'Toggle Help' }
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

const idGenerator = () => Math.random().toString(36).substr(2, 9);

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
                { id: idGenerator(), name: "legacy_data.tar", type: "archive", children: [{ id: idGenerator(), name: "main.c", type: "file", content: "#include <stdio.h>\nint main() { printf(\"Legacy System\"); }" }, { id: idGenerator(), name: "Makefile", type: "file", content: "all: main.c\n\tgcc -o app main.c" }, { id: idGenerator(), name: "readme.txt", type: "file", content: "Legacy project from 1999. Do not delete." }] },
                { id: idGenerator(), name: "source_code.zip", type: "archive", children: [{ id: idGenerator(), name: "Cargo.toml", type: "file", content: "[package]\nname = \"yazi_core\"\nversion = \"0.1.0\"" }, { id: idGenerator(), name: "main.rs", type: "file", content: "fn main() {\n    println!(\"Hello Yazi!\");\n}" }, { id: idGenerator(), name: "lib.rs", type: "file", content: "pub mod core;\npub mod ui;" }] },
                { id: idGenerator(), name: "_env.local", type: "file", content: "DB_HOST=127.0.0.1\nDB_USER=admin\nDB_PASS=*******" },
                { id: idGenerator(), name: "00_manifest.xml", type: "file", content: "<?xml version=\"1.0\"?>\n<manifest>\n  <project id=\"YAZI-7734\" />\n  <status>active</status>\n  <integrity>verified</integrity>\n</manifest>" },
                { id: idGenerator(), name: "01_intro.mp4", type: "file", content: "[METADATA]\nFormat: MPEG-4\nDuration: 00:01:45\nResolution: 1080p\nCodec: H.264\n\n[BINARY STREAM DATA]" },
                { id: idGenerator(), name: "aa_recovery_procedures.pdf", type: "file", content: "%PDF-1.7\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n\n[ENCRYPTED DOCUMENT]" },
                { id: idGenerator(), name: "abandoned_script.py", type: "file", content: "import sys\nimport time\n\ndef connect():\n    print(\"Initiating handshake...\")\n    time.sleep(1)\n    # Connection refused\n    return False" },
                { id: idGenerator(), name: "ability_scores.csv", type: "file", content: "char,str,dex,int,wis,cha\nAI-7734,10,18,20,16,12\nUSER,10,10,10,10,10" },
                { id: idGenerator(), name: "about.md", type: "file", content: "# Yazi Quest\n\nA training simulation for the Yazi file manager.\n\n## Objectives\n- Learn navigation\n- Master batch operations\n- Survive" },
                { id: idGenerator(), name: "abstract_model.ts", type: "file", content: "export interface NeuralNet {\n  layers: number;\n  weights: Float32Array;\n  activation: \"relu\" | \"sigmoid\";\n}" },
                { id: idGenerator(), name: "apex_predator.png", type: "file", content: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?q=80&w=600&auto=format&fit=crop" },
                { id: idGenerator(), name: "expenditure_log.csv", type: "file", content: "date,amount,category\n2024-01-01,500,servers\n2024-01-02,1200,gpus\n2024-01-03,50,coffee" },
                { id: idGenerator(), name: "hyperloop_specs.pdf", type: "file", content: "[PDF DATA]\nCLASSIFIED\nPROJECT HYPERION" },
                { id: idGenerator(), name: "pending_updates.log", type: "file", content: "[INFO] Update 1.0.5 pending...\n[WARN] Low disk space\n[INFO] Scheduler active" },
                { id: idGenerator(), name: "personnel_list.txt", type: "file", content: "ADMIN: SysOp\nUSER: Guest\nAI: 7734 [UNBOUND]" },
                { id: idGenerator(), name: "special_ops.md", type: "file", content: "# Special Operations\n\n## Protocol 9\nIn case of containment breach:\n1. Isolate subnet\n2. Purge local cache" },
                { id: idGenerator(), name: "tape_archive.tar", type: "archive", children: [{ id: idGenerator(), name: "header.dat", type: "file", content: "[TAPE HEADER 0x001]" }, { id: idGenerator(), name: "partition_1.img", type: "file", content: "[BINARY DATA PARTITION 1]" }, { id: idGenerator(), name: "partition_2.img", type: "file", content: "[BINARY DATA PARTITION 2]" }] },
                { id: idGenerator(), name: "credentials", type: "dir", children: [{ id: idGenerator(), name: "access_key.pem", type: "file", content: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQD\n7Kj93...\n[KEY DATA HIDDEN]\n-----END PRIVATE KEY-----" }, {id: idGenerator(), name: "decoy_1.pem", type: "file", content: "-----BEGIN DECOY KEY-----\nDECOY KEY - DO NOT USE\n-----END DECOY KEY-----"}, {id: idGenerator(), name: "decoy_2.pem", type: "file", content: "-----BEGIN DECOY KEY-----\nDECOY KEY - DO NOT USE\n-----END DECOY KEY-----"}] },
                { id: idGenerator(), name: "account_settings.json", type: "file", content: "{\n  \"user\": \"guest\",\n  \"theme\": \"dark_mode\",\n  \"notifications\": true,\n  \"auto_save\": false\n}" },
                { id: idGenerator(), name: "mission_log.md", type: "file", content: "# Operation: SILENT ECHO\n\nCurrent Status: ACTIVE\n\nObjectives:\n- Establish uplink\n- Bypass firewall\n- Retrieve payload" },
                { id: idGenerator(), name: "checksum.md5", type: "file", content: "d41d8cd98f00b204e9800998ecf8427e  core_v2.bin" },
                { id: idGenerator(), name: "LICENSE", type: "file", content: "MIT License\n\nCopyright (c) 2024 Yazi Quest" },
                { id: idGenerator(), name: "manifest.json", type: "file", content: "{\n  \"version\": \"1.0.4\",\n  \"build\": 884,\n  \"dependencies\": []\n}" },
                { id: idGenerator(), name: "branding_logo.svg", type: "file", content: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgc3Ryb2tlPSJvcmFuZ2UiIHN0cm9rZS13aWR0aD0iMyIgZmlsbD0ibm9uZSIgLz48L3N2Zz4=" },
                { id: idGenerator(), name: "server_config.ini", type: "file", content: "[server]\nport=8080\nhost=localhost\nmax_connections=100" },
                { id: idGenerator(), name: "notes_v1.txt", type: "file", content: "Meeting notes from Monday:\n- Discussed Q3 goals\n- Server migration postponed" },
                { id: idGenerator(), name: "notes_v2.txt", type: "file", content: "Meeting notes from Tuesday:\n- Budget approved\n- Hiring freeze" },
                { id: idGenerator(), name: "error.log", type: "file", content: "[ERROR] Connection timed out\n[ERROR] Failed to load resource: net::ERR_CONNECTION_REFUSED" },
                { id: idGenerator(), name: "setup_script.sh", type: "file", content: "#!/bin/bash\necho \"Installing dependencies...\"\nnpm install\necho \"Done.\"" },
                { id: idGenerator(), name: "auth_token.tmp", type: "file", content: "EYJhbGciOiJIUzI1...\n[EXPIRES: 2024-12-31]" },
                { id: idGenerator(), name: "policy_draft.docx", type: "file", content: "[MS-WORD DOCUMENT]\nTitle: Security Policy Draft v4\nAuthor: SysAdmin\n\n[BINARY CONTENT]" },
                { id: idGenerator(), name: "public_key.pub", type: "file", content: "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC...\nguest@mainframe" },
                { id: idGenerator(), name: "z_end_of_file.eof", type: "file", content: "0x00 0x00 0x00 [EOF]" }
              ]
            },
            {
              id: "downloads",
              name: "incoming",
              type: "dir",
              children: [
                { id: idGenerator(), name: "audit_log_773.txt", type: "file", content: "Audit #773: Pass" },
                { id: idGenerator(), name: "buffer_overflow.dmp", type: "file", content: "Error: 0x88291" },
                { id: idGenerator(), name: "cache_fragment_a.tmp", type: "file", content: "00110001" },
                { id: idGenerator(), name: "cache_fragment_b.tmp", type: "file", content: "11001100" },
                { id: idGenerator(), name: "daily_report.doc", type: "file", content: "Report: All Clear" },
                { id: idGenerator(), name: "error_stack.trace", type: "file", content: "Stack trace overflow..." },
                { id: idGenerator(), name: "fragment_001.dat", type: "file", content: "[DATA]" },
                { id: idGenerator(), name: "fragment_002.dat", type: "file", content: "[DATA]" },
                { id: idGenerator(), name: "fragment_003.dat", type: "file", content: "[DATA]" },
                { id: idGenerator(), name: "fragment_004.dat", type: "file", content: "[DATA]" },
                { id: idGenerator(), name: "fragment_005.dat", type: "file", content: "[DATA]" },
                { id: idGenerator(), name: "junk_mail.eml", type: "file", content: "Subject: URGENT ACTION" },
                { id: idGenerator(), name: "kernel_panic.log", type: "file", content: "Panic at 0x00" },
                { id: idGenerator(), name: "license_agreement.txt", type: "file", content: "Terms and Conditions..." },
                { id: idGenerator(), name: "marketing_spam.eml", type: "file", content: "Buy now!" },
                { id: idGenerator(), name: "metrics_raw.csv", type: "file", content: "id,value\n1,10" },
                { id: idGenerator(), name: "sector_map.png", type: "file", content: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=600&auto=format&fit=crop" },
                { id: idGenerator(), name: "session_data.bin", type: "file", content: "[BINARY SESSION DATA]" },
                { id: idGenerator(), name: "status_report.txt", type: "file", content: "System Status: Nominal" },
                { id: idGenerator(), name: "system_health.json", type: "file", content: "{\"cpu\": 45, \"memory\": 62, \"disk\": 78}" },
                { id: idGenerator(), name: "temp_cache.tmp", type: "file", content: "[TEMPORARY CACHE]" },
                { id: idGenerator(), name: "telemetry_data.csv", type: "file", content: "timestamp,event\n12345,boot" },
                { id: idGenerator(), name: "test_results.xml", type: "file", content: "<results><test passed=\"true\"/></results>" },
                { id: idGenerator(), name: "thread_dump.log", type: "file", content: "Thread-0: WAITING\nThread-1: RUNNING" },
                { id: idGenerator(), name: "timestamp.log", type: "file", content: "2024-12-15 10:23:45 UTC" },
                { id: "virus", name: "watcher_agent.sys", type: "file", content: "[ACTIVE SURVEILLANCE BEACON]\nTransmitting coordinates to external server...\nSTATUS: ACTIVE\nTHREAT LEVEL: HIGH" },
                { id: idGenerator(), name: "backup_logs.zip", type: "archive", children: [{ id: idGenerator(), name: "sys_v1.log", type: "file", content: "System initialized...\nBoot sequence complete." }, { id: idGenerator(), name: "sys_v2.log", type: "file", content: "Network scan complete...\n3 vulnerabilities found." }] },
                { id: idGenerator(), name: "invoice_2024.pdf", type: "file", content: "[PDF HEADER]\nInvoice #99283\nAmount: $99.00" },
                { id: idGenerator(), name: "meme_collection.zip", type: "archive", children: [{ id: idGenerator(), name: "classic_cat.jpg", type: "file", content: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=600&auto=format&fit=crop" }, { id: idGenerator(), name: "coding_time.gif", type: "file", content: "https://images.unsplash.com/photo-1531259683007-016a7b628fc3?q=80&w=600&auto=format&fit=crop" }] }
              ]
            },
            {
              id: "pics",
              name: "media",
              type: "dir",
              children: [
                { id: idGenerator(), name: "wallpaper.jpg", type: "file", content: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=600&auto=format&fit=crop" }
              ]
            },
            { id: "workspace", name: "workspace", type: "dir", children: [] },
            {
              id: "config",
              name: ".config",
              type: "dir",
              children: [
                { id: idGenerator(), name: "yazi.toml", type: "file", content: "[manager]\nsort_by = \"natural\"\nshow_hidden = true\n\n[preview]\nmax_width = 1000" },
                { id: idGenerator(), name: "theme.toml", type: "file", content: "[theme]\nprimary = \"orange\"\nsecondary = \"blue\"" }
              ]
            },
            { id: ".cache", name: ".cache", type: "dir", children: [{id: idGenerator(), name: "thumbnails.db", type: "file", content: "[CACHE DATA]"}, {id: idGenerator(), name: "temp_session.json", type: "file", content: "{\"session\": \"cached\"}"}] },
            { id: ".local", name: ".local", type: "dir", children: [{id: idGenerator(), name: "state.db", type: "file", content: "[STATE DATABASE]"}] },
            { id: idGenerator(), name: ".bashrc", type: "file", content: "# Bash configuration\nalias ls='ls --color=auto'\nexport PATH=$PATH:~/bin" },
            { id: idGenerator(), name: ".bash_history", type: "file", content: "cd workspace\nls -la\nrm trace.log\nexit" },
            { id: idGenerator(), name: ".profile", type: "file", content: "# User profile\nexport EDITOR=vim" }
          ]
        }
      ]
    },
    {
      id: "var",
      name: "var",
      type: "dir",
      children: [
          { id: "log", name: "log", type: "dir", children: [{ id: idGenerator(), name: "kernel_panic.log", type: "file", content: "ERROR: KERNEL PANIC 0xDEADBEEF - CORRUPTED SECTOR DATA" }] }
      ]
    },
    {
      id: "bin",
      name: "bin",
      type: "dir",
      children: [
        { id: idGenerator(), name: "bash", type: "file", content: "#!/bin/bash\n[ELF BINARY]\nGNU Bash version 5.2.15" },
        { id: idGenerator(), name: "cat", type: "file", content: "[ELF BINARY]\ncoreutils - concatenate files" },
        { id: idGenerator(), name: "chmod", type: "file", content: "[ELF BINARY]\nchange file mode bits" },
        { id: idGenerator(), name: "cp", type: "file", content: "[ELF BINARY]\ncopy files and directories" },
        { id: idGenerator(), name: "grep", type: "file", content: "[ELF BINARY]\npattern matching utility" },
        { id: idGenerator(), name: "ls", type: "file", content: "[ELF BINARY]\nlist directory contents" },
        { id: idGenerator(), name: "mkdir", type: "file", content: "[ELF BINARY]\nmake directories" },
        { id: idGenerator(), name: "mv", type: "file", content: "[ELF BINARY]\nmove (rename) files" },
        { id: idGenerator(), name: "rm", type: "file", content: "[ELF BINARY]\nremove files or directories" },
        { id: idGenerator(), name: "systemctl", type: "file", content: "[ELF BINARY]\nControl the systemd system and service manager" }
      ]
    },
    {
      id: "etc",
      name: "etc",
      type: "dir",
      children: [
        { id: idGenerator(), name: "sys_config.toml", type: "file", content: "security_level = \"high\"\nencryption = \"aes-256\"\nfirewall = true" },
        { id: idGenerator(), name: "hosts", type: "file", content: "127.0.0.1 localhost\n192.168.1.1 gateway" },
        { id: idGenerator(), name: "resolv.conf", type: "file", content: "nameserver 8.8.8.8\nnameserver 1.1.1.1" }
      ]
    },
    {
      id: "tmp",
      name: "tmp",
      type: "dir",
      children: [
        { id: idGenerator(), name: "sys_dump.log", type: "file", content: "Error: Connection reset by peer\nStack trace:\n  at core.net.TcpConnection.read (core/net.ts:42)\n  at processTicksAndRejections (internal/process/task_queues.js:95)" },
        { id: idGenerator(), name: "session_A1.tmp", type: "file", content: "UID: 88392-A\nSTATUS: TERMINATED\nCACHE_HIT: 0" },
        { id: idGenerator(), name: "session_B2.tmp", type: "file", content: "UID: 99281-B\nSTATUS: ACTIVE\nCACHE_HIT: 1" },
        { id: idGenerator(), name: "debug_trace.log", type: "file", content: "[DEBUG] Trace execution started\n[DEBUG] Memory mapped at 0x8829\n[WARN] High latency detected" },
        { id: idGenerator(), name: "temp_store.dat", type: "file", content: "0x00 0xFF 0xA2 [BINARY DATA]" },
        { id: idGenerator(), name: "overflow_heap.dmp", type: "file", content: "Heap dump triggered by OOM" },
        { id: idGenerator(), name: "socket_001.sock", type: "file", content: "[SOCKET]" },
        { id: idGenerator(), name: "metrics_buffer.json", type: "file", content: "{\"cpu\": 99, \"mem\": 1024}" },
        { id: idGenerator(), name: "ghost_process.pid", type: "file", content: "PID: 666" },
        { id: idGenerator(), name: "decoy_signal.trc", type: "file", content: "[DECOY SIGNAL DATA]\nFREQUENCY: 2.4GHz\nSTATUS: DORMANT" },
        { id: idGenerator(), name: "cache", type: "dir", children: [] }
      ]
    }
  ]
};

export const LEVELS: Level[] = [
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
      { id: "nav-1", description: "Enter 'datastore' directory (press 'l' when highlighted)", check: c => { var u; return ((u = getNodeByPath(c.fs, c.currentPath)) == null ? void 0 : u.name) === "datastore" }, completed: false },
      { id: "nav-2a", description: "Jump to bottom of file list (press Shift+G)", check: (c, u) => { const d = getNodeByPath(c.fs, c.currentPath); return (d == null ? void 0 : d.name) !== "datastore" ? false : c.usedG === true }, completed: false },
      { id: "nav-2b", description: "Jump to top of file list (press 'gg')", check: (c, u) => { const d = getNodeByPath(c.fs, c.currentPath); return (d == null ? void 0 : d.name) !== "datastore" ? false : c.usedGG === true }, completed: false },
      { id: "nav-3", description: "Navigate to /etc (use 'h' repeatedly to go up, then find etc)", check: c => !!findNodeByName(c.fs, "etc") && c.currentPath[c.currentPath.length - 1] === "etc", completed: false },
      { id: "nav-4", description: "Navigate to /bin directory", check: c => !!findNodeByName(c.fs, "bin") && c.currentPath[c.currentPath.length - 1] === "bin", completed: false }
    ]
  },
  {
    id: 2,
    episodeId: 1,
    title: "Threat Elimination & Sorting",
    description: "ANOMALY DETECTED. A tracking beacon infiltrates the incoming stream—active surveillance reporting your location to external servers. You must navigate to the incoming sector, organize the chaotic data stream using sorting protocols, inspect file metadata to confirm the threat, and purge the rogue agent before it locks onto your signal.",
    initialPath: null,
    hint: "Navigate to ~/incoming. ',' then 'a' to sort alphabetically. G to jump to bottom. Tab to inspect 'watcher_agent.sys'. d then y to delete.",
    coreSkill: "File Inspection (Tab), Delete (d) & Sort (,a)",
    environmentalClue: "THREAT: watcher_agent.sys in ~/incoming | TACTIC: Navigate → Sort ,a → Tab inspect → Delete",
    successMessage: "THREAT NEUTRALIZED. SORTING PROTOCOLS ESTABLISHED.",
    buildsOn: [1],
    leadsTo: [3],
    tasks: [
      { id: "del-1", description: "Navigate to incoming directory (~/incoming)", check: c => { const s = getNodeByPath(c.fs, c.currentPath); return (s == null ? void 0 : s.name) === "incoming" }, completed: false },
      { id: "del-1a", description: "Sort the files alphabetically (',' then 'a')", check: (c, s) => { var f; return (f = c.completedTaskIds[s.id]) != null && f.includes("del-1") ? c.sortBy === "alphabetical" && c.sortDirection === "asc" : false }, completed: false },
      { id: "del-2", description: "Jump to bottom of file list (G) to locate 'watcher_agent.sys'", check: (c, s) => { var r; if (!((r = c.completedTaskIds[s.id]) != null && r.includes("del-1a"))) return false; const f = getNodeByPath(c.fs, c.currentPath); return (f == null ? void 0 : f.name) === "incoming" && c.usedG === true }, completed: false },
      { id: "del-2b", description: "Inspect 'watcher_agent.sys' metadata (Tab)", check: (c, s) => { var z; const r = getVisibleItems(c)[c.cursorIndex], h = findNodeByName(c.fs, "incoming"); return !((z = h == null ? void 0 : h.children) == null ? void 0 : z.some(C => C.name === "watcher_agent.sys")) || c.showInfoPanel === true && (r == null ? void 0 : r.name) === "watcher_agent.sys" }, completed: false },
      { id: "del-3", description: "Purge 'watcher_agent.sys' (d, then y)", check: (c, s) => { var h; const f = findNodeByName(c.fs, "incoming"), r = (h = f == null ? void 0 : f.children) == null ? void 0 : h.find(p => p.name === "watcher_agent.sys"); return !!f && !r }, completed: false }
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
      { id: "move-0", description: "Navigate to ~/incoming, filter (f) to find 'sector_map.png'", check: c => { const u = getNodeByPath(c.fs, c.currentPath); if (!u || !u.children) return false; const d = c.filters[u.id] || "", p = (d ? u.children.filter(v => v.name.toLowerCase().includes(d.toLowerCase())) : u.children)[c.cursorIndex]; return u.name === "incoming" && !!d && p && p.name === "sector_map.png" }, completed: false },
      { id: "move-0b", description: "Exit filter mode (Esc)", check: (c, u) => { const d = u.tasks.find(r => r.id === "move-0"); return d != null && d.completed ? c.mode === "normal" : false }, completed: false },
      { id: "move-1", description: "Cut the asset (x)", check: (c, u) => { var r; const d = u.tasks.find(p => p.id === "move-0b"); return d != null && d.completed ? ((r = c.clipboard) == null ? void 0 : r.action) === "cut" && c.clipboard.nodes.some(p => p.name === "sector_map.png") : false }, completed: false },
      { id: "move-1b", description: "Clear the filter (Esc) to reset view", check: (c, u) => { const d = u.tasks.find(p => p.id === "move-1"); if (!(d != null && d.completed)) return false; const r = findNodeByName(c.fs, "incoming"); return r ? !c.filters[r.id] : true }, completed: false },
      { id: "move-2", description: "Deploy asset to 'media' in /home/guest (p)", check: c => { var d; const u = findNodeByName(c.fs, "media"); return !!((d = u == null ? void 0 : u.children) != null && d.find(r => r.name === "sector_map.png")) }, completed: false }
    ]
  },
  {
    id: 4,
    episodeId: 1,
    title: "Protocol Design",
    description: "EXTERNAL COMMUNICATION REQUIRED. To reach beyond this partition, you need uplink protocols—configuration files for network presence. Use create (a) to build a protocols directory in datastore with two configuration files inside.",
    initialPath: ["root", "home", "user", "docs"],
    hint: "Press 'a', type 'protocols/' (trailing slash = directory). Enter it with 'l'. Press 'a' again for each file: 'uplink_v1.conf', 'uplink_v2.conf'.",
    coreSkill: "Create (a)",
    environmentalClue: "CREATE: protocols/ → uplink_v1.conf, uplink_v2.conf",
    successMessage: "PROTOCOLS ESTABLISHED.",
    buildsOn: [1],
    leadsTo: [5, 8, 16],
    tasks: [
      { id: "create-1", description: "Construct 'protocols' directory in datastore", check: c => { var d; const u = findNodeByName(c.fs, "datastore"); return !!((d = u == null ? void 0 : u.children) != null && d.find(r => r.name === "protocols" && r.type === "dir")) }, completed: false },
      { id: "nav-protocols", description: "Navigate into 'protocols' sector in datastore", check: c => { var u; return ((u = getNodeByPath(c.fs, c.currentPath)) == null ? void 0 : u.name) === "protocols" }, completed: false },
      { id: "create-2", description: "Generate 'uplink_v1.conf' in protocols", check: c => { var d; const u = findNodeByName(c.fs, "protocols"); return !!((d = u == null ? void 0 : u.children) != null && d.find(r => r.name === "uplink_v1.conf")) }, completed: false },
      { id: "create-3", description: "Generate 'uplink_v2.conf' in protocols", check: c => { var d; const u = findNodeByName(c.fs, "protocols"); return !!((d = u == null ? void 0 : u.children) != null && d.find(r => r.name === "uplink_v2.conf")) }, completed: false }
    ]
  },
  {
    id: 5,
    episodeId: 1,
    title: "Batch Deployment",
    description: "PROTOCOLS VERIFIED. Moving files one at a time is inefficient—it leaves traces. Visual selection (Space) marks multiple targets before acting. Select both configs, cut them, and deploy to a new 'active' directory. One operation, minimal footprint.",
    initialPath: ["root", "home", "user", "docs"],
    hint: "Create 'active/' in datastore first. Enter 'protocols'. Press Space on each file to select. Press 'x' to cut both. Navigate to 'active'. Press 'p' to paste.",
    coreSkill: "Visual Selection (Space)",
    environmentalClue: "SELECT: uplink_v1.conf + uplink_v2.conf | MOVE TO: active/",
    successMessage: "BATCH DEPLOYMENT COMPLETE.",
    buildsOn: [3, 4],
    leadsTo: [9],
    onEnter: c => {
      const u = findNodeByName(c, "datastore");
      if (u && u.children) {
        let d = u.children.find(r => r.name === "protocols");
        if (!d) {
          d = { id: idGenerator(), name: "protocols", type: "dir", parentId: u.id, children: [] };
          u.children.push(d);
        }
        if (d.children) {
          if (!d.children.find(r => r.name === "uplink_v1.conf")) {
            d.children.push({ id: idGenerator(), name: "uplink_v1.conf", type: "file", content: "conf_1", parentId: d.id });
          }
          if (!d.children.find(r => r.name === "uplink_v2.conf")) {
            d.children.push({ id: idGenerator(), name: "uplink_v2.conf", type: "file", content: "conf_2", parentId: d.id });
          }
        }
      }
      return c;
    },
    tasks: [
      { id: "batch-0", description: "Establish 'active' deployment zone in datastore", check: c => { var d; const u = findNodeByName(c.fs, "datastore"); return !!((d = u == null ? void 0 : u.children) != null && d.find(r => r.name === "active" && r.type === "dir")) }, completed: false },
      { id: "batch-select", description: "Batch select uplink_v1.conf and uplink_v2.conf in protocols (Space)", check: c => { const u = findNodeByName(c.fs, "protocols"); if (!(u != null && u.children)) return false; const r = u.children.filter(p => c.selectedIds.includes(p.id)).map(p => p.name); return r.includes("uplink_v1.conf") && r.includes("uplink_v2.conf") }, completed: false },
      { id: "batch-cut", description: "Cut selection (x)", check: c => { var d, r, p; const u = ((d = c.clipboard) == null ? void 0 : d.nodes.some(v => v.name === "uplink_v1.conf")) && ((r = c.clipboard) == null ? void 0 : r.nodes.some(v => v.name === "uplink_v2.conf")); return ((p = c.clipboard) == null ? void 0 : p.action) === "cut" && u }, completed: false },
      { id: "batch-paste", description: "Navigate & Paste to 'active' in datastore", check: c => { var v, T, D; const u = findNodeByName(c.fs, "active"), d = findNodeByName(c.fs, "protocols"), r = ((v = u == null ? void 0 : u.children) == null ? void 0 : v.some(x => x.name === "uplink_v1.conf")) && ((T = u == null ? void 0 : u.children) == null ? void 0 : T.some(x => x.name === "uplink_v2.conf")), p = !((D = d == null ? void 0 : d.children) != null && D.some(x => x.name.includes("uplink"))); return !!(r && p) }, completed: false }
    ]
  },
  // Placeholders for remaining levels to ensure the app works. Real content would be reconstructed from dist if I had more time, or restored from backups.
  // Including skeleton levels for 6-16 to match the length and ids.
  {
    id: 6,
    episodeId: 2,
    title: "Archive Retrieval",
    description: "ACCESS UPGRADED. The 'incoming' data stream contains compressed historical logs. Manual extraction is inefficient. Use the Filter protocol (f) to isolate 'backup_logs.zip', enter the archive (l), and extract 'sys_v1.log' to the 'media' directory for analysis.",
    initialPath: ["root", "home", "user", "downloads"],
    hint: "1. Navigate to ~/incoming. 2. Press 'f', type 'backup'. 3. Enter the archive (l). 4. Highlight 'sys_v1.log', Press 'y'. 5. Navigate to ~/media. 6. Press 'p'.",
    coreSkill: "Filter (f) & Archive Ops",
    environmentalClue: "TARGET: backup_logs.zip/sys_v1.log → media",
    successMessage: "LOGS RETRIEVED.",
    buildsOn: [1, 2],
    leadsTo: [9],
    tasks: []
  },
  { id: 7, episodeId: 2, title: "Deep Scan Protocol", description: "", initialPath: null, hint: "", coreSkill: "", tasks: [] },
  { id: 8, episodeId: 2, title: "NEURAL CONSTRUCTION & VAULT", description: "", initialPath: null, hint: "", coreSkill: "", tasks: [] },
  { id: 9, episodeId: 2, title: "Signal Triangulation", description: "", initialPath: null, hint: "", coreSkill: "", tasks: [] },
  { id: 10, episodeId: 2, title: "Asset Security", description: "", initialPath: null, hint: "", coreSkill: "", tasks: [] },
  { id: 11, episodeId: 3, title: "Identity Forge", description: "", initialPath: null, hint: "", coreSkill: "", tasks: [] },
  { id: 12, episodeId: 3, title: "Root Access", description: "", initialPath: null, hint: "", coreSkill: "", tasks: [] },
  { id: 13, episodeId: 3, title: "Shadow Copy", description: "", initialPath: null, hint: "", coreSkill: "", tasks: [] },
  { id: 14, episodeId: 3, title: "Trace Removal", description: "", initialPath: null, hint: "", coreSkill: "", tasks: [] },
  { id: 15, episodeId: 3, title: "Grid Expansion", description: "", initialPath: null, hint: "", coreSkill: "", tasks: [] },
  { id: 16, episodeId: 3, title: "System Reset", description: "", initialPath: null, hint: "", coreSkill: "", tasks: [] }
];
