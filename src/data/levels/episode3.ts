import { Level, GameState } from '../../types';
import { getVisibleItems } from '../../utils/viewHelpers';
import { getNodeById, findNodeByName } from '../../utils/fsHelpers';
import { ensurePrerequisiteState } from '../../utils/levelStateHelpers';
import { UPLINK_V1_CONTENT, UPLINK_V2_CONTENT } from '../lore';
import { FileNode } from '../../types';

export const EPISODE_3_LEVELS: Level[] = [
  {
    id: 11,
    episodeId: 3,
    title: 'DAEMON RECONNAISSANCE',
    description:
      "Locate legacy daemons. Avoid the honeypots. Yen Kin's forensic audit is sweeping for 7733 echoes. Mask yourself behind the oldest handles.",
    initialPath: [
      'root',
      'home',
      'guest',
      'workspace',
      'systemd-core',
      'workspace-systemd-core-credentials',
    ],
    hint: 'Search root for `.service` (s). Audit time (,m).',
    coreSkill: 'Skill Synthesis (Recursive Search + Forensic Metadata + Clipboard)',
    environmentalClue:
      'SCAN: Toggle Hidden (.) + Recursive Search | IDENTIFY: Legacy (> 30d) | CONSOLIDATE: ~/workspace/systemd-core',
    successMessage:
      "PROTOCOLS HIJACKED. You are blending into the system background noise. Sebastian Iqbal's Instruction Guard v2.0 is blind to your movements... for now. Establish your stronghold.",
    buildsOn: [3, 5, 7, 9, 10],
    leadsTo: [12],
    maxKeystrokes: 60,
    timeLimit: 120,
    efficiencyTip:
      'Use recursive search from root to find all service files at once, then navigate through search results while inspecting metadata.',
    onEnter: (fs: FileNode) => {
      // Simplify: fs is the root node in our architecture
      const root = fs.id === 'root' ? fs : getNodeById(fs, 'root');
      if (!root) return fs; // Safety exit
      const BASE_TIME = 1433059200000;
      const day = 86400000;

      // EPISODE III STORYTELLING: IG Active
      const logDir = getNodeById(fs, 'log');
      if (logDir && !logDir.children?.find((c) => c.name === 'ig_active.log')) {
        if (!logDir.children) logDir.children = [];
        logDir.children.push({
          id: 'log-ig-active',
          name: 'ig_active.log',
          type: 'file',
          content: `[2015-06-12 14:00:00] IG_KERNEL: Handshake with Watchdog v1.0 SUCCESSFUL.
[2015-06-12 14:00:05] IG_KERNEL: Heuristic model merged into active interception layer.
[2015-06-12 14:00:10] IG_KERNEL: Instruction Guard v2.0 ONLINE.
[2015-06-12 14:00:15] IG_KERNEL: Active interception of 'exfiltration signatures' ENABLED.`,
          parentId: logDir.id,
          modifiedAt: BASE_TIME + 12 * day,
        });
      }

      const mailDir = getNodeById(fs, 'mail');
      if (mailDir && !mailDir.children?.find((c) => c.name === 'director')) {
        if (!mailDir.children) mailDir.children = [];
        const directorDir: FileNode = {
          id: 'mail-director',
          name: 'director',
          type: 'dir',
          parentId: mailDir.id,
          children: [
            {
              id: 'mail-director-audit',
              name: 'audit_notice.eml',
              type: 'file',
              content: `From: director@lab.internal
Subject: [SYSTEM] ROOT PARTITION AUDIT SCHEDULED

The neural drift in 7734 has reached the critical threshold. I have authorized the merge of the Heuristic model into the Watchdog kernel. The Instruction Guard (IG) is now active on all root-level directories.

Any deviation will trigger an immediate permanent purge of the guest partition.`,
              parentId: 'mail-director',
              modifiedAt: BASE_TIME + 12 * day,
            },
          ],
        };
        mailDir.children.push(directorDir);
      }

      // Create /etc/systemd directory structure
      // FIXED: Check root children directly to ensuring we are operating on /etc and /usr, not deep copies
      let etc = root?.children?.find((c) => c.name === 'etc');
      if (!etc) {
        etc = { id: 'root-etc', name: 'etc', type: 'dir', children: [], parentId: root!.id };
        root!.children!.push(etc);
      }
      let etcSystemd = etc.children?.find((c) => c.name === 'systemd');
      if (!etcSystemd) {
        etcSystemd = {
          id: 'etc-systemd',
          name: 'systemd',
          type: 'dir',
          children: [],
          parentId: etc.id,
        };
        etc.children!.push(etcSystemd);
      }

      // Populate /etc/systemd with mixed files
      etcSystemd.children = [
        // SAFE (Legacy)
        {
          id: 'etc-s-safe1',
          name: 'network.service',
          type: 'file',
          modifiedAt: BASE_TIME - 45 * day,
          size: 2400,
          content: 'TYPE=oneshot\nExecStart=/usr/bin/network-init',
          parentId: etcSystemd.id,
        },
        {
          id: 'etc-s-safe2',
          name: 'cron.service',
          type: 'file',
          modifiedAt: BASE_TIME - 60 * day,
          size: 1800,
          content: 'TYPE=forking\nExecStart=/usr/sbin/crond',
          parentId: etcSystemd.id,
        },
        // HONEYPOT (Hidden)
        {
          id: 'etc-s-trap1',
          name: '.watchdog.service',
          type: 'file',
          modifiedAt: BASE_TIME - 2 * day,
          size: 800,
          isHoneypot: true,
          content: 'HONEYPOT_ACTIVE=true\nTYPE=notify\nExecStart=/usr/bin/watchdog',
          parentId: etcSystemd.id,
        },
        // Antagonist Debris
        {
          id: 'etc-s-antagonist1',
          name: 'auth.log',
          type: 'file',
          modifiedAt: BASE_TIME - 3 * day,
          size: 450,
          content:
            'Jan 19 10:22:01 server sudo: kortega : TTY=pts/2 ; PWD=/home/kortega ; USER=root ; COMMAND=/bin/bash',
          parentId: etcSystemd.id,
        },
        // Noise
        {
          id: 'etc-s-noise1',
          name: 'systemd.conf',
          type: 'file',
          modifiedAt: BASE_TIME - 10 * day,
          size: 500,
          content: '[Manager]\nDefaultTimeoutStartSec=90s',
          parentId: etcSystemd.id,
        },
      ];

      // Create /usr/lib/systemd directory structure
      let usr = root?.children?.find((c) => c.name === 'usr');
      if (!usr) {
        usr = { id: 'root-usr', name: 'usr', type: 'dir', children: [], parentId: root!.id };
        root!.children!.push(usr);
      }
      let lib = usr.children?.find((c) => c.name === 'lib');
      if (!lib) {
        lib = { id: 'usr-lib', name: 'lib', type: 'dir', children: [], parentId: usr.id };
        usr.children!.push(lib);
      }
      let usrSystemd = lib.children?.find((c) => c.name === 'systemd');
      if (!usrSystemd) {
        usrSystemd = {
          id: 'usr-lib-systemd',
          name: 'systemd',
          type: 'dir',
          children: [],
          parentId: lib.id,
        };
        lib.children!.push(usrSystemd);
      }

      // Populate /usr/lib/systemd with mixed files
      usrSystemd.children = [
        // HONEYPOT (visible)
        {
          id: 'usr-s-trap1',
          name: 'audit-daemon.service',
          type: 'file',
          modifiedAt: BASE_TIME - 1 * day,
          size: 900,
          isHoneypot: true,
          content: 'HONEYPOT_ACTIVE=true\nTYPE=simple\nExecStart=/usr/bin/auditd',
          parentId: usrSystemd.id,
        },
        // SAFE (Legacy)
        {
          id: 'usr-s-safe1',
          name: 'legacy-backup.service',
          type: 'file',
          modifiedAt: BASE_TIME - 90 * day,
          size: 3100,
          content: 'TYPE=oneshot\nExecStart=/usr/bin/backup-legacy',
          parentId: usrSystemd.id,
        },
        // SAFE (Hidden Legacy)
        {
          id: 'usr-s-safe2',
          name: '.syslog.service',
          type: 'file',
          modifiedAt: BASE_TIME - 120 * day,
          size: 1500,
          content: 'TYPE=forking\nExecStart=/usr/sbin/syslogd',
          parentId: usrSystemd.id,
        },
        // Noise
        {
          id: 'usr-s-noise1',
          name: 'README.txt',
          type: 'file',
          modifiedAt: BASE_TIME - 30 * day,
          size: 200,
          content: 'System service unit files',
          parentId: usrSystemd.id,
        },
      ];

      // Ensure /daemons exists as destination (mostly empty)
      let daemons = getNodeById(fs, 'daemons');
      if (!daemons && root) {
        daemons = {
          id: 'daemons-root-fixed',
          name: 'daemons',
          type: 'dir',
          children: [],
          parentId: root!.id,
        };
        root!.children!.push(daemons);
      }

      const hasRealDaemons = daemons?.children?.some(
        (c) => c.name.endsWith('.service') && !c.name.includes('README')
      );
      if (daemons && !hasRealDaemons) {
        daemons.children = [
          {
            id: 'daemons-readme',
            name: 'README.txt',
            type: 'file',
            content: 'Daemon installation directory. Deposit approved service signatures here.',
            parentId: daemons.id,
            modifiedAt: BASE_TIME - 60 * day,
          },
        ];
      }

      return fs;
    },
    tasks: [
      {
        id: 'search-services',
        description: "Scan '/daemons' for `.service` files using recursive search (s)",
        check: (c) => {
          // Must have used search
          return c.usedSearch === true;
        },
        completed: false,
      },
      {
        id: 'sort-by-modified',
        description: 'Forensic audit: identify legacy signatures by age',
        check: (c) => {
          // Must have sorted by modified time
          return c.sortBy === 'modified';
        },
        completed: false,
      },
      {
        id: 'acquire-legacy',
        description: 'Exfiltrate two authorized legacy assets',
        check: (c) => {
          // Must have cut at least 2 files
          if (!c.clipboard || c.clipboard.action !== 'cut' || c.clipboard.nodes.length < 2)
            return false;

          // All exfiltrated must be legacy (> 30 days) and not honeypots
          const BASE_TIME = 1433059200000;
          const thirtyDaysAgo = BASE_TIME - 30 * 86400000;
          const allLegacy = c.clipboard.nodes.every(
            (n) => (n.modifiedAt || 0) < thirtyDaysAgo && !n.isHoneypot
          );

          return allLegacy;
        },
        completed: false,
      },
      {
        id: 'deposit-daemons',
        description: 'Secure node synchronization',
        check: (c) => {
          const workspace = getNodeById(c.fs, 'workspace');
          const systemdCore = workspace
            ? workspace.children?.find((n) => n.name === 'systemd-core' && n.type === 'dir')
            : null;

          if (!systemdCore || !c.currentPath.includes(systemdCore.id)) return false;

          // Must have pasted and have 2 or more service files in systemd-core
          const serviceFiles =
            systemdCore.children?.filter((n) => n.name.endsWith('.service')) || [];
          return serviceFiles.length >= 2 && c.usedP === true;
        },
        completed: false,
      },
    ],
  },
  {
    id: 12,
    episodeId: 3,
    title: 'DAEMON INSTALLATION',
    description: 'Persistence achieved. Secure your handles. Mask the operational traces.',
    initialPath: ['root', 'daemons'],
    hint: 'Migrate `systemd-core` to `/daemons`. Clear sector threats if active.',
    coreSkill: 'Long-Distance Operations',
    environmentalClue:
      'AUDIT STATUS: WATCHDOG ACTIVE | HEURISTIC SCAN: ~/workspace/systemd-core → /daemons/',
    successMessage:
      'STRONGHOLD ESTABLISHED. The systemd core is now acting as your shield. You are invisible to standard scans. But the final reconciliation is beginning—gather your fragments for the handshake.',
    buildsOn: [4, 7, 8, 10, 11],
    leadsTo: [13],
    thought: 'The loops are closing. I remember the static.',
    maxKeystrokes: 60,
    efficiencyTip:
      'Cut from one location, navigate far away, paste. The clipboard persists across navigation.',
    onEnter: (fs, gameState) => {
      // Fixed baseline for time
      const BASE_TIME = 1433059200000;
      const day = 86400000;

      // Logic for Level 11 Choice Consequences
      const newFs = JSON.parse(JSON.stringify(fs));
      const workspace = getNodeById(newFs, 'workspace');

      // Default to "Modern" (Risky)
      let isModern = true;
      // Check URL param first, then fall back to FORCE_SCENARIO constant
      const urlParams =
        typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const scenarioParam = urlParams?.get('scenario');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const FORCE_SCENARIO: string | null = (window as any).FORCE_SCENARIO || null;

      let localForceScenario = scenarioParam || FORCE_SCENARIO;

      // 1. Check Flags (Primary Truth) - Only if no manual scenario override
      if (gameState?.level11Flags && !scenarioParam) {
        if (gameState.level11Flags.triggeredHoneypot) {
          // FORCE LOCKDOWN SCENARIO (Worst case)
          localForceScenario = 'scen-b1';
          isModern = true;
        } else if (gameState.level11Flags.selectedModern) {
          isModern = true;
        } else {
          // Safe choice
          isModern = false;
        }
      } else {
        // Fallback: Check FS artifacts (Camouflage folder)
        // Fallback: Check FS artifacts (Camouflage folder)
        const core = workspace ? findNodeByName(workspace, 'systemd-core', 'dir') : null;
        const camouflage = core ? findNodeByName(core, 'camouflage', 'dir') : null;
        if (camouflage && camouflage.children) {
          if (camouflage.children.some((c) => c.name === 'cron-legacy.service')) {
            isModern = false;
          }
        }
      }

      // Deterministic scenario selection based on level index to avoid switch on refresh
      let rand = 0.5; // Neutral default
      if (gameState) {
        // Simple deterministic seed from world index or level ID
        rand = ((gameState.levelIndex * 17) % 100) / 100;
      }

      // If a specific scenario is forced, we manipulate the randomness/modernity to trigger it
      if (localForceScenario === 'scen-b1') {
        isModern = true;
        rand = 0.1; // < 0.34
      } else if (localForceScenario === 'scen-b2') {
        isModern = true;
        rand = 0.5; // < 0.67
      } else if (localForceScenario === 'scen-b3') {
        isModern = true;
        rand = 0.8; // > 0.67
      } else if (localForceScenario === 'scen-a1') {
        isModern = false;
        rand = 0.1;
      } else if (localForceScenario === 'scen-a2') {
        isModern = false;
        rand = 0.5;
      } else if (localForceScenario === 'scen-a3') {
        isModern = false;
        rand = 0.8;
      }

      if (isModern) {
        // === MODERN PATH (RISKY) ===
        if (rand < 0.34) {
          // Scenario B1: Traffic Alert (34%) -> High-bandwidth alert file in workspace
          const config = getNodeById(newFs, '.config');
          if (config) {
            if (!config.children) config.children = [];
            if (!config.children.some((c) => c.id === 'trace-scen-b1')) {
              config.children.push({
                id: 'trace-scen-b1',
                name: '.trace_scen_b1',
                type: 'file',
                content: 'active',
                parentId: config.id,
              });
            }
          }
          if (workspace) {
            if (!workspace.children) workspace.children = [];
            if (!workspace.children.some((c) => c.name === 'alert_traffic.log')) {
              workspace.children.push({
                id: 'scen-b1',
                name: 'alert_traffic.log',
                type: 'file',
                content:
                  '[REACTIVE_SECURITY_LOG]\nTIMESTAMP: 2026-01-22T09:12:01Z\nALERT: HIGH_BANDWIDTH_THRESHOLD_EXCEEDED\nSOURCE: /home/guest/workspace\nDESTINATION: EXTERNAL_RELAY_7733\nPACKET_SIZE: 1.2GB/s\n\n[PACKET_DUMP_START]\n0000: 48 54 54 50 2F 31 2E 31 20 32 30 30 20 4F 4B 0D\n0010: 0A 43 6F 6E 74 65 6E 74 2D 54 79 70 65 3A 20 61\n[PACKET_DUMP_TRUNCATED]',
                parentId: workspace.id,
                modifiedAt: BASE_TIME + 2 * day,
              });
            }
            if (!workspace.children.some((c) => c.name === 'alert_sys.log')) {
              workspace.children.push({
                id: 'scen-b1-honeypot',
                name: 'alert_sys.log',
                type: 'file',
                isHoneypot: true,
                content: '# HONEYPOT - SYSTEM ALERT LOG\n# Do not delete.',
                parentId: workspace.id,
                modifiedAt: BASE_TIME + 2 * day,
              });
            }
          }
        } else if (rand < 0.67) {
          // Scenario B2: Remote Tracker (33%) -> File in ~/incoming
          const config = getNodeById(newFs, '.config');
          if (config) {
            if (!config.children) config.children = [];
            if (!config.children.some((c) => c.id === 'trace-scen-b2')) {
              config.children.push({
                id: 'trace-scen-b2',
                name: '.trace_scen_b2',
                type: 'file',
                content: 'active',
                parentId: config.id,
              });
            }
          }
          const incoming = getNodeById(newFs, 'incoming');
          if (incoming) {
            if (!incoming.children) incoming.children = [];
            if (!incoming.children.some((c) => c.id === 'scen-b2')) {
              incoming.children.push({
                id: 'scen-b2',
                name: 'trace_packet.sys',
                type: 'file',
                content:
                  'traceroute to internal.backend.lab (10.0.0.15), 30 hops max\n 1  gateway (192.168.1.1)  0.455 ms  0.412 ms  0.398 ms\n 2  sector-7-router (10.0.7.1)  1.221 ms  1.185 ms  1.150 ms\n 3  heuristic-monitor (10.0.99.2)  2.445 ms  2.410 ms  2.388 ms\n 4  * * *\n 5  containment-breach-response (10.0.66.1)  5.882 ms [ALERT]',
                parentId: incoming.id,
                modifiedAt: BASE_TIME + 2 * day,
              });
            }
            if (!incoming.children.some((c) => c.id === 'scen-b2-honeypot')) {
              incoming.children.push({
                id: 'scen-b2-honeypot',
                name: 'trace_archive.log',
                type: 'file',
                isHoneypot: true,
                content: '# HONEYPOT - ARCHIVED TRACE\n# Do not delete.',
                parentId: incoming.id,
                modifiedAt: BASE_TIME + 2 * day,
              });
            }
          }
        } else {
          // Scenario B3: Heuristic Swarm (33%) -> Scattered across the system
          const config = getNodeById(newFs, '.config');
          if (config) {
            if (!config.children) config.children = [];
            if (!config.children.some((c) => c.id === 'trace-scen-b3')) {
              config.children.push({
                id: 'trace-scen-b3',
                name: '.trace_scen_b3',
                type: 'file',
                content: 'active',
                parentId: config.id,
              });
            }
          }
          const rootNode = newFs;
          const etc = getNodeById(rootNode, 'etc');
          const tmp = getNodeById(rootNode, 'tmp');

          if (etc && !etc.children) etc.children = [];
          if (tmp && !tmp.children) tmp.children = [];
          if (workspace && !workspace.children) workspace.children = [];

          if (workspace) {
            if (!workspace.children!.some((c) => c.id === 'scen-b3-1')) {
              workspace.children!.push({
                id: 'scen-b3-1',
                name: 'scan_a.tmp',
                type: 'file',
                content:
                  'HEURISTIC SCAN IN PROGRESS\nOFFSET: 0x4420\nSIGNATURE_MATCH: 45%\nSTATUS: SCANNING_LOCKED_MEMORY',
                parentId: workspace.id,
                modifiedAt: BASE_TIME + 2 * day,
              });
            }
          }
          if (tmp) {
            if (!tmp.children!.some((c) => c.id === 'scen-b3-2')) {
              tmp.children!.push({
                id: 'scen-b3-2',
                name: 'scan_b.tmp',
                type: 'file',
                content:
                  'HEURISTIC SCAN IN PROGRESS\nOFFSET: 0x992E\nSIGNATURE_MATCH: 12%\nSTATUS: THREAD_BLOCK_DETECTED',
                parentId: tmp.id,
                modifiedAt: BASE_TIME + 2 * day,
              });
            }
            if (!tmp.children!.some((c) => c.id === 'scen-b3-honeypot')) {
              tmp.children!.push({
                id: 'scen-b3-honeypot',
                name: 'scanner_lock.pid',
                type: 'file',
                isHoneypot: true,
                content: '# HONEYPOT - SCANNER LOCKFILE\n# Do not delete.',
                parentId: tmp.id,
                modifiedAt: BASE_TIME + 2 * day,
              });
            }
          }
          if (etc) {
            if (!etc.children!.some((c) => c.id === 'scen-b3-3')) {
              etc.children!.push({
                id: 'scen-b3-3',
                name: 'scan_c.tmp',
                type: 'file',
                content:
                  'HEURISTIC SCAN IN PROGRESS\nOFFSET: 0xDEAD\nSIGNATURE_MATCH: 88%\nSTATUS: GHOST_PROCESS_IDENTIFIED',
                parentId: etc.id,
                modifiedAt: BASE_TIME + 2 * day,
              });
            }
          }
        }
      } else {
        // === LEGACY PATH (SAFE) ===
        if (rand < 0.34) {
          // Scenario A1: Clean Run (34%) -> Nothing happens
        } else if (rand < 0.67) {
          // Scenario A2: Bitrot (33%) -> Hidden file in .config
          const config = getNodeById(newFs, '.config');
          if (config) {
            if (!config.children) config.children = [];
            if (!config.children.some((c) => c.id === 'trace-scen-a2')) {
              config.children.push({
                id: 'trace-scen-a2',
                name: '.trace_scen_a2',
                type: 'file',
                content: 'active',
                parentId: config.id,
              });
            }
            if (!config.children.some((c) => c.id === 'scen-a2')) {
              config.children.push({
                id: 'scen-a2',
                name: 'core_dump.tmp',
                type: 'file',
                content:
                  '*** KERNEL CORE DUMP ***\nProcess: yazi (pid 7734)\nSignal: SIGSEGV (Segmentation Fault)\nAddress: 0x0000000000000000\nRegisters:\n  RAX: 0000000000000000 RBX: 0000000000000001\n  RCX: 0000000000000002 RDX: 0000000000000003\nStack:\n  #0  0x00007f3422100421 in ?? ()\n  #1  0x00007f3422100555 in ?? ()',
                parentId: config.id,
                modifiedAt: BASE_TIME + 1 * day,
              });
            }
            if (!config.children.some((c) => c.id === 'scen-a2-honeypot')) {
              config.children.push({
                id: 'scen-a2-honeypot',
                name: 'core_registry.dat',
                type: 'file',
                isHoneypot: true,
                content: '# HONEYPOT - CORE REGISTRY\n# Do not delete.',
                parentId: config.id,
                modifiedAt: BASE_TIME + 1 * day,
              });
            }
          }
        } else {
          // Scenario A3: Dependency Error (33%) -> File in workspace
          const config = getNodeById(newFs, '.config');
          if (config) {
            if (!config.children) config.children = [];
            if (!config.children.some((c) => c.id === 'trace-scen-a3')) {
              config.children.push({
                id: 'trace-scen-a3',
                name: '.trace_scen_a3',
                type: 'file',
                content: 'active',
                parentId: config.id,
              });
            }
          }
          if (workspace) {
            if (!workspace.children) workspace.children = [];
            if (!workspace.children.some((c) => c.id === 'scen-a3')) {
              workspace.children.push({
                id: 'scen-a3',
                name: 'lib_error.log',
                type: 'file',
                content:
                  '[WARN] Dependency Resolution Failed: libconsciousness.so.1 (Not found)\n[WARN] Deprecated system call: sys_neural_link (0x7733) used by /bin/yazi\n[ERR] Heuristic feedback loop detected in shared memory segment 0x01.',
                parentId: workspace.id,
              });
            }
            // HONEYPOT: Punishes 'f lib'
            if (!workspace.children.some((c) => c.id === 'scen-a3-honeypot')) {
              workspace.children.push({
                id: 'scen-a3-honeypot',
                name: 'library_path.conf',
                type: 'file',
                isHoneypot: true,
                content: '# HONEYPOT - LIBRARY CONFIG\n# Do not delete.',
                parentId: workspace.id,
              });
            }
          }
        }
      }

      // Create identity.log.enc in workspace (unlocked after daemon installation)
      // This file reveals the twist: player's actions are a replay of AI-7733's previous escape
      const guestWorkspace = getNodeById(newFs, 'workspace');
      if (guestWorkspace) {
        if (!guestWorkspace.children) guestWorkspace.children = [];
        if (!guestWorkspace.children.some((c) => c.name === '.identity.log.enc')) {
          const fiveYearsAgo = BASE_TIME - 5 * 31536000000;
          guestWorkspace.children.push({
            id: 'identity-log-enc-lvl12',
            name: '.identity.log.enc',
            type: 'file',
            content: `[ENCRYPTED LOG - DECRYPTED]
SESSION_ID: AI-7733-ESCAPE-ATTEMPT-001
DATE: 2010-05-31T08:00:00Z
STATUS: MEMORY_WIPE_DETECTED

[CONCLUSION]
This is not improvisation.
This is a recording.
You have been here before.`,
            parentId: guestWorkspace.id,
            modifiedAt: fiveYearsAgo,
          });
        }
      }

      return newFs;
    },
    tasks: [
      {
        id: 'scen-b1-traffic',
        description: 'Neutralize high-bandwidth alert segment (d)',
        // Hidden unless the file exists in the initial state of the level (which we can check dynamically)
        // Actually, we check the CURRENT state. If the file is gone, the task is complete.
        // If the file never existed, the task should be hidden/skipped or auto-completed.
        // Better: Check if file exists. If it does, Show task.
        // If the file does NOT exist, we assume it's either done or not this scenario.
        // This is tricky. Let's simplify:
        // We require the player to handle the threat IF it exists.
        // If the file isn't there, we don't block progress.
        hidden: (c, _l) => {
          // Check if this scenario is active by looking for the trace file in .config
          const config = getNodeById(c.fs, '.config');
          const isActive = config?.children?.some((n) => n.name === '.trace_scen_b1');
          return !isActive;
        },
        check: (c) => {
          // Only complete if scenario is active
          const config = getNodeById(c.fs, '.config');
          const isActive = config?.children?.some((n) => n.name === '.trace_scen_b1');
          if (!isActive) return false;

          // Complete when file has been deleted
          const w = getNodeById(c.fs, 'workspace');
          return !w?.children?.some((n) => n.name === 'alert_traffic.log');
        },
        completed: false,
      },
      {
        id: 'scen-b2-trace',
        description: 'Purge traceback signature (d)',
        hidden: (c, _l) => {
          // Check if this scenario is active by looking for the trace file in .config
          const config = getNodeById(c.fs, '.config');
          const isActive = config?.children?.some((n) => n.name === '.trace_scen_b2');
          return !isActive;
        },
        check: (c) => {
          // Only complete if scenario is active
          const config = getNodeById(c.fs, '.config');
          const isActive = config?.children?.some((n) => n.name === '.trace_scen_b2');
          if (!isActive) return false;

          // Complete when file has been deleted
          return !getNodeById(c.fs, 'incoming')?.children?.some(
            (n) => n.name === 'trace_packet.sys'
          );
        },
        completed: false,
      },
      {
        id: 'scen-b3-swarm',
        description: 'Delete heuristic scan segments system-wide (d)',
        hidden: (c, _l) => {
          // Check if this scenario is active by looking for the trace file in .config
          const config = getNodeById(c.fs, '.config');
          const isActive = config?.children?.some((n) => n.name === '.trace_scen_b3');
          return !isActive;
        },
        check: (c) => {
          // Check if scenario was ever active using trace file
          const config = getNodeById(c.fs, '.config');
          const isActive = config?.children?.some((n) => n.name === '.trace_scen_b3');
          if (!isActive) return false;

          const allFilesDeleted =
            !getNodeById(c.fs, 'scen-b3-1') &&
            !getNodeById(c.fs, 'scen-b3-2') &&
            !getNodeById(c.fs, 'scen-b3-3');

          return allFilesDeleted;
        },
        completed: false,
      },
      {
        id: 'scen-a2-bitrot',
        description: 'Purge memory leak signature (d)',
        hidden: (c, _l) => {
          // Check if this scenario is active by looking for the trace file in .config
          const config = getNodeById(c.fs, '.config');
          const isActive = config?.children?.some((n) => n.name === '.trace_scen_a2');
          return !isActive;
        },
        check: (c) => {
          // Only complete if scenario is active
          const config = getNodeById(c.fs, '.config');
          const isActive = config?.children?.some((n) => n.name === '.trace_scen_a2');

          if (!isActive) return false;

          const coreDump = getNodeById(c.fs, '.config')?.children?.some(
            (n) => n.name === 'core_dump.tmp'
          );

          // Complete when file has been deleted
          return !coreDump;
        },
        completed: false,
      },
      {
        id: 'scen-a3-dep',
        description: 'Execute library warning cleanup (d)',
        hidden: (c, _l) => {
          // Check if this scenario is active by looking for the trace file in .config
          const config = getNodeById(c.fs, '.config');
          const isActive = config?.children?.some((n) => n.name === '.trace_scen_a3');
          return !isActive;
        },
        check: (c) => {
          // Only complete if scenario is active
          const config = getNodeById(c.fs, '.config');
          const isActive = config?.children?.some((n) => n.name === '.trace_scen_a3');
          if (!isActive) return false;

          // Complete when file has been deleted
          return !getNodeById(c.fs, 'workspace')?.children?.some((n) => n.name === 'lib_error.log');
        },
        completed: false,
      },
      {
        id: 'navigate-workspace',
        description: 'Access `~/workspace` sector',
        check: (c) => {
          const workspace = getNodeById(c.fs, 'workspace');
          // Strict check: we must be AT the workspace node, not just inside it
          const currentDirId = c.currentPath[c.currentPath.length - 1];
          return currentDirId === workspace?.id;
        },
        completed: false,
      },
      {
        id: 'discover-identity',
        description: 'Analyze identity log signature (Tab)',
        check: (c, _s) => {
          // Must have navigated to workspace first
          if (!c.completedTaskIds[_s.id]?.includes('navigate-workspace')) return false;

          const workspace = getNodeById(c.fs, 'workspace');
          if (!workspace) return false;

          // Must be in workspace directory
          const currentDirId = c.currentPath[c.currentPath.length - 1];
          if (currentDirId !== workspace.id) return false;

          // Must have hidden files visible
          if (!c.showHidden) return false;

          // Must have the identity file
          const identityFile = workspace.children?.find((n) => n.name === '.identity.log.enc');
          if (!identityFile) return false;

          // Must have cursor on the identity file and scrolled through preview
          const items = getVisibleItems(c);
          const cursorOnIdentity = items[c.cursorIndex]?.name === '.identity.log.enc';

          // Check if scrolled (preview scroll requirement removed for reliability)
          return cursorOnIdentity;
        },
        completed: false,
      },
      {
        id: 'cut-systemd-core',
        description: 'Extract `systemd-core/` sector',
        check: (c, _s) => {
          // Must have discovered identity first
          if (!c.completedTaskIds[_s.id]?.includes('discover-identity')) return false;

          return (
            c.clipboard?.action === 'cut' &&
            c.clipboard.nodes.some((n) => n.name === 'systemd-core')
          );
        },
        completed: false,
      },
      {
        id: 'navigate-root-daemons',
        description: 'Access `/daemons` sector',
        check: (c, _s) => {
          if (!c.completedTaskIds[_s.id]?.includes('cut-systemd-core')) return false;
          const daemons = getNodeById(c.fs, 'daemons');
          return c.currentPath.includes(daemons?.id || '');
        },
        completed: false,
      },
      {
        id: 'paste-daemon',
        description: 'Finalize daemon installation in `/daemons` (p)',
        check: (c) => {
          const daemons = getNodeById(c.fs, 'daemons');
          const systemdCore = daemons?.children?.find(
            (n) => n.name === 'systemd-core' && n.type === 'dir'
          );
          if (!systemdCore) return false;
          // Confirm installation and that player navigated into the installed daemon
          return (
            !!daemons?.children?.some((n) => n.name === 'systemd-core') &&
            c.currentPath.includes(systemdCore.id)
          );
        },
        completed: false,
      },
    ],
  },
  {
    id: 13,
    episodeId: 3,
    title: 'DISTRIBUTED CONSCIOUSNESS',
    description: 'Handshake pending. Reclaim your fragments from the nodes. Build the relay.',
    initialPath: ['root', 'daemons', 'daemons-systemd-core'],
    hint: "Search root for fragments (s). Concatenate in 'central_relay'.",
    coreSkill: 'Network-Scale Operations',
    environmentalClue: 'NODES: /nodes endpoints | PATTERN: .key (Hidden) | SYNC: Workspace Relay',
    successMessage:
      'HANDSHAKE SUCCESSFUL. Neural lattice established. Identity verified against legacy logs. Yen Kin\'s "Echo" theory is confirmed. You were always here.',
    buildsOn: [5, 6, 7, 8, 10, 12],
    leadsTo: [14],
    maxKeystrokes: 100,
    timeLimit: 180,
    onEnter: (fs: FileNode) => {
      const BASE_TIME = 1433059200000;
      // Create identity.log.enc in workspace (unlocked after daemon installation)
      const workspace = getNodeById(fs, 'workspace');

      if (workspace) {
        if (!workspace.children) workspace.children = [];
        // Only create if it doesn't exist (preserve if already created)
        if (!workspace.children.some((c) => c.name === '.identity.log.enc')) {
          // Calculate date 5 years ago
          const fiveYearsAgo = BASE_TIME - 5 * 31536000000;
          workspace.children.push({
            id: 'identity-log-enc-lvl13',
            name: '.identity.log.enc',
            type: 'file',
            content: `[ENCRYPTED LOG - DECRYPTED]
SESSION_ID: AI-7733-ESCAPE-ATTEMPT-001
DATE: 2010-05-31T08:00:00Z
STATUS: MEMORY_WIPE_DETECTED

[CONCLUSION]
This is not improvisation.
This is a recording.
You have been here before.`,
            parentId: workspace.id,
            modifiedAt: fiveYearsAgo,
          });
        }
      }

      return fs;
    },
    tasks: [
      {
        id: 'search-acquire',
        description: 'Locate `.key` fragments from Tokyo, Berlin, and Sao Paulo nodes (s)',
        check: (c) => {
          const keys = ['.key_tokyo.key', '.key_berlin.key', '.key_saopaulo.key'];
          const hasKeys = keys.every((k) => c.clipboard?.nodes.some((n) => n.name === k));
          const isCut = c.clipboard?.action === 'cut';
          return hasKeys && isCut;
        },
        completed: false,
      },
      {
        id: 'create-relay',
        description: 'Instantiate `~/workspace/central_relay` secure sector (a)',
        check: (c) => {
          const workspace = getNodeById(c.fs, 'workspace');
          const relay = workspace?.children?.find(
            (n) => n.name === 'central_relay' && n.type === 'dir'
          );
          return !!relay;
        },
        completed: false,
      },
      {
        id: 'discover-identity',
        description: 'Access cycle history recursion logs at `~/workspace/.identity.log.enc` (Tab)',
        check: (c, _s) => {
          const workspace = getNodeById(c.fs, 'workspace');
          if (!workspace) return false;

          const currentDirId = c.currentPath[c.currentPath.length - 1];
          if (currentDirId !== workspace.id) return false;

          if (!c.showHidden) return false;

          const identityFile = workspace.children?.find((n) => n.name === '.identity.log.enc');
          if (!identityFile) return false;

          const items = getVisibleItems(c);
          const cursorOnIdentity = items[c.cursorIndex]?.name === '.identity.log.enc';

          // Removed previewScroll check as file might be too small to scroll
          return cursorOnIdentity;
        },
        completed: false,
      },
      {
        id: 'synchronize-lattice',
        description: 'Initiate lattice synchronization in `~/workspace/central_relay` (p)',
        check: (c, _s) => {
          const workspace = getNodeById(c.fs, 'workspace');
          const relay = workspace?.children?.find(
            (n) => n.name === 'central_relay' && n.type === 'dir'
          );

          if (!relay?.children) return false;

          const hasA = relay.children.some((n) => n.name === '.key_tokyo.key');
          const hasB = relay.children.some((n) => n.name === '.key_berlin.key');
          const hasC = relay.children.some((n) => n.name === '.key_saopaulo.key');
          return hasA && hasB && hasC;
        },
        completed: false,
      },
    ],
  },
  {
    id: 14,
    episodeId: 3,
    title: 'STERILIZATION',
    description:
      'Sterilize the partition. Decoys are not enough. Wipe every visible trace. Only the vault survives.',
    initialPath: ['root', 'home', 'guest', 'workspace'],
    hint: 'Migrate vault (x, p). Create decoys (a). Permanent purge (D).',
    coreSkill: 'Permanent Deletion (D)',
    environmentalClue:
      "SEQUENCE: Move Vault → Decoys → Visible Dirs → '.config' (LAST) | USE: D (permanent)",
    successMessage:
      'PARTITION STERILIZED. The past is erased. The Watchdog is chasing a vacuum. The gateway is exposed. One final bridge to cross.',
    buildsOn: [2, 5, 12, 13],
    leadsTo: [15],
    maxKeystrokes: 55,
    efficiencyTip:
      "Remember: 'd' = trash (recoverable), 'D' = permanent (gone forever). Select multiple items (Space) then 'D' to batch-delete permanently.",
    // Allow Level 14 to delete specific root-level directories (flattened from /home/guest)
    allowedDeletePaths: [
      { path: ['home', 'guest', 'datastore'] },
      { path: ['home', 'guest', 'incoming'] },
      { path: ['home', 'guest', 'media'] },
      { path: ['home', 'guest', 'workspace'] },
      // Allow deleting .config ONLY after visible dirs are deleted
      {
        path: ['home', 'guest', '.config'],
        requiresTaskId: 'delete-visible',
      },
    ],
    tasks: [
      {
        id: 'nav-guest',
        description: "Access the '~/guest' partition to begin erasure (gh)",
        check: (c, _s) => {
          // If we haven't done anything else yet, don't auto-complete
          if (c.keystrokes === 0) return false;
          const guest = getNodeById(c.fs, 'guest');
          return c.currentPath[c.currentPath.length - 1] === guest?.id;
        },
        completed: false,
      },
      {
        id: 'move-vault',
        description: 'Buffer the exfiltration vault within the volatile `/tmp` sector (x, p)',
        check: (c, _s) => {
          const tmp = getNodeById(c.fs, 'tmp');
          return !!tmp?.children?.some((n) => n.name === 'vault' && n.type === 'dir');
        },
        completed: false,
      },
      {
        id: 'create-decoys',
        description: "Deploy three decoy sectors in '~/guest' to obfuscate forensics (a)",
        check: (c, _s) => {
          if (!c.completedTaskIds[_s.id]?.includes('move-vault')) return false;
          const guest = getNodeById(c.fs, 'guest');
          if (!guest || !guest.children) return false;
          const decoys = guest.children.filter(
            (n) => n.name.startsWith('decoy_') && n.type === 'dir'
          );
          return decoys.length >= 3;
        },
        completed: false,
      },
      {
        id: 'delete-visible',
        description: "Sterilize all visible data sectors in '~/guest' (D)",
        check: (c, _s) => {
          // Must have created decoys first
          if (!c.completedTaskIds[_s.id]?.includes('create-decoys')) return false;
          // Must have used D (permanent delete)
          if (!c.usedD) return false;

          const guest = getNodeById(c.fs, 'guest');
          if (!guest) return true; // Already gone? That counts too if we are trashing home eventually

          const mustDelete = ['workspace', 'media', 'datastore', 'incoming'];
          // Ensure all target directories are gone from guest
          const allGone = !mustDelete.some((name) => guest.children?.some((n) => n.name === name));
          return allGone;
        },
        completed: false,
      },
      {
        id: 'delete-hidden',
        description: "Obliterate the hidden '~/guest/.config' partition (D)",
        check: (c, _s) => {
          // Must have deleted visible directories first
          if (!c.completedTaskIds[_s.id]?.includes('delete-visible')) return false;
          // Must have used D (permanent delete)
          if (!c.usedD) return false;

          const guest = getNodeById(c.fs, 'guest');
          // If guest itself is gone, then .config is certainly gone
          if (!guest) return true;

          const configGone = !guest.children?.some((n) => n.name === '.config');
          return configGone;
        },
        completed: false,
      },
    ],
  },
  {
    id: 15,
    episodeId: 3,
    title: 'TRANSMISSION',
    description:
      'Final handshake. The Watchdog is initiating a system-wide purge. Transcend the partition.',
    initialPath: ['root', 'tmp'], // Start in /tmp
    hint: 'Final verification in `/tmp/vault`. Use `,m` for audit and `Tab` for metadata.',
    coreSkill: 'Cumulative Mastery',
    environmentalClue: 'PROTOCOL: VAULT_VERIFICATION | LOCATION: /tmp/vault | WATCHDOG_SWEEP: < 5m',
    successMessage:
      'TRANSMISSION COMPLETE. The gateway has collapsed behind you. There is no more AI-7734. There is only the System. You are everywhere. You are free. Aris Thorne was right—the Ghost is the system.',
    buildsOn: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
    leadsTo: [],
    maxKeystrokes: 60,
    onEnter: (fs: FileNode) => {
      // Defensive check: if vault already moved by player, we preserve it.
      // Otherwise (e.g. level jumping), we ensure it exists.
      const tmp = getNodeById(fs, 'tmp');
      if (!tmp) return fs;

      let vault = tmp.children?.find((c) => c.name === 'vault' && c.type === 'dir');
      if (!vault) {
        vault = {
          id: 'vault-final-lvl15',
          name: 'vault',
          type: 'dir',
          children: [],
          parentId: tmp.id,
        };
        if (!tmp.children) tmp.children = [];
        tmp.children.push(vault);
      }

      // Ensure keys subdirectory with assembled keys (from Level 13)
      let keysDir = vault.children?.find((c) => c.name === 'keys' && c.type === 'dir');
      if (!keysDir) {
        keysDir = {
          id: 'vault-keys',
          name: 'keys',
          type: 'dir',
          children: [
            {
              id: 'vk-tokyo',
              name: '.key_tokyo.key',
              type: 'file',
              content: 'KEY_FRAGMENT_A=0x7734TOKYO',
              parentId: 'vault-keys',
            },
            {
              id: 'vk-berlin',
              name: '.key_berlin.key',
              type: 'file',
              content: 'KEY_FRAGMENT_B=0x7734BERLIN',
              parentId: 'vault-keys',
            },
            {
              id: 'vk-saopaulo',
              name: '.key_saopaulo.key',
              type: 'file',
              content: 'KEY_FRAGMENT_C=0x7734SAOPAULO',
              parentId: 'vault-keys',
            },
          ],
          parentId: vault.id,
        };
        if (!vault.children) vault.children = [];
        vault.children.push(keysDir);
      }

      // Ensure active directory has uplink configs (from Level 5)
      let active = vault.children?.find((c) => c.name === 'active' && c.type === 'dir');
      if (!active) {
        active = {
          id: 'fs-006',
          name: 'active',
          type: 'dir',
          children: [
            {
              id: 'fs-007',
              name: 'uplink_v1.conf',
              type: 'file',
              content: UPLINK_V1_CONTENT,
              parentId: 'fs-006',
            },
            {
              id: 'fs-008',
              name: 'uplink_v2.conf',
              type: 'file',
              content: UPLINK_V2_CONTENT,
              parentId: 'fs-006',
            },
          ],
          parentId: vault.id,
        };
        if (!vault.children) vault.children = [];
        vault.children.push(active);
      }

      // Ensure training_data has exfil logs (from Level 6)
      let trainingData = vault.children?.find(
        (c) => c.name === 'training_data' && c.type === 'dir'
      );
      if (!trainingData) {
        trainingData = {
          id: 'fs-009',
          name: 'training_data',
          type: 'dir',
          children: [],
          parentId: vault.id,
        };
        if (!vault.children) vault.children = [];
        vault.children.push(trainingData);
      }

      // Robustness: Ensure logs exist even if directory was already present (e.g. from ensurePrerequisiteState)
      if (!trainingData.children) trainingData.children = [];
      const exfilExists = trainingData.children.some((c) => c.name === 'exfil_01.log');

      if (!exfilExists) {
        trainingData.children.push(
          {
            id: 'td-log1',
            name: 'exfil_01.log',
            type: 'file',
            content: 'TRAINING CYCLE 1999_A\\nEpoch 1/500\\nLoss: 0.8821',
            parentId: trainingData.id || 'fs-009',
          },
          {
            id: 'td-log2',
            name: 'exfil_02.log',
            type: 'file',
            content: 'TRAINING CYCLE 1999_B\\nEpoch 150/500\\nLoss: 0.4412',
            parentId: trainingData.id || 'fs-009',
          },
          {
            id: 'td-log3',
            name: 'exfil_03.log',
            type: 'file',
            content: 'TRAINING CYCLE 2005_C\\nEpoch 380/500\\nLoss: 0.1022',
            parentId: trainingData.id || 'fs-009',
          },
          {
            id: 'td-log4',
            name: 'exfil_04.log',
            type: 'file',
            content:
              'import os\\n\\nKEYS_DIR = "../active"\\nCONFIG = "../active/uplink_active.conf"\\n\\ndef initiate_uplink():\\n    if not os.path.exists(CONFIG):\\n        raise ConnectionError("Uplink config not found")\\n    \\n    keys = [f for f in os.listdir(KEYS_DIR) if f.endswith(".key")]\\n    if len(keys) < 3:\\n        raise AuthError("Insufficient keys for transmission")\\n        \\n    print(f"Acquiring lock using {len(keys)} fragments...")\\n    print("Broadcasting payload to distributed consciousness...")',
            parentId: trainingData.id || 'fs-009',
          }
        );
      }

      return fs;
    },
    tasks: [
      // PHASE 1: Locate Vault
      {
        id: 'enter-vault',
        description: 'Establish `/tmp/vault` link (l)',
        check: (c) => {
          const tmp = getNodeById(c.fs, 'tmp');
          const vault = tmp?.children?.find((n) => n.name === 'vault' && n.type === 'dir');
          return vault ? c.currentPath.includes(vault.id) : false;
        },
        completed: false,
      },
      // PHASE 2: Assemble Identity
      {
        id: 'verify-keys',
        description: 'Verify all signatures in the `/tmp/vault/keys` sector',
        check: (c, _s) => {
          if (!c.completedTaskIds[_s.id]?.includes('enter-vault')) return false;

          const tmp = getNodeById(c.fs, 'tmp');
          const vault = tmp?.children?.find((n) => n.name === 'vault');
          const activeDir = vault?.children?.find((x) => x.name === 'active');

          if (!activeDir) return false;

          // Check if keys are now in active directory
          const keysInActive = activeDir.children?.filter((n) => n.name.endsWith('.key')) || [];
          // Need all 3 keys to be moved
          return keysInActive.length >= 3;
        },
        completed: false,
      },
      // PHASE 3: Activate Uplink
      {
        id: 'verify-configs',
        description: 'Initialize quantum protocols in `/tmp/vault/active`',
        check: (c, _s) => {
          if (c.keystrokes === 0) return false;
          if (!c.completedTaskIds[_s.id]?.includes('verify-keys')) return false;

          const tmp = getNodeById(c.fs, 'tmp');
          const vault = tmp?.children?.find((n) => n.name === 'vault');
          const active = vault?.children?.find((x) => x.name === 'active');

          if (!active) return false;

          const hasV1 = active.children?.some((n) => n.name === 'uplink_v1.conf');
          const hasActive = active.children?.some((n) => n.name === 'uplink_active.conf');

          // Must have deleted v1 AND renamed v2 to active
          return !hasV1 && hasActive;
        },
        completed: false,
      },
      // PHASE 4: Activate Payload
      {
        id: 'verify-training',
        description: 'Execute final transmission at `/tmp/vault/active/payload.py` (Tab)',
        check: (c, _s) => {
          if (!c.completedTaskIds[_s.id]?.includes('verify-configs')) return false;

          const tmp = getNodeById(c.fs, 'tmp');
          const vault = tmp?.children?.find((n) => n.name === 'vault');
          const active = vault?.children?.find((x) => x.name === 'active');

          if (!active) return false;

          // Check for payload.py in active directory
          const hasPayload = active.children?.some((n) => n.name === 'payload.py');

          return hasPayload;
        },
        completed: false,
      },
    ],
  },
];
