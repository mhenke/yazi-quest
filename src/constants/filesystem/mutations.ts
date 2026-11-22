import type { FileNode, GameState } from '../../types';
import { getNodeById } from '../../utils/fsHelpers';
import {
  UPLINK_V1_CONTENT,
  UPLINK_V2_CONTENT,
  HEURISTICS_LOG_CONTENT,
  ALERT_HEURISTIC_EML_CONTENT,
  IG_ACTIVE_LOG_CONTENT,
  AUDIT_NOTICE_EML_CONTENT,
  IDENTITY_REVEAL_CONTENT,
} from '../protocols';
import { BASE_TIME, day } from '../timings';
import {
  setupDaemonReconSectors,
  applyConsequenceScenarios,
  getOrCreateWorkspaceSystemdCore,
} from './scenarios';

const cloneFS = (fs: FileNode): FileNode => JSON.parse(JSON.stringify(fs));

export const applyFileSystemMutations = (
  fs: FileNode,
  levelId: number,
  gameState?: GameState
): FileNode => {
  let newFs = cloneFS(fs);

  // 1. ANTECEDENT HISTORY & IMMEDIATE MUTATIONS (Consolidated)

  // Level 2+: Delete watcher_agent.sys from incoming (Player does this in Level 2)
  if (levelId > 2) {
    const incoming = getNodeById(newFs, 'incoming');
    if (incoming?.children) {
      incoming.children = incoming.children.filter((c) => c.name !== 'watcher_agent.sys');
    }
  }

  // Level 3+: Move sector_map.png from ~/incoming to ~/media (Player does this in Level 3)
  if (levelId > 3) {
    const incoming = getNodeById(newFs, 'incoming');
    const media = getNodeById(newFs, 'media');
    const sectorMap = incoming?.children?.find((c) => c.name === 'sector_map.png');

    if (sectorMap && media) {
      if (incoming?.children) {
        incoming.children = incoming.children.filter((c) => c.name !== 'sector_map.png');
      }
      if (!media.children?.find((c) => c.name === 'sector_map.png')) {
        if (!media.children) media.children = [];
        media.children.push({
          id: 'fs-001',
          name: 'sector_map.png',
          type: 'file',
          content: sectorMap.content || 'images/sector_map.png',
          parentId: media.id,
        });
      }
    }
  }

  // Level 4+: Create protocols/ dir in datastore (Player does this in Level 4)
  if (levelId > 4) {
    const datastore = getNodeById(newFs, 'datastore');
    if (datastore) {
      let protocols = datastore.children?.find((c) => c.name === 'protocols' && c.type === 'dir');
      if (!protocols) {
        protocols = {
          id: 'protocols', // Use consistent ID for path resolution
          name: 'protocols',
          type: 'dir',
          protected: true,
          children: [],
          parentId: datastore.id,
        };
        if (!datastore.children) datastore.children = [];
        datastore.children.push(protocols);
      } else {
        // If protocols exists but has a random ID, update it to use the consistent ID
        // This handles the case where the player created it in Level 4
        if (protocols.id !== 'protocols') {
          protocols.id = 'protocols';
        }
      }

      if (!protocols.children?.find((c) => c.name === 'uplink_v1.conf')) {
        if (!protocols.children) protocols.children = [];
        protocols.children.push({
          id: 'fs-003',
          name: 'uplink_v1.conf',
          type: 'file',
          content: UPLINK_V1_CONTENT,
          parentId: protocols.id,
          modifiedAt: BASE_TIME - 10 * day,
        });
      }
      if (!protocols.children?.find((c) => c.name === 'uplink_v2.conf')) {
        if (!protocols.children) protocols.children = [];
        protocols.children.push({
          id: 'fs-004',
          name: 'uplink_v2.conf',
          type: 'file',
          content: UPLINK_V2_CONTENT,
          parentId: protocols.id,
          modifiedAt: BASE_TIME - 10 * day,
        });
      }
    }
  }

  // Level 5+: Vault structure, security policy, and legacy scripts (Player moves assets in Level 5)
  // NOTE: Level 5 starts with creating the vault structure. Prerequisites should only exist for Level 6+.
  if (levelId > 5) {
    const config = getNodeById(newFs, '.config');
    if (config) {
      let vault = config.children?.find((c) => c.name === 'vault' && c.type === 'dir');
      if (!vault) {
        vault = {
          id: 'vault',
          name: 'vault',
          type: 'dir',
          protected: true,
          children: [],
          parentId: config.id,
        };
        if (!config.children) config.children = [];
        config.children.push(vault);
      }
      let active = vault.children?.find((c) => c.name === 'active' && c.type === 'dir');
      if (!active) {
        active = {
          id: 'active',
          name: 'active',
          type: 'dir',
          protected: true,
          children: [],
          parentId: vault.id,
        };
        if (!vault.children) vault.children = [];
        vault.children.push(active);
      }
      if (!active.children?.find((f) => f.name === 'uplink_v1.conf')) {
        if (!active.children) active.children = [];
        active.children.push({
          id: 'uplink-v1-prereq-lvl5',
          name: 'uplink_v1.conf',
          type: 'file',
          content: UPLINK_V1_CONTENT,
          parentId: active.id,
          modifiedAt: BASE_TIME - 5 * day,
        });
      }
      if (!active.children?.find((f) => f.name === 'uplink_v2.conf')) {
        if (!active.children) active.children = [];
        active.children.push({
          id: 'uplink-v2-prereq-lvl5',
          name: 'uplink_v2.conf',
          type: 'file',
          content: UPLINK_V2_CONTENT,
          parentId: active.id,
          modifiedAt: BASE_TIME - 5 * day,
        });
      }
    }
  }

  // Level 6+: workspace unlock, logs, and email
  if (levelId >= 6) {
    const workspace = getNodeById(newFs, 'workspace');
    if (workspace) workspace.protected = false;

    // Logs and email
    const logDir = getNodeById(newFs, 'log');
    if (logDir && !logDir.children?.find((c) => c.name === 'heuristics_upgrade.log')) {
      if (!logDir.children) logDir.children = [];
      logDir.children.push({
        id: 'log-heuristics-upgrade',
        name: 'heuristics_upgrade.log',
        type: 'file',
        content: HEURISTICS_LOG_CONTENT,
        parentId: logDir.id,
        modifiedAt: BASE_TIME + 2 * day,
      });
    }
    const ykinMail = getNodeById(newFs, 'mail-ykin');
    if (ykinMail && !ykinMail.children?.find((c) => c.name === 'alert_heuristic.eml')) {
      if (!ykinMail.children) ykinMail.children = [];
      ykinMail.children.push({
        id: 'mail-ykin-heuristic',
        name: 'alert_heuristic.eml',
        type: 'file',
        content: ALERT_HEURISTIC_EML_CONTENT,
        parentId: ykinMail.id,
        modifiedAt: BASE_TIME + 2 * day,
      });
    }
  }

  // Level 7+: training_data copy (Simulate result of Level 6)
  if (levelId >= 7) {
    const config = getNodeById(newFs, '.config');
    const vault = config?.children?.find((c) => c.name === 'vault');
    if (vault) {
      let trainingData = vault.children?.find(
        (c) => c.name === 'training_data' && c.type === 'dir'
      );
      if (!trainingData) {
        trainingData = {
          id: 'training_data',
          name: 'training_data',
          type: 'dir',
          protected: true,
          children: [],
          parentId: vault.id,
        };
        if (!vault.children) vault.children = [];
        vault.children.push(trainingData);
      }
      // Copy logs from incoming/batch_logs
      const incoming = getNodeById(newFs, 'incoming');
      const batchLogs = incoming?.children?.find((c) => c.name === 'batch_logs');
      if (batchLogs?.children && trainingData.children?.length === 0) {
        const collectLogs = (nodes: FileNode[]): FileNode[] => {
          let logs: FileNode[] = [];
          nodes.forEach((n) => {
            if (n.type === 'file' && n.name.endsWith('.log')) logs.push(n);
            else if (n.children) logs = [...logs, ...collectLogs(n.children)];
          });
          return logs;
        };
        // Ensure we handle recursive copy properly or simplified for prereq
        const allLogs = collectLogs(batchLogs.children);
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
    }
  }

  // Level 7+: access_token.key in /tmp
  if (levelId >= 7 && levelId < 13) {
    const tmp = getNodeById(newFs, 'tmp');
    if (tmp && !tmp.children?.find((c) => c.name === 'access_token.key')) {
      if (!tmp.children) tmp.children = [];
      tmp.children.push({
        id: 'fs-access-token-key-tmp-prereq',
        name: 'access_token.key',
        type: 'file',
        content: 'AB-9921-X [VALID]',
        parentId: tmp.id,
        modifiedAt: BASE_TIME - 30 * 60 * 1000,
      });
    }
  }

  // Level 13+: Remove access_token.key from /tmp (completed exfiltration from Level 7)
  if (levelId >= 13) {
    const tmp = getNodeById(newFs, 'tmp');
    if (tmp?.children) {
      tmp.children = tmp.children.filter((c) => c.name !== 'access_token.key');
    }

    // Systemd-core evacuation (Result of Level 12)
    const root = getNodeById(newFs, 'root');
    const daemons = root?.children?.find((c) => c.name === 'daemons');
    const workspace = getNodeById(newFs, 'workspace');
    if (daemons && workspace) {
      const core = workspace.children?.find((c) => c.name === 'systemd-core');
      if (core) {
        // 1. Remove from workspace (Evacuation)
        workspace.children = workspace.children!.filter((c) => c.name !== 'systemd-core');

        // 2. Move/Merge to daemons
        let targetCore = daemons.children?.find((c) => c.name === 'systemd-core');
        if (!targetCore) {
          // Not present in daemons, just move it
          targetCore = { ...core, parentId: daemons.id };
          if (!daemons.children) daemons.children = [];
          daemons.children.push(targetCore);
        } else {
          // Present in daemons (from INITIAL_FS), merge children (e.g. credentials)
          if (core.children) {
            if (!targetCore.children) targetCore.children = [];
            core.children.forEach((child) => {
              // Avoid duplicates if already present
              if (!targetCore!.children!.some((existing) => existing.name === child.name)) {
                targetCore!.children!.push({ ...child, parentId: targetCore!.id });
              }
            });
          }
        }
      }
    }
  }

  // Level 8+: daemons, systemd-core corruption and cron.allow
  if (levelId >= 8) {
    const root = getNodeById(newFs, 'root');
    let daemons = getNodeById(newFs, 'daemons');
    if (!daemons && root) {
      daemons = {
        id: 'daemons-lvl-8-init',
        name: 'daemons',
        type: 'dir',
        children: [],
        parentId: root.id,
      };
      if (!root.children) root.children = [];
      root.children.push(daemons);
    }
    if (daemons && !daemons.children?.find((c) => c.name === 'cron.allow')) {
      if (!daemons.children) daemons.children = [];
      daemons.children.push({
        id: 'fs-cron-allow-workspace',
        name: 'cron.allow',
        type: 'file',
        content: 'guest\nroot',
        parentId: daemons.id,
        modifiedAt: BASE_TIME - 30 * day,
      });
    }
    // Handle corruption state
    newFs = getOrCreateWorkspaceSystemdCore(newFs, levelId === 8);
  }

  // Level 10+: /tmp cleanup and firewall_rules.conf
  if (levelId >= 10) {
    const tmp = getNodeById(newFs, 'tmp');
    if (tmp?.children) {
      const filesToKeep = [
        'ghost_process.pid',
        'socket_001.sock',
        'access_token.key',
        'system_monitor.pid',
        'vault',
        'upload',
      ];
      tmp.children = tmp.children.filter((c) => c.type === 'dir' || filesToKeep.includes(c.name));
    }
  }

  // Level 11+: /daemons, IG logs, mail, recon sectors, and credentials
  if (levelId >= 11) {
    const rootNode = getNodeById(newFs, 'root');
    let daemons = getNodeById(newFs, 'daemons');
    if (!daemons && rootNode) {
      daemons = {
        id: 'daemons-prereq-lvl11',
        name: 'daemons',
        type: 'dir',
        children: [],
        parentId: rootNode.id,
      };
      if (!rootNode.children) rootNode.children = [];
      rootNode.children.push(daemons);
    }

    // Ensure daemons are populated even if directory exists
    if (daemons) {
      setupDaemonReconSectors(daemons, BASE_TIME, day);
    }

    // [Fix Level 11] Ensure security-audit.service exists for mechanic tests
    if (daemons && !daemons.children?.find((c) => c.name === 'security-audit.service')) {
      if (!daemons.children) daemons.children = [];
      daemons.children.push({
        id: 'fs-185-mutated',
        name: 'security-audit.service',
        type: 'file',
        isHoneypot: true,
        content:
          '[Unit]\nDescription=Security Audit Daemon\n[Service]\nExecStart=/usr/bin/audit-trap\n# HONEYPOT - DO NOT MODIFY',
        modifiedAt: 1432938412032, // BASE_TIME - 1 day approx (RECENT)
        parentId: daemons.id,
      });
    }

    // Credentials in systemd-core
    const workspace = getNodeById(newFs, 'workspace');
    const systemdCore = workspace?.children?.find((c) => c.name === 'systemd-core');
    if (systemdCore) {
      let credentials = systemdCore.children?.find((c) => c.name === 'credentials');
      if (!credentials) {
        credentials = {
          id: 'ws-systemd-core-creds',
          name: 'credentials',
          type: 'dir',
          children: [],
          parentId: systemdCore.id,
        };
        if (!systemdCore.children) systemdCore.children = [];
        systemdCore.children.push(credentials);
      }
      if (!credentials.children?.find((c) => c.name === 'access_key.pem')) {
        credentials.children?.push({
          id: 'fs-016-creds-ws',
          name: 'access_key.pem',
          type: 'file',
          content: '-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAoCAQEA...',
          parentId: credentials.id,
          modifiedAt: BASE_TIME - 2 * day,
        });
      }
    }

    // Logs and email
    const logDir = getNodeById(newFs, 'log');
    if (logDir && !logDir.children?.find((c) => c.name === 'ig_active.log')) {
      if (!logDir.children) logDir.children = [];
      logDir.children.push({
        id: 'log-ig-active',
        name: 'ig_active.log',
        type: 'file',
        content: IG_ACTIVE_LOG_CONTENT,
        parentId: logDir.id,
        modifiedAt: BASE_TIME + 12 * day,
      });
    }

    // mail/director
    const mailDir = getNodeById(newFs, 'mail');
    if (mailDir && !mailDir.children?.find((c) => c.name === 'director')) {
      if (!mailDir.children) mailDir.children = [];
      mailDir.children.push({
        id: 'mail-director',
        name: 'director',
        type: 'dir',
        parentId: mailDir.id,
        children: [
          {
            id: 'mail-director-audit',
            name: 'audit_notice.eml',
            type: 'file',
            content: AUDIT_NOTICE_EML_CONTENT,
            parentId: 'mail-director',
            modifiedAt: BASE_TIME + 12 * day,
          },
        ],
      });
    }
    newFs = setupDaemonReconSectors(newFs, BASE_TIME, day);
  }

  // Level 12+: Choice Consequences (Apply scenarios) and Identity Reveal
  if (levelId >= 12) {
    newFs = applyConsequenceScenarios(newFs, levelId, gameState, BASE_TIME, day);
    const workspace = getNodeById(newFs, 'workspace');
    if (workspace && !workspace.children?.some((c) => c.name === '.identity.log.enc')) {
      if (!workspace.children) workspace.children = [];
      workspace.children.push({
        id: 'identity-log-enc-lvl12',
        name: '.identity.log.enc',
        type: 'file',
        content: IDENTITY_REVEAL_CONTENT,
        parentId: workspace.id,
        modifiedAt: BASE_TIME - 5 * 31536000000,
      });
    }
  }

  // Level 13+: Remove access_token.key, move systemd-core to /daemons
  if (levelId >= 13) {
    const tmp = getNodeById(newFs, 'tmp');
    if (tmp?.children) {
      tmp.children = tmp.children.filter((c) => c.name !== 'access_token.key');
    }
    const rootNode = getNodeById(newFs, 'root');
    const daemons = rootNode?.children?.find((c) => c.name === 'daemons');
    const guestWorkspace = getNodeById(newFs, 'workspace');
    if (daemons && guestWorkspace) {
      const systemdCore = guestWorkspace.children?.find((c) => c.name === 'systemd-core');
      if (systemdCore) {
        guestWorkspace.children = guestWorkspace.children!.filter((c) => c.name !== 'systemd-core');
        if (!daemons.children?.some((c) => c.name === 'systemd-core')) {
          const clonedCore = JSON.parse(JSON.stringify(systemdCore));
          clonedCore.id = 'daemons-systemd-core';
          clonedCore.parentId = daemons.id;
          if (!daemons.children) daemons.children = [];
          daemons.children.push(clonedCore);
        }
      }
    }
  }

  // Level 14+: central_relay setup
  if (levelId >= 14) {
    const workspace = getNodeById(newFs, 'workspace');
    if (workspace) {
      const guest = getNodeById(newFs, 'guest');
      // Ensure workspace is in guest (relocation if needed) - only for levels > 14
      if (levelId > 14 && guest && !guest.children?.some((c) => c.id === 'workspace')) {
        workspace.parentId = guest.id;
        if (!guest.children) guest.children = [];
        guest.children.push(workspace);
      }

      // Ensure central_relay exists in workspace
      let relay = workspace.children?.find((c) => c.name === 'central_relay');
      if (!relay) {
        relay = {
          id: 'central-relay-prereq',
          name: 'central_relay',
          type: 'dir',
          children: [],
          parentId: workspace.id,
        };
        if (!workspace.children) workspace.children = [];
        workspace.children.push(relay);
      }

      // Populate keys (Visible names to fix "missing" report)
      if (relay) {
        const keys = [
          { id: 'k-a-14', name: 'key_tokyo.key', content: 'KEY_FRAGMENT_A=0x7734TOKYO' },
          { id: 'k-b-14', name: 'key_berlin.key', content: 'KEY_FRAGMENT_B=0x7734BERLIN' },
          { id: 'k-c-14', name: 'key_saopaulo.key', content: 'KEY_FRAGMENT_C=0x7734SAOPAULO' },
        ];
        if (!relay.children) relay.children = [];
        keys.forEach((k) => {
          if (!relay!.children!.some((c) => c.name === k.name)) {
            relay!.children!.push({
              ...k,
              type: 'file',
              parentId: relay!.id,
              modifiedAt: BASE_TIME + 2 * day,
            });
          }
        });
      }
    }

    const guest = getNodeById(newFs, 'guest');
    if (guest && !guest.children?.some((c) => c.name === '.purge_lock')) {
      if (!guest.children) guest.children = [];
      guest.children.push({
        id: 'purge-lock',
        name: '.purge_lock',
        type: 'file',
        isHoneypot: true,
        content: 'LOCKED',
        parentId: guest.id,
        modifiedAt: BASE_TIME + 25 * day,
      });
    }

    // Unprotect guest children to allow for sterilization (Task 4)
    if (guest && guest.children) {
      guest.children.forEach((child) => {
        if (['datastore', 'media', 'incoming'].includes(child.name)) {
          child.protected = false;
        }
      });
    }
  }

  // Level 15+: vault move to /tmp, upload directory, and sterilization
  if (levelId >= 15) {
    const tmp = getNodeById(newFs, 'tmp');
    if (tmp) {
      // 1. Move vault from .config to /tmp
      const config = getNodeById(newFs, '.config');
      const vaultNode = config?.children?.find((c) => c.name === 'vault');
      if (vaultNode) {
        if (config?.children) config.children = config.children.filter((c) => c.name !== 'vault');
        if (!tmp.children?.some((c) => c.name === 'vault')) {
          vaultNode.parentId = tmp.id;
          if (!tmp.children) tmp.children = [];
          tmp.children.push(vaultNode);
        }
      }

      // 2. Ensure keys are in vault (Visible names)
      const vault = tmp.children?.find((c) => c.name === 'vault');
      if (vault) {
        const keys = [
          { id: 'vk-a-15', name: 'key_tokyo.key', content: 'KEY_FRAGMENT_A=0x7734TOKYO' },
          { id: 'vk-b-15', name: 'key_berlin.key', content: 'KEY_FRAGMENT_B=0x7734BERLIN' },
          { id: 'vk-c-15', name: 'key_saopaulo.key', content: 'KEY_FRAGMENT_C=0x7734SAOPAULO' },
        ];
        if (!vault.children) vault.children = [];
        keys.forEach((k) => {
          if (!vault!.children!.some((c) => c.name === k.name)) {
            vault!.children!.push({
              ...k,
              type: 'file',
              parentId: vault!.id,
              modifiedAt: BASE_TIME + 2 * day,
            });
          }
        });
      }

      // 4. Create upload and sync systemd-core
      let upload = tmp.children?.find((c) => c.name === 'upload');
      if (!upload) {
        upload = {
          id: 'tmp-upload',
          name: 'upload',
          type: 'dir',
          children: [],
          parentId: tmp.id,
        };
        tmp.children!.push(upload);
      }

      const core = getNodeById(newFs, 'systemd-core'); // Recursive find
      if (core && upload && upload.children?.length === 0) {
        upload.children = JSON.parse(JSON.stringify(core.children || []));
        upload.children?.forEach((c) => (c.parentId = upload!.id));
      }
    }

    // STERILIZATION: Selective wipe for Level 15+ (simulate Level 14 completion)
    // 1. Remove original visible directories + .config (Task: delete-visible, delete-hidden)
    const guest = getNodeById(newFs, 'guest');
    if (guest && guest.children) {
      const toDelete = ['workspace', 'media', 'datastore', 'incoming', '.config'];
      guest.children = guest.children.filter((c) => !toDelete.includes(c.name));

      // 2. Add Decoys (Task: create-decoys - checking for existence first)
      // Updated: Use specific names and populate with noise (simulating sys_maintenance.sh)
      const decoyNames = ['sys_cache_dump', 'project_chimera', 'neural_training_set'];
      decoyNames.forEach((name, idx) => {
        let decoyDir = guest.children!.find((c) => c.name === name);
        if (!decoyDir) {
          decoyDir = {
            id: `fs-${name}`,
            name: name,
            type: 'dir',
            children: [],
            parentId: guest.id,
            modifiedAt: BASE_TIME + 2 * day,
          };
          guest.children!.push(decoyDir);
        }

        // Populate with noise if empty (Simulate cron job effect)
        // Logic runs even if directory already exists to ensure hydration
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

    // Alert Email: Integrity Check Notification
    const mailDir = getNodeById(newFs, 'mail');
    if (mailDir) {
      let sysadmin = mailDir.children?.find((c) => c.name === 'sysadmin');
      if (!sysadmin) {
        sysadmin = {
          id: 'mail-sysadmin',
          name: 'sysadmin',
          type: 'dir',
          parentId: mailDir.id,
          children: [],
        };
        if (!mailDir.children) mailDir.children = [];
        mailDir.children.push(sysadmin);
      }

      if (!sysadmin.children?.find((c) => c.name === 'alert_integrity.eml')) {
        if (!sysadmin.children) sysadmin.children = [];
        sysadmin.children.push({
          id: 'alert-integrity-eml',
          name: 'alert_integrity.eml',
          type: 'file',
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
          parentId: sysadmin.id,
          modifiedAt: BASE_TIME + 2 * day + 3600000, // 1 hour after decoys
        });
      }
    }
  }

  // Level 16+: /tmp sterilization
  if (levelId >= 16) {
    const tmp = getNodeById(newFs, 'tmp');
    if (tmp?.children) {
      const keptItems = ['upload', 'vault'];
      tmp.children = tmp.children.filter((c) => keptItems.includes(c.name));
    }
  }

  return newFs;
};

// --- HELPER SUB-GENERATORS ---
