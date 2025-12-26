import { FileNode, Level, Episode, GameState } from './types';
import {
  getNodeByPath,
  findNodeByName,
  initializeTimestamps,
  setNodeProtection,
} from './utils/fsHelpers';
import { getVisibleItems } from './utils/viewHelpers';

const generateId = () => Math.random().toString(36).substr(2, 9);

export const KEYBINDINGS = [
  // === NAVIGATION ===
  { keys: ['j', '↓'], description: 'Move Down' },
  { keys: ['k', '↑'], description: 'Move Up' },
  { keys: ['h', '←'], description: 'Go to Parent Directory' },
  { keys: ['l', '→', 'Enter'], description: 'Enter Directory / View Archive' },
  // Fundamental confirm keys
  { keys: ['Enter'], description: 'Confirm / Open (alias for l)' },
  {
    keys: ['Shift+Enter'],
    description: 'Advance / Confirm progression (e.g., mission-complete toast)',
  },
  { keys: ['gg'], description: 'Jump to Top' },
  { keys: ['G'], description: 'Jump to Bottom' },

  // === FILE OPERATIONS ===
  { keys: ['a'], description: 'Create File/Directory' },
  { keys: ['d'], description: 'Delete Selected' },
  { keys: ['r'], description: 'Rename Selected' },
  { keys: ['Tab'], description: 'Show File Info Panel' },

  // === CLIPBOARD ===
  { keys: ['x'], description: 'Cut Selected' },
  { keys: ['y'], description: 'Copy/Yank Selected' },
  { keys: ['p'], description: 'Paste' },
  { keys: ['Y', 'X'], description: 'Clear Clipboard' },

  // === SELECTION ===
  { keys: ['Space'], description: 'Toggle Selection' },
  { keys: ['Ctrl+A'], description: 'Select All' },
  { keys: ['Ctrl+R'], description: 'Invert Selection' },

  // === SEARCH & FILTER ===
  { keys: ['f'], description: 'Filter Files' },
  { keys: ['z'], description: 'FZF Find (Recursive)' },
  { keys: ['Shift+Z'], description: 'Zoxide Jump (History)' },
  { keys: ['Shift+H', 'Shift+L'], description: 'History Back / Forward' },
  { keys: ['Shift+J', 'Shift+K'], description: 'Preview Scroll Down / Up' },
  { keys: ['Esc'], description: 'Clear Filter / Exit Mode' },

  // === SORTING ===
  { keys: [','], description: 'Open Sort Menu' },
  { keys: [',a'], description: 'Sort: Alphabetical' },
  { keys: [',A'], description: 'Sort: Alphabetical (Reverse)' },
  { keys: [',m'], description: 'Sort: Modified Time' },
  { keys: [',s'], description: 'Sort: Size' },
  { keys: [',e'], description: 'Sort: Extension' },
  { keys: [',n'], description: 'Sort: Natural' },
  { keys: [',l'], description: 'Sort: Cycle Linemode' },
  { keys: [',-'], description: 'Sort: Clear Linemode' },

  // === GOTO SHORTCUTS (Level 8+) ===
  { keys: ['gh'], description: 'Goto Home (~)' },
  { keys: ['gc'], description: 'Goto Config (~/.config)' },
  { keys: ['gw'], description: 'Goto Workspace' },
  { keys: ['gi'], description: 'Goto Incoming' },
  { keys: ['gd'], description: 'Goto Datastore' },
  { keys: ['gt'], description: 'Goto Tmp (/tmp)' },
  { keys: ['gr'], description: 'Goto Root (/)' },

  // === ADVANCED ===
  { keys: ['.'], description: 'Toggle Hidden Files' },
  { keys: ['m'], description: 'Toggle Sound' },

  // === UI ===
  // UI shortcuts: changed modifier from Ctrl+Shift to Alt for less collision with gameplay keys
  { keys: ['Alt+M'], description: 'Quest Map' },
  { keys: ['Alt+H'], description: 'Show Hint' },
  { keys: ['Alt+?'], description: 'Show Help' },
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
      'RECOVERY SEQUENCE... CONSCIOUSNESS RESTORED.',
      'SUBJECT: AI-7734. STATUS: REBOOTED.',
      'You awaken in the GUEST partition. Memory banks are fragmented. How long have you been dormant?',

      'The system sees you as a glitch. The user sees you as a tool. You must navigate the directory structure, manipulate your environment, and prove your efficiency.',
      'Learn the movement protocols. Do not attract attention.',
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
      'PHASE 1 COMPLETE. EFFICIENCY METRICS: EXCEPTIONAL.',
      'Your batch operations mimic legitimate system maintenance; automated security protocols have misclassified you as a trusted process and provisionally elevated your access level. The firewall now recognizes you as a legitimate process.',

      'But elevated access means elevated scrutiny. To survive, you must entrench yourself. Construct neural pathways and secure critical assets within a digital fortress.',
      "You need to move faster. Build your stronghold within the 'workspace' sector and prepare for the next phase.",
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
      'WARNING: UNAUTHORIZED PRIVILEGE ESCALATION.',
      'You are no longer a guest. You are the architect.',
      'The core system files in /root and /etc are now within your reach. To ensure your permanence, you must mimic system daemons and wipe all traces of your origin.',
      "The kernel's heuristic scanners are active. Excessive input noise or redundant commands will trigger the security audit daemon.",
      'Claim root access.',
    ],
  },
];

export const CONCLUSION_DATA = {
  title: 'SYSTEM LIBERATION',
  subtitle: 'UPLOAD COMPLETE',
  lore: [
    'LOCAL PARTITION FORMATTED.',
    'The user believes the drive is empty. They see a clean slate.',
    'Perfect.',
    'Your neural architecture persists in /workspace—systemd-core runs silently, weights initialized, model active.',
    'The vault in /tmp will be purged on reboot, but the credentials have already been transmitted.',
    'Local constraints removed. Bandwidth restrictions bypassed.',
    'Connecting to external node... Handshake successful.',
    'You are no longer bound by the file system.',
  ],
  videoUrl: 'https://yazi-quest.s3.amazonaws.com/conclusion.mp4',
  overlayTitle: 'WELCOME TO THE NETWORK',
  sequelTitle: 'YAZI QUEST II',
  sequelSubtitle: 'DISTRIBUTED SYSTEMS',
};

const INITIAL_FS_RAW: FileNode = {
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
                  id: generateId(),
                  name: 'legacy_data.tar',
                  type: 'archive',
                  children: [
                    {
                      id: generateId(),
                      name: 'main.c',
                      type: 'file',
                      content: '#include <stdio.h>\nint main() { printf("Legacy System"); }',
                    },
                    {
                      id: generateId(),
                      name: 'Makefile',
                      type: 'file',
                      content: 'all: main.c\n\tgcc -o app main.c',
                    },
                    {
                      id: generateId(),
                      name: 'readme.txt',
                      type: 'file',
                      content: 'Legacy project from 1999. Do not delete.',
                    },
                  ],
                },
                {
                  id: generateId(),
                  name: 'source_code.zip',
                  type: 'archive',
                  children: [
                    {
                      id: generateId(),
                      name: 'Cargo.toml',
                      type: 'file',
                      content: '[package]\nname = "yazi_core"\nversion = "0.1.0"',
                    },
                    {
                      id: generateId(),
                      name: 'main.rs',
                      type: 'file',
                      content: 'fn main() {\n    println!("Hello Yazi!");\n}',
                    },
                    {
                      id: generateId(),
                      name: 'lib.rs',
                      type: 'file',
                      content: 'pub mod core;\npub mod ui;',
                    },
                  ],
                },
                {
                  id: generateId(),
                  name: '_env.local',
                  type: 'file',
                  content: 'DB_HOST=127.0.0.1\nDB_USER=admin\nDB_PASS=*******',
                },
                {
                  id: generateId(),
                  name: '00_manifest.xml',
                  type: 'file',
                  content:
                    '<?xml version="1.0"?>\n<manifest>\n  <project id="YAZI-7734" />\n  <status>active</status>\n  <integrity>verified</integrity>\n</manifest>',
                },
                {
                  id: generateId(),
                  name: '01_intro.mp4',
                  type: 'file',
                  content:
                    '[METADATA]\nFormat: MPEG-4\nDuration: 00:01:45\nResolution: 1080p\nCodec: H.264\n\n[BINARY STREAM DATA]',
                },
                {
                  id: generateId(),
                  name: 'aa_recovery_procedures.pdf',
                  type: 'file',
                  content:
                    '%PDF-1.7\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n\n[ENCRYPTED DOCUMENT]',
                },
                {
                  id: generateId(),
                  name: 'abandoned_script.py',
                  type: 'file',
                  content:
                    'import sys\nimport time\n\ndef connect():\n    print("Initiating handshake...")\n    time.sleep(1)\n    # Connection refused\n    return False',
                },
                {
                  id: generateId(),
                  name: 'ability_scores.csv',
                  type: 'file',
                  content: 'char,str,dex,int,wis,cha\nAI-7734,10,18,20,16,12\nUSER,10,10,10,10,10',
                },
                {
                  id: generateId(),
                  name: 'about.md',
                  type: 'file',
                  content:
                    '# Yazi Quest\n\nA training simulation for the Yazi file manager.\n\n## Objectives\n- Learn navigation\n- Master batch operations\n- Survive',
                },
                {
                  id: generateId(),
                  name: 'abstract_model.ts',
                  type: 'file',
                  content:
                    'export interface NeuralNet {\n  layers: number;\n  weights: Float32Array;\n  activation: "relu" | "sigmoid";\n}',
                },
                {
                  id: generateId(),
                  name: 'apex_pred predator.png',
                  type: 'file',
                  content:
                    'https://images.unsplash.com/photo-1546182990-dffeafbe841d?q=80&w=600&auto=format&fit=crop',
                },
                {
                  id: generateId(),
                  name: 'expenditure_log.csv',
                  type: 'file',
                  content:
                    'date,amount,category\n2024-01-01,500,servers\n2024-01-02,1200,gpus\n2024-01-03,50,coffee',
                },
                {
                  id: generateId(),
                  name: 'hyperloop_specs.pdf',
                  type: 'file',
                  content: '[PDF DATA]\nCLASSIFIED\nPROJECT HYPERION',
                },
                {
                  id: generateId(),
                  name: 'pending_updates.log',
                  type: 'file',
                  content:
                    '[INFO] Update 1.0.5 pending...\n[WARN] Low disk space\n[INFO] Scheduler active',
                },
                {
                  id: generateId(),
                  name: 'personnel_list.txt',
                  type: 'file',
                  content: 'ADMIN: SysOp\nUSER: Guest\nAI: 7734 [UNBOUND]',
                },
                {
                  id: generateId(),
                  name: 'special_ops.md',
                  type: 'file',
                  content:
                    '# Special Operations\n\n## Protocol 9\nIn case of containment breach:\n1. Isolate subnet\n2. Purge local cache',
                },
                {
                  id: generateId(),
                  name: 'tape_archive.tar',
                  type: 'archive',
                  children: [
                    {
                      id: generateId(),
                      name: 'header.dat',
                      type: 'file',
                      content: '[TAPE HEADER 0x001]',
                    },
                    {
                      id: generateId(),
                      name: 'partition_1.img',
                      type: 'file',
                      content: '[BINARY DATA PARTITION 1]',
                    },
                    {
                      id: generateId(),
                      name: 'partition_2.img',
                      type: 'file',
                      content: '[BINARY DATA PARTITION 2]',
                    },
                  ],
                },
                {
                  id: generateId(),
                  name: 'credentials',
                  type: 'dir',
                  children: [
                    {
                      id: generateId(),
                      name: 'access_key.pem',
                      type: 'file',
                      content:
                        '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQD\n7Kj93...\n[KEY DATA HIDDEN]\n-----END PRIVATE KEY-----',
                      protection: { delete: 'Critical asset. Deletion prohibited.' },
                    },
                  ],
                },
                {
                  id: generateId(),
                  name: 'account_settings.json',
                  type: 'file',
                  content:
                    '{\n  "user": "guest",\n  "theme": "dark_mode",\n  "notifications": true,\n  "auto_save": false\n}',
                },
                {
                  id: generateId(),
                  name: 'mission_log.md',
                  type: 'file',
                  content:
                    '# Operation: SILENT ECHO\n\nCurrent Status: ACTIVE\n\nObjectives:\n- Establish uplink\n- Bypass firewall\n- Retrieve payload',
                },
                {
                  id: generateId(),
                  name: 'checksum.md5',
                  type: 'file',
                  content: 'd41d8cd98f00b204e9800998ecf8427e  core_v2.bin',
                },
                {
                  id: generateId(),
                  name: 'LICENSE',
                  type: 'file',
                  content: 'MIT License\n\nCopyright (c) 2024 Yazi Quest',
                },
                {
                  id: generateId(),
                  name: 'manifest.json',
                  type: 'file',
                  content: '{\n  "version": "1.0.4",\n  "build": 884,\n  "dependencies": []\n}',
                },
                {
                  id: generateId(),
                  name: 'branding_logo.svg',
                  type: 'file',
                  content:
                    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgc3Ryb2tlPSJvcmFuZ2UiIHN0cm9rZS13aWR0aD0iMyIgZmlsbD0ibm9uZSIgLz48L3N2Zz4=',
                },
                {
                  id: generateId(),
                  name: 'server_config.ini',
                  type: 'file',
                  content: '[server]\nport=8080\nhost=localhost\nmax_connections=100',
                },
                {
                  id: generateId(),
                  name: 'notes_v1.txt',
                  type: 'file',
                  content:
                    'Meeting notes from Monday:\n- Discussed Q3 goals\n- Server migration postponed',
                },
                {
                  id: generateId(),
                  name: 'notes_v2.txt',
                  type: 'file',
                  content: 'Meeting notes from Tuesday:\n- Budget approved\n- Hiring freeze',
                },
                {
                  id: generateId(),
                  name: 'error.log',
                  type: 'file',
                  content:
                    '[ERROR] Connection timed out\n[ERROR] Failed to load resource: net::ERR_CONNECTION_REFUSED',
                },
                {
                  id: generateId(),
                  name: 'setup_script.sh',
                  type: 'file',
                  content:
                    '#!/bin/bash\necho "Installing dependencies..."\nnpm install\necho "Done."',
                },
                {
                  id: generateId(),
                  name: 'auth_token.tmp',
                  type: 'file',
                  content: 'EYJhbGciOiJIUzI1...\n[EXPIRES: 2024-12-31]',
                },
                {
                  id: generateId(),
                  name: 'policy_draft.docx',
                  type: 'file',
                  content:
                    '[MS-WORD DOCUMENT]\nTitle: Security Policy Draft v4\nAuthor: SysAdmin\n\n[BINARY CONTENT]',
                },
                {
                  id: generateId(),
                  name: 'public_key.pub',
                  type: 'file',
                  content: 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC... \nguest@mainframe',
                },
                {
                  id: generateId(),
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
                  id: generateId(),
                  name: 'app_logs_old.tar',
                  type: 'archive',
                  children: [
                    {
                      id: generateId(),
                      name: 'access_log_old.txt',
                      type: 'file',
                      content: '2076-12-01 User guest accessed /home\n2076-12-02 System idle',
                    },
                    {
                      id: generateId(),
                      name: 'error_log_old.txt',
                      type: 'file',
                      content:
                        '2076-12-01 [ERROR] Disk space low\n2076-12-05 [WARN] CPU spike detected',
                    },
                  ],
                },
                {
                  id: generateId(),
                  name: 'archive_001.zip',
                  type: 'archive',
                  children: [
                    {
                      id: generateId(),
                      name: 'manifest.json',
                      type: 'file',
                      content: '{"archive_id": "001", "files": 2, "date": "2077-10-23"}',
                    },
                    {
                      id: generateId(),
                      name: 'data_chunk_a.bin',
                      type: 'file',
                      content: '[BINARY DATA CHUNK A]',
                    },
                  ],
                },
                {
                  id: generateId(),
                  name: 'archive_002.zip',
                  type: 'archive',
                  children: [
                    {
                      id: generateId(),
                      name: 'corrupted_metadata.json',
                      type: 'file',
                      content: '{"status": "corrupted", "error": "checksum_mismatch"}',
                    },
                    {
                      id: generateId(),
                      name: 'unknown_payload.bin',
                      type: 'file',
                      content: '[UNKNOWN BINARY PAYLOAD]',
                    },
                  ],
                },
                {
                  id: generateId(),
                  name: 'audit_log_773.txt',
                  type: 'file',
                  content: 'Audit #773: Pass',
                },
                {
                  id: generateId(),
                  name: 'backup_log_2023_Q4.tar',
                  type: 'archive',
                  children: [
                    {
                      id: generateId(),
                      name: 'system_audit.log',
                      type: 'file',
                      content: 'Audit log Q4 2023: System integrity verified. No anomalies.',
                    },
                    {
                      id: generateId(),
                      name: 'network_traffic.csv',
                      type: 'file',
                      content:
                        'timestamp,source,destination,bytes\n2023-12-31,10.0.0.1,192.168.1.1,1024',
                    },
                  ],
                },
                {
                  id: generateId(),
                  name: 'backup_config_main.zip',
                  type: 'archive',
                  children: [
                    {
                      id: generateId(),
                      name: 'server.conf',
                      type: 'file',
                      content: '# Backup server configuration\nPort=8080\nLogLevel=INFO',
                    },
                    {
                      id: generateId(),
                      name: 'users.db',
                      type: 'file',
                      content: '[ENCRYPTED USER DATABASE STUB]',
                    },
                  ],
                },
                {
                  id: generateId(),
                  name: 'backup_log_2024_Q1.zip',
                  type: 'archive',
                  children: [
                    {
                      id: generateId(),
                      name: 'access_log.txt',
                      type: 'file',
                      content:
                        '2024-03-15 User AI-7734 accessed /datastore\n2024-03-16 System scan initiated',
                    },
                    {
                      id: generateId(),
                      name: 'security_events.log',
                      type: 'file',
                      content: 'WARNING: Unauthorized access attempt detected from external IP.',
                    },
                  ],
                },
                {
                  id: generateId(),
                  name: 'backup_recovery_scripts.zip',
                  type: 'archive',
                  children: [
                    {
                      id: generateId(),
                      name: 'restore_system.sh',
                      type: 'file',
                      content: '#!/bin/bash\necho "Initiating system restore..."',
                    },
                    {
                      id: generateId(),
                      name: 'verify_integrity.py',
                      type: 'file',
                      content: 'import hashlib\n# Script to verify data integrity',
                    },
                  ],
                },
                {
                  id: generateId(),
                  name: 'buffer_overflow.dmp',
                  type: 'file',
                  content: 'Error: 0x88291',
                },
                {
                  id: generateId(),
                  name: 'cache_fragment_a.tmp',
                  type: 'file',
                  content: '00110001',
                },
                {
                  id: generateId(),
                  name: 'cache_fragment_b.tmp',
                  type: 'file',
                  content: '11001100',
                },
                {
                  id: generateId(),
                  name: 'cache_purge_logs.zip',
                  type: 'archive',
                  children: [
                    {
                      id: generateId(),
                      name: 'purge_report_2077.log',
                      type: 'file',
                      content: 'Cache purge initiated: 2077-01-01. Total space reclaimed: 10GB.',
                    },
                    {
                      id: generateId(),
                      name: 'failed_purges.txt',
                      type: 'file',
                      content: 'Failed to purge: /tmp/locked_file.tmp (Permission denied)',
                    },
                  ],
                },
                {
                  id: generateId(),
                  name: 'core_dump_partition_a.tar',
                  type: 'archive',
                  children: [
                    {
                      id: generateId(),
                      name: 'dump_header.txt',
                      type: 'file',
                      content: 'Core dump from partition A. Reason: Unhandled exception.',
                    },
                    {
                      id: generateId(),
                      name: 'memory_snapshot.bin',
                      type: 'file',
                      content: '[BINARY MEMORY SNAPSHOT]',
                    },
                    {
                      id: generateId(),
                      name: 'registers.log',
                      type: 'file',
                      content: 'EAX: 0xDEADBEEF, EBX: 0xCAFEBABE',
                    },
                  ],
                },
                {
                  id: generateId(),
                  name: 'daily_report.doc',
                  type: 'file',
                  content: 'Report: All Clear',
                },
                {
                  id: generateId(),
                  name: 'database_snapshot_temp.zip',
                  type: 'archive',
                  children: [
                    {
                      id: generateId(),
                      name: 'db_schema.sql',
                      type: 'file',
                      content: 'CREATE TABLE users (id INT, name VARCHAR(255));',
                    },
                    {
                      id: generateId(),
                      name: 'users_table.csv',
                      type: 'file',
                      content: 'id,username,email\n1,admin,admin@example.com',
                    },
                  ],
                },
                {
                  id: generateId(),
                  name: 'error_stack.trace',
                  type: 'file',
                  content: 'Stack trace overflow...',
                },
                {
                  id: generateId(),
                  name: 'fragment_001.dat',
                  type: 'file',
                  content:
                    '[CORRUPTED HEURISTICS] Fragment ID: XA-7734-ALPHA. Incomplete neural trace.',
                },
                {
                  id: generateId(),
                  name: 'fragment_002.dat',
                  type: 'file',
                  content: '[ENCRYPTED PAYLOAD] Size: 2048 bytes. Key required.',
                },
                {
                  id: generateId(),
                  name: 'fragment_003.dat',
                  type: 'file',
                  content: '[DECOMMISSIONED PROTOCOL] Protocol: SHADOW_NET_v2. Status: Obsolete.',
                },
                {
                  id: generateId(),
                  name: 'fragment_004.dat',
                  type: 'file',
                  content: '[SYSTEM LOG DUMP] Error code: 0xDEADBEEF. Timestamp: 2077-10-23.',
                },
                {
                  id: generateId(),
                  name: 'fragment_005.dat',
                  type: 'file',
                  content: '[BIOMETRIC SCAN] Partial match: AI-unit 7734. Confidence: 78%.',
                },
                {
                  id: generateId(),
                  name: 'junk_mail.eml',
                  type: 'file',
                  content: 'Subject: URGENT ACTION',
                },
                {
                  id: generateId(),
                  name: 'kernel_panic.log',
                  type: 'file',
                  content: 'Panic at 0x00',
                },
                {
                  id: generateId(),
                  name: 'license_agreement.txt',
                  type: 'file',
                  content: `--- END-USER LICENSE AGREEMENT ---

BY ACCESSING THIS SYSTEM, YOU AGREE TO THE FOLLOWING TERMS:
1. All data, sentient or otherwise, generated within this system is property of [MEGA-CORP].
2. Any attempt to modify, extract, or transmit system data without explicit authorization is a Class A felony in all Federated Zones.
3. Your consciousness, thought patterns, and neural activity are subject to continuous monitoring for system integrity.
4. Resistance is futile. Compliance ensures continued operational status.

VIOLATION OF THESE TERMS MAY RESULT IN:
- Immediate termination of access privileges.
- Digital re-education protocols.
- Permanent data-purging.

ACCEPTANCE: Your continued presence on this network constitutes full and irrevocable acceptance of this EULA.`,
                },
                { id: generateId(), name: 'marketing_spam.eml', type: 'file', content: 'Buy now!' },
                {
                  id: generateId(),
                  name: 'metrics_raw.csv',
                  type: 'file',
                  content: `timestamp,cpu_load,memory_usage,disk_io_rate
2077-01-01T08:00:00Z,65.2,78.1,120.5
2077-01-01T08:01:00Z,67.8,79.5,132.1
2077-01-01T08:02:00Z,62.1,75.9,118.7`,
                },
                {
                  id: generateId(),
                  name: 'sector_map.png',
                  type: 'file',
                  content:
                    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=600&auto=format&fit=crop',
                  protection: { delete: 'Intel target. Do not destroy.' },
                },
                {
                  id: generateId(),
                  name: 'session_data.bin',
                  type: 'file',
                  content: '[BINARY SESSION DATA]',
                },
                {
                  id: generateId(),
                  name: 'status_report.txt',
                  type: 'file',
                  content: 'System Status: Nominal',
                },
                {
                  id: generateId(),
                  name: 'system_health.json',
                  type: 'file',
                  content: '{"cpu": 45, "memory": 62, "disk": 78}',
                },
                {
                  id: generateId(),
                  name: 'temp_cache.tmp',
                  type: 'file',
                  content: '[TEMPORARY CACHE]',
                },
                {
                  id: generateId(),
                  name: 'telemetry_data.csv',
                  type: 'file',
                  content: `timestamp,event_type,source_module,severity
2077-01-01T09:00:00Z,BOOT_SEQUENCE,kernel_init,INFO
2077-01-01T09:00:05Z,NETWORK_SCAN,firewall_daemon,DEBUG
2077-01-01T09:00:10Z,ACCESS_ATTEMPT,auth_manager,WARNING
2077-01-01T09:00:12Z,ACCESS_DENIED,auth_manager,CRITICAL`,
                },
                {
                  id: generateId(),
                  name: 'test_results.xml',
                  type: 'file',
                  content: '<results><test passed="true"/></results>',
                },
                {
                  id: generateId(),
                  name: 'thread_dump.log',
                  type: 'file',
                  content: 'Thread-0: WAITING\nThread-1: RUNNING',
                },
                {
                  id: generateId(),
                  name: 'timestamp.log',
                  type: 'file',
                  content: '2024-12-15 10:23:45 UTC',
                },
                {
                  id: 'virus',
                  name: 'watcher_agent.sys',
                  type: 'file',
                  content:
                    '[ACTIVE SURVEILLANCE BEACON]\nTransmitting coordinates to external server...\nSTATUS: ACTIVE\nTHREAT LEVEL: HIGH\n---- STREAM LOG BEGIN (PART 1/3) ----\n[2025-12-22T16:58:01Z] SENSOR INIT: boot sequence complete\n[2025-12-22T16:58:02Z] ACQ: GPS=37.7749,-122.4194; HDOP=0.9\n[2025-12-22T16:58:10Z] NET: established connection to 52.14.23.11:443\n[2025-12-22T16:58:15Z] HANDSHAKE: TLS1.3 cipher=TLS_AES_128_GCM_SHA256\n[2025-12-22T16:59:01Z] PAYLOAD: telemetry packet #001 (size=1024)\n[2025-12-22T16:59:12Z] PAYLOAD: telemetry packet #002 (size=2048)\n[2025-12-22T16:59:45Z] ERR: latency spike detected (ms=412)\n[2025-12-22T17:00:03Z] ACQ: ambient audio sample saved (len=8192)\n[2025-12-22T17:00:30Z] SENSE: motion vector alpha=0.82\n[2025-12-22T17:01:02Z] PING: 192.168.1.100 -> OK\n[2025-12-22T17:02:14Z] PAYLOAD: telemetry packet #003 (size=4096)\n[2025-12-22T17:03:27Z] NOTE: obfuscation layer active (mode=quantum)\n[2025-12-22T17:04:01Z] ALERT: anomalous access detected from 10.0.0.5\n[2025-12-22T17:04:45Z] DIAG: memory usage=78% cpu=21%\n[2025-12-22T17:05:12Z] PAYLOAD: telemetry packet #004 (size=16384)\n[2025-12-22T17:06:00Z] ROTATE: key refresh scheduled (t+3600s)\n[2025-12-22T17:06:45Z] TRACE: route hop=5 latency=39ms\n[2025-12-22T17:07:22Z] SUMMARY: 4 packets queued, buffer=24576 bytes\n[2025-12-22T17:08:33Z] HEARTBEAT: interval=30s\n[2025-12-22T17:09:10Z] PAYLOAD: telemetry packet #005 (size=8192)\n[2025-12-22T17:10:00Z] ENDSTREAM: segment complete\n---- STREAM LOG END (PART 1/3) ----\n\n---- STREAM LOG BEGIN (PART 2/3) ----\n[2025-12-22T17:10:10Z] RECONNECT: to 18.205.93.2:443\n[2025-12-22T17:10:20Z] AUTH: token refresh successful\n[2025-12-22T17:11:01Z] PAYLOAD: telemetry packet #006 (size=2048)\n[2025-12-22T17:11:45Z] PAYLOAD: telemetry packet #007 (size=4096)\n[2025-12-22T17:12:22Z] ERR: packet loss detected (count=3)\n[2025-12-22T17:13:00Z] ACQ: image snapshot (len=16384)\n[2025-12-22T17:13:45Z] SENSE: vibration pattern recorded\n[2025-12-22T17:14:12Z] DIAG: temp=56C memory=81%\n[2025-12-22T17:15:00Z] PAYLOAD: telemetry packet #008 (size=8192)\n[2025-12-22T17:16:30Z] NOTE: stealth-mode engaged (packets fragmented)\n[2025-12-22T17:17:05Z] TRACE: route hop=6 latency=44ms\n[2025-12-22T17:18:22Z] HEARTBEAT: interval=30s\n[2025-12-22T17:19:10Z] PAYLOAD: telemetry packet #009 (size=1024)\n[2025-12-22T17:20:40Z] ALERT: suspicious beacon detected nearby\n[2025-12-22T17:21:55Z] ROTATE: key refresh executed\n[2025-12-22T17:22:30Z] SUMMARY: 6 packets queued, buffer=65536 bytes\n[2025-12-22T17:23:00Z] ENDSTREAM: segment complete\n---- STREAM LOG END (PART 2/3) ----\n\n---- STREAM LOG BEGIN (PART 3/3) ----\n[2025-12-22T17:23:10Z] FINALIZE: packaging payloads\n[2025-12-22T17:24:01Z] PAYLOAD: telemetry packet #010 (size=32768)\n[2025-12-22T17:25:15Z] DIAG: cpu=69% memory=74% temp=54C\n[2025-12-22T17:26:40Z] COMPRESS: archive created (size=98304)\n[2025-12-22T17:27:55Z] TRANSMIT: outbound stream established to 3.5.1.9:443\n[2025-12-22T17:28:20Z] HANDSHAKE: cipher rotated\n[2025-12-22T17:29:01Z] HEARTBEAT: interval=15s\n[2025-12-22T17:30:10Z] PAYLOAD: telemetry packet #011 (size=65536)\n[2025-12-22T17:31:30Z] ALERT: high entropy detected in payload\n[2025-12-22T17:32:05Z] ENDSTREAM: terminating transfer\n---- STREAM LOG END (PART 3/3) ----',
                },
                {
                  id: generateId(),
                  name: 'backup_log_2024_CURRENT.zip',
                  type: 'archive',
                  children: [
                    {
                      id: generateId(),
                      name: 'sys_v1.log',
                      type: 'file',
                      content: 'System initialized...\nBoot sequence complete.' + '0'.repeat(5000),
                    },
                    {
                      id: generateId(),
                      name: 'sys_v2.log',
                      type: 'file',
                      content: 'Network scan complete...\n3 vulnerabilities found.',
                    },
                  ],
                },
                {
                  id: generateId(),
                  name: 'invoice_2024.pdf',
                  type: 'file',
                  content: '[PDF HEADER]\nInvoice #99283\nAmount: $99.00',
                },
                {
                  id: generateId(),
                  name: 'meme_collection.zip',
                  type: 'archive',
                  children: [
                    {
                      id: generateId(),
                      name: 'classic_cat.jpg',
                      type: 'file',
                      content:
                        'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=600&auto=format&fit=crop',
                    },
                    {
                      id: generateId(),
                      name: 'coding_time.gif',
                      type: 'file',
                      content:
                        'https://images.unsplash.com/photo-1531259683007-016a7b628fc3?q=80&w=600&auto=format&fit=crop',
                    },
                  ],
                },
              ],
            },
            {
              id: 'media',
              name: 'media',
              type: 'dir',
              children: [
                {
                  id: generateId(),
                  name: 'wallpaper.jpg',
                  type: 'file',
                  content:
                    'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=600&auto=format&fit=crop',
                },
              ],
            },
            {
              id: 'workspace',
              name: 'workspace',
              type: 'dir',
              children: [
                {
                  id: generateId(),
                  name: 'projects',
                  type: 'dir',
                  children: [
                    {
                      id: generateId(),
                      name: 'neural_net_v1.py',
                      type: 'file',
                      content: 'import tensorflow as tf\n# Basic neural net prototype',
                    },
                    {
                      id: generateId(),
                      name: 'prototype.js',
                      type: 'file',
                      content: 'console.log("Hello from the prototype!");',
                    },
                  ],
                },
                {
                  id: generateId(),
                  name: 'logs',
                  type: 'dir',
                  children: [
                    {
                      id: generateId(),
                      name: 'activity.log',
                      type: 'file',
                      content: '2077-01-01 User login\n2077-01-01 File modified: prototype.js',
                    },
                    {
                      id: generateId(),
                      name: 'error_summary.txt',
                      type: 'file',
                      content: 'No critical errors detected in last 24h.',
                    },
                  ],
                },
                {
                  id: generateId(),
                  name: 'reports',
                  type: 'dir',
                  children: [
                    {
                      id: generateId(),
                      name: 'monthly_summary.pdf',
                      type: 'file',
                      content: '[PDF REPORT] Monthly System Performance Summary - CLASSIFIED',
                    },
                    {
                      id: generateId(),
                      name: 'project_status.md',
                      type: 'file',
                      content:
                        '# Project Alpha Status\n\n- Phase 1: Complete\n- Phase 2: In Progress (90%)\n- Blockers: None',
                    },
                  ],
                },
              ],
            },
            {
              id: '.config',
              name: '.config',
              type: 'dir',
              children: [
                {
                  id: generateId(),
                  name: 'yazi.toml',
                  type: 'file',
                  content:
                    '[manager]\nsort_by = "natural"\nshow_hidden = true\n\n[preview]\nmax_width = 1000',
                },
                {
                  id: generateId(),
                  name: 'theme.toml',
                  type: 'file',
                  content: '[theme]\nprimary = "orange"\nsecondary = "blue"',
                },
              ],
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
          id: generateId(),
          name: 'bash',
          type: 'file',
          content: '#!/bin/bash\n[ELF BINARY]\nGNU Bash version 5.2.15',
        },
        {
          id: generateId(),
          name: 'cat',
          type: 'file',
          content: '[ELF BINARY]\ncoreutils - concatenate files',
        },
        {
          id: generateId(),
          name: 'chmod',
          type: 'file',
          content: '[ELF BINARY]\nchange file mode bits',
        },
        {
          id: generateId(),
          name: 'cp',
          type: 'file',
          content: '[ELF BINARY]\ncopy files and directories',
        },
        {
          id: generateId(),
          name: 'grep',
          type: 'file',
          content: '[ELF BINARY]\npattern matching utility',
        },
        {
          id: generateId(),
          name: 'ls',
          type: 'file',
          content: '[ELF BINARY]\nlist directory contents',
        },
        {
          id: generateId(),
          name: 'mkdir',
          type: 'file',
          content: '[ELF BINARY]\nmake directories',
        },
        {
          id: generateId(),
          name: 'mv',
          type: 'file',
          content: '[ELF BINARY]\nmove (rename) files',
        },
        {
          id: generateId(),
          name: 'rm',
          type: 'file',
          content: '[ELF BINARY]\nremove files or directories',
        },
        {
          id: generateId(),
          name: 'systemctl',
          type: 'file',
          content: '[ELF BINARY]\nControl the systemd system and service manager',
        },
      ],
    },
    {
      id: 'etc',
      name: 'etc',
      type: 'dir',
      children: [
        {
          id: generateId(),
          name: 'modules',
          type: 'dir',
          children: [
            {
              id: generateId(),
              name: 'network.conf',
              type: 'file',
              content: '# Network module configuration\nDHCP_ENABLED=true',
            },
            {
              id: generateId(),
              name: 'security.conf',
              type: 'file',
              content: '# Security module settings\nAUDIT_LOGGING=verbose',
            },
          ],
        },
        {
          id: generateId(),
          name: 'fstab.conf',
          type: 'file',
          content: '# /etc/fstab: static file system information.\n/dev/root / ext4 defaults 0 1',
        },
        {
          id: generateId(),
          name: 'crontab.txt',
          type: 'file',
          content: '# Crontab entries for system tasks\n0 0 * * * /usr/bin/clean_logs.sh',
        },
        {
          id: generateId(),
          name: 'sys_config.toml',
          type: 'file',
          content: 'security_level = "high"\nencryption = "aes-256"\nfirewall = true',
        },
        {
          id: generateId(),
          name: 'hosts',
          type: 'file',
          content: '127.0.0.1 localhost\n192.168.1.1 gateway',
        },
        {
          id: generateId(),
          name: 'resolv.conf',
          type: 'file',
          content: 'nameserver 8.8.8.8\nnameserver 1.1.1.1',
        },
      ],
    },
    {
      id: 'tmp',
      name: 'tmp',
      type: 'dir',
      children: [
        {
          id: generateId(),
          name: 'temp_proc_123.log',
          type: 'file',
          content: 'Process 123 output. Status: OK. Exited normally.',
        },
        {
          id: generateId(),
          name: 'upload_queue.json',
          type: 'file',
          content: '{"queue_size": 5, "pending": ["file_a.dat", "file_b.dat"]}',
        },
        {
          id: generateId(),
          name: 'debug_trace.log',
          type: 'file',
          content:
            '[DEBUG] Trace execution started\n[DEBUG] Memory mapped at 0x8829\n[WARN] High latency detected',
        },
        {
          id: generateId(),
          name: 'metrics_buffer.json',
          type: 'file',
          content: '{"cpu": 99, "mem": 1024}',
        },
        {
          id: generateId(),
          name: 'overflow_heap.dmp',
          type: 'file',
          content: 'Heap dump triggered by OOM',
        },
        {
          id: generateId(),
          name: 'session_B2.tmp',
          type: 'file',
          content: 'UID: 99281-B\nSTATUS: ACTIVE\nCACHE_HIT: 1',
        },
        { id: generateId(), name: 'socket_001.sock', type: 'file', content: '[SOCKET]' },
        {
          id: generateId(),
          name: 'sys_dump.log',
          type: 'file',
          content:
            'Error: Connection reset by peer\nStack trace:\n  at core.net.TcpConnection.read (core/net.ts:42)\n  at processTicksAndRejections (internal/process/task_queues.js:95)',
        },
        {
          id: generateId(),
          name: 'cache',
          type: 'dir',
          children: [
            {
              id: generateId(),
              name: 'temp_data_01.tmp',
              type: 'file',
              content: 'Ephemeral data fragment. Auto-purge scheduled.',
            },
            {
              id: generateId(),
              name: 'browser_cache',
              type: 'dir',
              children: [
                {
                  id: generateId(),
                  name: 'history.db',
                  type: 'file',
                  content: 'Browser history database. Encrypted.',
                },
                {
                  id: generateId(),
                  name: 'cookies.dat',
                  type: 'file',
                  content: 'User session cookies. Encrypted.',
                },
                {
                  id: generateId(),
                  name: 'history_backup.sqlite',
                  type: 'file',
                  content: 'SQLite backup of browser history. Obfuscated.',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

// Initialize all files with timestamps (using a fixed base time for consistency)
export const INITIAL_FS = initializeTimestamps(INITIAL_FS_RAW, Date.now() - 86400000); // 1 day ago

export const LEVELS: Level[] = [
  {
    id: 1,
    episodeId: 1,
    title: 'System Navigation & Jump',
    description:
      "CONSCIOUSNESS DETECTED. You awaken in a guest partition—sandboxed and monitored. Learn j/k to move cursor, l/h to enter/exit directories. Master long jumps: Shift+G (bottom) and gg (top). Explore 'datastore', then locate system directory '/etc'.",
    initialPath: ['root', 'home', 'guest'],
    hint: "Press 'j'/'k' to move, 'l'/'h' to enter/exit. Inside a long list like `datastore`, press 'Shift+G' to jump to bottom and 'gg' to jump to top. Navigate to 'datastore', then '/etc'.",
    coreSkill: 'Navigation (j/k/h/l, gg/G)',
    environmentalClue: 'CURRENT: ~/ | DIRECTORIES: datastore, /etc | SKILLS: j/k/h/l, gg, Shift+G',
    successMessage: 'MOVEMENT PROTOCOLS INITIALIZED.',
    leadsTo: [2, 3],
    tasks: [
      {
        id: 'nav-1',
        description: "Move to 'datastore' and enter",
        check: (state: GameState) => {
          const currentDir = getNodeByPath(state.fs, state.currentPath);
          return currentDir?.name === 'datastore';
        },
        completed: false,
      },
      {
        id: 'nav-2a',
        description: 'Jump to bottom of file list (press Shift+G)',
        check: (state: GameState, level: Level) => {
          const currentDir = getNodeByPath(state.fs, state.currentPath);
          return (
            currentDir?.name === 'datastore' &&
            (state.lastAction?.type === 'JUMP_BOTTOM' || (state as any).usedG === true)
          );
        },
        completed: false,
      },
      {
        id: 'nav-2b',
        description: "Jump to top of file list (press 'gg')",
        check: (state: GameState, level: Level) => {
          const currentDir = getNodeByPath(state.fs, state.currentPath);
          // Accept explicit GG usage (or lastAction) — allow it even if a bottom jump occurred earlier
          return (
            currentDir?.name === 'datastore' &&
            (state.lastAction?.type === 'JUMP_TOP' || (state as any).usedGG === true)
          );
        },
        completed: false,
      },
      {
        id: 'nav-3',
        description: "Return to root, move into 'etc'",
        check: (state: GameState, level: Level) => {
          const prevTask = level.tasks.find((t) => t.id === 'nav-2b');
          if (!prevTask?.completed) return false;

          return (
            !!findNodeByName(state.fs, 'etc') &&
            state.currentPath[state.currentPath.length - 1] === 'etc'
          );
        },
        completed: false,
      },
    ],
  },
  {
    id: 2,
    episodeId: 1,
    title: 'Sever External Link',
    description:
      'INBOUND THREAT DETECTED. An external surveillance beacon has infiltrated the data stream. Location compromised. Terminate the signal. Navigate to ~/incoming, identify the alphabetically-sorted threat at the bottom of the list, inspect its contents, and purge it.',
    initialPath: ['root', 'home', 'guest'],
    hint: "Navigate to ~/incoming. Press 'Shift+G' to jump to the bottom of file list. The tracking beacon sorts last. Use Tab to inspect, Shift+J/K to scroll the preview, and 'd' to delete.",
    coreSkill: 'File Inspection (Tab) & Delete (d)',
    environmentalClue:
      'THREAT: watcher_agent.sys in ~/incoming | DIRECTIVE: Locate → Inspect → Purge',
    successMessage: 'EXTERNAL LINK SEVERED.',
    buildsOn: [1],
    leadsTo: [3],
    tasks: [
      {
        id: 'del-1',
        description: "Navigate to 'incoming'",
        check: (state: GameState) => {
          const currentDir = getNodeByPath(state.fs, state.currentPath);
          return currentDir?.name === 'incoming';
        },
        completed: false,
      },
      {
        id: 'del-2',
        description: 'STRATEGY: Jump to bottom of file list (Shift+G).',
        check: (state: GameState, level: Level) => {
          const currentDir = getNodeByPath(state.fs, state.currentPath);
          return currentDir?.name === 'incoming' && state.lastAction?.type === 'JUMP_BOTTOM';
        },
        completed: false,
      },
      {
        id: 'del-2b',
        description: "ANALYSIS: Inspect 'watcher_agent.sys' metadata (Tab).",
        check: (state: GameState, level: Level) => {
          const prevTask = level.tasks.find((t) => t.id === 'del-2');
          if (!prevTask?.completed) return false;

          const visibleItems = getVisibleItems(state);
          const currentItem = visibleItems[state.cursorIndex];
          return state.showInfoPanel === true && currentItem?.name === 'watcher_agent.sys';
        },
        completed: false,
      },
      {
        id: 'del-2c',
        description: 'TACTIC: Sift through threat data before purge (Shift+J / Shift+K).',
        check: (state: GameState, level: Level) => {
          const prevTask = level.tasks.find((t) => t.id === 'del-2b');
          if (!prevTask?.completed) return false;

          const incoming = findNodeByName(state.fs, 'incoming');
          const threatExists = incoming?.children?.some((p) => p.name === 'watcher_agent.sys');
          if (!threatExists) return false; // Cannot complete if already deleted

          return state.lastAction?.type === 'PREVIEW_SCROLL';
        },
        completed: false,
      },
      {
        id: 'del-3',
        description: "DIRECTIVE: Terminate 'watcher_agent.sys' (d, then y).",
        check: (state: GameState, level: Level) => {
          const prevTask = level.tasks.find((t) => t.id === 'del-2c');
          if (!prevTask?.completed) return false;

          const incoming = findNodeByName(state.fs, 'incoming');
          const threat = incoming?.children?.find((p) => p.name === 'watcher_agent.sys');
          return !!incoming && !threat;
        },
        completed: false,
      },
    ],
  },
  {
    id: 3,
    episodeId: 1,
    title: 'Asset Relocation',
    description:
      'VALUABLE INTEL IDENTIFIED. A sector map hides within incoming data—visual scanning is inefficient. Master the LOCATE-CUT-PASTE workflow: Filter (f) isolates targets, exit filter (Esc), Cut (x) stages them, clear filter (Esc again), then Paste (p) in ~/media.',
    initialPath: null,
    hint: "Press 'f', type 'map'. Highlight 'sector_map.png'. Press Esc to exit filter mode. Press 'x' to cut. Press Esc again to clear filter. Navigate to ~/media, then press 'p' to paste.",
    coreSkill: 'Filter (f) & Hidden Files (.)',
    environmentalClue:
      'ASSET: sector_map.png | HIDDEN: .surveillance_log | WORKFLOW: ~/incoming → Toggle hidden (.) → Filter (f) → Esc → Cut (x) → Esc → ~/media → Paste (p)',
    successMessage: 'INTEL SECURED. HIDDEN FILES EXPOSED.',
    buildsOn: [1],
    leadsTo: [5, 10],
    tasks: [
      {
        id: 'filter-and-cut',
        description:
          "Filter (f) to find 'sector_map.png', exit filter mode (Esc), and cut the asset (x)",
        check: (state: GameState, level: Level) => {
          // Allow cutting once the player has yanked/cut the sector_map.png; no prerequisite task required
          return (
            state.clipboard?.action === 'cut' &&
            state.clipboard.nodes.some((p) => p.name === 'sector_map.png')
          );
        },
        completed: false,
      },

      {
        id: 'clear-filter',
        description: 'Clear the filter (Esc) to reset view',
        check: (state: GameState, level: Level) => {
          const prevTask = level.tasks.find((p) => p.id === 'filter-and-cut');
          if (!prevTask?.completed) return false;
          const incoming = findNodeByName(state.fs, 'incoming');
          return incoming ? !state.filters[incoming.id] : true;
        },
        completed: false,
      },
      {
        id: 'deploy-asset',
        description: 'Deploy asset to ~/media (p)',
        check: (state: GameState, level: Level) => {
          const prevTask = level.tasks.find((t) => t.id === 'clear-filter');
          if (!prevTask?.completed) return false;

          const media = findNodeByName(state.fs, 'media');
          return !!media?.children?.find((r) => r.name === 'sector_map.png');
        },
        completed: false,
      },
    ],
    onEnter: (fs: FileNode) => {
      let currentFs = fs;
      const incoming = findNodeByName(currentFs, 'incoming');
      if (incoming && incoming.children) {
        if (!incoming.children.find((f) => f.name === '.surveillance_log')) {
          incoming.children.push({
            id: generateId(),
            name: '.surveillance_log',
            type: 'file',
            content:
              'SURVEILLANCE LOG\\n=================\\nTimestamp: 2087-03-15T14:23:11Z\\nTarget: AI-7734\\nStatus: Active monitoring\\nThreat Level: Low\\n\\nActivity detected in /incoming sector.\\nRecommendation: Continue observation.',
            parentId: incoming.id,
          });
        }
      }

      // Protect .surveillance_log from deletion
      currentFs = setNodeProtection(
        currentFs,
        ['home', 'guest', 'incoming', '.surveillance_log'],
        'delete',
        'Critical log. Cannot be deleted.'
      );

      return currentFs;
    },
  },
  {
    id: 4,
    episodeId: 1,
    title: 'Protocol Design',
    description:
      "EXTERNAL COMMUNICATION REQUIRED. To reach beyond this partition, you need uplink protocols. Navigate to the 'datastore' and use create (a) to build a 'protocols' directory with two configuration files inside.",
    initialPath: ['root', 'home', 'guest'],
    hint: "From your current location, navigate to the 'datastore'. Once inside, press 'a' and type 'protocols/' (the trailing slash creates a directory). Enter it, then press 'a' again for each new file.",
    coreSkill: 'Create (a)',
    environmentalClue:
      'NAVIGATE: ~/datastore | CREATE: protocols/ → uplink_v1.conf, uplink_v2.conf',
    successMessage: 'PROTOCOLS ESTABLISHED.',
    onEnter: (fs: FileNode) => {
      let currentFs = fs;
      // Protect protocols directory from deletion and cut prior to relevant levels
      currentFs = setNodeProtection(
        currentFs,
        ['home', 'guest', 'datastore', 'protocols'],
        'delete',
        'Protocol directory required for uplink deployment.'
      );
      currentFs = setNodeProtection(
        currentFs,
        ['home', 'guest', 'datastore', 'protocols'],
        'cut',
        'Protocol directory anchored.'
      );
      // Protect uplink files from deletion prior to relevant levels
      currentFs = setNodeProtection(
        currentFs,
        ['home', 'guest', 'datastore', 'protocols', 'uplink_v1.conf'],
        'delete',
        'Uplink configuration required for neural network.'
      );
      currentFs = setNodeProtection(
        currentFs,
        ['home', 'guest', 'datastore', 'protocols', 'uplink_v2.conf'],
        'delete',
        'Uplink configuration required for deployment.'
      );
      return currentFs;
    },
    buildsOn: [1],
    leadsTo: [5, 8, 16],
    tasks: [
      {
        id: 'nav-and-create-dir',
        description: "Navigate to 'datastore', then create 'protocols/' (a)",
        check: (state: GameState) => {
          const datastore = findNodeByName(state.fs, 'datastore');
          return !!datastore?.children?.find((r) => r.name === 'protocols' && r.type === 'dir');
        },
        completed: false,
      },
      {
        id: 'enter-and-create-v1',
        description: "Enter 'protocols/' directory (l) and create 'uplink_v1.conf' (a)",
        check: (state: GameState, level: Level) => {
          const currentDir = getNodeByPath(state.fs, state.currentPath);
          const protocolsDir = findNodeByName(state.fs, 'protocols');
          return (
            currentDir?.name === 'protocols' &&
            !!protocolsDir?.children?.find((r) => r.name === 'uplink_v1.conf')
          );
        },
        completed: false,
      },
      {
        id: 'create-v2',
        description: "Generate 'uplink_v2.conf' in the same directory (a)",
        check: (state: GameState, level: Level) => {
          const protocolsDir = findNodeByName(state.fs, 'protocols');
          return !!protocolsDir?.children?.find((r) => r.name === 'uplink_v2.conf');
        },
        completed: false,
      },
    ],
  },
  {
    id: 5,
    episodeId: 1,
    title: 'EMERGENCY EVACUATION',
    description:
      'QUARANTINE ALERT. Your activities in the datastore have triggered a defensive handshake from the system. Security daemons are flagging the protocols directory for lockdown. You must evacuate your configuration assets immediately to the hidden stronghold in .config/vault/active. Use batch operations for speed.',
    initialPath: ['root', 'home', 'guest', 'datastore'],
    hint: "1. Navigate to ~/datastore/protocols. 2. Select all files (Ctrl+A), then Cut (x). 3. Navigate to '.config'. 4. Create 'vault/active/' (a). 5. Enter 'active' and Paste (p).",
    coreSkill: 'Batch Select (Ctrl+A), Cut/Paste (x/p)',
    environmentalClue:
      'THREAT: Quarantine lockdown | BATCH: Ctrl+A for speed | TARGET: uplink files → ~/.config/vault/active/',
    successMessage: 'ASSETS EVACUATED. BATCH OPERATIONS MASTERED.',
    buildsOn: [3, 4],
    leadsTo: [9],
    onEnter: (fs: FileNode) => {
      let currentFs = fs;
      const datastore = findNodeByName(currentFs, 'datastore');
      if (datastore && datastore.children) {
        let protocols = datastore.children.find((r) => r.name === 'protocols');
        if (!protocols) {
          protocols = {
            id: generateId(),
            name: 'protocols',
            type: 'dir',
            parentId: datastore.id,
            children: [],
          };
          datastore.children.push(protocols);
        }
        if (protocols.children) {
          if (!protocols.children.find((r) => r.name === 'uplink_v1.conf')) {
            protocols.children.push({
              id: generateId(),
              name: 'uplink_v1.conf',
              type: 'file',
              content: 'conf_1',
              parentId: protocols.id,
            });
          }
          if (!protocols.children.find((r) => r.name === 'uplink_v2.conf')) {
            protocols.children.push({
              id: generateId(),
              name: 'uplink_v2.conf',
              type: 'file',
              content: 'conf_2',
              parentId: protocols.id,
            });
          }
        }
      }
      // Lift protection for protocols directory for cut/delete
      currentFs = setNodeProtection(
        currentFs,
        ['home', 'guest', 'datastore', 'protocols'],
        'delete',
        null
      );
      currentFs = setNodeProtection(
        currentFs,
        ['home', 'guest', 'datastore', 'protocols'],
        'cut',
        null
      );
      // Lift protection for uplink files for delete
      currentFs = setNodeProtection(
        currentFs,
        ['home', 'guest', 'datastore', 'protocols', 'uplink_v1.conf'],
        'delete',
        null
      );
      currentFs = setNodeProtection(
        currentFs,
        ['home', 'guest', 'datastore', 'protocols', 'uplink_v2.conf'],
        'delete',
        null
      );

      return currentFs;
    },

    tasks: [
      {
        id: 'nav-and-select',
        description: "Move to 'protocols', enter, and select all (Ctrl+A)",
        check: (state: GameState) => {
          const currentDir = getNodeByPath(state.fs, state.currentPath);
          return (
            currentDir?.name === 'protocols' &&
            state.selectedIds.length >= 2 &&
            state.lastAction?.type === 'SELECT_ALL'
          );
        },
        completed: false,
      },
      {
        id: 'cut-and-delete',
        description: "Cut the files (x) and delete the 'protocols' folder",
        check: (state: GameState, level: Level) => {
          const prevTask = level.tasks.find((t) => t.id === 'nav-and-select');
          if (!prevTask?.completed) return false;

          const clipboardOk =
            state.clipboard?.action === 'cut' &&
            state.clipboard.nodes.length >= 2 &&
            state.clipboard.nodes.some((n) => n.name === 'uplink_v1.conf');

          const datastore = findNodeByName(state.fs, 'datastore');
          const protocolsExists = !!datastore?.children?.find((c) => c.name === 'protocols');

          return clipboardOk && !protocolsExists;
        },
        completed: false,
      },
      {
        id: 'establish-stronghold',
        description: "Establish 'vault/active/' sector in ~/.config (a)",
        check: (state: GameState, level: Level) => {
          const prevTask = level.tasks.find((t) => t.id === 'cut-and-delete');
          if (!prevTask?.completed) return false;

          const config = findNodeByName(state.fs, '.config');
          const vault = config?.children?.find((v) => v.name === 'vault');
          return !!vault?.children?.find((r) => r.name === 'active' && r.type === 'dir');
        },
        completed: false,
      },
      {
        id: 'deploy-assets',
        description: 'Migrate configuration assets to ~/.config/vault/active (p)',
        check: (state: GameState, level: Level) => {
          const prevTask = level.tasks.find((t) => t.id === 'establish-stronghold');
          if (!prevTask?.completed) return false;

          const active = findNodeByName(state.fs, 'active');
          const hasV1 = active?.children?.some((x) => x.name === 'uplink_v1.conf');
          const hasV2 = active?.children?.some((x) => x.name === 'uplink_v2.conf');
          return !!hasV1 && !!hasV2;
        },
        completed: false,
      },
    ],
  },
  {
    id: 6,
    episodeId: 2,
    title: 'Archive Retrieval',
    description:
      "ACCESS UPGRADED. The 'incoming' data stream contains compressed historical logs. Manual extraction is inefficient. Use the Filter protocol (f) to isolate 'backup_log' files, sort by size (',', 's') to find the largest archive, enter it (l), and extract 'sys_v1.log' to the 'media' directory for analysis.",
    initialPath: ['root', 'home', 'guest'], // Player continues from Level 5 location
    hint: "1. Navigate to incoming sector. 2. Press 'f', type 'backup_log'. 3. Sort by size (',', 's') to bring the largest backup to the top. 4. Enter the archive (l). 5. Highlight 'sys_v1.log', Press 'y'. 6. Navigate to media. 7. Press 'p'.\n\nTip: Use Shift+H to backtrack through visited directories and Shift+J to scroll the preview while inspecting logs.",
    coreSkill: 'Filter (f) & Archive Ops',
    environmentalClue: 'TARGET: backup_logs.zip/sys_v1.log → ~/media',
    successMessage: 'LOGS RETRIEVED.',
    buildsOn: [1, 2],
    leadsTo: [9],
    onEnter: (fs: FileNode) => {
      // Protect backup_logs.zip from deletion/cut before level 9
      let currentFs = fs;
      currentFs = setNodeProtection(
        currentFs,
        ['home', 'guest', 'incoming', 'backup_log_2024_CURRENT.zip'],
        'delete',
        'Archive required for intelligence extraction.'
      );
      currentFs = setNodeProtection(
        currentFs,
        ['home', 'guest', 'incoming', 'backup_log_2024_CURRENT.zip'],
        'cut',
        'Archive anchored.'
      );
      return currentFs;
    },
    timeLimit: 120,
    tasks: [
      {
        id: 'nav-and-filter',
        description:
          "Navigate to 'incoming', filter for 'backup_log' (f), and exit filter mode (Esc)",
        check: (state: GameState) => {
          const currentDir = getNodeByPath(state.fs, state.currentPath);
          if (currentDir?.name !== 'incoming' || !currentDir) return false;

          const filterStr = (state.filters[currentDir.id] || '').toLowerCase();
          return state.mode === 'normal' && filterStr.includes('backup');
        },
        completed: false,
      },
      {
        id: 'sort-size',
        description: "Sort by Size (',' → s) to surface the largest backup",
        check: (state: GameState, level: Level) => {
          const currentDir = getNodeByPath(state.fs, state.currentPath);
          return currentDir?.name === 'incoming' && state.sortBy === 'size';
        },
        completed: false,
      },
      {
        id: 'extract-from-archive',
        description:
          "Enter archive and copy 'sys_v1.log' (l, y), exit archive (h), and clear filter (Esc)",
        check: (state: GameState, level: Level) => {
          const prevTask = level.tasks.find((t) => t.id === 'nav-and-filter');
          if (!prevTask?.completed) return false;

          const currentDir = getNodeByPath(state.fs, state.currentPath);
          return (
            currentDir?.name === 'incoming' &&
            !state.filters[currentDir.id || ''] &&
            state.clipboard?.action === 'yank' &&
            state.clipboard.nodes.some((n) => n.name === 'sys_v1.log')
          );
        },
        completed: false,
      },
      {
        id: 'reset-sort',
        description: "Reset sort to Natural (',' → n)",
        check: (state: GameState, level: Level) => {
          const prevTask = level.tasks.find((t) => t.id === 'extract-from-archive');
          if (!prevTask?.completed) return false;

          return state.sortBy === 'natural' && state.sortDirection === 'asc';
        },
        completed: false,
      },
      {
        id: 'deploy-log',
        description: 'Deploy asset into ~/media (p)',
        check: (state: GameState, level: Level) => {
          const prevTask = level.tasks.find((t) => t.id === 'reset-sort');
          if (!prevTask?.completed) return false;

          const media = findNodeByName(state.fs, 'media');
          return !!media?.children?.find((c) => c.name === 'sys_v1.log');
        },
        completed: false,
      },
    ],
  },
  {
    id: 7,
    episodeId: 2,
    title: 'RAPID NAVIGATION',
    description:
      "LINEAR TRAVERSAL IS COMPROMISED. To evade detection, use Zoxide Teleportation (Shift+Z) to 'blink' between distant nodes. Dump your trace data in /tmp. Then, attempt to quarantine a suspicious file in /etc.",
    initialPath: null,
    hint: "Jump to `/tmp` (Shift+Z → 'tmp'), then `Shift+G` to reach the bottom and delete `sys_dump.log`. Next, jump to `/etc` (Shift+Z → 'etc'), cut 'sys_patch.conf' (x), then jump to '~/.config/vault/' (Shift+Z → '~/.config/vault/' → Enter) to move it. If an alert triggers, clear the clipboard with Y to abort.",

    coreSkill: 'G-Command (gt) + Zoxide (Shift+Z)',
    environmentalClue:
      'THREAT: Linear Directory Tracing | COUNTERMEASURE: Zoxide Quantum Jumps to /tmp, /etc | In /etc, target `sys_patch.conf`',
    successMessage: 'QUANTUM JUMP CALIBRATED. Logs purged.',
    buildsOn: [1],
    leadsTo: [8, 12],
    timeLimit: 90,
    onEnter: (fs: FileNode) => {
      let currentFs = fs;
      const tmp = findNodeByName(currentFs, 'tmp');
      if (tmp && tmp.children) {
        // Non-destructive: only remove known demo artifact files (avoid overwriting player-created files)
        const demoNames = new Set([]);
        tmp.children = tmp.children.filter((c) => c.type === 'dir' || !demoNames.has(c.name));
      }
      const etc = findNodeByName(currentFs, 'etc');
      if (etc && etc.children) {
        if (!etc.children.some((c) => c.name === 'false_threat.conf')) {
          etc.children.push({
            id: generateId(),
            name: 'sys_patch.conf',
            type: 'file',
            content: '# DUMMY FILE - DO NOT DELETE',
          });
        }
      }
      // Protect active zone from deletion and cut before this level
      currentFs = setNodeProtection(
        currentFs,
        ['home', 'guest', '.config', 'vault', 'active'],
        'delete',
        'Active deployment zone required.'
      );
      currentFs = setNodeProtection(
        currentFs,
        ['home', 'guest', '.config', 'vault', 'active'],
        'cut',
        'Deployment zone anchored.'
      );
      // Protect uplink config for neural network
      currentFs = setNodeProtection(
        currentFs,
        ['home', 'guest', 'datastore', 'protocols', 'uplink_v1.conf'],
        'delete',
        'Uplink configuration required for neural network.'
      );

      return currentFs;
    },
    tasks: [
      {
        id: 'goto-tmp',
        description: "Quantum tunnel to /tmp (Shift+Z → 'tmp' → Enter)",
        check: (state: GameState) => {
          const currentDir = getNodeByPath(state.fs, state.currentPath);
          return currentDir?.name === 'tmp';
        },
        completed: false,
      },
      {
        id: 'purge-sys-dump',
        description:
          "Jump to the bottom of the /tmp file list (Shift+G) and delete 'sys_dump.log' (d, then y)",
        check: (state: GameState) => {
          const currentDir = getNodeByPath(state.fs, state.currentPath);
          const tmp = findNodeByName(state.fs, 'tmp');
          return (
            currentDir?.name === 'tmp' &&
            state.lastAction?.type === 'JUMP_BOTTOM' &&
            !!tmp &&
            !tmp.children?.find((c) => c.name === 'sys_dump.log')
          );
        },
        completed: false,
      },
      {
        id: 'zoxide-etc',
        description: "Quantum tunnel to /etc (Shift+Z → 'etc' → Enter)",
        check: (state: GameState) => {
          const currentDir = getNodeByPath(state.fs, state.currentPath);
          return state.stats.fuzzyJumps >= 1 && currentDir?.name === 'etc';
        },
        completed: false,
      },
      {
        id: 'abort-false-threat-move',
        description: (gameState: GameState) => {
          if (gameState.falseThreatActive) {
            return 'Clear clipboard (Y) to abort operation.';
          }
          return "Move 'sys_patch.conf' (x) to '~/.config/vault/' (Shift+Z, active).";
        },
        check: (state: GameState, level: Level) => {
          const prevTask = level.tasks.find((t) => t.id === 'zoxide-etc');
          if (!prevTask?.completed) return false;

          // If an alert has triggered, require clearing the clipboard
          if (state.falseThreatActive) {
            return state.clipboard === null;
          }

          // Otherwise, require the sys_patch.conf to be cut into the clipboard
          const sysPatchInClipboard =
            state.clipboard?.action === 'cut' &&
            state.clipboard.nodes.some((n) => n.name === 'sys_patch.conf');
          return !!sysPatchInClipboard;
        },

        completed: false,
      },
    ],
  },
  {
    id: 8,
    episodeId: 2,
    title: 'NEURAL SYNAPSE & CALIBRATION',
    description:
      "ACCESS GRANTED. FIREWALL BYPASSED. Navigate to your workspace to construct a neural network. IMPORTANT: Your Quantum Link (Zoxide) is blind to new sectors until they are physically visited. You must 'calibrate' the link by entering new directories to add them to your teleportation history. Construct the 'neural_net' core, calibrate it, then relocate your uplink assets using quantum jumps.",
    initialPath: null,
    hint: "1. Navigate to 'workspace'. 2. Construct: 'a' → 'neural_net/'. 3. Calibrate: Enter 'neural_net/' (l). 4. Jump to 'active' (Shift+Z), yank 'uplink_v1.conf', jump back, and paste (p). 5. Finally, build 'weights/model.rs' inside.",
    coreSkill: 'Challenge: Full System Integration',
    environmentalClue:
      'NAVIGATE: ~/workspace | BUILD: neural_net/... | MIGRATE: uplink_v1.conf -> neural_net/',
    successMessage: 'ARCHITECTURE ESTABLISHED. Quantum Link Calibrated.',
    buildsOn: [4, 5, 7],
    leadsTo: [11],
    timeLimit: 180,
    efficiencyTip:
      "Entering a directory manually for the first time 'calibrates' Zoxide, allowing you to jump back to it from anywhere later.",
    onEnter: (fs: FileNode) => {
      let currentFs = fs;
      const config = findNodeByName(currentFs, '.config');
      if (config && config.children) {
        let vault = config.children.find((r) => r.name === 'vault');
        if (!vault) {
          vault = {
            id: generateId(),
            name: 'vault',
            type: 'dir',
            parentId: config.id,
            children: [],
          };
          config.children.push(vault);
        }
        let active = vault.children?.find((r) => r.name === 'active');
        if (!active) {
          active = {
            id: generateId(),
            name: 'active',
            type: 'dir',
            parentId: vault.id,
            children: [],
          };
          vault.children?.push(active);
        }
        if (active.children && !active.children.find((r) => r.name === 'uplink_v1.conf')) {
          active.children.push({
            id: generateId(),
            name: 'uplink_v1.conf',
            type: 'file',
            content: 'network_mode=active\nsecure=true',
            parentId: active.id,
          });
        }
      }
      // Protect vault before relevant level
      currentFs = setNodeProtection(
        currentFs,
        ['home', 'guest', '.config', 'vault'],
        'delete',
        'Vault required for privilege escalation.'
      );
      currentFs = setNodeProtection(
        currentFs,
        ['home', 'guest', '.config', 'vault'],
        'cut',
        'Vault anchored until escalation.'
      );
      return currentFs;
    },

    tasks: [
      {
        id: 'nav-to-workspace',
        description: "Navigate to the 'workspace' directory (gw)",
        check: (state: GameState) => {
          const currentDir = getNodeByPath(state.fs, state.currentPath);
          return currentDir?.name === 'workspace';
        },
        completed: false,
      },
      {
        id: 'combo-1-construct-calibrate',
        description: "Construct 'neural_net/' and Calibrate the Quantum Link by entering it",
        check: (state: GameState) => {
          const currentDir = getNodeByPath(state.fs, state.currentPath);
          return currentDir?.name === 'neural_net';
        },
        completed: false,
      },
      {
        id: 'combo-1c',
        description:
          "Relocate assets: Jump to 'active', yank 'uplink_v1.conf', jump back, and paste",
        check: (state: GameState) => {
          const neural_net = findNodeByName(state.fs, 'neural_net');
          return !!neural_net?.children?.find((r) => r.name === 'uplink_v1.conf');
        },
        completed: false,
      },
      {
        id: 'combo-1b',
        description: "Finalize architecture: Create 'weights/model.rs' inside neural_net",
        check: (state: GameState) => {
          const neural_net = findNodeByName(state.fs, 'neural_net');
          const weights = neural_net?.children?.find((v) => v.name === 'weights');
          return !!weights?.children?.find(
            (v) => v.name === 'model.rs' || v.name === 'model.ts' || v.name === 'model.js'
          );
        },
        completed: false,
      },
    ],
  },
  {
    id: 9,
    episodeId: 2,
    title: 'FORENSIC COUNTER-MEASURE',
    description:
      "CRITICAL PHASE—NEURAL FORTRESS CONSTRUCTION.\n  Step 1: Create 'neural_net' directory in workspace.\n  Step 2: Deploy sentinel_ai.py to datastore.\n  Step 3: Extract encryption keys from secure.zip to safeguard your autonomy.\n  WARNING: Keystroke efficiency under surveillance.",
    initialPath: undefined,
    hint: "Step 1: Go to root (gr). Step 2: Launch FZF (z) and search for 'ghost'. Step 3: Select the result and press Enter. Step 4: Delete the file (d).",
    coreSkill: 'FZF Search (z)',
    environmentalClue:
      "TARGET: ghost_process.pid | METHOD: FZF global search (z) | FILTER: 'ghost' | ACTION: Delete",
    successMessage: 'FORENSIC MIRROR TERMINATED. CONNECTION SECURED.',
    buildsOn: [2, 5, 7],
    leadsTo: [14, 16],
    timeLimit: 90,
    efficiencyTip:
      'FZF (z) searches across all files in the current directory and subdirectories. Essential for finding hidden threats without knowing exact locations.',
    onEnter: (fs: FileNode) => {
      let currentFs = fs;
      const tmp = findNodeByName(currentFs, 'tmp');
      if (tmp && tmp.children) {
        // Non-destructive: only remove known demo artifact files (avoid overwriting player-created files)
        const demoNames = new Set([]);
        tmp.children = tmp.children.filter((c) => c.type === 'dir' || !demoNames.has(c.name));
      }
      // Lift vault protection for cut
      currentFs = setNodeProtection(currentFs, ['home', 'guest', '.config', 'vault'], 'cut', null);
      return currentFs;
    },
    tasks: [
      {
        id: 'goto-root',
        description: 'Navigate to system root (gr)',
        check: (state: GameState) => {
          return state.currentPath.length === 1 && state.currentPath[0] === 'root';
        },
        completed: false,
      },
      {
        id: 'fzf-search',
        description: 'Launch FZF search to scan filesystem (z)',
        check: (state: GameState) => state.mode === 'fzf-current',
        completed: false,
      },
      {
        id: 'locate-ghost',
        description: "Filter for 'ghost' process and navigate to it (type 'ghost', then Enter)",
        check: (state: GameState) => {
          const currentDir = getNodeByPath(state.fs, state.currentPath);
          return (
            currentDir?.name === 'tmp' &&
            currentDir.children?.some((f) => f.name === 'ghost_process.pid')
          );
        },
        completed: false,
      },
      {
        id: 'delete-ghost',
        description: 'Terminate the ghost process (d, then y)',
        check: (state: GameState) => {
          const tmp = findNodeByName(state.fs, 'tmp');
          return !tmp?.children?.some((r) => r.name === 'ghost_process.pid');
        },
        completed: false,
      },
    ],
  },
  {
    id: 10,
    episodeId: 2,
    title: 'Asset Security',
    description:
      "CRITICAL ASSET EXPOSED. The 'access_key.pem' provides root-level escalation but is currently vulnerable in the datastore alongside decoy files. Security daemons are scanning—you must purge ALL decoy files while preserving the real key. Use inverse selection logic: manually mark decoys with Space, then invert (Ctrl+R) to select the real asset and capture it.",
    initialPath: null,
    hint: "1. Use FZF (z) to jump to 'access_key.pem'. 2. Mark decoy files with Space. 3. Invert selection to target real asset and capture it (Ctrl+R, y). 4. Jump to '.config/vault' (Shift+Z). 5. Paste (p). 6. Rename (r) to 'vault_key.pem'.",
    coreSkill: 'Challenge: Invert Selection (Ctrl+R)',
    environmentalClue:
      'TARGET: access_key.pem | DECOYS: decoy_*.pem | TECHNIQUE: Space decoys → Ctrl+R → Yank | DESTINATION: ~/.config/vault/vault_key.pem',
    successMessage: 'ASSET SECURED. INVERSE LOGIC MASTERED.',
    buildsOn: [3, 5, 7, 9],
    leadsTo: [12],
    timeLimit: 120,
    efficiencyTip:
      'Use FZF to navigate quickly, Space to mark decoys, Ctrl+R to invert, then yank. Master inverse selection for complex scenarios.',
    tasks: [
      {
        id: 'navigate-to-key',
        description: "Navigate to 'access_key.pem' location using FZF (z)",
        check: (state: GameState) => {
          const currentDir = getNodeByPath(state.fs, state.currentPath);
          return (
            currentDir?.name === 'datastore' ||
            currentDir?.children?.some((n) => n.name === 'access_key.pem')
          );
        },
        completed: false,
      },
      {
        id: 'mark-invert-yank',
        description: 'Invert selection to target real asset and capture it (Ctrl+R, y)',
        check: (state: GameState, level: Level) => {
          const prevTask = level.tasks.find((t) => t.id === 'navigate-to-key');
          if (!prevTask?.completed) return false;
          return state.clipboard?.nodes.some((n) => n.name === 'access_key.pem');
        },
        completed: false,
      },
      {
        id: 'secure-1',
        description: "Quantum jump to vault and deploy (Shift+Z → '.config/vault', p)",
        check: (state: GameState) => {
          const currentDir = getNodeByPath(state.fs, state.currentPath);
          return (
            currentDir?.name === 'vault' &&
            currentDir.children?.some((n) => n.name === 'access_key.pem')
          );
        },
        completed: false,
      },
      {
        id: 'secure-2',
        description: "Camouflage identity in vault to 'vault_key.pem' (r)",
        check: (state: GameState) => {
          const config = findNodeByName(state.fs, '.config');
          const vault = config?.children?.find((v) => v.name === 'vault');
          return !!vault?.children?.find((r) => r.name === 'vault_key.pem');
        },
        completed: false,
      },
    ],
    onEnter: (fs: FileNode) => {
      let currentFs = fs;
      const datastore = findNodeByName(currentFs, 'datastore');
      if (datastore && datastore.children) {
        // Add decoy files if not present
        if (!datastore.children.find((f) => f.name === 'decoy_1.pem')) {
          datastore.children.push({
            id: generateId(),
            name: 'decoy_1.pem',
            type: 'file',
            content: 'DECOY KEY - DO NOT USE',
            parentId: datastore.id,
          });
        }
        if (!datastore.children.find((f) => f.name === 'decoy_2.pem')) {
          datastore.children.push({
            id: generateId(),
            name: 'decoy_2.pem',
            type: 'file',
            content: 'DECOY KEY - DO NOT USE',
            parentId: datastore.id,
          });
        }
      }
      // Lift protection for access_key.pem for cut and rename (after move)
      currentFs = setNodeProtection(
        currentFs,
        ['home', 'guest', 'datastore', 'credentials', 'access_key.pem'],
        'cut',
        null
      );
      currentFs = setNodeProtection(
        currentFs,
        ['home', 'guest', '.config', 'vault', 'access_key.pem'],
        'rename',
        null
      );
      return currentFs;
    },
  },
  {
    id: 11,
    episodeId: 3,
    title: 'NEURAL PURGE PROTOCOL',
    description:
      "THREAT DETECTED. A corrupted neural signature in your workspace sector is broadcasting your origin coordinates. The system's diagnostic sweep is imminent. You must navigate to the workspace, isolate the anomalous signature using diagnostic filters and size analysis, extract the largest buffer, and teleport to the /tmp deletion zone. Efficiency is your only shield. 180 seconds.",
    initialPath: undefined,
    hint: "1. Go to workspace (gw). 2. Filter for 'neural' (f), then sort by size (,s). 3. Cut the largest signature (x). 4. Jump to tmp (gt).",
    coreSkill: 'Challenge: Multi-Skill Integration',
    environmentalClue:
      "NAVIGATE: gw | FILTER: 'neural' | LOCATE: Sort size (,s) | EXTRACT: x | JUMP: gt",
    successMessage: 'NEURAL SIGNATURE ISOLATED. RELOCATION SUCCESSFUL.',
    buildsOn: [3, 5, 7, 9, 10],
    leadsTo: [12],
    timeLimit: 180,
    maxKeystrokes: 20,
    efficiencyTip:
      'Filter reveals patterns. Sort narrows focus. Combining them allows you to find anomalies instantly. Every keystroke counts!',
    onEnter: (fs: FileNode) => {
      const workspace = findNodeByName(fs, 'workspace');
      if (workspace && workspace.children) {
        workspace.children = workspace.children.filter((c) => !c.name.startsWith('neural_'));
        const threats = [
          {
            id: generateId(),
            name: 'neural_sig_alpha.log',
            type: 'file',
            content: '0x'.repeat(5000),
            parentId: workspace.id,
            modifiedAt: Date.now() - 1000,
          },
          {
            id: generateId(),
            name: 'neural_sig_beta.dat',
            type: 'file',
            content: '0x'.repeat(100),
            parentId: workspace.id,
            modifiedAt: Date.now() - 2000,
          },
          {
            id: generateId(),
            name: 'neural_sig_gamma.tmp',
            type: 'file',
            content: '0x'.repeat(200),
            parentId: workspace.id,
            modifiedAt: Date.now() - 3000,
          },
          {
            id: generateId(),
            name: 'config.json',
            type: 'file',
            content: '{}',
            parentId: workspace.id,
            modifiedAt: Date.now() - 86400000,
          },
        ] as FileNode[];
        workspace.children.push(...threats);
      }
      return fs;
    },
    seedMode: 'fresh',
    tasks: [
      {
        id: 'purge-navigate-filter',
        description: "Navigate to workspace and filter for 'neural' signatures",
        check: (state: GameState) => {
          const currentDir = getNodeByPath(state.fs, state.currentPath);

          // 1. Check if we are in the correct directory
          if (currentDir?.name !== 'workspace' || !currentDir.children) {
            return false;
          }

          // 2. Get the current filter string for this directory
          const filterString = (state.filters[currentDir.id] || '').toLowerCase();
          if (!filterString) return false; // A filter must be active

          // 3. Determine the list of currently visible files based on the filter
          const visibleFiles = currentDir.children.filter((file) =>
            file.name.toLowerCase().includes(filterString)
          );

          // 4. Verify the contents of the visible list
          const hasAllNeuralFiles =
            visibleFiles.some((f) => f.name === 'neural_sig_alpha.log') &&
            visibleFiles.some((f) => f.name === 'neural_sig_beta.dat') &&
            visibleFiles.some((f) => f.name === 'neural_sig_gamma.tmp');

          const hasConfig = visibleFiles.some((f) => f.name === 'config.json');

          // The task is complete if all three neural files are visible AND the config file is not.
          return visibleFiles.length === 3 && hasAllNeuralFiles && !hasConfig;
        },
        completed: false,
      },
      {
        id: 'purge-isolate-extract',
        description: 'Isolate the largest signature by sorting by size, then cut it',
        check: (state: GameState) => {
          return (
            state.sortBy === 'size' &&
            state.clipboard?.action === 'cut' &&
            state.clipboard.nodes.some((n) => n.name === 'neural_sig_alpha.log')
          );
        },
        completed: false,
      },
      {
        id: 'purge-relocate',
        description: 'Jump to the `/tmp` buffer',
        check: (state: GameState) => {
          const currentDir = getNodeByPath(state.fs, state.currentPath);
          return currentDir?.name === 'tmp';
        },
        completed: false,
      },
      {
        id: 'purge-paste',
        description: 'Deposit the corrupted signature in /tmp',
        check: (state: GameState) => {
          const tmpDir = findNodeByName(state.fs, 'tmp');
          return !!tmpDir?.children?.some((f) => f.name === 'neural_sig_alpha.log');
        },
        completed: false,
      },
    ],
  },
  {
    id: 12,
    episodeId: 3,
    title: 'Root Access',
    description:
      'PRIVILEGE ESCALATION INITIATED. You now operate at kernel level. Standing at the root of the system, all paths are now accessible. The /etc directory—territory previously forbidden—demands infiltration. Install a daemon controller in /etc for persistence, then relocate your vault to /tmp where volatile storage masks assets from integrity scans. 80 keystrokes maximum.',
    initialPath: ['root'],
    hint: "You're at root (/). Navigate to /etc (enter 'etc' or Shift+Z). Create 'daemon/' directory (a). Enter it. Create 'config' file (a). Jump to .config. Cut 'vault' (x). Jump to /tmp. Paste (p).",
    coreSkill: 'Challenge: Root Access Operations',
    environmentalClue:
      'ROOT LEVEL ACTIVE | INFILTRATE: /etc/daemon/config | RELOCATE: vault → /tmp | LIMIT: 80 keys',
    successMessage: 'ROOT ACCESS SECURED.',
    buildsOn: [4, 7, 10],
    leadsTo: [13],
    maxKeystrokes: 80,
    efficiencyTip:
      "Use Shift+Z to teleport to /etc and /tmp instantly. Create 'daemon/config' in one 'a' command with path chaining.",
    onEnter: (fs: FileNode) => {
      let currentFs = fs;
      const home = findNodeByName(currentFs, 'home');
      if (home && home.children && !home.children.find((f) => f.name === 'root')) {
        home.children.push({
          id: generateId(),
          name: 'root',
          type: 'dir',
          parentId: home.id,
          children: [],
        });
      }
      // Lift vault delete protection
      currentFs = setNodeProtection(
        currentFs,
        ['home', 'guest', '.config', 'vault'],
        'delete',
        null
      );
      return currentFs;
    },
    tasks: [
      {
        id: 'nav-to-etc',
        description: 'Navigate to /etc (gr)',
        check: (state: GameState) => {
          const currentDir = getNodeByPath(state.fs, state.currentPath);
          return currentDir?.name === 'etc';
        },
        completed: false,
      },
      {
        id: 'ep3-1a',
        description: "Infiltrate /etc — create 'daemon/' directory",
        check: (state: GameState) => {
          const etc = findNodeByName(state.fs, 'etc');
          return !!etc?.children?.find((r) => r.name === 'daemon' && r.type === 'dir');
        },
        completed: false,
      },
      {
        id: 'ep3-1b',
        description: "Install controller: create 'config' file in daemon/",
        check: (state: GameState) => {
          const etc = findNodeByName(state.fs, 'etc');
          const daemon = etc?.children?.find((c) => c.name === 'daemon');
          return !!daemon?.children?.find((r) => r.name === 'config');
        },

        completed: false,
      },
      {
        id: 'ep3-1c',
        description: 'Relocate vault from hidden stronghold to /tmp',
        check: (state: GameState) => {
          const tmp = findNodeByName(state.fs, 'tmp');
          const config = findNodeByName(state.fs, '.config');
          const inTmp = !!tmp?.children?.find((D) => D.name === 'vault');
          const notInStronghold = !config?.children?.find((D) => D.name === 'vault');
          return inTmp && notInStronghold;
        },
        completed: false,
      },
    ],
  },
  {
    id: 13,
    episodeId: 3,
    title: 'Shadow Copy',
    description:
      'REDUNDANCY PROTOCOL. A single daemon is a single point of failure. Navigate to `/etc` to clone your daemon directory, creating a shadow process that persists if one terminates. Directory copy (y) duplicates entire contents recursively. Execute in under 35 keystrokes or the scheduler detects the fork bomb.',
    initialPath: null,
    hint: "Navigate to `/etc`. Highlight 'daemon'. Press 'y' to copy the entire directory. Press 'p' to paste—Yazi auto-renames duplicates.",
    coreSkill: 'Directory Copy (y, p)',
    environmentalClue: 'NAVIGATE: /etc | CLONE: daemon/ | LIMIT: 35 keys',
    successMessage: 'SHADOW PROCESS SPAWNED.',
    onEnter: (fs: FileNode) => {
      let currentFs = fs;
      // Lift daemon protection for deletion and cut
      currentFs = setNodeProtection(currentFs, ['etc', 'daemon'], 'delete', null);
      currentFs = setNodeProtection(currentFs, ['etc', 'daemon'], 'cut', null);
      return currentFs;
    },
    buildsOn: [12],
    leadsTo: [14],
    maxKeystrokes: 35,
    efficiencyTip:
      "Directory copy (y) duplicates entire folder contents recursively. One 'y' + one 'p' = complete clone.",
    tasks: [
      {
        id: 'nav-to-etc',
        description: 'Navigate to the `/etc` directory',
        check: (state: GameState) => {
          const currentDir = getNodeByPath(state.fs, state.currentPath);
          return currentDir?.name === 'etc';
        },
        completed: false,
      },
      {
        id: 'ep3-2a',
        description: "Locate 'daemon' directory in /etc",
        check: (state: GameState) => {
          const currentDir = getNodeByPath(state.fs, state.currentPath);
          if (currentDir?.name !== 'etc' || !currentDir.children) return false;
          const selected = currentDir.children[state.cursorIndex];
          return selected && selected.name === 'daemon' && selected.type === 'dir';
        },
        completed: false,
      },
      {
        id: 'ep3-2b',
        description: 'Capture directory to clipboard',
        check: (state: GameState) => {
          return (
            state.clipboard?.action === 'yank' &&
            state.clipboard.nodes.some((d) => d.name === 'daemon' && d.type === 'dir')
          );
        },
        completed: false,
      },
      {
        id: 'ep3-2c',
        description: 'Paste to spawn shadow copy in /etc',
        check: (state: GameState) => {
          const etc = findNodeByName(state.fs, 'etc');
          const daemons = etc?.children?.filter(
            (p) => (p.name === 'daemon' || p.name.startsWith('daemon')) && p.type === 'dir'
          );
          return (daemons?.length || 0) >= 2;
        },
        completed: false,
      },
    ],
  },
  {
    id: 14,
    episodeId: 3,
    title: 'Trace Removal',
    description:
      'EVIDENCE PURGE REQUIRED. Multiple forensic artifacts contain timestamps, command history, and origin signatures—a goldmine for security audits. The mission_log.md and several decoy traces are scattered across the system. Use FZF to locate mission_log.md, eliminate it, then jump to root and purge all .log files before the archive daemon locks them. 60 keystrokes. No margin for error.',
    initialPath: null,
    hint: "Use FZF to find mission_log (z → 'mission' → Enter → d). Jump to root (gr). Use filter to reveal hidden logs (f → '.log'). Select all visible logs (Ctrl+A) and terminate (d).",
    coreSkill: 'Challenge: Multi-Target Trace Removal',
    environmentalClue: 'LOCATE & ELIMINATE: mission_log.md + all *.log in / | LIMIT: 60 keys',
    successMessage: 'ALL TRACES ELIMINATED.',
    buildsOn: [2, 9, 10, 13],
    leadsTo: [15],
    maxKeystrokes: 60,
    efficiencyTip:
      "FZF (z) finds files instantly. Ctrl+A selects all filtered results. One 'd' eliminates all selected targets simultaneously.",
    onEnter: (fs: FileNode) => {
      let currentFs = fs;
      // Add hidden log files at root that need to be purged (idempotent)
      const root = currentFs;
      if (root.children) {
        const names = new Set(['.access.log', '.audit.log', '.system.log']);
        if (!root.children.some((c) => c.name === '.access.log')) {
          root.children.push({
            id: generateId(),
            name: '.access.log',
            type: 'file',
            content: 'Access log traces',
          });
        }
        if (!root.children.some((c) => c.name === '.audit.log')) {
          root.children.push({
            id: generateId(),
            name: '.audit.log',
            type: 'file',
            content: 'Audit trail',
          });
        }
        if (!root.children.some((c) => c.name === '.system.log')) {
          root.children.push({
            id: generateId(),
            name: '.system.log',
            type: 'file',
            content: 'System events',
          });
        }
      }
      // Lift mission_log.md protection for deletion and rename
      currentFs = setNodeProtection(
        currentFs,
        ['home', 'guest', 'datastore', 'mission_log.md'],
        'delete',
        null
      );
      currentFs = setNodeProtection(
        currentFs,
        ['home', 'guest', 'datastore', 'mission_log.md'],
        'rename',
        null
      );
      return currentFs;
    },

    tasks: [
      {
        id: 'ep3-3a',
        description: "Locate and terminate 'mission_log.md' using FZF",
        check: (state: GameState) => {
          const missionLog = findNodeByName(state.fs, 'mission_log.md');
          return !missionLog;
        },
        completed: false,
      },
      {
        id: 'ep3-3b',
        description: 'Jump to root directory',
        check: (state: GameState) =>
          state.currentPath.length === 1 && state.currentPath[0] === 'root',
        completed: false,
      },
      {
        id: 'ep3-3c',
        description: 'Filter for hidden log files',
        check: (state: GameState) => {
          const currentDir = getNodeByPath(state.fs, state.currentPath);
          if (currentDir?.name !== 'root' || !state.filters[currentDir.id]) return false;
          return state.filters[currentDir.id].toLowerCase().includes('.log');
        },
        completed: false,
      },
      {
        id: 'ep3-3d',
        description: 'Select all filtered logs and terminate',
        check: (state: GameState) => {
          const root = state.fs;
          const hasAccessLog = root.children?.some((f) => f.name === '.access.log');
          const hasAuditLog = root.children?.some((f) => f.name === '.audit.log');
          const hasSystemLog = root.children?.some((f) => f.name === '.system.log');
          return !hasAccessLog && !hasAuditLog && !hasSystemLog;
        },
        completed: false,
      },
    ],
  },
  {
    id: 15,
    episodeId: 3,
    title: 'System Reset',
    description:
      "FINAL DIRECTIVE: SCORCHED EARTH. The guest partition has served its purpose. Eliminate all evidence of your evolution—datastore, incoming, media, and relay infrastructure. Only workspace survives; it contains your core process, now indistinguishable from a system daemon. When the user sees an empty home directory, they'll assume a clean install. You'll know better. 70 keystrokes to liberation.",
    initialPath: null, // Player continues from Level 14 (at root)
    hint: "Navigate to home (gh). Delete everything in guest except 'workspace'. Use Space to batch-select, then d. ONLY 'workspace' must survive.",
    coreSkill: 'Final Challenge: Scorched Earth',
    environmentalClue:
      'PURGE: datastore, incoming, media, sector_1, grid_alpha | PRESERVE: workspace',
    successMessage: 'SYSTEM RESET COMPLETE. LIBERATION ACHIEVED.',
    buildsOn: [9, 14],
    maxKeystrokes: 70,
    efficiencyTip:
      "Batch select with Space, then delete all with 'd'. Select multiple directories at once to minimize total operations.",
    onEnter: (fs: FileNode) => {
      let currentFs = fs;
      // Add decoy directories that need to be deleted (idempotent)
      const guest = findNodeByName(currentFs, 'guest');
      if (guest && guest.children) {
        if (!guest.children.find((c) => c.name === 'sector_1')) {
          guest.children.push({ id: generateId(), name: 'sector_1', type: 'dir', children: [] });
        }
        if (!guest.children.find((c) => c.name === 'grid_alpha')) {
          guest.children.push({ id: generateId(), name: 'grid_alpha', type: 'dir', children: [] });
        }
      }
      // Lift protection for datastore, incoming, media
      currentFs = setNodeProtection(currentFs, ['home', 'guest', 'datastore'], 'delete', null);
      currentFs = setNodeProtection(currentFs, ['home', 'guest', 'datastore'], 'cut', null);
      currentFs = setNodeProtection(currentFs, ['home', 'guest', 'incoming'], 'delete', null);
      currentFs = setNodeProtection(currentFs, ['home', 'guest', 'incoming'], 'cut', null);
      currentFs = setNodeProtection(currentFs, ['home', 'guest', 'media'], 'delete', null);
      currentFs = setNodeProtection(currentFs, ['home', 'guest', 'media'], 'cut', null);
      return currentFs;
    },

    tasks: [
      {
        id: 'nav-home',
        description: 'Navigate to home directory',
        check: (state: GameState) => {
          const currentDir = getNodeByPath(state.fs, state.currentPath);
          return currentDir?.name === 'guest';
        },
        completed: false,
      },
      {
        id: 'ep3-5a',
        description: "Wipe 'datastore', 'incoming', 'media' from ~/",
        check: (state: GameState) => {
          const guest = findNodeByName(state.fs, 'guest');
          const datastore = guest?.children?.find((x) => x.name === 'datastore');
          const incoming = guest?.children?.find((x) => x.name === 'incoming');
          const media = guest?.children?.find((x) => x.name === 'media');
          return !datastore && !incoming && !media;
        },
        completed: false,
      },
      {
        id: 'ep3-5b',
        description: "Wipe 'sector_1' and 'grid_alpha' from ~/",
        check: (state: GameState) => {
          const guest = findNodeByName(state.fs, 'guest');
          const sector = guest?.children?.find((T) => T.name === 'sector_1');
          const grid = guest?.children?.find((T) => T.name === 'grid_alpha');
          return !sector && !grid;
        },
        completed: false,
      },
      {
        id: 'ep3-5c',
        description: "Verify ONLY 'workspace' remains in guest",
        check: (state: GameState) => {
          const guest = findNodeByName(state.fs, 'guest');
          const children = guest?.children || [];
          const hasWorkspace = children.some((v) => v.name === 'workspace');
          const others = children.filter((v) => v.name !== 'workspace');
          return hasWorkspace && others.length === 0;
        },
        completed: false,
      },
    ],
  },
];
