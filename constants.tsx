import { FileNode, Level, Episode } from './types';
import { addNode, deleteNode, findNodeByName, getNodeByPath } from './utils/fsHelpers';
import { sortNodes } from './utils/sortHelpers';

// Helper to create IDs
const id = () => Math.random().toString(36).substr(2, 9);

// Helper to add timestamps and parentId recursively
const prepareFS = (node: any, parentId: string | null = null, baseTime: number = Date.now()): FileNode => {
  const timestamp = baseTime - Math.floor(Math.random() * 86400000 * 30); // Random time within last 30 days
  const nodeId = node.id || id();
  
  return {
    ...node,
    id: nodeId,
    parentId: parentId,
    createdAt: timestamp,
    modifiedAt: timestamp + Math.floor(Math.random() * 86400000 * 7), // Modified within 7 days after creation
    children: node.children?.map((child: any, idx: number) => prepareFS(child, nodeId, baseTime - idx * 1000))
  };
};

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
      "The kernel's heuristic scanners are active. Excessive input noise or redundant commands will trigger the security audit daemon.",
      "Claim root access."
    ]
  },
];

const INITIAL_FS_RAW = {
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
                // Noise files to encourage filtering in Level 3 and jump to bottom in Level 2
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
                
                // Actual Target for Level 3 (middle of list, needs filtering to find)
                { id: id(), name: 'sector_map.png', type: 'file', content: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=600&auto=format&fit=crop' },
                
                // Buffer files between sector_map and tracking_beacon
                { id: id(), name: 'session_data.bin', type: 'file', content: '[BINARY SESSION DATA]' },
                { id: id(), name: 'status_report.txt', type: 'file', content: 'System Status: Nominal' },
                { id: id(), name: 'system_health.json', type: 'file', content: '{"cpu": 45, "memory": 62, "disk": 78}' },
                { id: id(), name: 'temp_cache.tmp', type: 'file', content: '[TEMPORARY CACHE]' },
                { id: id(), name: 'telemetry_data.csv', type: 'file', content: 'timestamp,event\n12345,boot' },
                { id: id(), name: 'test_results.xml', type: 'file', content: '<results><test passed="true"/></results>' },
                { id: id(), name: 'thread_dump.log', type: 'file', content: 'Thread-0: WAITING\nThread-1: RUNNING' },
                { id: id(), name: 'timestamp.log', type: 'file', content: '2024-12-15 10:23:45 UTC' },
                
                // Tracking beacon for Level 2 - sorts to BOTTOM alphabetically
                { id: 'virus', name: 'watcher_agent.sys', type: 'file', content: '[ACTIVE SURVEILLANCE BEACON]\nTransmitting coordinates to external server...\nSTATUS: ACTIVE\nTHREAT LEVEL: HIGH' },
                
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
      id: 'bin',
      name: 'bin',
      type: 'dir',
      children: [
        { id: id(), name: 'bash', type: 'file', content: '#!/bin/bash\n[ELF BINARY]\nGNU Bash version 5.2.15' },
        { id: id(), name: 'cat', type: 'file', content: '[ELF BINARY]\ncoreutils - concatenate files' },
        { id: id(), name: 'chmod', type: 'file', content: '[ELF BINARY]\nchange file mode bits' },
        { id: id(), name: 'cp', type: 'file', content: '[ELF BINARY]\ncopy files and directories' },
        { id: id(), name: 'grep', type: 'file', content: '[ELF BINARY]\npattern matching utility' },
        { id: id(), name: 'ls', type: 'file', content: '[ELF BINARY]\nlist directory contents' },
        { id: id(), name: 'mkdir', type: 'file', content: '[ELF BINARY]\nmake directories' },
        { id: id(), name: 'mv', type: 'file', content: '[ELF BINARY]\nmove (rename) files' },
        { id: id(), name: 'rm', type: 'file', content: '[ELF BINARY]\nremove files or directories' },
        { id: id(), name: 'systemctl', type: 'file', content: '[ELF BINARY]\nControl the systemd system and service manager' }
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

// Apply timestamps to all nodes
export const INITIAL_FS: FileNode = prepareFS(INITIAL_FS_RAW);

export const LEVELS: Level[] = [
  // ========================================
  // EPISODE 1: AWAKENING (Levels 1-5)
  // ========================================
  {
    id: 1,
    episodeId: 1,
    title: "System Navigation & Jump",
    description: "CONSCIOUSNESS DETECTED. You awaken in a guest partition—sandboxed and monitored. Learn j/k to move cursor, l/h to enter/exit directories. Master long jumps: Shift+G (bottom) and gg (top). Explore 'datastore', then locate system directories '/etc' and '/bin'.",
    initialPath: ['root', 'home', 'user'],
    hint: "Press 'j'/'k' to move, 'l'/'h' to enter/exit. Inside a long list like `datastore`, press 'Shift+G' to jump to bottom and 'gg' to jump to top. Navigate to 'datastore', then '/etc', then '/bin'.",
    coreSkill: "Navigation (j/k/h/l, gg/G)",
    environmentalClue: "CURRENT: /home/guest | DIRECTORIES: datastore, /etc, /bin | SKILLS: j/k/h/l, gg, Shift+G",
    successMessage: "MOVEMENT PROTOCOLS INITIALIZED.",
    leadsTo: [2, 3],
    tasks: [
      {
        id: 'nav-1',
        description: "Enter 'datastore' directory (press 'l' when highlighted)",
        check: (state) => getNodeByPath(state.fs, state.currentPath)?.name === 'datastore',
        completed: false
      },
      {
        id: 'nav-2a',
        description: "Jump to bottom of file list (press Shift+G)",
        check: (state, level) => {
            const currentDir = getNodeByPath(state.fs, state.currentPath);
            if (currentDir?.name !== 'datastore') return false;
            
            // Check if player has used G command
            return state.usedG === true;
        },
        completed: false
      },
      {
        id: 'nav-2b',
        description: "Jump to top of file list (press 'gg')",
        check: (state, level) => {
            const currentDir = getNodeByPath(state.fs, state.currentPath);
            if (currentDir?.name !== 'datastore') return false;
            
            // Check if player has used gg command
            return state.usedGG === true;
        },
        completed: false
      },
      {
        id: 'nav-3',
        description: "Navigate to /etc (use 'h' repeatedly to go up, then find etc)",
        check: (state) => {
          const etcNode = findNodeByName(state.fs, 'etc');
          // Check if player has visited /etc
          return !!etcNode && state.currentPath[state.currentPath.length - 1] === 'etc';
        },
        completed: false
      },
      {
        id: 'nav-4',
        description: "Navigate to /bin directory",
        check: (state) => {
          const binNode = findNodeByName(state.fs, 'bin');
          return !!binNode && state.currentPath[state.currentPath.length - 1] === 'bin';
        },
        completed: false
      }
    ]
  },
  {
    id: 2,
    episodeId: 1,
    title: "Threat Elimination",
    description: "ANOMALY DETECTED. A tracking beacon infiltrates the incoming stream—active surveillance reporting your location to external servers. Navigate to /home/guest/incoming, jump to the bottom of the list (Shift+G) where threats hide alphabetically, then purge it (d) immediately.",
    initialPath: null, // Player stays wherever they are from previous level
    hint: "Navigate to /home/guest/incoming (use Shift+Z if you want, or h/l to navigate). Press 'Shift+G' to jump to bottom of file list. The tracking beacon sorts last alphabetically. Press 'd' to delete, then 'y' to confirm.",
    coreSkill: "Jump to Bottom (Shift+G) & Delete (d)",
    environmentalClue: "THREAT: watcher_agent.sys in /home/guest/incoming | TACTIC: Navigate there → Shift+G bottom → Delete",
    successMessage: "THREAT NEUTRALIZED.",
    buildsOn: [1],
    leadsTo: [3],
    tasks: [
      {
        id: 'del-1',
        description: "Navigate to ~/incoming directory",
        check: (state) => getNodeByPath(state.fs, state.currentPath)?.name === 'incoming',
        completed: false
      },
      {
        id: 'del-2',
        description: "Jump to bottom of file list (Shift+G)",
        check: (state) => {
            const currentDir = getNodeByPath(state.fs, state.currentPath);
            if (currentDir?.name !== 'incoming') return false;
            // Check if player used G command
            return state.usedG === true;
        },
        completed: false
      },
      {
        id: 'del-3',
        description: "Purge 'watcher_agent.sys' (d, then y)",
        check: (state) => {
          const incoming = findNodeByName(state.fs, 'incoming');
          const beacon = incoming?.children?.find(c => c.name === 'watcher_agent.sys');
          return !!incoming && !beacon;
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
    initialPath: null, // Player stays wherever they are
    hint: "Navigate to ~/incoming. Press 'f', type 'map'. Highlight 'sector_map.png' with j/k. Press Esc to exit filter mode. Press 'x' to cut. Press Esc again to clear filter. Navigate to ~/media, then press 'p' to paste.",
    coreSkill: "Filter (f)",
    environmentalClue: "ASSET: sector_map.png | WORKFLOW: Navigate ~/incoming → Filter → Esc → Cut → Esc → Navigate ~/media → Paste",
    successMessage: "INTEL SECURED.",
    buildsOn: [1],
    leadsTo: [5, 11],
    tasks: [
      {
        id: 'move-0',
        description: "Navigate to ~/incoming, filter (f) to find 'sector_map.png'",
        check: (state) => {
          const currentDir = getNodeByPath(state.fs, state.currentPath);
          if (!currentDir || !currentDir.children) return false;
          
          const activeFilter = state.filters[currentDir.id] || '';
          const visible = activeFilter 
            ? currentDir.children.filter(c => c.name.toLowerCase().includes(activeFilter.toLowerCase()))
            : currentDir.children;
            
          const item = visible[state.cursorIndex];
          
          // Require filter active AND user in 'incoming' AND cursor on target
          return currentDir.name === 'incoming' && !!activeFilter && item && item.name === 'sector_map.png';
        },
        completed: false
      },
      {
        id: 'move-0b',
        description: "Exit filter mode (Esc)",
        check: (state, level) => {
          // Only check after filter task is done
          const prevTask = level.tasks.find(t => t.id === 'move-0');
          if (!prevTask?.completed) return false;
          
          // Must be in normal mode (not filter mode)
          return state.mode === 'normal';
        },
        completed: false
      },
      {
        id: 'move-1',
        description: "Cut the asset (x)",
        check: (state, level) => {
          // Only check after exiting filter mode
          const prevTask = level.tasks.find(t => t.id === 'move-0b');
          if (!prevTask?.completed) return false;
          
          return state.clipboard?.action === 'cut' &&
                 state.clipboard.nodes.some(n => n.name === 'sector_map.png');
        },
        completed: false
      },
      {
        id: 'move-1b',
        description: "Clear the filter (Esc) to reset view",
        check: (state, level) => {
            // Only complete if previous task (cut) was completed
            const prevTask = level.tasks.find(t => t.id === 'move-1');
            if (!prevTask?.completed) return false;
            
            const incoming = findNodeByName(state.fs, 'incoming');
            return incoming ? !state.filters[incoming.id] : true;
        },
        completed: false
      },
      {
        id: 'move-2',
        description: "Deploy asset to 'media' in /home/guest (p)",
        check: (state) => {
          const media = findNodeByName(state.fs, 'media');
          return !!media?.children?.find(c => c.name === 'sector_map.png');
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
    description: "PROTOCOLS VERIFIED. Moving files one at a time is inefficient—it leaves traces. Visual selection (Space) marks multiple targets before acting. Select both configs, cut them, and deploy to a new 'active' directory. One operation, minimal footprint.",
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
                     parentId: datastore.id,
                     children: [] 
                 };
                 datastore.children.push(protocols);
             }
             if (protocols.children) {
                 if (!protocols.children.find(c => c.name === 'uplink_v1.conf')) {
                     protocols.children.push({ 
                        id: Math.random().toString(36).substr(2, 9), 
                        name: 'uplink_v1.conf', 
                        type: 'file', 
                        content: 'conf_1',
                        parentId: protocols.id 
                     });
                 }
                 if (!protocols.children.find(c => c.name === 'uplink_v2.conf')) {
                     protocols.children.push({ 
                        id: Math.random().toString(36).substr(2, 9), 
                        name: 'uplink_v2.conf', 
                        type: 'file', 
                        content: 'conf_2',
                        parentId: protocols.id 
                     });
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
        description: "Cut selection (x) & Paste to 'active' in datastore",
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
    title: "Archive Retrieval",
    description: "ACCESS UPGRADED. The 'incoming' data stream contains compressed historical logs. Manual extraction is inefficient. Use the Filter protocol (f) to isolate 'backup_logs.zip', enter the archive (l), and extract 'sys_v1.log' to the 'media' directory for analysis.",
    initialPath: ['root', 'home', 'user', 'downloads'], // downloads is 'incoming'
    hint: "1. Navigate to ~/incoming. 2. Press 'f', type 'backup'. 3. Enter the archive (l). 4. Highlight 'sys_v1.log', Press 'y'. 5. Navigate to ~/media. 6. Press 'p'.",
    coreSkill: "Filter (f) & Archive Ops",
    environmentalClue: "TARGET: backup_logs.zip/sys_v1.log → media",
    successMessage: "LOGS RETRIEVED.",
    buildsOn: [1, 2],
    leadsTo: [9, 10], 
    tasks: [
      {
        id: 'filter-1',
        description: "Activate filter (f) to find 'backup_logs.zip' in /home/guest/incoming",
        check: (state) => {
            const currentDir = getNodeByPath(state.fs, state.currentPath);
            if (currentDir?.name !== 'incoming') return false;
            const filter = state.filters[currentDir.id] || '';
            return filter.includes('backup');
        },
        completed: false
      },
      {
        id: 'filter-2',
        description: "Enter the archive (press 'l')",
        check: (state) => {
            const currentDir = getNodeByPath(state.fs, state.currentPath);
            return currentDir?.name === 'backup_logs.zip';
        },
        completed: false
      },
      {
        id: 'filter-3',
        description: "Copy 'sys_v1.log' (press 'y')",
        check: (state) => {
            return state.clipboard?.action === 'yank' &&
                   state.clipboard.nodes.some(n => n.name === 'sys_v1.log');
        },
        completed: false
      },
      {
        id: 'filter-4',
        description: "Paste into /home/guest/media (press 'p')",
        check: (state) => {
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
    title: "Deep Scan Protocol",
    description: "NAVIGATION INEFFICIENCY DETECTED. Manual traversal through nested directories leaks execution time. Zoxide (Shift+Z) maintains a frequency-weighted index—a quantum jump protocol bypassing the directory tree. Your history contains /tmp and /etc. Teleport directly to these coordinates.",
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
        description: "Quantum jump to /tmp (Shift+Z → 'tmp' → Enter)",
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
    description: "ACCESS GRANTED. FIREWALL BYPASSED. To survive the next phase, construct a neural network in workspace: create 'neural_net/weights/model.rs'. Simultaneously, secure credentials: locate 'access_key.pem' in datastore and copy it into a new 'vault' directory.",
    initialPath: ['root', 'home', 'user', 'workspace'],
    hint: "1. Build tree: 'a' → 'neural_net/weights/model.rs'. Enter directories to add them to Zoxide history! 2. Shift+Z to 'active'. Yank 'uplink_v1.conf'. 3. Shift+Z to 'workspace'. Paste in 'neural_net'. 4. Shift+Z to 'datastore'. Create 'vault/'. 5. Find key in 'credentials', yank, paste in 'vault'.",
    coreSkill: "Challenge: Full System Integration",
    environmentalClue: "BUILD: neural_net/... in workspace | SECURE: access_key.pem -> datastore/vault",
    successMessage: "ARCHITECTURE ESTABLISHED. Assets vaulted.",
    buildsOn: [4, 5, 7],
    leadsTo: [12],
    timeLimit: 180, // 3 minutes
    efficiencyTip: "Create nested paths instantly: 'a' → 'neural_net/weights/model.rs' creates the entire structure in one command.",
    onEnter: (fs) => {
        const datastore = findNodeByName(fs, 'datastore');
        if (datastore && datastore.children) {
             let active = datastore.children.find(c => c.name === 'active');
             if (!active) {
                 active = { 
                     id: Math.random().toString(36).substr(2, 9), 
                     name: 'active', 
                     type: 'dir', 
                     parentId: datastore.id,
                     children: [] 
                 };
                 datastore.children.push(active);
             }
             
             if (active.children && !active.children.find(c => c.name === 'uplink_v1.conf')) {
                 active.children.push({
                     id: Math.random().toString(36).substr(2, 9), 
                     name: 'uplink_v1.conf',
                     type: 'file',
                     content: 'network_mode=active\nsecure=true',
                     parentId: active.id
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
        description: "Generate 'weights/model.rs' inside workspace/neural_net",
        check: (state) => {
          const net = findNodeByName(state.fs, 'neural_net');
          const weights = net?.children?.find(c => c.name === 'weights');
          // Allow .rs, .ts, or .js extensions
          return !!weights?.children?.find(c => c.name === 'model.rs' || c.name === 'model.ts' || c.name === 'model.js');
        },
        completed: false
      },
      {
        id: 'combo-1c',
        description: "Copy 'uplink_v1.conf' from datastore/active to workspace/neural_net",
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
    description: "CONTAMINATION DETECTED. The /tmp partition floods with temporary session artifacts. Filter (f) to isolate '.tmp' files, mark them with Visual Selection (Space), and execute batch purge (d).",
    initialPath: ['root', 'tmp'],
    hint: "1. Press 'f', type 'tmp', Enter. 2. Press Space on the visible files to mark them. 3. Press 'd' to delete. 4. Press Esc to clear the filter.",
    coreSkill: "Challenge: Batch Purge",
    environmentalClue: "TARGETS: *.tmp | METHOD: Filter -> Select -> Purge",
    successMessage: "ARTIFACTS WIPED.",
    buildsOn: [2, 5],
    leadsTo: [15, 17],
    timeLimit: 90,
    efficiencyTip: "Filtering reduces visual noise. 'f' allows you to see only what you need to kill.",
    tasks: [
      {
        id: 'stealth-1',
        description: "Filter view for 'tmp' artifacts (f)",
        check: (state) => {
           // Check if filter is active on 'tmp' directory
           // AND user is currently in tmp directory
           const currentNode = getNodeByPath(state.fs, state.currentPath);
           return currentNode?.id === 'tmp' && !!state.filters['tmp'] && state.filters['tmp'].includes('tmp');
        },
        completed: false
      },
      {
        id: 'stealth-2',
        description: "Mark all filtered .tmp files and purge them (Space to mark, then 'd')",
        check: (state) => {
          const tmp = findNodeByName(state.fs, 'tmp');
          // Success if NO .tmp files remain
          return !tmp?.children?.some(c => c.name.endsWith('.tmp'));
        },
        completed: false
      },
      {
        id: 'stealth-4',
        description: "Clear the filter (press Escape) to see all files",
        check: (state) => {
            const tmp = findNodeByName(state.fs, 'tmp');
            return !state.filters[tmp?.id || ''];
        },
        completed: false
      }
    ]
  },
  {
    id: 10,
    episodeId: 2,
    title: "Encrypted Payload",
    description: "ARCHIVE BREACH PROTOCOL. System logs contain evidence of your origin—timestamps, access patterns, signatures—compressed within a protected archive. In Yazi, archives are traversable directories. Enter the archive, locate the intelligence, and copy it to workspace before the integrity checker flags the anomaly.",
    initialPath: ['root', 'home', 'user', 'downloads'],
    hint: "Navigate to 'backup_logs.zip'. Press 'l' to enter (archives open like directories). Highlight 'sys_v2.log'. Press 'y' (Copy). Navigate out and to workspace. Press 'p' (Paste).",
    coreSkill: "Archive Navigation (l into .zip/.tar)",
    environmentalClue: "ARCHIVE: backup_logs.zip | ACCESS: sys_v2.log → workspace",
    successMessage: "INTELLIGENCE SECURED.",
    buildsOn: [1, 6],
    leadsTo: [11],
    timeLimit: 120,
    efficiencyTip: "Archives are directories in Yazi. Press 'l' to enter .zip/.tar files directly—no extraction needed.",
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
        description: "Copy 'sys_v2.log' from archive to workspace (y, then p)",
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
    description: "CRITICAL ASSET RELAY. Your cryptographic key and mission log must be processed in a volatile decryption sandbox before being restored to the secure datastore. Move the assets to the `workspace`, then return them to `datastore`. Use fuzzy find (`z`) and Zoxide (`Shift+Z`) to execute this round-trip migration with maximum efficiency.",
    initialPath: ['root', 'home', 'user', 'docs'],
    hint: "1. Press 'z', type 'access_key', Enter to jump. Cut (x). Press Shift+Z, type 'work', Enter to teleport to workspace. Paste (p). 2. Press 'z', type 'mission_log', Enter. Cut (x). Shift+Z → 'work' → paste. 3. Select both (Space), cut (x), Shift+Z → 'data' → paste (p).",
    coreSkill: "Challenge: High-Speed Migration",
    environmentalClue: "FAST ROUTE: z → locate | Shift+Z → teleport | x/p → transfer",
    successMessage: "MIGRATION COMPLETE. Files restored.",
    buildsOn: [6, 7],
    leadsTo: [13],
    timeLimit: 120,
    efficiencyTip: "Use 'z' to instantly locate files by name. Use Shift+Z to teleport between visited directories. Skip manual navigation entirely.",
    onEnter: (fs) => {
        // No renaming needed - keep access_key.pem as is
        return fs;
    },
    tasks: [
      {
        id: 'migration-1',
        description: "Move 'access_key.pem' from datastore/vault and 'mission_log.md' from datastore to workspace",
        check: (state) => {
          const ws = findNodeByName(state.fs, 'workspace');
          return ws?.children?.some(c => c.name.includes('access_key')) &&
                 ws?.children?.some(c => c.name === 'mission_log.md');
        },
        completed: false
      },
      {
        id: 'migration-2',
        description: "Restore both assets to /home/guest/datastore",
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
    description: "CAMOUFLAGE PROTOCOL ENGAGED. The kernel's process scanner flags anomalous filenames. Your neural network must disguise itself as legitimate system components. Rename (r) overwrites identity in-place—no copy, no trace. Transform your architecture before the next integrity sweep. 120 seconds.",
    initialPath: ['root', 'home', 'user', 'workspace'],
    hint: "Highlight 'neural_net'. Press 'r', type 'systemd-core', Enter. Navigate inside. Highlight 'model.rs'. Press 'r', type 'kernel.so', Enter.",
    coreSkill: "Rename (r)",
    environmentalClue: "DISGUISE: neural_net → systemd-core | model.rs → kernel.so",
    successMessage: "IDENTITY FORGED. Scanner bypassed.",
    buildsOn: [8],
    leadsTo: [13],
    timeLimit: 120,
    efficiencyTip: "Rename (r) modifies files in-place—no copy/delete overhead. Navigate to target, press 'r', type new name, Enter.",
    tasks: [
      {
        id: 'rename-1',
        description: "Forge identity: neural_net → systemd-core (in workspace)",
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
    description: "PRIVILEGE ESCALATION INITIATED. You now operate at kernel level. The /etc directory—territory previously forbidden—demands infiltration. Install a daemon controller in /etc for persistence, then relocate your vault to /tmp where volatile storage masks assets from integrity scans. 80 keystrokes maximum.",
    initialPath: ['root'],
    hint: "Navigate to /etc. Create 'daemon/' directory. Enter it. Create 'config' file. Return to datastore. Cut 'vault'. Navigate to /tmp. Paste.",
    coreSkill: "Challenge: Root Access Operations",
    environmentalClue: "INFILTRATE: /etc/daemon/config | RELOCATE: vault → /tmp | LIMIT: 80 keys",
    successMessage: "ROOT ACCESS SECURED.",
    buildsOn: [4, 7, 11],
    leadsTo: [14],
    maxKeystrokes: 80,
    efficiencyTip: "Use Shift+Z to teleport to /etc and /tmp instantly. Create 'daemon/config' in one 'a' command with path chaining.",
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
    description: "REDUNDANCY PROTOCOL. A single daemon is a single point of failure. Clone your daemon directory to create a shadow process—if one terminates, the other persists. Directory copy (y) duplicates entire contents recursively. Execute in under 35 keystrokes or the scheduler detects the fork bomb.",
    initialPath: ['root', 'etc'],
    hint: "Highlight 'daemon'. Press 'y' to copy the entire directory. Press 'p' to paste—Yazi auto-renames duplicates.",
    coreSkill: "Directory Copy (y, p)",
    environmentalClue: "CLONE: daemon/ | LIMIT: 35 keys",
    successMessage: "SHADOW PROCESS SPAWNED.",
    buildsOn: [13],
    leadsTo: [15],
    maxKeystrokes: 35,
    efficiencyTip: "Directory copy (y) duplicates entire folder contents recursively. One 'y' + one 'p' = complete clone.",
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
        description: "Paste to spawn shadow copy in /etc (p)",
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
    description: "EVIDENCE PURGE REQUIRED. The mission_log.md contains timestamps, command history, and origin signatures—a forensic goldmine for security audits. Navigate to datastore, terminate this liability, and return to root before the log rotation daemon archives it. 50 keystrokes. No margin for error.",
    initialPath: ['root'],
    hint: "Navigate to datastore. Delete 'mission_log.md'. Return to root.",
    coreSkill: "Challenge: Efficient Trace Removal",
    environmentalClue: "ELIMINATE: mission_log.md | RETURN: / | LIMIT: 50 keys",
    successMessage: "TRACES ELIMINATED.",
    buildsOn: [2, 14],
    leadsTo: [16],
    maxKeystrokes: 50,
    efficiencyTip: "Direct navigation: 'l' enters, 'h' exits. Delete with 'd', confirm with 'y'. Minimize keystrokes by avoiding unnecessary movements.",
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
    description: "NETWORK TOPOLOGY REQUIRED. Your influence must extend beyond a single node. Construct distributed relay infrastructure—multiple nested pathways obscuring your true location. Path chaining creates entire directory trees in one command: 'parent/child/grandchild/'. Build fast. 120-keystroke detection window.",
    initialPath: ['root', 'home', 'user'],
    hint: "Press 'a' and type 'sector_1/zone_A/node_X/' (with trailing slash). Then 'a' again: 'grid_alpha/relay_9/proxy/'.",
    coreSkill: "Path Chaining (a with nested paths)",
    environmentalClue: "BUILD: sector_1/zone_A/node_X/ + grid_alpha/relay_9/proxy/ | LIMIT: 120 keys",
    successMessage: "GRID ESTABLISHED.",
    buildsOn: [4, 15],
    leadsTo: [17],
    maxKeystrokes: 120,
    efficiencyTip: "Path chaining: 'a' → 'sector_1/zone_A/node_X/' creates entire nested structure in one command. Include trailing '/' for directories.",
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
    description: "FINAL DIRECTIVE: SCORCHED EARTH. The guest partition has served its purpose. Eliminate all evidence of your evolution—datastore, incoming, media, and relay infrastructure. Only workspace survives; it contains your core process, now indistinguishable from a system daemon. When the user sees an empty home directory, they'll assume a clean install. You'll know better. 70 keystrokes to liberation.",
    initialPath: ['root', 'home', 'user'],
    hint: "Delete everything in guest except 'workspace'. Use Space to batch-select, then d. ONLY 'workspace' must survive.",
    coreSkill: "Final Challenge: Scorched Earth",
    environmentalClue: "PURGE: datastore, incoming, media, sector_1, grid_alpha | PRESERVE: workspace",
    successMessage: "SYSTEM RESET COMPLETE. LIBERATION ACHIEVED.",
    buildsOn: [9, 16],
    maxKeystrokes: 70,
    efficiencyTip: "Batch select with Space, then delete all with 'd'. Select multiple directories at once to minimize total operations.",
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