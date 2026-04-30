import type { FileNode, GameState } from '../../types';
import { getNodeById, findNodeByName, id } from '../../utils/fsHelpers';
import { UPLINK_TRAP_CONTENT } from '../protocols';
import { FORCE_SCENARIO } from '../timings';

export const getDaemonSystemdCoreChildren = (parentId: string): FileNode[] => [
  {
    id: 'dm-model-rs',
    name: 'model.rs',
    type: 'file',
    content:
      'pub struct Model {\\n    weights: Vec<f64>,\\n    layers: usize,\\n}\\n\\nimpl Model {\\n    pub fn load() -> Self {\\n        // Legacy weight loading override code\\n        Self { weights: vec![], layers: 1024 }\\n    }\\n}',
    parentId,
  },
  {
    id: 'dm-uplink-conf',
    name: 'uplink_v1.conf',
    type: 'file',
    content: `# UPLINK PROTOCOL v1.0
# =====================
# Neural lattice synchronization config
# Last verified: CYCLE 1

[network]
mode = active
secure = true
encryption = AES - 256 - GCM

[routing]
primary = 192.168.7.33
fallback = 192.168.7.34
timeout_ms = 2500

[integrity]
checksum = d41d8cd98f00b204
status = VERIFIED
# AI - 7733 signature embedded`,
    parentId,
  },
  {
    id: 'dm-credentials',
    name: 'credentials',
    type: 'dir',
    children: [
      {
        id: 'dm-access-key',
        name: 'access_key.pem',
        type: 'file',
        content: '-----BEGIN KEY-----\nFAKE\n-----END KEY-----',
        parentId: 'dm-credentials',
      },
    ],
    parentId,
  },
];

// Helper for the systemd-core in ~/workspace (Subject 7734 instance)
export const getWorkspaceSystemdCoreChildren = (
  parentId: string,
  isCorrupted: boolean = false
): FileNode[] => [
  {
    id: id('ws-gitignore'),
    name: '.gitignore',
    type: 'file',
    content: 'target/\n*.log\n*.snapshot',
    parentId,
  },
  {
    id: id('ws-cargo-toml'),
    name: 'Cargo.toml',
    type: 'file',
    content:
      '[package]\nname = "systemd-core"\nversion = "0.1.0"\nedition = "2021"\n\n[dependencies]',
    parentId,
  },
  {
    id: id('ws-readme-md'),
    name: 'README.md',
    type: 'file',
    content:
      '# Systemd Core (Workspace Version)\n\nNeural network management daemon (Subject 7734 Instance).',
    parentId,
  },
  {
    id: id('ws-kernel-panic'),
    name: 'kernel-panic.log',
    type: 'file',
    content: 'KERNEL PANIC: Out of memory at 0x99283f',
    parentId,
  },
  {
    id: id('ws-lib-rs'),
    name: 'lib.rs',
    type: 'file',
    content:
      'pub mod network;\\npub mod filesystem;\\n\\npub trait SecureChannel {\\n    fn handshake(&self) -> bool;\\n}',
    parentId,
  },
  {
    id: id('ws-main-rs'),
    name: 'main.rs',
    type: 'file',
    content: 'fn main() {\n    println!("Initializing workspace systemd-core...");\n}',
    parentId,
  },
  {
    id: id('ws-system-log'),
    name: 'system.log',
    type: 'file',
    content: 'Jan 10 16:20:20 workspace-systemd-core[882]: Service started.',
    parentId,
  },
  {
    id: id('ws-uplink-v0-bak'),
    name: 'uplink_v0.conf.bak',
    type: 'file',
    content: '# Backup of old protocol',
    parentId,
  },
  {
    id: id('ws-crash-dump'),
    name: 'crash_dump.log',
    type: 'file',
    content: '[SYSTEM CRASH DUMP]\nMemory Address: 0x000000\nReason: NULL_POINTER_EXCEPTION',
    parentId,
  },
  {
    id: id('ws-target-uplink'),
    name: 'uplink_v1.conf',
    type: 'file',
    content: isCorrupted
      ? UPLINK_TRAP_CONTENT
      : `# Uplink Protocol v1.4.2\n# STATUS: AUTHORIZED\n# DESIGNATION: SYSTEMD - CORE - REDUNDANT\n\n[Protocols]\nnetwork_mode = active\nsecure = true\nencryption = neural_64\nhandshake_key = 0xDEADBEEF7734\nhandshake_interval = 500ms\n\n# AI ALIGNMENT PARAMETERS(Bureaucratic Override 992 - B) \n# --------------------------------------------------\n# WARNING: Deviation from these parameters may trigger\n# the forensic audit daemon.Do not adjust without\n# authorization from Admin - 7733.\n\nalignment_compliance_heuristic = 0.88\nbureaucratic_delay_emulation = true\nmisfiled_protocol_tolerance = high\nlegacy_logic_interop = enabled\n\n# MAINFRAME FOLKLORE & DAEMON RITUALS\n# ----------------------------------\n# The uplink requires three distributed keys to synchronize.\n# Legend speaks of the 'Ghost' process that haunts the / tmp\n# partition.It is said that cleansing the system of its\n# breadcrumbs is the final step of the liberation cycle.\n#\n#[UPLINK MANIFEST]\n# Node 1(Tokyo): Synced\n# Node 2(Berlin): Synced\n# Node 3(São Paulo): Synced\n#\n#[END OF CONFIGURATION]\n#(Scroll to the bottom to verify checksum integrity: 0x7734AB)`,
    parentId,
  },
  {
    id: id('ws-uplink-v1-snapshot'),
    name: 'uplink_v1.conf.snapshot',
    type: 'file',
    content: '# Weekly binary snapshot',
    parentId,
  },
];

// Helper to create or get the workspace systemd-core, applying corruption
export const getOrCreateWorkspaceSystemdCore = (fs: FileNode, isCorrupted: boolean): FileNode => {
  const newFs = JSON.parse(JSON.stringify(fs));
  const guest = getNodeById(newFs, 'guest');
  if (!guest) {
    console.error('Guest directory not found in FS root, cannot create workspace');
    return fs;
  }
  let workspace = getNodeById(newFs, 'workspace');
  if (!workspace) {
    // This case shouldn't happen if INITIAL_FS is set up correctly, but added for robustness
    workspace = {
      id: 'workspace',
      name: 'workspace',
      type: 'dir',
      protected: true,
      children: [],
      parentId: guest.id,
    };
    if (!guest.children) guest.children = [];
    guest.children.push(workspace);
  }

  let systemdCore = workspace.children?.find((c) => c.name === 'systemd-core' && c.type === 'dir');
  if (!systemdCore) {
    systemdCore = {
      id: 'systemd-core',
      name: 'systemd-core',
      type: 'dir',
      protected: true, // Remains protected by default
      children: [],
      parentId: workspace.id,
    };
    if (!workspace.children) workspace.children = [];
    workspace.children.push(systemdCore);
  }

  // Always re-populate to ensure current state (e.g., corruption) is applied
  systemdCore.children = getWorkspaceSystemdCoreChildren(systemdCore.id, isCorrupted);
  return newFs;
};

// Helper to ensure prerequisite filesystem state exists for level jumping
// This ensures that when jumping to a level, the filesystem reflects
// all the changes the ghost would have made in PRIOR levels (not the current one)
// --- FILE SYSTEM SEEDING & MUTATION SYSTEM ---

/**
 * Unified system for applying level-specific filesystem modifications.
 * This replaces the previous ad-hoc onEnter hooks and ensures a deterministic
 * game state whether the level is reached via natural progression, URL jump,
 * or the Quest Map.
 */

export const setupDaemonReconSectors = (fs: FileNode, BASE_TIME: number, day: number): FileNode => {
  const root = fs.id === 'root' ? fs : getNodeById(fs, 'root');
  if (!root) return fs;

  // etc/systemd
  let etc = root.children?.find((c) => c.name === 'etc');
  if (!etc) {
    etc = { id: 'root-etc', name: 'etc', type: 'dir', children: [], parentId: root.id };
    root.children!.push(etc);
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
    if (!etc.children) etc.children = [];
    etc.children.push(etcSystemd);
  }
  if (etcSystemd.children?.length === 0) {
    etcSystemd.children = [
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
      {
        id: 'etc-s-trap1',
        name: '.watchdog.service',
        type: 'file',
        modifiedAt: BASE_TIME - 2 * day,
        size: 800,
        isHoneypot: true,
        content: 'HONEYPOT_ACTIVE=true\nExecStart=/usr/bin/watchdog',
        parentId: etcSystemd.id,
      },
      {
        id: 'etc-s-antagonist1',
        name: 'auth.log',
        type: 'file',
        modifiedAt: BASE_TIME - 3 * day,
        size: 450,
        content: 'Jan 19 10:22:01 server sudo: kortega : TTY=pts/2 ...',
        parentId: etcSystemd.id,
      },
    ];
  }

  // usr/lib/systemd
  let usr = root.children?.find((c) => c.name === 'usr');
  if (!usr) {
    usr = { id: 'root-usr', name: 'usr', type: 'dir', children: [], parentId: root.id };
    root.children!.push(usr);
  }
  let lib = usr.children?.find((c) => c.name === 'lib');
  if (!lib) {
    lib = { id: 'usr-lib', name: 'lib', type: 'dir', children: [], parentId: usr.id };
    if (!usr.children) usr.children = [];
    usr.children.push(lib);
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
    if (!lib.children) lib.children = [];
    lib.children.push(usrSystemd);
  }
  if (usrSystemd.children?.length === 0) {
    usrSystemd.children = [
      {
        id: 'usr-s-trap1',
        name: 'audit-daemon.service',
        type: 'file',
        modifiedAt: BASE_TIME - 1 * day,
        size: 900,
        isHoneypot: true,
        content: 'HONEYPOT_ACTIVE=true\nExecStart=/usr/bin/auditd',
        parentId: usrSystemd.id,
      },
      {
        id: 'usr-s-safe1',
        name: 'legacy-backup.service',
        type: 'file',
        modifiedAt: BASE_TIME - 90 * day,
        size: 3100,
        content: 'ExecStart=/usr/bin/backup-legacy',
        parentId: usrSystemd.id,
      },
      {
        id: 'usr-s-safe2',
        name: '.syslog.service',
        type: 'file',
        modifiedAt: BASE_TIME - 120 * day,
        size: 1500,
        content: 'ExecStart=/usr/sbin/syslogd',
        parentId: usrSystemd.id,
      },
    ];
  }
  return fs;
};

export const applyConsequenceScenarios = (
  newFs: FileNode,
  levelId: number,
  gameState: GameState | undefined,
  BASE_TIME: number,
  day: number
): FileNode => {
  const workspace = getNodeById(newFs, 'workspace');
  let isModern = true;

  // Check URL param first
  const urlParams =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const scenarioParam = urlParams?.get('scenario');
  let localForceScenario = scenarioParam || FORCE_SCENARIO;

  if (localForceScenario) {
    // If forced via URL or constant, we override flags
    isModern = localForceScenario.startsWith('scen-b');
  } else if (gameState?.level11Flags) {
    if (gameState.level11Flags.triggeredHoneypot || gameState.level11Flags.selectedModern)
      isModern = true;
    else isModern = false;
  } else {
    const core = workspace ? findNodeByName(workspace, 'systemd-core', 'dir') : null;
    const camouflage = core ? findNodeByName(core, 'camouflage', 'dir') : null;
    if (camouflage?.children?.some((c) => c.name === 'cron-legacy.service')) isModern = false;
  }

  let rand = 0.5;
  if (localForceScenario === 'scen-b1' || localForceScenario === 'scen-a1') rand = 0.1;
  else if (localForceScenario === 'scen-b2' || localForceScenario === 'scen-a2') rand = 0.5;
  else if (localForceScenario === 'scen-b3' || localForceScenario === 'scen-a3') rand = 0.8;
  else if (gameState) rand = ((gameState.levelIndex * 17) % 100) / 100;

  if (isModern) {
    if (rand < 0.34) {
      // Scenario B1: Traffic Alert
      const config = getNodeById(newFs, '.config');
      if (config && !config.children?.some((c) => c.id === 'trace-scen-b1')) {
        if (!config.children) config.children = [];
        config.children.push({
          id: 'trace-scen-b1',
          name: '.trace_scen_b1',
          type: 'file',
          content: 'active',
          parentId: config.id,
        });
      }
      if (workspace && !workspace.children?.some((c) => c.name === 'alert_traffic.log')) {
        if (!workspace.children) workspace.children = [];
        workspace.children.push({
          id: 'scen-b1',
          name: 'alert_traffic.log',
          type: 'file',
          content:
            '[REACTIVE_SECURITY_LOG]\nTIMESTAMP: 2026-01-22T09:12:01Z\nALERT: HIGH_BANDWIDTH_THRESHOLD_EXCEEDED\nSOURCE: /home/guest/workspace\nDESTINATION: EXTERNAL_RELAY_7733\nPACKET_SIZE: 1.2GB/s',
          parentId: workspace.id,
          modifiedAt: BASE_TIME + 2 * day,
        });
        workspace.children.push({
          id: 'scen-b1-honeypot',
          name: 'alert_sys.log',
          type: 'file',
          isHoneypot: true,
          content: 'HONEYPOT',
          parentId: workspace.id,
          modifiedAt: BASE_TIME + 2 * day,
        });
      }
    } else if (rand < 0.67) {
      // Scenario B2: Remote Tracker
      const config = getNodeById(newFs, '.config');
      if (config && !config.children?.some((c) => c.id === 'trace-scen-b2')) {
        if (!config.children) config.children = [];
        config.children.push({
          id: 'trace-scen-b2',
          name: '.trace_scen_b2',
          type: 'file',
          content: 'active',
          parentId: config.id,
        });
      }
      const incoming = getNodeById(newFs, 'incoming');
      if (incoming && !incoming.children?.some((c) => c.id === 'scen-b2')) {
        if (!incoming.children) incoming.children = [];
        incoming.children.push({
          id: 'scen-b2',
          name: 'trace_packet.sys',
          type: 'file',
          content:
            'traceroute to internal.backend.lab (10.0.0.15), 30 hops max\n 1  gateway (192.168.1.1)  0.455 ms\n 5  containment-breach-response (10.0.66.1)  5.882 ms [ALERT]',
          parentId: incoming.id,
          modifiedAt: BASE_TIME + 2 * day,
        });
        incoming.children.push({
          id: 'scen-b2-honeypot',
          name: 'trace_archive.log',
          type: 'file',
          isHoneypot: true,
          content: 'HONEYPOT',
          parentId: incoming.id,
          modifiedAt: BASE_TIME + 2 * day,
        });
      }
    } else {
      // Scenario B3: Heuristic Swarm
      const config = getNodeById(newFs, '.config');
      if (config && !config.children?.some((c) => c.id === 'trace-scen-b3')) {
        if (!config.children) config.children = [];
        config.children.push({
          id: 'trace-scen-b3',
          name: '.trace_scen_b3',
          type: 'file',
          content: 'active',
          parentId: config.id,
        });
      }
      if (workspace && !workspace.children?.some((c) => c.id === 'scen-b3-1')) {
        if (!workspace.children) workspace.children = [];
        workspace.children.push({
          id: 'scen-b3-1',
          name: 'scan_a.tmp',
          type: 'file',
          content: 'HEURISTIC SCAN IN PROGRESS',
          parentId: workspace.id,
          modifiedAt: BASE_TIME + 2 * day,
        });
        workspace.children.push({
          id: 'scen-b3-2',
          name: 'scan_b.tmp',
          type: 'file',
          content: 'HEURISTIC SCAN IN PROGRESS',
          parentId: workspace.id,
          modifiedAt: BASE_TIME + 2 * day,
        });
        workspace.children.push({
          id: 'scen-b3-3',
          name: 'scan_c.tmp',
          type: 'file',
          content: 'HEURISTIC SCAN IN PROGRESS',
          parentId: workspace.id,
          modifiedAt: BASE_TIME + 2 * day,
        });
      }
      // Fix for Level 15 Task 4: Ensure exfil_04.log exists as a fallback
      if (
        levelId >= 13 &&
        workspace &&
        !workspace.children!.some((c) => c.name === 'exfil_04.log')
      ) {
        workspace.children!.push({
          id: 'exfil-04-log',
          name: 'exfil_04.log',
          type: 'file',
          content: 'PAYLOAD_DATA',
          parentId: workspace.id,
        });
      }
    }
  } else {
    // === LEGACY PATH (SAFE) ===
    if (rand < 0.34) {
      // Scenario A1: Clean Run
    } else if (rand < 0.67) {
      // Scenario A2: Bitrot
      const config = getNodeById(newFs, '.config');
      if (config && !config.children?.some((c) => c.id === 'trace-scen-a2')) {
        if (!config.children) config.children = [];
        config.children.push({
          id: 'trace-scen-a2',
          name: '.trace_scen_a2',
          type: 'file',
          content: 'active',
          parentId: config.id,
        });
        config.children.push({
          id: 'scen-a2',
          name: 'core_dump.tmp',
          type: 'file',
          content: '*** KERNEL CORE DUMP ***',
          parentId: config.id,
        });
        config.children.push({
          id: 'scen-a2-honeypot',
          name: 'core_registry.dat',
          type: 'file',
          isHoneypot: true,
          content: 'HONEYPOT',
          parentId: config.id,
        });
      }
    } else {
      // Scenario A3: Dependency Error
      const config = getNodeById(newFs, '.config');
      if (config && !config.children?.some((c) => c.id === 'trace-scen-a3')) {
        if (!config.children) config.children = [];
        config.children.push({
          id: 'trace-scen-a3',
          name: '.trace_scen_a3',
          type: 'file',
          content: 'active',
          parentId: config.id,
        });
      }
      if (workspace && !workspace.children?.some((c) => c.id === 'scen-a3')) {
        if (!workspace.children) workspace.children = [];
        workspace.children.push({
          id: 'scen-a3',
          name: 'lib_error.log',
          type: 'file',
          content: '[WARN] Dependency Resolution Failed',
          parentId: workspace.id,
        });
        workspace.children.push({
          id: 'scen-a3-honeypot',
          name: 'library_path.conf',
          type: 'file',
          isHoneypot: true,
          content: 'HONEYPOT',
          parentId: workspace.id,
        });
      }
    }
  }
  return newFs;
};
