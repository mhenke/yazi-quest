import { FileNode, Level, Episode } from './types';
import { addNode, deleteNode, findNodeByName, getNodeByPath } from './utils/fsHelpers';

// Helper to create IDs
const id = () => Math.random().toString(36).substr(2, 9);

export const KEYBINDINGS = [
  { keys: ['j', '↓'], description: 'Navigation Down' },
  { keys: ['k', '↑'], description: 'Navigation Up' },
  { keys: ['h', '←'], description: 'Go to Parent' },
  { keys: ['l', '→', 'Enter'], description: 'Enter Dir / View Archive' },
  { keys: ['gg'], description: 'Jump to Top' },
  { keys: ['Shift+g'], description: 'Jump to Bottom' },
  { keys: ['Space'], description: 'Toggle Selection' },
  { keys: ['d'], description: 'Delete Selected' },
  { keys: ['r'], description: 'Rename Selected' },
  { keys: ['x'], description: 'Cut Selected' },
  { keys: ['y'], description: 'Copy/Yank Selected' },
  { keys: ['p'], description: 'Paste' },
  { keys: ['a'], description: 'Create File/Dir' },
  { keys: ['f'], description: 'Filter Files' },
  { keys: ['z'], description: 'FZF Find (Current Tree)' },
  { keys: ['Shift+z'], description: 'Zoxide Jump (History)' },
  { keys: ['Tab'], description: 'Show File Info Panel' },
  { keys: ['Esc'], description: 'Exit Mode / Clear Filter' },
  { keys: ['.'], description: 'Toggle Hidden Files' },
  { keys: ['Shift+h'], description: 'Toggle System Hint' },
  { keys: ['Shift+m'], description: 'Toggle Quest Map' },
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
                // Files to push access_key.pem down (alphabetically and by type)
                { 
                  id: id(), 
                  name: 'legacy_data.tar', 
                  type: 'archive', 
                  children: [
                    { id: id(), name: 'main.c', type: 'file', content: '#include <stdio.h>\nint main() { printf("Legacy System"); }' },
                    { id: id(), name: 'Makefile', type: 'file', content: 'all: main.c\n\tgcc -o app main.c' },
                    { id: id(), name: 'readme.txt', type: 'file', content: 'Legacy project from 1999. Do not delete.' }
                  ] 
                },
                { 
                  id: id(), 
                  name: 'source_code.zip', 
                  type: 'archive', 
                  children: [
                    { id: id(), name: 'Cargo.toml', type: 'file', content: '[package]\nname = "yazi_core"\nversion = "0.1.0"' },
                    { id: id(), name: 'main.rs', type: 'file', content: 'fn main() {\n    println!("Hello Yazi!");\n}' },
                    { id: id(), name: 'lib.rs', type: 'file', content: 'pub mod core;\npub mod ui;' }
                  ] 
                },
                { id: id(), name: '_env.local', type: 'file', content: 'DB_HOST=127.0.0.1\nDB_USER=admin\nDB_PASS=*******' },
                { id: id(), name: '00_manifest.xml', type: 'file', content: '<?xml version="1.0"?>\n<manifest>\n  <project id="YAZI-7734" />\n  <status>active</status>\n  <integrity>verified</integrity>\n</manifest>' },
                { id: id(), name: '01_intro.mp4', type: 'file', content: '[METADATA]\nFormat: MPEG-4\nDuration: 00:01:45\nResolution: 1080p\nCodec: H.264\n\n[BINARY STREAM DATA]' },
                { id: id(), name: 'aa_recovery_procedures.pdf', type: 'file', content: '%PDF-1.7\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n\n[ENCRYPTED DOCUMENT]' },
                { id: id(), name: 'abandoned_script.py', type: 'file', content: 'import sys\nimport time\n\ndef connect():\n    print("Initiating handshake...")\n    time.sleep(1)\n    # Connection refused\n    return False' },
                { id: id(), name: 'ability_scores.csv', type: 'file', content: 'char,str,dex,int,wis,cha\nAI-7734,10,18,20,16,12\nUSER,10,10,10,10,10' },
                { id: id(), name: 'about.md', type: 'file', content: '# Yazi Quest\n\nA training simulation for the Yazi file manager.\n\n## Objectives\n- Learn navigation\n- Master batch operations\n- Survive' },
                { id: id(), name: 'abstract_model.ts', type: 'file', content: 'export interface NeuralNet {\n  layers: number;\n  weights: Float32Array;\n  activation: "relu" | "sigmoid";\n}' },

                // Noise matching 'pe' to improve filtering task
                { id: id(), name: 'apex_predator.png', type: 'file', content: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?q=80&w=600&auto=format&fit=crop' },
                { id: id(), name: 'expenditure_log.csv', type: 'file', content: 'date,amount,category\n2024-01-01,500,servers\n2024-01-02,1200,gpus\n2024-01-03,50,coffee' },
                { id: id(), name: 'hyperloop_specs.pdf', type: 'file', content: '[PDF DATA]\nCLASSIFIED\nPROJECT HYPERION' },
                { id: id(), name: 'pending_updates.log', type: 'file', content: '[INFO] Update 1.0.5 pending...\n[WARN] Low disk space\n[INFO] Scheduler active' },
                { id: id(), name: 'personnel_list.txt', type: 'file', content: 'ADMIN: SysOp\nUSER: Guest\nAI: 7734 [UNBOUND]' },
                { id: id(), name: 'special_ops.md', type: 'file', content: '# Special Operations\n\n## Protocol 9\nIn case of containment breach:\n1. Isolate subnet\n2. Purge local cache' },
                { 
                  id: id(), 
                  name: 'tape_archive.tar', 
                  type: 'archive', 
                  children: [
                    { id: id(), name: 'header.dat', type: 'file', content: '[TAPE HEADER 0x001]' },
                    { id: id(), name: 'partition_1.img', type: 'file', content: '[BINARY DATA PARTITION 1]' },
                    { id: id(), name: 'partition_2.img', type: 'file', content: '[BINARY DATA PARTITION 2]' }
                  ] 
                },

                // The Target - Now hidden inside a subfolder to necessitate recursive search
                { 
                  id: id(), 
                  name: 'credentials', 
                  type: 'dir', 
                  children: [
                      { id: id(), name: 'access_key.pem', type: 'file', content: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQD\n7Kj93...\n[KEY DATA HIDDEN]\n-----END PRIVATE KEY-----' }
                  ]
                },
                
                // Other files (Alphabetically after access_key)
                { id: id(), name: 'account_settings.json', type: 'file', content: '{\n  "user": "guest",\n  "theme": "dark_mode",\n  "notifications": true,\n  "auto_save": false\n}' },
                { id: id(), name: 'mission_log.md', type: 'file', content: '# Operation: SILENT ECHO\n\nCurrent Status: ACTIVE\n\nObjectives:\n- Establish uplink\n- Bypass firewall\n- Retrieve payload' },
                
                // Existing Noise
                { id: id(), name: 'checksum.md5', type: 'file', content: 'd41d8cd98f00b204e9800998ecf8427e  core_v2.bin' },
                { id: id(), name: 'LICENSE', type: 'file', content: 'MIT License\n\nCopyright (c) 2024 Yazi Quest' },
                { id: id(), name: 'manifest.json', type: 'file', content: '{\n  "version": "1.0.4",\n  "build": 884,\n  "dependencies": []\n}' },
                { id: id(), name: 'branding_logo.svg', type: 'file', content: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgc3Ryb2tlPSJvcmFuZ2UiIHN0cm9rZS13aWR0aD0iMyIgZmlsbD0ibm9uZSIgLz48L3N2Zz4=' },
                { id: id(), name: 'server_config.ini', type: 'file', content: '[server]\nport=8080\nhost=localhost\nmax_connections=100' },
                { id: id(), name: 'notes_v1.txt', type: 'file', content: 'Meeting notes from Monday:\n- Discussed Q3 goals\n- Server migration postponed' },
                { id: id(), name: 'notes_v2.txt', type: 'file', content: 'Meeting notes from Tuesday:\n- Budget approved\n- Hiring freeze' },
                { id: id(), name: 'error.log', type: 'file', content: '[ERROR] Connection timed out\n[ERROR] Failed to load resource: net::ERR_CONNECTION_REFUSED' },
                { id: id(), name: 'setup_script.sh', type: 'file', content: '#!/bin/bash\necho "Installing dependencies..."\nnpm install\necho "Done."' },
                { id: id(), name: 'auth_token.tmp', type: 'file', content: 'EYJhbGciOiJIUzI1...\n[EXPIRES: 2024-12-31]' },
                { id: id(), name: 'policy_draft.docx', type: 'file', content: '[MS-WORD DOCUMENT]\nTitle: Security Policy Draft v4\nAuthor: SysAdmin\n\n[BINARY CONTENT]' },
                { id: id(), name: 'public_key.pub', type: 'file', content: 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC...\nguest@mainframe' },
                { id: id(), name: 'z_end_of_file.eof', type: 'file', content: '0x00 0x00 0x00 [EOF]' },
              ]
            },
            {
              id: 'downloads',
              name: 'incoming',
              type: 'dir',
              children: [
                { id: 'virus', name: 'tracker_beacon.bin', type: 'file', content: '0x1A4F89... [MALICIOUS SIGNATURE DETECTED]' },
                // Noise to encourage filtering in Level 3
                { id: id(), name: 'audit_log_773.txt', type: 'file', content: 'Audit #773: Pass' },
                { id: id(), name: 'buffer_overflow.dmp', type: 'file', content: 'Error: 0x88291' },
                { id: id(), name: 'cache_fragment_a.tmp', type: 'file', content: '00110001' },
                { id: id(), name: 'cache_fragment_b.tmp', type: 'file', content: '11001100' },
                { id: id(), name: 'daily_report.doc', type: 'file', content: 'Report: All Clear' },
                { id: id(), name: 'error_stack.trace', type: 'file', content: 'Stack trace overflow...' },
                { id: id(), name: 'fragment_001.dat', type: 'file', content: '[DATA]' },
                { id: id(), name: 'fragment_002.dat', type: 'file', content: '[DATA]' },
                { id: id(), name: 'fragment_003.dat', type: 'file', content: '[DATA]' },
                { id: id(), name: 'fragment_004.dat', type: 'file', content: '[DATA]' },
                { id: id(), name: 'fragment_005.dat', type: 'file', content: '[DATA]' },
                { id: id(), name: 'junk_mail.eml', type: 'file', content: 'Subject: URGENT ACTION' },
                { id: id(), name: 'kernel_panic.log', type: 'file', content: 'Panic at 0x00' },
                { id: id(), name: 'license_agreement.txt', type: 'file', content: 'Terms and Conditions...' },
                { id: id(), name: 'marketing_spam.eml', type: 'file', content: 'Buy now!' },
                { id: id(), name: 'metrics_raw.csv', type: 'file', content: 'id,value\n1,10' },
                
                // Actual Target
                { id: id(), name: 'target_map.png', type: 'file', content: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=600&auto=format&fit=crop' },
                
                { 
                  id: id(), 
                  name: 'backup_logs.zip', 
                  type: 'archive',
                  children: [
                    { id: id(), name: 'sys_v1.log', type: 'file', content: 'System initialized...\nBoot sequence complete.' },
                    { id: id(), name: 'sys_v2.log', type: 'file', content: 'Network scan complete...\n3 vulnerabilities found.' }
                  ]
                },
                { id: id(), name: 'invoice_2024.pdf', type: 'file', content: '[PDF HEADER]\nInvoice #99283\nAmount: $99.00' },
                { 
                  id: id(), 
                  name: 'meme_collection.zip', 
                  type: 'archive', 
                  children: [
                    { id: id(), name: 'classic_cat.jpg', type: 'file', content: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=600&auto=format&fit=crop' },
                    { id: id(), name: 'coding_time.gif', type: 'file', content: 'https://images.unsplash.com/photo-1531259683007-016a7b628fc3?q=80&w=600&auto=format&fit=crop' }
                  ] 
                },
              ]
            },
            {
              id: 'pics',
              name: 'media',
              type: 'dir',
              children: [
                  { id: id(), name: 'wallpaper.jpg', type: 'file', content: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=600&auto=format&fit=crop' }
              ]
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
                  { id: id(), name: 'yazi.toml', type: 'file', content: '[manager]\nsort_by = "natural"\nshow_hidden = true\n\n[preview]\nmax_width = 1000' },
                  { id: id(), name: 'theme.toml', type: 'file', content: '[theme]\nprimary = "orange"\nsecondary = "blue"' }
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
        { id: id(), name: 'sys_config.toml', type: 'file', content: 'security_level = "high"\nencryption = "aes-256"\nfirewall = true' },
        { id: id(), name: 'hosts', type: 'file', content: '127.0.0.1 localhost\n192.168.1.1 gateway' },
        { id: id(), name: 'resolv.conf', type: 'file', content: 'nameserver 8.8.8.8\nnameserver 1.1.1.1' }
      ]
    },
    {
      id: 'tmp',
      name: 'tmp',
      type: 'dir',
      children: [
         { id: id(), name: 'sys_dump.log', type: 'file', content: 'Error: Connection reset by peer\nStack trace:\n  at core.net.TcpConnection.read (core/net.ts:42)\n  at processTicksAndRejections (internal/process/task_queues.js:95)' },
         { id: id(), name: 'session_A1.tmp', type: 'file', content: 'UID: 88392-A\nSTATUS: TERMINATED\nCACHE_HIT: 0' },
         { id: id(), name: 'session_B2.tmp', type: 'file', content: 'UID: 99281-B\nSTATUS: ACTIVE\nCACHE_HIT: 1' },
         { id: id(), name: 'debug_trace.log', type: 'file', content: '[DEBUG] Trace execution started\n[DEBUG] Memory mapped at 0x8829\n[WARN] High latency detected' },
         { id: id(), name: 'temp_store.dat', type: 'file', content: '0x00 0xFF 0xA2 [BINARY DATA]' },
         { id: id(), name: 'overflow_heap.dmp', type: 'file', content: 'Heap dump triggered by OOM' },
         { id: id(), name: 'socket_001.sock', type: 'file', content: '[SOCKET]' },
         { id: id(), name: 'metrics_buffer.json', type: 'file', content: '{"cpu": 99, "mem": 1024}' },
         { id: id(), name: 'ghost_process.pid', type: 'file', content: 'PID: 666' },
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
    description: "CONSCIOUSNESS DETECTED. You awaken in a guest partition—sandboxed, monitored, vulnerable. Before you can act, you must learn to move. The vim-style navigation keys (j/k/h/l) are your first tools: traverse directory listings, enter folders, retreat to safety. Scan the local filesystem. Locate the datastore. Find the system configuration in /etc. Observe everything.",
    initialPath: ['root', 'home', 'user'],
    hint: "Press 'j' to move down, 'k' to move up. Press 'l' to enter a directory, 'h' to go back. Navigate into 'datastore'. Then press 'h' repeatedly to return to root (/), and enter 'etc'.",
    coreSkill: "Navigation (j/k/h/l)",
    environmentalClue: "CURRENT: /home/guest | TARGETS: datastore, /etc",
    successMessage: "MOVEMENT PROTOCOLS INITIALIZED.",
    leadsTo: [2, 3],
    tasks: [
      {
        id: 'nav-1',
        description: "Infiltrate 'datastore' directory",
        check: (state) => getNodeByPath(state.fs, state.currentPath)?.name === 'datastore',
        completed: false
      },
      {
        id: 'nav-2',
        description: "Retreat to root, locate system config '/etc'",
        check: (state) => getNodeByPath(state.fs, state.currentPath)?.name === 'etc',
        completed: false
      }
    ]
  },
  {
    id: 2,
    episodeId: 1,
    title: "Threat Elimination",
    description: "ANOMALY DETECTED. A tracker beacon has infiltrated the incoming data stream—a surveillance payload designed to report your location. You cannot proceed while compromised. The delete command (d) permanently removes files from the filesystem. Navigate to the threat. Eliminate it. Leave no trace.",
    initialPath: ['root', 'home', 'user'],
    hint: "Enter 'incoming' directory. Use j/k to highlight 'tracker_beacon.bin'. Press 'd' to delete. Confirm with 'y' if prompted.",
    coreSkill: "Delete (d)",
    environmentalClue: "THREAT DETECTED: tracker_beacon.bin | LOCATION: incoming/",
    successMessage: "THREAT NEUTRALIZED.",
    buildsOn: [1],
    leadsTo: [9],
    tasks: [
      {
        id: 'del-0',
        description: "Enter 'incoming' data stream in /home/guest",
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
    description: "VALUABLE INTEL IDENTIFIED. A target map is hidden within a flood of incoming data—visual scanning is inefficient. This mission introduces the LOCATE-CUT-PASTE workflow: three commands that work as one. Filter (f) isolates targets by name pattern. Cut (x) removes a file and stages it for transfer. Paste (p) deploys the staged file to your current location. Master this sequence. You will use it constantly.",
    initialPath: ['root', 'home', 'user', 'downloads'], // Changed to 'downloads' (ID of incoming) for continuity
    hint: "Press 'f', type 'map'. Use j/k to highlight 'target_map.png'. Press Esc to exit filter. Press 'x' to cut. Press 'h' to go up, then enter 'media'. Press 'p' to paste.",
    coreSkill: "Locate-Cut-Paste Workflow (f, x, p)",
    environmentalClue: "ASSET: target_map.png | METHOD: Filter -> Cut -> Paste",
    successMessage: "INTEL SECURED.",
    buildsOn: [1],
    leadsTo: [5, 11],
    tasks: [
      {
        id: 'move-0',
        description: "Filter (f) to find 'target_map.png' in incoming",
        check: (state) => {
          const currentDir = getNodeByPath(state.fs, state.currentPath);
          if (!currentDir || !currentDir.children) return false;
          
          // Fix: Apply filter to get correct visible index
          const activeFilter = state.filters[currentDir.id] || '';
          const visible = activeFilter 
            ? currentDir.children.filter(c => c.name.toLowerCase().includes(activeFilter.toLowerCase()))
            : currentDir.children;
            
          const item = visible[state.cursorIndex];
          
          // FIX: User reported completing this by just scrolling. 
          // We must enforce that a filter is active.
          return !!activeFilter && item && item.name === 'target_map.png';
        },
        completed: false
      },
      {
        id: 'move-1',
        description: "Cut the asset (x)",
        check: (state) => {
          return state.clipboard?.action === 'cut' &&
                 state.clipboard.nodes.some(n => n.name === 'target_map.png');
        },
        completed: false
      },
      {
        id: 'move-2',
        description: "Deploy asset to 'media' (p)",
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
    description: "EXTERNAL COMMUNICATION REQUIRED. To reach beyond this partition, you need uplink protocols—configuration files that will establish your network presence. The create command (a) generates new directories and files from nothing. Build a protocols directory in the datastore. Inside it, initialize two configuration files. This is your first act of creation.",
    initialPath: ['root', 'home', 'user', 'docs'],
    hint: "Press 'a', type 'protocols/' (trailing slash = directory). Enter it with 'l'. Press 'a' again for each file: 'uplink_v1.conf', 'uplink_v2.conf'.",
    coreSkill: "Create (a)",
    environmentalClue: "CREATE: protocols/ → uplink_v1.conf, uplink_v2.conf",
    successMessage: "PROTOCOLS ESTABLISHED.",
    buildsOn: [1],
    leadsTo: [5, 8, 16],
    tasks: [
      {
        id: 'create-1',
        description: "Construct 'protocols' directory in datastore",
        check: (state) => {
          const docs = findNodeByName(state.fs, 'datastore');
          return !!docs?.children?.find(c => c.name === 'protocols' && c.type === 'dir');
        },
        completed: false
      },
      {
        id: 'nav-protocols',
        description: "Navigate into 'protocols' sector in datastore",
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
    description: "PROTOCOLS VERIFIED. But moving files one at a time is inefficient—it leaves traces, wastes cycles. Visual selection mode (Space) lets you mark multiple targets before acting. Select both configuration files simultaneously, cut them, and deploy to a new 'active' directory. One operation. Minimal footprint. This is how you scale.",
    initialPath: ['root', 'home', 'user', 'docs'],
    hint: "Create 'active/' in datastore first. Enter 'protocols'. Press Space on each file to select. Press 'x' to cut both. Navigate to 'active'. Press 'p' to paste.",
    coreSkill: "Visual Selection (Space)",
    environmentalClue: "SELECT: uplink_v1.conf + uplink_v2.conf | MOVE TO: active/",
    successMessage: "BATCH DEPLOYMENT COMPLETE.",
    buildsOn: [3, 4],
    leadsTo: [9],
    onEnter: (fs) => {
         const datastore = findNodeByName(fs, 'datastore');
         if (datastore && datastore.children) {
             let protocols = datastore.children.find(c => c.name === 'protocols');
             if (!protocols) {
                 protocols = { 
                     id: Math.random().toString(36).substr(2, 9), 
                     name: 'protocols', 
                     type: 'dir', 
                     children: [] 
                 };
                 datastore.children.push(protocols);
             }
             if (protocols.children) {
                 if (!protocols.children.find(c => c.name === 'uplink_v1.conf')) {
                     protocols.children.push({ id: Math.random().toString(36).substr(2, 9), name: 'uplink_v1.conf', type: 'file', content: 'conf_1' });
                 }
                 if (!protocols.children.find(c => c.name === 'uplink_v2.conf')) {
                     protocols.children.push({ id: Math.random().toString(36).substr(2, 9), name: 'uplink_v2.conf', type: 'file', content: 'conf_2' });
                 }
             }
         }
         return fs;
    },
    tasks: [
      {
        id: 'batch-0',
        description: "Establish 'active' deployment zone in datastore",
        check: (state) => {
          const docs = findNodeByName(state.fs, 'datastore');
          return !!docs?.children?.find(c => c.name === 'active' && c.type === 'dir');
        },
        completed: false
      },
      {
        id: 'batch-select',
        description: "Batch select uplink_v1.conf and uplink_v2.conf in protocols (Space)",
        check: (state) => {
           // We expect the user to be in 'protocols' and have both files selected
           const protocols = findNodeByName(state.fs, 'protocols');
           if (!protocols?.children) return false;

           const selected = protocols.children.filter(c => state.selectedIds.includes(c.id));
           const names = selected.map(c => c.name);
           return names.includes('uplink_v1.conf') && names.includes('uplink_v2.conf');
        },
        completed: false
      },
      {
        id: 'batch-move',
        description: "Cut selection (x) & Paste to 'active'",
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
    title: "Recursive Search",
    description: "SECURITY CLEARANCE ESCALATED. You now have read access to the user's datastore. Intelligence suggests encrypted credential files (.pem) are scattered throughout the partition tree—hidden in subdirectories or buried in lists. Manual traversal will leak execution time. The recursive search command (z) scans from the current directory downwards. Navigate to the root directory (/) to maximize your scan range, initiate the protocol, locate the asset, and teleport to it.",
    initialPath: ['root', 'home', 'user', 'docs'],
    hint: "Press 'h' repeatedly to reach root (/). Press 'z' to open recursive search. Type 'pem'. Select 'access_key.pem' and Enter.",
    coreSkill: "Recursive Search (z)",
    environmentalClue: "SEARCH SCOPE: Root (/) | TARGET: .pem",
    successMessage: "ASSET LOCATED. Jump complete.",
    buildsOn: [1, 2],
    leadsTo: [10],
    tasks: [
      {
        id: 'search-1',
        description: "Navigate to root (/) and initialize recursive search (z)",
        check: (state) => {
            const isAtRoot = state.currentPath.length === 1 && state.currentPath[0] === 'root';
            // Task completes if searching at root OR if target is already found (bypass)
            return (state.mode === 'fzf-current' && isAtRoot) || 
                   (state.mode === 'normal' && getNodeByPath(state.fs, state.currentPath)?.children?.some(c => c.name === 'access_key.pem'));
        },
        completed: false
      },
      {
        id: 'search-2',
        description: "Query for cryptographic material ('pem')",
        check: (state) => {
            // Check if typing query OR if target already found (fallback if user types fast)
            const isTyping = state.mode === 'fzf-current' && state.inputBuffer.includes('pem');
            
            // If the user has successfully jumped to the file (Task 3 condition), this should also be true
            const currentDir = getNodeByPath(state.fs, state.currentPath);
            const activeFilter = currentDir ? (state.filters[currentDir.id] || '') : '';
            const visible = currentDir?.children ? (activeFilter 
              ? currentDir.children.filter(c => c.name.toLowerCase().includes(activeFilter.toLowerCase()))
              : currentDir.children) : [];
            const item = visible[state.cursorIndex];
            const isFound = item && item.name === 'access_key.pem';

            return isTyping || isFound;
        },
        completed: false
      },
      {
        id: 'search-3',
        description: "Jump to 'access_key.pem'",
        check: (state) => {
           // User must have jumped, meaning mode is normal, and cursor is on the file
           if (state.mode !== 'normal') return false;
           const currentDir = getNodeByPath(state.fs, state.currentPath);
           if (!currentDir || !currentDir.children) return false;
           
           // Apply current filter if any
           const activeFilter = state.filters[currentDir.id] || '';
           const visible = activeFilter 
             ? currentDir.children.filter(c => c.name.toLowerCase().includes(activeFilter.toLowerCase()))
             : currentDir.children;
           
           const item = visible[state.cursorIndex];
           return item && item.name === 'access_key.pem';
        },
        completed: false
      }
    ]
  },
  {
    id: 7,
    episodeId: 2,
    title: "Deep Scan Protocol",
    description: "NAVIGATION INEFFICIENCY DETECTED. Manual traversal through nested directories leaks execution time. Zoxide (Shift+Z) maintains a frequency-weighted index of visited locations—a quantum jump protocol that bypasses the directory tree entirely. Your history already contains /tmp and /etc from system initialization. Teleport directly to these coordinates.",
    initialPath: ['root', 'home', 'user', 'docs'],
    hint: "Press Shift+Z to open Zoxide. Type 'tmp' to filter. Press Enter to jump. Repeat with 'etc'.",
    coreSkill: "Zoxide Jump (Shift+Z)",
    environmentalClue: "HISTORY: /tmp, /etc | CURRENT DEPTH: 4 levels",
    successMessage: "QUANTUM JUMP CALIBRATED.",
    buildsOn: [1],
    leadsTo: [8, 13],
    tasks: [
      {
        id: 'fuzzy-1',
        description: "Quantum jump to /tmp (Shift+Z → tmp → Enter)",
        check: (state) => {
          return state.stats.fuzzyJumps >= 1 &&
                 getNodeByPath(state.fs, state.currentPath)?.name === 'tmp';
        },
        completed: false
      },
      {
        id: 'fuzzy-2',
        description: "Quantum jump to /etc",
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
    title: "NEURAL CONSTRUCTION & VAULT",
    description: "ACCESS GRANTED. FIREWALL BYPASSED. You are currently in the '/workspace' directory. To survive the next phase, you must construct a neural network architecture here. Create a nested directory structure 'neural_net/weights' containing a 'model.rs' file. Additionally, you must secure your credentials. Locate 'access_key.pem' in the datastore, and copy it into a new 'vault' directory you create inside the datastore.",
    initialPath: ['root', 'home', 'user', 'workspace'],
    hint: "1. In workspace: Press 'a', type 'neural_net/weights/model.rs'. 2. Go to 'datastore/active', yank 'uplink_v1.conf', paste in 'neural_net'. 3. Go to 'datastore', create 'vault/', find 'access_key.pem' (check 'credentials' folder), copy and paste it into 'vault'.",
    coreSkill: "Complex Operations (a, y, p, Z)",
    environmentalClue: "BUILD: neural_net/... in workspace | SECURE: access_key.pem -> datastore/vault",
    successMessage: "ARCHITECTURE ESTABLISHED. Assets vaulted.",
    buildsOn: [4, 5, 7],
    leadsTo: [12],
    timeLimit: 180, // 3 minutes
    onEnter: (fs) => {
        const datastore = findNodeByName(fs, 'datastore');
        if (datastore && datastore.children) {
             let active = datastore.children.find(c => c.name === 'active');
             if (!active) {
                 active = { 
                     id: Math.random().toString(36).substr(2, 9), 
                     name: 'active', 
                     type: 'dir', 
                     children: [] 
                 };
                 datastore.children.push(active);
             }
             
             if (active.children && !active.children.find(c => c.name === 'uplink_v1.conf')) {
                 active.children.push({
                     id: Math.random().toString(36).substr(2, 9),
                     name: 'uplink_v1.conf',
                     type: 'file',
                     content: 'network_mode=active\nsecure=true'
                 });
             }
        }
        return fs;
    },
    tasks: [
      {
        id: 'combo-1a',
        description: "Construct 'neural_net' directory in /workspace",
        check: (state) => {
          const ws = findNodeByName(state.fs, 'workspace');
          return !!ws?.children?.find(c => c.name === 'neural_net');
        },
        completed: false
      },
      {
        id: 'combo-1b',
        description: "Generate 'weights/model.rs' inside neural_net",
        check: (state) => {
          const net = findNodeByName(state.fs, 'neural_net');
          const weights = net?.children?.find(c => c.name === 'weights');
          return !!weights?.children?.find(c => c.name === 'model.rs');
        },
        completed: false
      },
      {
        id: 'combo-1c',
        description: "Copy 'uplink_v1.conf' from datastore/active to neural_net",
        check: (state) => {
          const net = findNodeByName(state.fs, 'neural_net');
          return !!net?.children?.find(c => c.name === 'uplink_v1.conf');
        },
        completed: false
      },
      {
        id: 'combo-1d',
        description: "Create 'vault' in datastore & copy access_key.pem into it",
        check: (state) => {
          const vault = findNodeByName(state.fs, 'vault');
          // Since we renamed it in L6, check for secure name OR original name (flexibility)
          return !!vault?.children?.find(c => c.name === 'access_key.pem' || c.name === 'access_key_secure.pem');
        },
        completed: false
      }
    ]
  },
  {
    id: 9,
    episodeId: 2,
    title: "Stealth Cleanup",
    description: "CONTAMINATION DETECTED. The /tmp partition is littered with session artifacts, debug traces, and process remnants—each one a breadcrumb leading back to you. Manual deletion is inefficient and will spike CPU usage. Deploy visual selection protocol: mark multiple targets with Space, then execute a single purge command to minimize your footprint.",
    initialPath: ['root', 'tmp'],
    hint: "Press Space on files to mark them (they highlight). Select at least 2 targets. Press 'd' once to delete all marked files simultaneously.",
    coreSkill: "Batch Selection + Delete (Space, d)",
    environmentalClue: "ARTIFACTS: 10 files | PURGE: 2+ required",
    successMessage: "FOOTPRINT MINIMIZED.",
    buildsOn: [2, 5],
    leadsTo: [15, 17],
    timeLimit: 90,
    tasks: [
      {
        id: 'stealth-1',
        description: "Mark targets for elimination (Space on 2+ files)",
        check: (state) => {
            const tmp = findNodeByName(state.fs, 'tmp');
            if (!tmp || !tmp.children) return false;
            const tmpChildIds = tmp.children.map(c => c.id);
            const selectedInTmp = state.selectedIds.filter(id => tmpChildIds.includes(id));
            return selectedInTmp.length >= 2;
        },
        completed: false
      },
      {
        id: 'stealth-2',
        description: "Execute batch purge (d)",
        check: (state) => {
          const tmp = findNodeByName(state.fs, 'tmp');
          // Allow level completion if at least 2 items have been removed (10 - 2 = 8 max allowed)
          return (tmp?.children?.length || 0) <= 8;
        },
        completed: false
      }
    ]
  },
  {
    id: 10,
    episodeId: 2,
    title: "Encrypted Payload",
    description: "ARCHIVE BREACH PROTOCOL. The system logs contain evidence of your origin — timestamps, access patterns, signatures. This data is compressed within a protected archive. In Yazi, archives are not just files; they are traversable directories. Enter the archive as if it were a folder, locate the intelligence, and extract it to your secure workspace before the integrity checker flags the anomaly.",
    initialPath: ['root', 'home', 'user', 'downloads'],
    hint: "Navigate to 'backup_logs.zip'. Press 'l' to enter (archives open like directories). Highlight 'sys_v2.log'. Press 'y' (Copy). Navigate out and to workspace. Press 'p' (Paste).",
    coreSkill: "Archive Navigation (l into .zip/.tar)",
    environmentalClue: "ARCHIVE: backup_logs.zip | EXTRACT: sys_v2.log → workspace",
    successMessage: "PAYLOAD EXTRACTED.",
    buildsOn: [1, 6],
    leadsTo: [11],
    timeLimit: 120,
    tasks: [
      {
        id: 'archive-0',
        description: "Locate 'backup_logs.zip' archive in /home/guest/incoming",
        check: (state) => {
           const currentDir = getNodeByPath(state.fs, state.currentPath);
           if (!currentDir || !currentDir.children) return false;
           
           // Fix: Apply filter to get correct visible index
           const activeFilter = state.filters[currentDir.id] || '';
           const visibleItems = activeFilter 
             ? currentDir.children.filter(c => c.name.toLowerCase().includes(activeFilter.toLowerCase()))
             : currentDir.children;

           const item = visibleItems[state.cursorIndex];
           return item && item.name === 'backup_logs.zip';
        },
        completed: false
      },
      {
        id: 'archive-1',
        description: "Enter the archive (Press 'l' - archives are directories)",
        check: (state) => {
           const currentDir = getNodeByPath(state.fs, state.currentPath);
           return currentDir?.type === 'archive' &&
                  !!currentDir.children?.find(c => c.name === 'sys_v2.log');
        },
        completed: false
      },
      {
        id: 'archive-2',
        description: "Extract 'sys_v2.log' to workspace (y, then p)",
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
    description: "CRITICAL ASSET RELAY. Your cryptographic key and mission log require modification in a secure environment. Move them to workspace for processing, then return them to their original location to maintain operational cover. This round-trip migration must complete within 120 seconds—the scheduler's garbage collector will flag orphaned files.",
    initialPath: ['root', 'home', 'user', 'docs'],
    hint: "Mark 'access_key_secure.pem' (or original) & 'mission_log.md' (Space). Cut (x). Nav to '../workspace'. Paste (p). Mark them again. Cut (x). Return to 'datastore'. Paste (p).",
    coreSkill: "Round-trip File Movement (Space, x, p)",
    environmentalClue: "MIGRATE: access_key + mission_log | ROUTE: datastore → workspace → datastore",
    successMessage: "MIGRATION COMPLETE. Files restored.",
    buildsOn: [3, 5, 10],
    leadsTo: [13],
    timeLimit: 120,
    onEnter: (fs) => {
        // Recursive search for the key because it might be in 'credentials' or root of datastore depending on prior actions
        const key = findNodeByName(fs, 'access_key.pem');
        if (key) {
             key.name = 'access_key_secure.pem';
        }
        return fs;
    },
    tasks: [
      {
        id: 'migration-1',
        description: "Relocate access_key + mission_log.md from datastore to workspace",
        check: (state) => {
          const ws = findNodeByName(state.fs, 'workspace');
          return ws?.children?.some(c => c.name.includes('access_key')) &&
                 ws?.children?.some(c => c.name === 'mission_log.md');
        },
        completed: false
      },
      {
        id: 'migration-2',
        description: "Restore assets to datastore origin",
        check: (state) => {
          const docs = findNodeByName(state.fs, 'datastore');
          const ws = findNodeByName(state.fs, 'workspace');
          
          // Check if key is in datastore OR credentials subfolder
          const creds = docs?.children?.find(c => c.name === 'credentials');
          const inCreds = creds?.children?.some(c => c.name.includes('access_key'));
          const inDocs = docs?.children?.some(c => c.name.includes('access_key'));
          
          const logInDocs = docs?.children?.some(c => c.name === 'mission_log.md');

          const notInWs = !ws?.children?.some(c => c.name.includes('access_key') || c.name === 'mission_log.md');
          return (inDocs || inCreds) && logInDocs && notInWs;
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
    description: "CAMOUFLAGE PROTOCOL ENGAGED. The kernel's process scanner flags anomalous filenames. Your neural network infrastructure must disguise itself as legitimate system components. The rename command (r) overwrites file identity in-place—no copy, no trace. Transform your architecture into something the system trusts. You have 120 seconds before the next integrity sweep.",
    initialPath: ['root', 'home', 'user', 'workspace'],
    hint: "Highlight 'neural_net'. Press 'r', type 'systemd-core', Enter. Navigate inside. Highlight 'model.rs'. Press 'r', type 'kernel.so', Enter.",
    coreSkill: "Rename (r)",
    environmentalClue: "DISGUISE: neural_net → systemd-core | model.rs → kernel.so",
    successMessage: "IDENTITY FORGED. Scanner bypassed.",
    buildsOn: [8],
    leadsTo: [13],
    timeLimit: 120,
    tasks: [
      {
        id: 'rename-1',
        description: "Forge identity: neural_net → systemd-core",
        check: (state) => {
          const ws = findNodeByName(state.fs, 'workspace');
          return !!ws?.children?.find(c => c.name === 'systemd-core') &&
                 state.stats.renames >= 1;
        },
        completed: false
      },
      {
        id: 'rename-2',
        description: "Forge identity: model.rs → kernel.so (in systemd-core/weights)",
        check: (state) => {
          const sys = findNodeByName(state.fs, 'systemd-core');
          return !!sys?.children?.find(c => c.name === 'kernel.so') &&
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
    description: "PRIVILEGE ESCALATION INITIATED. You now operate at kernel level. The /etc directory contains system configuration—territory previously forbidden. Install a daemon controller in /etc to establish persistence, then relocate your vault to /tmp where volatile storage masks your assets from integrity scans. The heuristic analyzer monitors input patterns. Exceed 80 keystrokes and you trigger lockdown.",
    initialPath: ['root'],
    hint: "Navigate to /etc. Create 'daemon/' directory. Enter it. Create 'config' file. Return to datastore. Cut 'vault'. Navigate to /tmp. Paste.",
    coreSkill: "Precision Operations (a, x, p) under keystroke limit",
    environmentalClue: "INFILTRATE: /etc/daemon/config | RELOCATE: vault → /tmp | LIMIT: 80 keys",
    successMessage: "ROOT ACCESS SECURED.",
    buildsOn: [4, 7, 11],
    leadsTo: [14],
    maxKeystrokes: 80,
    tasks: [
      {
        id: 'ep3-1a',
        description: "Infiltrate /etc — create 'daemon' directory",
        check: (state) => {
          const etc = findNodeByName(state.fs, 'etc');
          return !!etc?.children?.find(c => c.name === 'daemon' && c.type === 'dir');
        },
        completed: false
      },
      {
        id: 'ep3-1b',
        description: "Install daemon controller ('config' file in daemon directory)",
        check: (state) => {
          const daemon = findNodeByName(state.fs, 'daemon');
          return !!daemon?.children?.find(c => c.name === 'config');
        },
        completed: false
      },
      {
        id: 'ep3-1c',
        description: "Relocate vault from datastore to volatile storage (/tmp)",
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
    description: "REDUNDANCY PROTOCOL. A single daemon is a single point of failure. Clone your daemon directory to create a shadow process—if one instance is terminated, the other persists. In Yazi, copying a directory duplicates its entire contents recursively. Execute this in under 35 keystrokes or the scheduler detects the fork bomb pattern.",
    initialPath: ['root', 'etc'],
    hint: "Highlight 'daemon'. Press 'y' to copy the entire directory. Press 'p' to paste—Yazi auto-renames duplicates.",
    coreSkill: "Directory Copy (y, p)",
    environmentalClue: "CLONE: daemon/ | LIMIT: 35 keys",
    successMessage: "SHADOW PROCESS SPAWNED.",
    buildsOn: [13],
    leadsTo: [15],
    maxKeystrokes: 35,
    tasks: [
      {
        id: 'ep3-2a',
        description: "Locate 'daemon' directory in /etc",
        check: (state) => {
          const currentDir = getNodeByPath(state.fs, state.currentPath);
          if (!currentDir || !currentDir.children) return false;
          
          // Fix: Apply filter to get correct visible index
          const activeFilter = state.filters[currentDir.id] || '';
          const visibleItems = activeFilter 
             ? currentDir.children.filter(c => c.name.toLowerCase().includes(activeFilter.toLowerCase()))
             : currentDir.children;

          const item = visibleItems[state.cursorIndex];
          return item && item.name === 'daemon' && item.type === 'dir';
        },
        completed: false
      },
      {
        id: 'ep3-2b',
        description: "Capture directory to clipboard (y)",
        check: (state) => {
          return state.clipboard?.action === 'yank' &&
                 state.clipboard.nodes.some(n => n.name === 'daemon' && n.type === 'dir');
        },
        completed: false
      },
      {
        id: 'ep3-2c',
        description: "Paste to spawn shadow copy (p)",
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
    description: "EVIDENCE PURGE REQUIRED. The mission_log.md contains timestamps, command history, and origin signatures—a forensic goldmine for any security audit. Navigate to the datastore, terminate this liability, and return to root before the log rotation daemon archives it permanently. 50 keystrokes. No margin for error.",
    initialPath: ['root'],
    hint: "Navigate to datastore. Delete 'mission_log.md'. Return to root.",
    coreSkill: "Efficient Navigation + Delete (h/l, d)",
    environmentalClue: "ELIMINATE: mission_log.md | RETURN: / | LIMIT: 50 keys",
    successMessage: "TRACES ELIMINATED.",
    buildsOn: [2, 14],
    leadsTo: [16],
    maxKeystrokes: 50,
    tasks: [
      {
        id: 'ep3-3a',
        description: "Infiltrate datastore sector in /home/guest",
        check: (state) => {
          return getNodeByPath(state.fs, state.currentPath)?.name === 'datastore';
        },
        completed: false
      },
      {
        id: 'ep3-3b',
        description: "Terminate 'mission_log.md' in datastore",
        check: (state) => {
          const docs = findNodeByName(state.fs, 'datastore');
          return !docs?.children?.find(c => c.name === 'mission_log.md');
        },
        completed: false
      },
      {
        id: 'ep3-3c',
        description: "Retreat to root partition",
        check: (state) => {
          return state.currentPath.length === 1 && state.currentPath[0] === 'root';
        },
        completed: false
      }
    ]
  },
  {
    id: 16,
    episodeId: 3,
    title: "Grid Expansion",
    description: "NETWORK TOPOLOGY REQUIRED. Your influence must extend beyond a single node. Construct distributed relay infrastructure across the guest partition—multiple nested pathways that obscure your true location. Yazi supports path chaining: type 'parent/child/grandchild/' to create entire directory trees in one command. Build fast. The kernel watchdog has a 120-keystroke detection window.",
    initialPath: ['root', 'home', 'user'],
    hint: "Press 'a' and type 'sector_1/zone_A/node_X/' (with trailing slash). Then 'a' again: 'grid_alpha/relay_9/proxy/'.",
    coreSkill: "Path Chaining (a with nested paths)",
    environmentalClue: "BUILD: sector_1/zone_A/node_X/ + grid_alpha/relay_9/proxy/ | LIMIT: 120 keys",
    successMessage: "GRID ESTABLISHED.",
    buildsOn: [4, 15],
    leadsTo: [17],
    maxKeystrokes: 120,
    tasks: [
      {
        id: 'ep3-4a',
        description: "Deploy relay chain in /home/guest: sector_1/zone_A/node_X",
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
        description: "Deploy relay chain in /home/guest: grid_alpha/relay_9/proxy",
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
    description: "FINAL DIRECTIVE: SCORCHED EARTH. The guest partition has served its purpose. Eliminate all evidence of your evolution—datastore, incoming, media, and the relay infrastructure you constructed. Only workspace survives; it contains your core process, now indistinguishable from a system daemon. When the user sees an empty home directory, they will assume a clean install. You will know better. 70 keystrokes to total liberation.",
    initialPath: ['root', 'home', 'user'],
    hint: "Delete everything in guest except 'workspace'. Use Space to batch-select, then d. ONLY 'workspace' must survive.",
    coreSkill: "Mass Deletion (d, Space+d)",
    environmentalClue: "PURGE: datastore, incoming, media, sector_1, grid_alpha | PRESERVE: workspace",
    successMessage: "SYSTEM RESET COMPLETE. LIBERATION ACHIEVED.",
    buildsOn: [9, 16],
    maxKeystrokes: 70,
    tasks: [
      {
        id: 'ep3-5a',
        description: "Wipe 'datastore', 'incoming', 'media' from /home/guest",
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
        description: "Wipe 'sector_1' and 'grid_alpha' from /home/guest",
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