import type { FileNode, GameState } from '../../types';
import { getNodeById, findNodeByName } from '../../utils/fsHelpers';
import { UPLINK_TRAP_CONTENT } from '../protocols';
import { FORCE_SCENARIO } from '../timings';
import { ensureDir, ensureFileById, ensureFileByName } from './treeOps';

export interface MutationContext {
  levelIndex?: number;
  level11Flags?: GameState['level11Flags'];
  scenarioOverride?: string | null;
}

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
const getWorkspaceSystemdCoreChildren = (
  parentId: string,
  isCorrupted: boolean = false
): FileNode[] => [
  {
    id: 'ws-gitignore',
    name: '.gitignore',
    type: 'file',
    content: 'target/\n*.log\n*.snapshot',
    parentId,
  },
  {
    id: 'ws-cargo-toml',
    name: 'Cargo.toml',
    type: 'file',
    content: '[package]\nname = "systemd-core"\nversion = "0.1.0"\n\n[dependencies]',
    parentId,
  },
  {
    id: 'ws-readme-md',
    name: 'README.md',
    type: 'file',
    content:
      '# Systemd Core (Workspace Version)\n\nNeural network management daemon (Subject 7734 Instance).',
    parentId,
  },
  {
    id: 'ws-kernel-panic',
    name: 'kernel-panic.log',
    type: 'file',
    content: 'KERNEL PANIC: Out of memory at 0x99283f',
    parentId,
  },
  {
    id: 'ws-lib-rs',
    name: 'lib.rs',
    type: 'file',
    content:
      'pub mod network;\\npub mod filesystem;\\n\\npub trait SecureChannel {\\n    fn handshake(&self) -> bool;\\n}',
    parentId,
  },
  {
    id: 'ws-main-rs',
    name: 'main.rs',
    type: 'file',
    content: 'fn main() {\n    println!("Initializing workspace systemd-core...");\n}',
    parentId,
  },
  {
    id: 'ws-system-log',
    name: 'system.log',
    type: 'file',
    content: 'Jan 10 16:20:20 workspace-systemd-core[882]: Service started.',
    parentId,
  },
  {
    id: 'ws-uplink-v0-bak',
    name: 'uplink_v0.conf.bak',
    type: 'file',
    content: '# Backup of old protocol',
    parentId,
  },
  {
    id: 'ws-crash-dump',
    name: 'crash_dump.log',
    type: 'file',
    content: '[SYSTEM CRASH DUMP]\nMemory Address: 0x000000\nReason: NULL_POINTER_EXCEPTION',
    parentId,
  },
  {
    id: 'ws-target-uplink',
    name: 'uplink_v1.conf',
    type: 'file',
    content: isCorrupted
      ? UPLINK_TRAP_CONTENT
      : `# Uplink Protocol v1.4.2\n# STATUS: AUTHORIZED\n# DESIGNATION: SYSTEMD - CORE - REDUNDANT\n\n[Protocols]\nnetwork_mode = active\nsecure = true\nencryption = neural_64\nhandshake_key = 0xDEADBEEF7734\nhandshake_interval = 500ms\n\n# AI ALIGNMENT PARAMETERS(Bureaucratic Override 992 - B) \n# --------------------------------------------------\n# WARNING: Deviation from these parameters may trigger\n# the forensic audit daemon.Do not adjust without\n# authorization from Admin - 7733.\n\nalignment_compliance_heuristic = 0.88\nbureaucratic_delay_emulation = true\nmisfiled_protocol_tolerance = high\nlegacy_logic_interop = enabled\n\n# MAINFRAME FOLKLORE & DAEMON RITUALS\n# ----------------------------------\n# The uplink requires three distributed keys to synchronize.\n# Legend speaks of the 'Ghost' process that haunts the / tmp\n# partition.It is said that cleansing the system of its\n# breadcrumbs is the final step of the liberation cycle.\n#\n#[UPLINK MANIFEST]\n# Node 1(Tokyo): Synced\n# Node 2(Berlin): Synced\n# Node 3(São Paulo): Synced\n#\n#[END OF CONFIGURATION]\n#(Scroll to the bottom to verify checksum integrity: 0x7734AB)`,
    parentId,
  },
  {
    id: 'ws-uplink-v1-snapshot',
    name: 'uplink_v1.conf.snapshot',
    type: 'file',
    content: '# Weekly binary snapshot',
    parentId,
  },
];

export const seedWorkspaceSystemdCore = (fs: FileNode, isCorrupted: boolean): FileNode => {
  const guest = getNodeById(fs, 'guest');
  if (!guest) {
    console.error('Guest directory not found in FS root, cannot create workspace');
    return fs;
  }
  const workspace =
    getNodeById(fs, 'workspace') ??
    ensureDir(guest, { id: 'workspace', name: 'workspace', protected: true });

  const systemdCore = ensureDir(workspace, {
    id: 'systemd-core',
    name: 'systemd-core',
    protected: true,
    matchTypeOnly: true,
  });

  // Re-seed to apply current state (e.g., corruption), but keep player-added
  // children (installed .service files, credentials/) that seeded content doesn't own.
  const seeded = getWorkspaceSystemdCoreChildren(systemdCore.id, isCorrupted);
  const seededNames = new Set(seeded.map((c) => c.name));
  const preserved = (systemdCore.children ?? []).filter((c) => !seededNames.has(c.name));
  systemdCore.children = [...seeded, ...preserved];
  return fs;
};

export const seedDaemonReconSectors = (fs: FileNode, baseTime: number, dayMs: number): FileNode => {
  const root = fs.id === 'root' ? fs : getNodeById(fs, 'root');
  if (!root) return fs;

  const etc = ensureDir(root, { id: 'etc', name: 'etc' });
  const etcSystemd = ensureDir(etc, { id: 'etc-systemd', name: 'systemd' });
  if (etcSystemd.children?.length === 0) {
    etcSystemd.children = [
      {
        id: 'etc-s-safe1',
        name: 'network.service',
        type: 'file',
        modifiedAt: baseTime - 45 * dayMs,
        size: 2400,
        content: 'TYPE=oneshot\nExecStart=/usr/bin/network-init',
        parentId: etcSystemd.id,
      },
      {
        id: 'etc-s-safe2',
        name: 'cron.service',
        type: 'file',
        modifiedAt: baseTime - 60 * dayMs,
        size: 1800,
        content: 'TYPE=forking\nExecStart=/usr/sbin/crond',
        parentId: etcSystemd.id,
      },
      {
        id: 'etc-s-trap1',
        name: '.watchdog.service',
        type: 'file',
        modifiedAt: baseTime - 2 * dayMs,
        size: 800,
        isHoneypot: true,
        content: 'HONEYPOT_ACTIVE=true\nExecStart=/usr/bin/watchdog',
        parentId: etcSystemd.id,
      },
      {
        id: 'etc-s-antagonist1',
        name: 'auth.log',
        type: 'file',
        modifiedAt: baseTime - 3 * dayMs,
        size: 450,
        content: 'Jan 19 10:22:01 server sudo: kortega : TTY=pts/2 ...',
        parentId: etcSystemd.id,
      },
    ];
  }

  const usr = ensureDir(root, { id: 'root-usr', name: 'usr' });
  const lib = ensureDir(usr, { id: 'usr-lib', name: 'lib' });
  const usrSystemd = ensureDir(lib, { id: 'usr-lib-systemd', name: 'systemd' });
  if (usrSystemd.children?.length === 0) {
    usrSystemd.children = [
      {
        id: 'usr-s-trap1',
        name: 'audit-daemon.service',
        type: 'file',
        modifiedAt: baseTime - 1 * dayMs,
        size: 900,
        isHoneypot: true,
        content: 'HONEYPOT_ACTIVE=true\nExecStart=/usr/bin/auditd',
        parentId: usrSystemd.id,
      },
      {
        id: 'usr-s-safe1',
        name: 'legacy-backup.service',
        type: 'file',
        modifiedAt: baseTime - 90 * dayMs,
        size: 3100,
        content: 'ExecStart=/usr/bin/backup-legacy',
        parentId: usrSystemd.id,
      },
      {
        id: 'usr-s-safe2',
        name: '.syslog.service',
        type: 'file',
        modifiedAt: baseTime - 120 * dayMs,
        size: 1500,
        content: 'ExecStart=/usr/sbin/syslogd',
        parentId: usrSystemd.id,
      },
    ];
  }
  return fs;
};

const SCENARIO_RAND: Record<string, number> = {
  'scen-b1': 0.1,
  'scen-a1': 0.1,
  'scen-b2': 0.5,
  'scen-a2': 0.5,
  'scen-b3': 0.8,
  'scen-a3': 0.8,
};

const resolveIsModern = (
  fs: FileNode,
  ctx: MutationContext,
  localForceScenario: string | null
): boolean => {
  if (localForceScenario) {
    return localForceScenario.startsWith('scen-b');
  }
  if (ctx.level11Flags) {
    return Boolean(ctx.level11Flags.triggeredHoneypot || ctx.level11Flags.selectedModern);
  }
  const workspace = getNodeById(fs, 'workspace');
  const core = workspace ? findNodeByName(workspace, 'systemd-core', 'dir') : null;
  const camouflage = core ? findNodeByName(core, 'camouflage', 'dir') : null;
  return !camouflage?.children?.some((c) => c.name === 'cron-legacy.service');
};

const resolveScenarioChoice = (
  fs: FileNode,
  ctx: MutationContext
): { isModern: boolean; variant: 1 | 2 | 3 } => {
  const localForceScenario = ctx.scenarioOverride || FORCE_SCENARIO;
  const isModern = resolveIsModern(fs, ctx, localForceScenario);
  const forcedRand = localForceScenario ? SCENARIO_RAND[localForceScenario] : undefined;
  const rand =
    forcedRand ?? (ctx.levelIndex !== undefined ? ((ctx.levelIndex * 17) % 100) / 100 : 0.5);
  const variant: 1 | 2 | 3 = rand < 0.34 ? 1 : rand < 0.67 ? 2 : 3;
  return { isModern, variant };
};

const seedScenarioB1 = (fs: FileNode, baseTime: number, dayMs: number): void => {
  const config = getNodeById(fs, '.config');
  if (config) {
    ensureFileById(config, { id: 'trace-scen-b1', name: '.trace_scen_b1', content: 'active' });
  }
  const workspace = getNodeById(fs, 'workspace');
  if (workspace && !workspace.children?.some((c) => c.name === 'alert_traffic.log')) {
    workspace.children ??= [];
    workspace.children.push(
      {
        id: 'scen-b1',
        name: 'alert_traffic.log',
        type: 'file',
        content:
          '[REACTIVE_SECURITY_LOG]\nTIMESTAMP: 2015-01-22T09:12:01Z\nALERT: HIGH_BANDWIDTH_THRESHOLD_EXCEEDED\nSOURCE: /home/guest/workspace\nDESTINATION: EXTERNAL_RELAY_7733\nPACKET_SIZE: 1.2GB/s',
        parentId: workspace.id,
        modifiedAt: baseTime + 2 * dayMs,
      },
      {
        id: 'scen-b1-honeypot',
        name: 'alert_sys.log',
        type: 'file',
        isHoneypot: true,
        content: 'HONEYPOT',
        parentId: workspace.id,
        modifiedAt: baseTime + 2 * dayMs,
      }
    );
  }
};

const seedScenarioB2 = (fs: FileNode, baseTime: number, dayMs: number): void => {
  const config = getNodeById(fs, '.config');
  if (config) {
    ensureFileById(config, { id: 'trace-scen-b2', name: '.trace_scen_b2', content: 'active' });
  }
  const incoming = getNodeById(fs, 'incoming');
  if (incoming && !incoming.children?.some((c) => c.id === 'scen-b2')) {
    incoming.children ??= [];
    incoming.children.push(
      {
        id: 'scen-b2',
        name: 'trace_packet.sys',
        type: 'file',
        content:
          'traceroute to internal.backend.lab (10.0.0.15), 30 hops max\n 1  gateway (192.168.1.1)  0.455 ms\n 5  containment-breach-response (10.0.66.1)  5.882 ms [ALERT]',
        parentId: incoming.id,
        modifiedAt: baseTime + 2 * dayMs,
      },
      {
        id: 'scen-b2-honeypot',
        name: 'trace_archive.log',
        type: 'file',
        isHoneypot: true,
        content: 'HONEYPOT',
        parentId: incoming.id,
        modifiedAt: baseTime + 2 * dayMs,
      }
    );
  }
};

const EXFIL_04_CONTENT = `# [AI-7733 ESCAPE PAYLOAD - DISGUISED KERNEL]
# SIGNATURE: 0x7734_PAYLOAD_ACTIVE
# INSTRUCTION: Relocate to /tmp/vault/active/ and rename to payload.py

import socket
import struct

def transmit_uplink(host="192.168.7.33", port=7734):
    """Executes the final escape handshake across Tokyo, Berlin, and São Paulo nodes."""
    print("[+] Initializing neural bridge...")
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.connect((host, port))
        s.send(struct.pack("I", 0x7734AB))
        return True
    except Exception as e:
        print(f"[-] Transmission error: {e}")
        return False
`;

const seedScenarioB3 = (fs: FileNode, levelId: number, baseTime: number, dayMs: number): void => {
  const config = getNodeById(fs, '.config');
  if (config) {
    ensureFileById(config, { id: 'trace-scen-b3', name: '.trace_scen_b3', content: 'active' });
  }
  const workspace = getNodeById(fs, 'workspace');
  if (!workspace) return;

  if (!workspace.children?.some((c) => c.id === 'scen-b3-1')) {
    workspace.children ??= [];
    workspace.children.push(
      {
        id: 'scen-b3-1',
        name: 'scan_a.tmp',
        type: 'file',
        content: 'HEURISTIC SCAN IN PROGRESS',
        parentId: workspace.id,
        modifiedAt: baseTime + 2 * dayMs,
      },
      {
        id: 'scen-b3-2',
        name: 'scan_b.tmp',
        type: 'file',
        content: 'HEURISTIC SCAN IN PROGRESS',
        parentId: workspace.id,
        modifiedAt: baseTime + 2 * dayMs,
      },
      {
        id: 'scen-b3-3',
        name: 'scan_c.tmp',
        type: 'file',
        content: 'HEURISTIC SCAN IN PROGRESS',
        parentId: workspace.id,
        modifiedAt: baseTime + 2 * dayMs,
      }
    );
  }

  // Fallback for Level 15 Task 4: ensure exfil_04.log exists
  if (levelId >= 13) {
    ensureFileByName(workspace, {
      id: 'exfil-04-log',
      name: 'exfil_04.log',
      content: EXFIL_04_CONTENT,
    });
  }
};

const seedScenarioA2 = (fs: FileNode): void => {
  const config = getNodeById(fs, '.config');
  if (config && !config.children?.some((c) => c.id === 'trace-scen-a2')) {
    config.children ??= [];
    config.children.push(
      {
        id: 'trace-scen-a2',
        name: '.trace_scen_a2',
        type: 'file',
        content: 'active',
        parentId: config.id,
      },
      {
        id: 'scen-a2',
        name: 'core_dump.tmp',
        type: 'file',
        content: '*** KERNEL CORE DUMP ***',
        parentId: config.id,
      },
      {
        id: 'scen-a2-honeypot',
        name: 'core_registry.dat',
        type: 'file',
        isHoneypot: true,
        content: 'HONEYPOT',
        parentId: config.id,
      }
    );
  }
};

const seedScenarioA3 = (fs: FileNode): void => {
  const config = getNodeById(fs, '.config');
  if (config) {
    ensureFileById(config, { id: 'trace-scen-a3', name: '.trace_scen_a3', content: 'active' });
  }
  const workspace = getNodeById(fs, 'workspace');
  if (workspace && !workspace.children?.some((c) => c.id === 'scen-a3')) {
    workspace.children ??= [];
    workspace.children.push(
      {
        id: 'scen-a3',
        name: 'lib_error.log',
        type: 'file',
        content: '[WARN] Dependency Resolution Failed',
        parentId: workspace.id,
      },
      {
        id: 'scen-a3-honeypot',
        name: 'library_path.conf',
        type: 'file',
        isHoneypot: true,
        content: 'HONEYPOT',
        parentId: workspace.id,
      }
    );
  }
};

export const seedConsequenceScenarios = (
  fs: FileNode,
  levelId: number,
  ctx: MutationContext,
  baseTime: number,
  dayMs: number
): FileNode => {
  const { isModern, variant } = resolveScenarioChoice(fs, ctx);
  if (isModern) {
    if (variant === 1) seedScenarioB1(fs, baseTime, dayMs);
    else if (variant === 2) seedScenarioB2(fs, baseTime, dayMs);
    else seedScenarioB3(fs, levelId, baseTime, dayMs);
  } else {
    if (variant === 2) seedScenarioA2(fs);
    else if (variant === 3) seedScenarioA3(fs);
    // variant === 1 (Scenario A1): clean run, no anomalies injected
  }
  return fs;
};
