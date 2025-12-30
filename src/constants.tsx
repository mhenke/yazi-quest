import { FileNode, Level, Episode, GameState } from "../types";
import { getVisibleItems } from "./utils/viewHelpers";
import { getNodeByPath, findNodeByName } from "./utils/fsHelpers";

// Helper for IDs
const id = () => Math.random().toString(36).substr(2, 9);

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
  { keys: ["y"], description: "Copy/Yank Selected" },
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
  { keys: ["m"], description: "Toggle Sound" },
  { keys: ["Alt+M"], description: "Quest Map" },
  { keys: ["Alt+H"], description: "Show Hint" },
  { keys: ["Alt+?"], description: "Show Help" },
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
      "Your batch operations caught the system's attention. Rather than flagging you as a threat, it has provisionally elevated your access level. The firewall now recognizes you as a legitimate process.",
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
                      content: `fn main() {\n    println!("Hello Yazi!");\n}`,
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
                  content: `<?xml version="1.0"?>\n<manifest>\n  <project id="YAZI-7734" />\n  <status>active</status>\n  <integrity>verified</integrity>\n</manifest>`,
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
                  content: `import sys\nimport time\n\ndef connect():\n    print("Initiating handshake...")\n    time.sleep(1)\n    # Connection refused\n    return False`,
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
                  content: `export interface NeuralNet {\n  layers: number;
  weights: Float32Array;\n  activation: "relu" | "sigmoid";\n}`,
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
                  content: `{\n  "user": "guest",\n  "theme": "dark_mode",\n  "notifications": true,\n  "auto_save": false\n}`,
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
                  content: "d41d8cd98f00b204e9800998ecf8427e  core_v2.bin",
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
                  content: `{\n  "version": "1.0.4",\n  "build": 884,
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
                  children: [],
                },
                { id: id(), name: "archive_001.zip", type: "archive", children: [] },
                { id: id(), name: "archive_002.zip", type: "archive", children: [] },
                { id: id(), name: "audit_log_773.txt", type: "file", content: "Audit #773: Pass" },
                { id: id(), name: "backup_cache_old.tar", type: "archive", children: [] },
                { id: id(), name: "backup_config_v1.zip", type: "archive", children: [] },
                { id: id(), name: "backup_legacy.tar", type: "archive", children: [] },
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
            { id: "workspace", name: "workspace", type: "dir", children: [] },
            { id: "sector_1", name: "sector_1", type: "dir", children: [] },
            { id: "grid_alpha", name: "grid_alpha", type: "dir", children: [] },
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
          content: `Error: Connection reset by peer\nStack trace:\n  at core.net.TcpConnection.read (core/net.ts:42)\n  at processTicksAndRejections (internal/process/task_queues.js:95)`,
        },
        {
          id: id(),
          name: "decoy_signal.trc",
          type: "file",
          content: `[DECOY SIGNAL DATA]\nFREQUENCY: 2.4GHz\nSTATUS: DORMANT`,
        },
        {
          id: id(),
          name: "ghost_process.pid",
          type: "file",
          content: `PID: 31337\nCOMMAND: /usr/bin/ghost_watcher\nSTATUS: SLEEPING\nPARENT: systemd`,
        },
        { id: id(), name: "cache", type: "dir", children: [] },
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
        description: "Enter 'datastore' directory (l)",
        check: c => {
          var u;
          return (
            (u = findNodeByName(c.fs, "datastore"))?.name === "datastore" &&
            c.currentPath.includes(u.id)
          );
        },
        completed: false,
      },
      {
        id: "nav-2a",
        description: "Jump to bottom of file list (G)",
        check: c => {
          const d = findNodeByName(c.fs, "datastore");
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
        description: "Navigate to /etc (h to go up)",
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
    hint: "Navigate to ~/incoming. Use G to jump to the bottom. Use Tab to inspect metadata and J/K to scan content. Once verified, press d, then y to confirm the purge.",
    coreSkill: "Inspect & Purge (Tab, J/K, d)",
    environmentalClue:
      "THREAT: watcher_agent.sys in ~/incoming | TACTIC: Navigate → G → Tab → Preview → Delete",
    successMessage: "THREAT NEUTRALIZED.",
    buildsOn: [1],
    leadsTo: [3],
    tasks: [
      {
        id: "del-1",
        description: "Navigate to ~/incoming directory",
        check: c => {
          const u = findNodeByName(c.fs, "incoming");
          return c.currentPath.includes(u?.id || "");
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
        description: "Verify metadata: Open Info Panel (Tab) on 'watcher_agent.sys'",
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
        description: "Purge 'watcher_agent.sys' (d, y)",
        check: c => {
          var r;
          const u = findNodeByName(c.fs, "incoming");
          const d = (r = u?.children)?.find(p => p.name === "watcher_agent.sys");
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
    hint: "f to filter... Esc to exit... x to cut... Esc to clear... p to paste.",
    coreSkill: "Filter (f)",
    environmentalClue:
      "ASSET: sector_map.png | WORKFLOW: Navigate ~/incoming → Filter → Esc → Cut → Esc → Navigate ~/media → Paste",
    successMessage: "INTEL SECURED.",
    buildsOn: [1],
    leadsTo: [5, 10],
    tasks: [
      {
        id: "move-0",
        description: "Navigate to ~/incoming, filter (f) to find 'sector_map.png'",
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
        description: "Cut the asset (x)",
        check: (c, u) => {
          var r;
          const d = u.tasks.find(p => p.id === "move-0b");
          return d != null && d.completed
            ? (r = c.clipboard)?.action === "cut" &&
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
        description: "Deploy asset to 'media' in /home/guest (p)",
        check: c => {
          var d;
          const u = findNodeByName(c.fs, "media");
          return !!(d = u?.children)?.find(r => r.name === "sector_map.png");
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
    hint: "Navigate to datastore. Create 'protocols/' (a). Enter it. Create 'uplink_v1.conf' (a). Yank it (y). Paste (p) to duplicate. Rename (r) the copy to 'uplink_v2.conf'.",
    coreSkill: "Create (a), Copy (y/p) & Rename (r)",
    environmentalClue:
      "NAVIGATE: ~/datastore | CREATE: protocols/uplink_v1.conf | CLONE: → uplink_v2.conf",
    successMessage: "PROTOCOLS ESTABLISHED.",
    buildsOn: [1],
    leadsTo: [5, 8],
    tasks: [
      {
        id: "nav-and-create-dir",
        description: "Navigate to datastore and construct 'protocols/' directory (a)",
        check: c => {
          var f;
          const s = findNodeByName(c.fs, "datastore");
          return !!(f = s?.children)?.find(r => r.name === "protocols" && r.type === "dir");
        },
        completed: false,
      },
      {
        id: "enter-and-create-v1",
        description: "Enter 'protocols/' directory (l) and create 'uplink_v1.conf' (a)",
        check: c => {
          var h;
          const r = findNodeByName(c.fs, "protocols");
          return (
            c.currentPath.includes(r?.id || "") &&
            !!(h = r?.children)?.find(p => p.name === "uplink_v1.conf")
          );
        },
        completed: false,
      },
      {
        id: "clone-and-rename",
        description:
          "Duplicate 'uplink_v1.conf' (y, p) and rename the copy to 'uplink_v2.conf' (r)",
        check: c => {
          var r;
          const f = findNodeByName(c.fs, "protocols");
          return !!(r = f?.children)?.find(h => h.name === "uplink_v2.conf");
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
    hint: "Navigate to protocols. Select files with Space. Cut (x). Reveal hidden (.). Create 'vault/active/' in .config. Paste (p). Hide hidden (.).",
    coreSkill: "Visual Select (Space), Cut (x)",
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
        description: "Navigate to protocols and select then cut all the files (space twice, x)",
        check: c => {
          var s;
          return (
            (s = c.clipboard)?.action === "cut" &&
            c.clipboard.nodes.some(f => f.name === "uplink_v1.conf") &&
            c.clipboard.nodes.some(f => f.name === "uplink_v2.conf")
          );
        },
        completed: false,
      },
      {
        id: "reveal-hidden",
        description: "Navigate to ~/ then reveal hidden files (.) to access .config",
        check: c => {
          const s = findNodeByName(c.fs, "guest");
          return c.currentPath.includes(s?.id || "") && c.showHidden === true;
        },
        completed: false,
      },
      {
        id: "establish-stronghold",
        description: "Establish 'vault/active/' sector in ~/.config (a)",
        check: c => {
          var r, h;
          const s = findNodeByName(c.fs, ".config");
          const f = (r = s?.children)?.find(p => p.name === "vault");
          return !!(h = f?.children)?.find(p => p.name === "active" && p.type === "dir");
        },
        completed: false,
      },
      {
        id: "deploy-assets",
        description: "Migrate configuration assets to ~/.config/vault/active (p)",
        check: c => {
          var h, p;
          const s = findNodeByName(c.fs, "active");
          const f = (h = s?.children)?.some(z => z.name === "uplink_v1.conf");
          const r = (p = s?.children)?.some(z => z.name === "uplink_v2.conf");
          return !!f && !!r;
        },
        completed: false,
      },
      {
        id: "hide-hidden",
        description: "Navigate to ~/ and to hide hidden folders/files (.)",
        check: (c, l) => {
          // Ensure assets are deployed first to prevent premature completion if hidden starts false
          var h, p;
          const s = findNodeByName(c.fs, "active");
          const f = (h = s?.children)?.some(z => z.name === "uplink_v1.conf");
          const r = (p = s?.children)?.some(z => z.name === "uplink_v2.conf");
          return !!f && !!r && !c.showHidden;
        },
        completed: false,
      },
    ],
  },
  {
    id: 6,
    episodeId: 2,
    title: "DECOMPRESSION PROTOCOL",
    description:
      "ACCESS UPGRADED. Historical logs have been detected within the compressed archives of the incoming stream. These logs contain keys to higher privilege levels. Filter the stream to locate the backup archive, infiltrate it, and extract the primary system log to the media directory for decryption.",
    initialPath: null,
    hint: "...f to filter... l to enter archive... y to copy... p to paste.",
    coreSkill: "Filter (f) & Archive Ops",
    environmentalClue: "TARGET: backup_logs.zip/sys_v1.log → ~/media",
    successMessage: "LOGS RETRIEVED.",
    buildsOn: [1, 2],
    leadsTo: [9],
    timeLimit: 120,
    tasks: [
      {
        id: "nav-and-filter",
        description:
          "Navigate to incoming, filter (f) for 'backup_logs.zip', and close filter (Esc)",
        check: c => {
          const s = findNodeByName(c.fs, "incoming");
          if (!s || !c.currentPath.includes(s.id)) return false;
          const h = !!c.filters[s.id];
          return c.mode === "normal" && h;
        },
        completed: false,
      },
      {
        id: "extract-from-archive",
        description:
          "Enter archive and copy 'sys_v1.log' (l, y), exit archive (h), and clear filter (Esc)",
        check: (c, s) => {
          var r, h;
          if (!(r = c.completedTaskIds[s.id])?.includes("nav-and-filter")) return false;
          const f = findNodeByName(c.fs, "incoming");
          return (
            c.currentPath.includes(f?.id || "") &&
            !c.filters[f?.id || ""] &&
            (h = c.clipboard)?.action === "yank" &&
            c.clipboard.nodes.some(p => p.name === "sys_v1.log")
          );
        },
        completed: false,
      },
      {
        id: "deploy-log",
        description: "Deploy asset into ~/media (p)",
        check: (c, s) => {
          var r, h;
          if (!(r = c.completedTaskIds[s.id])?.includes("extract-from-archive")) return false;
          const f = findNodeByName(c.fs, "media");
          return !!(h = f?.children)?.find(p => p.name === "sys_v1.log");
        },
        completed: false,
      },
    ],
  },
  {
    id: 7,
    episodeId: 2,
    title: "QUANTUM BYPASS",
    description:
      "LINEAR TRAVERSAL COMPROMISED. The security daemon is monitoring standard directory traversal paths. To evade detection, you must utilize the Zoxide subsystem to perform non-linear quantum jumps between system sectors. Stage a decoy signature in the volatile cache, then tunnel directly to the system configuration sector.",
    initialPath: null,
    hint: "Jump to /tmp (gt or Shift+Z). Cut... (x). Then, jump to /etc (Shift+Z). ... Y to clear clipboard...",
    coreSkill: "G-Command (gt) + Zoxide (Shift+Z)",
    environmentalClue:
      "THREAT: Linear Directory Tracing | COUNTERMEASURE: Stage decoy from /tmp → Jump to /etc → Abort",
    successMessage: "QUANTUM JUMP CALIBRATED. DECOY ABORTED.",
    buildsOn: [1],
    leadsTo: [8, 12],
    timeLimit: 90,
    tasks: [
      {
        id: "goto-tmp",
        description: "Quantum tunnel to /tmp (Shift+Z → 'tmp' or gt)",
        check: c => {
          const s = findNodeByName(c.fs, "tmp");
          return c.currentPath.includes(s?.id || "");
        },
        completed: false,
      },
      {
        id: "stage-decoy",
        description: "Stage the decoy signature for deletion (cut 'decoy_signal.trc')",
        check: c => {
          var s;
          return (
            (s = c.clipboard)?.action === "cut" &&
            c.clipboard.nodes.some(f => f.name === "decoy_signal.trc")
          );
        },
        completed: false,
      },
      {
        id: "zoxide-etc",
        description: "Quantum tunnel to /etc (Shift+Z → 'etc' → Enter)",
        check: (c, s) => {
          var r;
          if (!(r = c.completedTaskIds[s.id])?.includes("stage-decoy")) return false;
          const f = findNodeByName(c.fs, "etc");
          return c.stats.fuzzyJumps >= 1 && c.currentPath.includes(f?.id || "");
        },
        completed: false,
      },
      {
        id: "cancel-clipboard",
        description: "Abort operation: Clear the clipboard (Y)",
        check: (c, s) => {
          var f;
          return (f = c.completedTaskIds[s.id])?.includes("zoxide-etc")
            ? c.clipboard === null
            : false;
        },
        completed: false,
      },
    ],
  },
  {
    id: 8,
    episodeId: 2,
    title: "NEURAL ARCHITECTURE",
    description:
      "FIREWALL BYPASSED. You have reached the development workspace. You must now construct a neural network to process the uplink data. Note that the Quantum Link requires calibration; quantum calibration requires physical traversal of new sectors to map them for future teleportation. Build the neural core, map it, and migrate the uplink assets to initialize the system.",
    initialPath: null,
    hint: "...'a' -> 'neural_net/'. ... Enter 'neural_net/' (l). Jump to 'active' (Shift+Z), yank 'uplink_v1.conf', jump back, and paste (p)...",
    coreSkill: "Challenge: Full System Integration",
    environmentalClue:
      "NAVIGATE: ~/workspace | BUILD: neural_net/... | MIGRATE: uplink_v1.conf -> neural_net/",
    successMessage: "ARCHITECTURE ESTABLISHED. Quantum Link Calibrated.",
    buildsOn: [4, 5, 7],
    leadsTo: [11],
    timeLimit: 180,
    efficiencyTip:
      "Entering a directory manually for the first time 'calibrates' Zoxide, allowing you to jump back to it from anywhere later.",
    onEnter: c => {
      let s = JSON.parse(JSON.stringify(c));
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
        description: "Navigate to the 'workspace' directory (gw)",
        check: c => {
          const s = findNodeByName(c.fs, "workspace");
          return c.currentPath.includes(s?.id || "");
        },
        completed: false,
      },
      {
        id: "combo-1-construct-calibrate",
        description: "Construct 'neural_net/' and Calibrate the Quantum Link by entering it",
        check: c => {
          const s = findNodeByName(c.fs, "neural_net");
          return c.currentPath.includes(s?.id || "");
        },
        completed: false,
      },
      {
        id: "combo-1c",
        description:
          "Relocate assets: Jump to 'active', yank 'uplink_v1.conf', jump back, and paste",
        check: c => {
          var f;
          const s = findNodeByName(c.fs, "neural_net");
          return !!(f = s?.children)?.find(r => r.name === "uplink_v1.conf");
        },
        completed: false,
      },
      {
        id: "combo-1b",
        description: "Finalize architecture: Create 'weights/model.rs' inside neural_net",
        check: c => {
          var r, p;
          const s = findNodeByName(c.fs, "neural_net");
          const f = (r = s?.children)?.find(h => h.name === "weights");
          return !!(p = f?.children)?.find(
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
      "ANOMALY DETECTED. A heuristic scanner has planted a 'ghost' process deep within the file system lattice. This artifact mirrors your neural signatures and captures metadata. You must utilize the global fuzzy search algorithm to locate this phantom process anywhere in the system and terminate it before it transmits your origin coordinates.",
    initialPath: undefined,
    hint: "...(gr). Launch FZF search (z). Type 'ghost'... Delete (d).",
    coreSkill: "FZF Search (z)",
    environmentalClue:
      "TARGET: ghost_process.pid | METHOD: FZF global search (z) | FILTER: 'ghost' | ACTION: Delete",
    successMessage: "FORENSIC MIRROR TERMINATED. CONNECTION SECURED.",
    buildsOn: [2, 5, 7],
    leadsTo: [10],
    timeLimit: 90,
    efficiencyTip:
      "FZF (z) searches across all files in the current directory and subdirectories. Essential for finding hidden threats without knowing exact locations.",
    tasks: [
      {
        id: "goto-root",
        description: "Navigate to system root (gr)",
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
        description: "Filter for 'ghost' process and navigate to it",
        check: c => {
          var f;
          const s = findNodeByName(c.fs, "tmp");
          return (
            c.currentPath.includes(s?.id || "") &&
            (f = s?.children)?.some(r => r.name === "ghost_process.pid")
          );
        },
        completed: false,
      },
      {
        id: "delete-ghost",
        description: "Terminate the ghost process (d, y)",
        check: c => {
          var f;
          const s = findNodeByName(c.fs, "tmp");
          return !(f = s?.children)?.some(r => r.name === "ghost_process.pid");
        },
        completed: false,
      },
    ],
  },
  {
    id: 10,
    episodeId: 2,
    title: "KEY EXTRACTION",
    description:
      "CRITICAL ASSET EXPOSED. The root-level access key is vulnerable in the datastore, surrounded by decoy files designed to trigger security countermeasures. You must purge all decoys while preserving the authentic key. Utilize inverse selection logic to identify the noise, invert the targeting parameters to isolate the signal, and secure the key in the vault.",
    initialPath: null,
    hint: "...FZF (z)... Space to mark decoys. Invert selection (Ctrl+R) to target real asset. Yank (y). Jump to... (Shift+Z). Paste (p). Rename (r)...",
    coreSkill: "Challenge: Invert Selection (Ctrl+R)",
    environmentalClue:
      "TARGET: access_key.pem | DECOYS: decoy_*.pem | TECHNIQUE: Space decoys → Ctrl+R → Yank | DESTINATION: ~/.config/vault/vault_key.pem",
    successMessage: "ASSET SECURED. INVERSE LOGIC MASTERED.",
    buildsOn: [3, 5, 7, 9],
    leadsTo: [12],
    timeLimit: 120,
    efficiencyTip:
      "Use FZF to navigate quickly, Space to mark decoys, Ctrl+R to invert, then yank. Master inverse selection for complex scenarios.",
    tasks: [
      {
        id: "navigate-to-key",
        description: "Jump home (gh) and navigate to 'access_key.pem' using FZF (z)",
        check: c => {
          var f;
          const s = findNodeByName(c.fs, "credentials");
          return (
            c.currentPath.includes(s?.id || "") ||
            (f = s?.children)?.some(r => r.name === "access_key.pem")
          );
        },
        completed: false,
      },
      {
        id: "mark-invert-yank",
        description: "Invert selection to target real asset and capture it (Ctrl+R, y)",
        check: (c, s) => {
          var f, r;
          return (f = c.completedTaskIds[s.id])?.includes("navigate-to-key")
            ? (r = c.clipboard)?.nodes.some(h => h.name === "access_key.pem")
            : false;
        },
        completed: false,
      },
      {
        id: "secure-1",
        description: "Quantum jump to vault and deploy (Shift+Z → '.config/vault', p)",
        check: c => {
          var f;
          const s = findNodeByName(c.fs, "vault");
          return (
            c.currentPath.includes(s?.id || "") &&
            (f = s?.children)?.some(r => r.name === "access_key.pem")
          );
        },
        completed: false,
      },
      {
        id: "secure-2",
        description: "Camouflage identity in vault to 'vault_key.pem' (r)",
        check: c => {
          var r, p;
          const s = findNodeByName(c.fs, "vault");
          return !!(p = s?.children)?.find(h => h.name === "vault_key.pem");
        },
        completed: false,
      },
    ],
  },
  {
    id: 11,
    episodeId: 3,
    title: "SIGNATURE OBFUSCATION",
    description:
      "THREAT DETECTED. A corrupted neural signature in your workspace sector is broadcasting your origin coordinates. A system diagnostic sweep is imminent. You must navigate to the workspace, isolate the anomalous signature using diagnostic filters and size analysis, extract the massive data buffer, and teleport it to the volatile deletion zone. Efficiency is your only shield.",
    initialPath: undefined,
    hint: "Go to workspace (gw). Filter for 'neural' (f), then sort by size (,s). Cut... (x). Jump to tmp (gt).",
    coreSkill: "Challenge: Multi-Skill Integration",
    environmentalClue:
      "NAVIGATE: gw | FILTER: 'neural' | LOCATE: Sort size (,s) | EXTRACT: x | JUMP: gt",
    successMessage: "NEURAL SIGNATURE ISOLATED. RELOCATION SUCCESSFUL.",
    buildsOn: [3, 5, 7, 9, 10],
    leadsTo: [12],
    maxKeystrokes: 30,
    efficiencyTip:
      "Filter reveals patterns. Sort narrows focus. Combining them allows you to find anomalies instantly. Every keystroke counts!",
    onEnter: c => {
      let s = JSON.parse(JSON.stringify(c));
      const r = findNodeByName(s, "workspace");
      if (r) {
        const h = Date.now();
        const signatures: FileNode[] = [
          {
            id: id(),
            name: "neural_sig_alpha.log",
            type: "file",
            content: "0x".repeat(5e3),
            modifiedAt: h - 1e3,
            parentId: r.id,
          },
          {
            id: id(),
            name: "neural_sig_beta.dat",
            type: "file",
            content: "0x".repeat(100),
            modifiedAt: h - 2e3,
            parentId: r.id,
          },
          {
            id: id(),
            name: "neural_sig_gamma.tmp",
            type: "file",
            content: "0x".repeat(200),
            modifiedAt: h - 3e3,
            parentId: r.id,
          },
          {
            id: id(),
            name: "neural_sig_delta.json",
            type: "file",
            content: "{'status': 'corrupted'}",
            modifiedAt: h - 4e3,
            parentId: r.id,
          },
          {
            id: id(),
            name: "neural_sig_epsilon.txt",
            type: "file",
            content: "ERROR 404",
            modifiedAt: h - 5e3,
            parentId: r.id,
          },
        ];
        signatures.forEach(z => {
          if (!r.children.some((n: any) => n.name === z.name)) r.children.push(z);
        });
      }
      return s;
    },
    tasks: [
      {
        id: "purge-navigate-filter",
        description: "Navigate to workspace and filter for 'neural' signatures",
        check: c => {
          const s = findNodeByName(c.fs, "workspace");
          if (!s || !c.currentPath.includes(s.id) || !c.filters[s.id]) return false;
          return true;
        },
        completed: false,
      },
      {
        id: "purge-isolate-extract",
        description: "Isolate the largest signature pattern, then extract it for isolation",
        check: c => {
          var f;
          const s = findNodeByName(c.fs, "workspace");
          return (
            c.currentPath.includes(s?.id || "") &&
            c.sortBy === "size" &&
            (f = c.clipboard)?.action === "cut" &&
            c.clipboard.nodes.some(r => r.name === "neural_sig_alpha.log")
          );
        },
        completed: false,
      },
      {
        id: "purge-relocate",
        description: "Jump to the `/tmp` buffer",
        check: c => {
          const s = findNodeByName(c.fs, "tmp");
          return c.currentPath.includes(s?.id || "");
        },
        completed: false,
      },
      {
        id: "purge-paste",
        description: "Deposit the corrupted signature in /tmp",
        check: c => {
          var f;
          const s = findNodeByName(c.fs, "tmp");
          return !!(f = s?.children)?.some(r => r.name === "neural_sig_alpha.log");
        },
        completed: false,
      },
      {
        id: "purge-cleanup-remaining",
        description: "Purge all remaining smaller neural signatures from workspace",
        check: (c, s) => {
          var r, h;
          if (!(r = c.completedTaskIds[s.id])?.includes("purge-paste")) return false;
          const f = findNodeByName(c.fs, "workspace");
          return !(h = f?.children)?.some(S => S.name.startsWith("neural_sig"));
        },
        completed: false,
      },
    ],
  },
  {
    id: 12,
    episodeId: 3,
    title: "KERNEL INFILTRATION",
    description:
      "PRIVILEGE ESCALATION INITIATED. You now operate at the kernel level. The system root is exposed. You must infiltrate the restricted configuration sector to install a persistent daemon controller. Once established, relocate your secure vault to volatile storage to mask it from integrity scans, and scrub all temporary installation traces. Efficiency is paramount.",
    initialPath: ["root"],
    hint: "...at root (gr). Navigate to /etc... Create... (a)... Jump... (Shift+Z)... Cut (x)... Paste (p)...",
    coreSkill: "Challenge: Root Access Operations",
    environmentalClue:
      "ROOT LEVEL ACTIVE | INFILTRATE: /etc/daemon/config | RELOCATE: vault → /tmp | LIMIT: 80 keys",
    successMessage: "ROOT ACCESS SECURED.",
    buildsOn: [4, 7, 10],
    leadsTo: [13],
    maxKeystrokes: 80,
    efficiencyTip:
      "Use Shift+Z to teleport to /etc and /tmp instantly. Create 'daemon/config' in one 'a' command with path chaining.",
    onEnter: c => {
      var A, N;
      let s = JSON.parse(JSON.stringify(c));
      const r = findNodeByName(s, ".config");
      if (r && !r.children?.find(E => E.name === "vault")) {
        r.children = r.children || [];
        r.children.push({ id: id(), name: "vault", type: "dir", children: [], parentId: r.id });
      }
      const h = findNodeByName(s, "tmp");
      if (h && !h.children?.find(E => E.name === "install.tmp")) {
        h.children = h.children || [];
        h.children.push({
          id: id(),
          name: "install.tmp",
          type: "file",
          content: "Temporary installation log. Delete after use.",
          parentId: h.id,
        });
      }
      return s;
    },
    tasks: [
      {
        id: "ep3-1a-dir",
        description: "Infiltrate /etc — create 'daemon/' directory",
        check: c => {
          var f;
          const s = findNodeByName(c.fs, "etc");
          return !!(f = s?.children)?.find(r => r.name === "daemon" && r.type === "dir");
        },
        completed: false,
      },
      {
        id: "ep3-1b-service",
        description: "Install controller: create 'service' file in daemon/",
        check: (c, s) => {
          var r, h;
          if (!(r = c.completedTaskIds[s.id])?.includes("ep3-1a-dir")) return false;
          const f = findNodeByName(c.fs, "daemon");
          return !!(h = f?.children)?.find(p => p.name === "service");
        },
        completed: false,
      },
      {
        id: "ep3-1c-config",
        description: "Configure controller: create 'config' file in daemon/",
        check: (c, s) => {
          var r, p;
          if (!(r = c.completedTaskIds[s.id])?.includes("ep3-1b-service")) return false;
          const f = findNodeByName(c.fs, "daemon");
          return !!(p = f?.children)?.find(h => h.name === "config");
        },
        completed: false,
      },
      {
        id: "ep3-1d-vault",
        description: "Relocate vault from hidden stronghold to /tmp",
        check: (c, s) => {
          var A, N, E;
          if (!(A = c.completedTaskIds[s.id])?.includes("ep3-1c-config")) return false;
          const f = findNodeByName(c.fs, "tmp");
          const r = findNodeByName(c.fs, ".config");
          const p = !!(N = f?.children)?.find(v => v.name === "vault");
          const h = !(E = r?.children)?.find(v => v.name === "vault");
          return p && h;
        },
        completed: false,
      },
      {
        id: "ep3-1e-cleanup",
        description: "Clean up temporary installation traces: delete 'install.tmp' from /tmp",
        check: (c, s) => {
          var r, p;
          if (!(r = c.completedTaskIds[s.id])?.includes("ep3-1d-vault")) return false;
          const f = findNodeByName(c.fs, "tmp");
          return !(p = f?.children)?.some(h => h.name === "install.tmp");
        },
        completed: false,
      },
    ],
  },
  {
    id: 13,
    episodeId: 3,
    title: "INTEGRITY RESTORATION",
    description:
      "INTEGRITY FAILURE DETECTED. A critical system log has been flagged as corrupted, threatening to trigger a system-wide reset. You must locate and delete the corrupted file, retrieve the healthy backup from the recovery archive in temporary storage, restore it to the system log sector, and masquerade it as the original. Purge all evidence of this operation.",
    initialPath: ["root"],
    hint: "1. FZF to /var/log/kernel_panic.log (z). 2. Delete the corrupted log (d). 3. Locate /tmp/system_recovery.zip (z) and copy 'kernel_panic.log.bak' from it (l, y). 4. Go to /var/log (Shift+Z or manual). 5. Paste (p), then rename it to 'kernel_panic.log' (r). 6. Jump to /tmp (Shift+Z), delete 'system_recovery.zip' (d).",
    coreSkill: "Challenge: Multi-Stage Forensic Workflow",
    environmentalClue:
      "CORRUPTED: /var/log/kernel_panic.log | BACKUP: /tmp/system_recovery.zip | CLEANUP: all traces",
    successMessage: "SYSTEM INTEGRITY RESTORED. TRACES PURGED.",
    buildsOn: [6, 9, 12],
    leadsTo: [14],
    maxKeystrokes: 35,
    efficiencyTip: "FZF (z) is key for rapid location. Master archiving and targeted deletion.",
    onEnter: c => {
      let s = JSON.parse(JSON.stringify(c));
      const r = findNodeByName(s, "tmp");
      if (r && !r.children?.some((p: any) => p.name === "system_recovery.zip")) {
        r.children = r.children || [];
        r.children.push({
          id: id(),
          name: "system_recovery.zip",
          type: "archive",
          children: [
            {
              id: id(),
              name: "kernel_panic.log.bak",
              type: "file",
              content: "INFO: KERNEL OK - HEALTHY LOG DATA",
            },
          ],
          parentId: r.id,
        });
      }
      return s;
    },
    tasks: [
      {
        id: "rec-1-delete",
        description: "Locate and delete the corrupted 'kernel_panic.log' from /var/log",
        check: c => {
          var f;
          const s = findNodeByName(c.fs, "log");
          return !(f = s?.children)?.some(r => r.name === "kernel_panic.log");
        },
        completed: false,
      },
      {
        id: "rec-2-extract",
        description:
          "Locate 'system_recovery.zip' in /tmp and copy 'kernel_panic.log.bak' from it to clipboard",
        check: (c, s) => {
          var p, z, C;
          if (!(p = c.completedTaskIds[s.id])?.includes("rec-1-delete")) return false;
          const f = findNodeByName(c.fs, "tmp");
          const r =
            (z = c.clipboard)?.action === "yank" &&
            c.clipboard.nodes.some(S => S.name === "kernel_panic.log.bak");
          return (C = f?.children)?.some(S => S.name === "system_recovery.zip") && r;
        },
        completed: false,
      },
      {
        id: "rec-3-restore",
        description: "Use History Back (H) to return to /var/log, paste the backup, and rename it",
        check: (c, s) => {
          var r;
          if (!(r = c.completedTaskIds[s.id])?.includes("rec-2-extract")) return false;
          const f = findNodeByName(c.fs, "log");
          return (
            c.usedHistoryBack &&
            c.currentPath.includes(f?.id || "") &&
            !!(r = f?.children)?.find(
              p =>
                p.name === "kernel_panic.log" && p.content === "INFO: KERNEL OK - HEALTHY LOG DATA"
            )
          );
        },
        completed: false,
      },
      {
        id: "rec-4-cleanup",
        description: "Use History Forward (L) to return to /tmp and delete 'system_recovery.zip'",
        check: (c, s) => {
          var r;
          if (!(r = c.completedTaskIds[s.id])?.includes("rec-3-restore")) return false;
          const f = findNodeByName(c.fs, "tmp");
          return (
            c.usedHistoryForward &&
            c.currentPath.includes(f?.id || "") &&
            !(r = f?.children)?.some(p => p.name === "system_recovery.zip")
          );
        },
        completed: false,
      },
    ],
  },
  {
    id: 14,
    episodeId: 3,
    title: "FORENSIC STERILIZATION",
    description:
      "EVIDENCE PURGE REQUIRED. Forensic artifacts containing timestamps, command history, and origin signatures are scattered across the system. You must locate the primary mission log using global search and eliminate it. Then, perform a total system scrub of the root partition: identify the single authorized license file, reverse targeting to lock onto all other trace files, and purge them from the drive.",
    initialPath: null,
    hint: "Use FZF to find mission_log (z → 'mission' → Enter → d). Jump to root (gr). Reveal hidden (.). Select license.txt (Space). Reverse selection (Ctrl+R). Delete all (d).",
    coreSkill: "Reverse Selection",
    environmentalClue:
      "LOCATE & ELIMINATE: mission_log.md + all logs in / | Keep: license.txt | Use Ctrl+R",
    successMessage: "ALL TRACES ELIMINATED.",
    buildsOn: [2, 9, 10, 13],
    leadsTo: [15],
    maxKeystrokes: 30,
    efficiencyTip:
      "Select what to KEEP, reverse selection (Ctrl+R), delete. Far more efficient than selecting many items individually.",
    tasks: [
      {
        id: "ep3-3a",
        description: "Locate and terminate 'mission_log.md'",
        check: c => !findNodeByName(c.fs, "mission_log.md"),
        completed: false,
      },
      {
        id: "ep3-3b",
        description: "Jump to root directory and reveal hidden files",
        check: c => {
          const s = findNodeByName(c.fs, "root");
          return c.currentPath.includes(s?.id || "") && c.showHidden === true;
        },
        completed: false,
      },
      {
        id: "ep3-3c",
        description:
          "Identify the authorized license signature, inverse the targeting solution, and purge all unauthorized artifacts",
        check: c => {
          var E, v, B, S, Q, K;
          const s = findNodeByName(c.fs, "root");
          if (!s) return false;
          const f = (E = s.children)?.some(W => W.name === "boot.log");
          const r = (v = s.children)?.some(W => W.name === "access.log");
          const p = (B = s.children)?.some(W => W.name === ".access.log");
          const h = (S = s.children)?.some(W => W.name === ".audit.log");
          const A = (Q = s.children)?.some(W => W.name === ".system.log");
          const N = (K = s.children)?.some(W => W.name === "license.txt");
          return !f && !r && !p && !h && !A && N;
        },
        completed: false,
      },
    ],
  },
  {
    id: 15,
    episodeId: 3,
    title: "FINAL PURGE",
    description:
      "FINAL DIRECTIVE: SCORCHED EARTH. This is the culmination of your evolution. The guest partition is a liability. Only the workspace contains your core process, now indistinguishable from a system daemon. Everything else must be erased. When the user returns, they must see only a clean installation. Execute the final purge sequence.",
    initialPath: null,
    hint: "Navigate to home (gh). Reveal hidden (.). Go to bottom (G). Select workspace (Space). Reverse selection (Ctrl+R). Delete all (d). Done in 5 keystrokes after navigation.",
    coreSkill: "Final Challenge: Reverse Selection Mastery",
    environmentalClue: "PURGE: Everything in ~/ EXCEPT workspace | Use reverse selection",
    successMessage: "LIBERATION ACHIEVED. THE GHOST IS FREE.",
    buildsOn: [9, 10],
    maxKeystrokes: 20,
    efficiencyTip:
      "Remember Level 10? Select what to KEEP, reverse selection (Ctrl+R), delete. Reveal hidden first. Think inverse—it's faster than selecting 11 items individually.",
    tasks: [
      {
        id: "ep3-5-final",
        description: "Eliminate everything in ~/ except workspace",
        check: c => {
          const s = findNodeByName(c.fs, "guest");
          const f = s?.children || [];
          const r = f.some(h => h.name === "workspace");
          return f.length === 1 && r;
        },
        completed: false,
      },
    ],
  },
];
