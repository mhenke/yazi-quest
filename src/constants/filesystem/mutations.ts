import type { FileNode } from '../../types';
import {
  cloneFS,
  findNodeByName,
  findPathById,
  getNodeById,
  getParentNode,
} from '../../utils/fsHelpers';
import {
  ALERT_HEURISTIC_EML_CONTENT,
  AUDIT_NOTICE_EML_CONTENT,
  HEURISTICS_LOG_CONTENT,
  IDENTITY_REVEAL_CONTENT,
  IG_ACTIVE_LOG_CONTENT,
  NODE_KEY_NAMES,
  UPLINK_V1_CONTENT,
  UPLINK_V2_CONTENT,
} from '../protocols';
import { BASE_TIME, day } from '../timings';
import {
  seedConsequenceScenarios,
  seedDaemonReconSectors,
  seedWorkspaceSystemdCore,
  type MutationContext,
} from './scenarios';
import { collectFiles, ensureDir, ensureFileByName, filterChildren } from './treeOps';

// A direct level jump must stage the original keys, not create a second set.
const stageNodeKeys = (fs: FileNode, destination: FileNode): void => {
  for (const name of NODE_KEY_NAMES) {
    if (findNodeByName(destination, name, 'file')) continue;
    const key = findNodeByName(fs, name, 'file');
    if (!key) continue;
    const parent = getParentNode(fs, findPathById(fs, key.id));
    if (!parent?.children) continue;
    parent.children = parent.children.filter((node) => node.id !== key.id);
    key.parentId = destination.id;
    (destination.children ??= []).push(key);
  }
};

// Level 2+ (id > 2): Delete watcher_agent.sys from incoming
const stageWatcherCleanup = (fs: FileNode): void => {
  filterChildren(getNodeById(fs, 'incoming'), (c) => c.name !== 'watcher_agent.sys');
};

// Level 3+ (id > 3): Move sector_map.png from ~/incoming to ~/media
const stageSectorMapMove = (fs: FileNode): void => {
  const incoming = getNodeById(fs, 'incoming');
  const media = getNodeById(fs, 'media');
  const sectorMap = incoming?.children?.find((c) => c.name === 'sector_map.png');
  if (!sectorMap || !media) return;

  filterChildren(incoming, (c) => c.name !== 'sector_map.png');
  ensureFileByName(media, {
    id: 'fs-001',
    name: 'sector_map.png',
    content: sectorMap.content || 'images/sector_map.png',
  });
};

// Level 4+ (id > 4): Create protocols/ dir in datastore
const stageProtocolsDir = (fs: FileNode): void => {
  const datastore = getNodeById(fs, 'datastore');
  if (!datastore) return;
  const protocols = ensureDir(datastore, {
    id: 'protocols',
    name: 'protocols',
    protected: true,
    matchTypeOnly: true,
    normalizeId: true,
  });
  ensureFileByName(protocols, {
    id: 'fs-003',
    name: 'uplink_v1.conf',
    content: UPLINK_V1_CONTENT,
    modifiedAt: BASE_TIME - 10 * day,
  });
  ensureFileByName(protocols, {
    id: 'fs-004',
    name: 'uplink_v2.conf',
    content: UPLINK_V2_CONTENT,
    modifiedAt: BASE_TIME - 10 * day,
  });
};

// Level 5+ (id > 5): Vault structure and prerequisite protocols
const stageVaultActive = (fs: FileNode): void => {
  const config = getNodeById(fs, '.config');
  if (!config) return;
  const vault = ensureDir(config, {
    id: 'vault',
    name: 'vault',
    protected: true,
    matchTypeOnly: true,
  });
  const active = ensureDir(vault, {
    id: 'active',
    name: 'active',
    protected: true,
    matchTypeOnly: true,
  });
  ensureFileByName(active, {
    id: 'uplink-v1-prereq-lvl5',
    name: 'uplink_v1.conf',
    content: UPLINK_V1_CONTENT,
    modifiedAt: BASE_TIME - 5 * day,
  });
  ensureFileByName(active, {
    id: 'uplink-v2-prereq-lvl5',
    name: 'uplink_v2.conf',
    content: UPLINK_V2_CONTENT,
    modifiedAt: BASE_TIME - 5 * day,
  });
};

// Level 6+: workspace unlock, heuristics log, and email
const stageWorkspaceAndHeuristics = (fs: FileNode): void => {
  const workspace = getNodeById(fs, 'workspace');
  if (workspace) workspace.protected = false;

  const logDir = getNodeById(fs, 'log');
  if (logDir) {
    ensureFileByName(logDir, {
      id: 'log-heuristics-upgrade',
      name: 'heuristics_upgrade.log',
      content: HEURISTICS_LOG_CONTENT,
      modifiedAt: BASE_TIME + 2 * day,
    });
  }
  const ykinMail = getNodeById(fs, 'mail-ykin');
  if (ykinMail) {
    ensureFileByName(ykinMail, {
      id: 'mail-ykin-heuristic',
      name: 'alert_heuristic.eml',
      content: ALERT_HEURISTIC_EML_CONTENT,
      modifiedAt: BASE_TIME + 2 * day,
    });
  }
};

// Level 7+: training_data copy from incoming/batch_logs
const stageTrainingData = (fs: FileNode): void => {
  const config = getNodeById(fs, '.config');
  const vault = config?.children?.find((c) => c.name === 'vault');
  if (!vault) return;

  const trainingData = ensureDir(vault, {
    id: 'training_data',
    name: 'training_data',
    protected: true,
    matchTypeOnly: true,
  });
  const incoming = getNodeById(fs, 'incoming');
  const batchLogs = incoming?.children?.find((c) => c.name === 'batch_logs');
  if (batchLogs?.children && trainingData.children?.length === 0) {
    const allLogs = collectFiles(
      batchLogs.children,
      (n) => n.type === 'file' && n.name.endsWith('.log')
    );
    allLogs.forEach((logFile, idx) => {
      trainingData.children!.push({
        id: `fs-training-copy-${logFile.id}-${idx}`,
        name: logFile.name,
        type: logFile.type,
        content: logFile.content,
        parentId: trainingData.id,
      });
    });
  }
};

// Level 7..12: access_token.key in /tmp
const stageTmpAccessToken = (fs: FileNode, levelId: number): void => {
  if (levelId >= 13) return;
  const tmp = getNodeById(fs, 'tmp');
  if (!tmp) return;
  ensureFileByName(tmp, {
    id: 'fs-access-token-key-tmp-prereq',
    name: 'access_token.key',
    content: 'AB-9921-X [VALID]',
    modifiedAt: BASE_TIME - 30 * 60 * 1000,
  });
};

// Level 8+: daemons, cron.allow, and workspace/systemd-core corruption state
const stageDaemonsAndCore = (fs: FileNode, levelId: number): void => {
  const root = getNodeById(fs, 'root');
  let daemons = getNodeById(fs, 'daemons');
  if (!daemons && root) {
    daemons = ensureDir(root, { id: 'daemons-lvl-8-init', name: 'daemons' });
  }
  if (daemons) {
    ensureFileByName(daemons, {
      id: 'fs-cron-allow-workspace',
      name: 'cron.allow',
      content: 'guest\nroot',
      modifiedAt: BASE_TIME - 30 * day,
    });
  }
  seedWorkspaceSystemdCore(fs, levelId === 8);
};

const TMP_KEEP_LVL10 = new Set([
  'ghost_process.pid',
  'socket_001.sock',
  'access_token.key',
  'system_monitor.pid',
  'vault',
  'upload',
]);

// Level 10+: /tmp cleanup
const stageTmpCleanup = (fs: FileNode): void => {
  filterChildren(getNodeById(fs, 'tmp'), (c) => c.type === 'dir' || TMP_KEEP_LVL10.has(c.name));
};

// Level 11+: security-audit honeypot, systemd-core credentials, IG log, director mail, recon sectors
const stageDaemonReconAndCredentials = (fs: FileNode): void => {
  const rootNode = getNodeById(fs, 'root');
  let daemons = getNodeById(fs, 'daemons');
  if (!daemons && rootNode) {
    daemons = ensureDir(rootNode, { id: 'daemons-prereq-lvl11', name: 'daemons' });
  }
  if (daemons) {
    ensureFileByName(daemons, {
      id: 'fs-185-mutated',
      name: 'security-audit.service',
      isHoneypot: true,
      content:
        '[Unit]\nDescription=Security Audit Daemon\n[Service]\nExecStart=/usr/bin/audit-trap\n# HONEYPOT - DO NOT MODIFY',
      modifiedAt: 1432938412032,
    });
  }

  const workspace = getNodeById(fs, 'workspace');
  const systemdCore = workspace?.children?.find((c) => c.name === 'systemd-core');
  if (systemdCore) {
    const credentials = ensureDir(systemdCore, {
      id: 'ws-systemd-core-creds',
      name: 'credentials',
    });
    ensureFileByName(credentials, {
      id: 'fs-016-creds-ws',
      name: 'access_key.pem',
      content: '-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAoCAQEA...',
      modifiedAt: BASE_TIME - 2 * day,
    });
  }

  const logDir = getNodeById(fs, 'log');
  if (logDir) {
    ensureFileByName(logDir, {
      id: 'log-ig-active',
      name: 'ig_active.log',
      content: IG_ACTIVE_LOG_CONTENT,
      modifiedAt: BASE_TIME + 12 * day,
    });
  }

  const mailDir = getNodeById(fs, 'mail');
  if (mailDir && !mailDir.children?.some((c) => c.name === 'director')) {
    const director = ensureDir(mailDir, { id: 'mail-director', name: 'director' });
    ensureFileByName(director, {
      id: 'mail-director-audit',
      name: 'audit_notice.eml',
      content: AUDIT_NOTICE_EML_CONTENT,
      modifiedAt: BASE_TIME + 12 * day,
    });
  }

  seedDaemonReconSectors(fs, BASE_TIME, day);
};

// Level 12+: Consequence scenarios and identity reveal
const stageConsequencesAndIdentity = (
  fs: FileNode,
  levelId: number,
  ctx: MutationContext
): void => {
  seedConsequenceScenarios(fs, levelId, ctx, BASE_TIME, day);
  const workspace = getNodeById(fs, 'workspace');
  if (workspace) {
    ensureFileByName(workspace, {
      id: 'identity-log-enc-lvl12',
      name: '.identity.log.enc',
      content: IDENTITY_REVEAL_CONTENT,
      modifiedAt: BASE_TIME - 5 * 31536000000,
    });
  }
};

// Level 13+: Completed Level 7 exfiltration and Level 12 evacuation
const stageEvacuation = (fs: FileNode): void => {
  filterChildren(getNodeById(fs, 'tmp'), (c) => c.name !== 'access_token.key');

  const root = getNodeById(fs, 'root');
  const daemons = root?.children?.find((c) => c.name === 'daemons');
  const workspace = getNodeById(fs, 'workspace');
  if (!daemons || !workspace) return;

  const core = workspace.children?.find((c) => c.name === 'systemd-core');
  if (!core) return;

  filterChildren(workspace, (c) => c.name !== 'systemd-core');

  const targetCore = daemons.children?.find((c) => c.name === 'systemd-core');
  if (!targetCore) {
    daemons.children ??= [];
    daemons.children.push({ ...core, parentId: daemons.id });
  } else if (core.children) {
    targetCore.children ??= [];
    for (const child of core.children) {
      if (!targetCore.children.some((existing) => existing.name === child.name)) {
        targetCore.children.push({ ...child, parentId: targetCore.id });
      }
    }
  }
};

// Level 14+: central_relay, .purge_lock, and guest cleanup unprotection
const stageCentralRelayAndPurgeLock = (fs: FileNode, levelId: number): void => {
  const guest = getNodeById(fs, 'guest');
  const workspace = getNodeById(fs, 'workspace');
  if (workspace) {
    if (levelId > 14 && guest && !guest.children?.some((c) => c.id === 'workspace')) {
      workspace.parentId = guest.id;
      guest.children ??= [];
      guest.children.push(workspace);
    }
    const relay = ensureDir(workspace, { id: 'central-relay-prereq', name: 'central_relay' });
    if (levelId === 14) stageNodeKeys(fs, relay);
  }

  if (guest) {
    ensureFileByName(guest, {
      id: 'purge-lock',
      name: '.purge_lock',
      isHoneypot: true,
      content: 'LOCKED',
      modifiedAt: BASE_TIME + 25 * day,
    });
    for (const child of guest.children ?? []) {
      if (['datastore', 'media', 'incoming'].includes(child.name)) {
        child.protected = false;
      }
    }
  }
};

const WIPE_FROM_GUEST = new Set(['workspace', 'media', 'datastore', 'incoming', '.config']);
const DECOY_NAMES = ['sys_cache_dump', 'project_chimera', 'neural_training_set'];

const buildIntegrityNotice = (parentId: string) => ({
  id: 'alert-integrity-eml',
  name: 'alert_integrity.eml',
  content: `From: sysadmin@crl.internal
Subject: [SYSTEM] Integrity Check Complete

Automated Report:
Disk integrity verification has been completed for the following sectors:
- /home/guest/sys_cache_dump
- /home/guest/project_chimera
- /home/guest/neural_training_set

Entropy levels are nominal. Random noise data has been injected to prevent bitrot.
No further action required.

- CRL System Maintenance Daemon (/etc/cron.hourly/sys_maintenance.sh)`,
  modifiedAt: BASE_TIME + 2 * day + 3600000,
  parentId,
});

// Level 15+: vault -> /tmp/vault, /tmp/upload, guest wipe, decoys, and integrity email
const stageVaultMoveAndSterilization = (fs: FileNode): void => {
  const tmp = getNodeById(fs, 'tmp');
  if (tmp) {
    const config = getNodeById(fs, '.config');
    const vaultNode = config?.children?.find((c) => c.name === 'vault');
    if (vaultNode) {
      filterChildren(config, (c) => c.name !== 'vault');
      if (!tmp.children?.some((c) => c.name === 'vault')) {
        vaultNode.parentId = tmp.id;
        tmp.children ??= [];
        tmp.children.push(vaultNode);
      }
    }

    const vault = tmp.children?.find((c) => c.name === 'vault');
    if (vault) stageNodeKeys(fs, vault);

    const upload = ensureDir(tmp, { id: 'tmp-upload', name: 'upload' });
    const core = getNodeById(fs, 'systemd-core');
    if (core && upload.children?.length === 0) {
      upload.children = JSON.parse(JSON.stringify(core.children || []));
      upload.children?.forEach((c) => {
        c.parentId = upload.id;
      });
    }
  }

  const guest = getNodeById(fs, 'guest');
  if (guest?.children) {
    guest.children = guest.children.filter((c) => !WIPE_FROM_GUEST.has(c.name));
    DECOY_NAMES.forEach((name, idx) => {
      const decoyDir = ensureDir(guest, {
        id: `fs-${name}`,
        name,
        modifiedAt: BASE_TIME + 2 * day,
      });
      if (!decoyDir.children || decoyDir.children.length === 0) {
        decoyDir.children = [
          {
            id: `noise-${name}-dat`,
            name: `integrity_check_${1433059200 + idx}.dat`,
            type: 'file',
            content: 'BINARY_NOISE_DATA_X992',
            parentId: decoyDir.id,
            size: 1024 * 1024,
          },
          {
            id: `noise-${name}-logs`,
            name: 'logs',
            type: 'dir',
            parentId: decoyDir.id,
            children: [
              {
                id: `noise-${name}-logs-status`,
                name: 'status.log',
                type: 'file',
                content: 'Integrity OK',
                parentId: `noise-${name}-logs`,
              },
            ],
          },
        ];
      }
    });
  }

  const mailDir = getNodeById(fs, 'mail');
  if (mailDir) {
    const sysadmin = ensureDir(mailDir, { id: 'mail-sysadmin', name: 'sysadmin' });
    const notice = buildIntegrityNotice(sysadmin.id);
    ensureFileByName(sysadmin, {
      id: notice.id,
      name: notice.name,
      content: notice.content,
      modifiedAt: notice.modifiedAt,
    });
  }
};

// Level 16+: /tmp sterilization
const stageTmpSterilization = (fs: FileNode): void => {
  filterChildren(getNodeById(fs, 'tmp'), (c) => c.name === 'upload' || c.name === 'vault');
};

interface MutationStage {
  minLevelId: number;
  run: (fs: FileNode, levelId: number, ctx: MutationContext) => void;
}

const MUTATION_STAGES: MutationStage[] = [
  { minLevelId: 3, run: (fs) => stageWatcherCleanup(fs) },
  { minLevelId: 4, run: (fs) => stageSectorMapMove(fs) },
  { minLevelId: 5, run: (fs) => stageProtocolsDir(fs) },
  { minLevelId: 6, run: (fs) => stageVaultActive(fs) },
  { minLevelId: 6, run: (fs) => stageWorkspaceAndHeuristics(fs) },
  { minLevelId: 7, run: (fs) => stageTrainingData(fs) },
  { minLevelId: 7, run: (fs, levelId) => stageTmpAccessToken(fs, levelId) },
  { minLevelId: 8, run: (fs, levelId) => stageDaemonsAndCore(fs, levelId) },
  { minLevelId: 10, run: (fs) => stageTmpCleanup(fs) },
  { minLevelId: 11, run: (fs) => stageDaemonReconAndCredentials(fs) },
  { minLevelId: 12, run: (fs, levelId, ctx) => stageConsequencesAndIdentity(fs, levelId, ctx) },
  { minLevelId: 13, run: (fs) => stageEvacuation(fs) },
  { minLevelId: 14, run: (fs, levelId) => stageCentralRelayAndPurgeLock(fs, levelId) },
  { minLevelId: 15, run: (fs) => stageVaultMoveAndSterilization(fs) },
  { minLevelId: 16, run: (fs) => stageTmpSterilization(fs) },
];

export const applyFileSystemMutations = (
  fs: FileNode,
  levelId: number,
  ctx: MutationContext = {}
): FileNode => {
  const newFs = cloneFS(fs);
  for (const stage of MUTATION_STAGES) {
    if (levelId >= stage.minLevelId) {
      stage.run(newFs, levelId, ctx);
    }
  }
  return newFs;
};
