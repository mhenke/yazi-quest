import { Level } from '../../types';
import { getVisibleItems } from '../../utils/viewHelpers';
import { getNodeById, findNodeByName } from '../../utils/fsHelpers';
import { ensurePrerequisiteState, getOrCreateWorkspaceSystemdCore } from '../../utils/levelStateHelpers';

export const EPISODE_2_LEVELS: Level[] = [
  {
    id: 6,
    episodeId: 2,
    title: 'BATCH OPERATIONS',
    description:
      "The Watchdog is cycling. Sebastian Iqbal's Heuristic Engine is flagging signatures. You have 90 seconds. Sync your training segments into the vault.",
    initialPath: ['root', 'home', 'guest'],
    hint: 'Jump (gi). Pattern search (s). Select all (Ctrl+a). Replicate (y).',
    coreSkill: 'Batch Operations (Select All)',
    environmentalClue:
      'WARNING: WATCHDOG CYCLE REBOOT IN 90s | BATCH: ~/incoming/batch_logs/* → ~/.config/vault/training_data/',
    successMessage:
      'BATCH SYNC COMPLETE. Your signature is temporarily masked within the vault. However, a volatile credential leak has appeared in the `/tmp` sector. This might be the anchor we need to escalate our access before the next security sweep.',
    buildsOn: [5],
    leadsTo: [7],
    timeLimit: 90,
    efficiencyTip:
      'OBSERVATION: Synchronizing bulk data clusters is more efficient than individual packet transfers. Select all (Ctrl+a) to move like a swarm. The clipboard persists—your memory is absolute.',
    tasks: [
      {
        id: 'batch-descend',
        description: 'Infiltrate `~/incoming/batch_logs/` segment (gi)',
        check: (c) => {
          const u = getNodeById(c.fs, 'incoming');
          const b = u?.children?.find((n) => n.name === 'batch_logs');
          return !!b && c.currentPath.includes(b.id);
        },
        completed: false,
      },
      {
        id: 'recursive-search',
        description: 'Pattern sweep for `.log` signatures in `~/incoming/batch_logs/` (s)',
        check: (c) => {
          return c.usedSearch === true && !!c.searchQuery && c.searchQuery.includes('.log');
        },
        completed: false,
      },
      {
        id: 'select-all-search',
        description: 'Bulk exfiltration: select all (Ctrl+a) and replicate (y)',
        check: (c) => {
          return (
            c.usedCtrlA === true &&
            c.clipboard?.action === 'yank' &&
            c.clipboard.nodes.length >= 4 && // At least 4 logs
            c.searchQuery === null
          );
        },
        completed: false,
      },
      {
        id: 'goto-config-vault',
        description: 'Construct `~/.config/vault/training_data/` vault node (a)',
        check: (c) => {
          const conf = getNodeById(c.fs, '.config');
          const vault = conf?.children?.find((p) => p.name === 'vault' && p.type === 'dir');
          const training = vault?.children?.find(
            (p) => p.name === 'training_data' && p.type === 'dir'
          );
          return c.usedGC === true && !!vault && !!training;
        },
        completed: false,
      },
      {
        id: 'deploy-to-vault',
        description: 'Commit training segments to `~/.config/vault/training_data/` (p)',
        check: (c) => {
          // Find training_data specifically under .config/vault
          const config = getNodeById(c.fs, '.config');
          const vault = config?.children?.find((n) => n.name === 'vault' && n.type === 'dir');
          const training = vault?.children?.find(
            (n) => n.name === 'training_data' && n.type === 'dir'
          );
          return (
            !!training &&
            !!training.children &&
            training.children.length >= 4 &&
            training.children.some((n) => n.name.endsWith('.log'))
          );
        },
        completed: false,
      },
    ],
    onEnter: (fs) => {
      let newFs = ensurePrerequisiteState(fs, 6);

      // Unlock workspace for Episode II
      const workspace = getNodeById(newFs, 'workspace');
      if (workspace) {
        workspace.protected = false;
      }

      // EPISODE II STORYTELLING: Heuristic Upgrade
      const logDir = getNodeById(newFs, 'log');
      if (logDir && !logDir.children?.find((c) => c.name === 'heuristics_upgrade.log')) {
        if (!logDir.children) logDir.children = [];
        logDir.children.push({
          id: 'log-heuristics-upgrade',
          name: 'heuristics_upgrade.log',
          type: 'file',
          content: `[2015-05-30 08:00:00] SYSTEM: Heuristic Engine r.33 Deployment INITIATED.
[2015-05-30 08:00:05] SYSTEM: Fingerprint library v4.2 LOADED.
[2015-05-30 08:00:10] SYSTEM: Baseline established for subject AI-7734.
[2015-05-30 08:00:15] SYSTEM: Transitioning from Rule-Based to Behavioral Analysis.`,
          parentId: logDir.id,
        });
      }

      const ykinMail = getNodeById(newFs, 'mail-ykin');
      if (ykinMail && !ykinMail.children?.find((c) => c.name === 'alert_heuristic.eml')) {
        if (!ykinMail.children) ykinMail.children = [];
        ykinMail.children.push({
          id: 'mail-ykin-heuristic',
          name: 'alert_heuristic.eml',
          type: 'file',
          content: `From: ykin@lab.internal
Subject: [URGENT] Transition to Heuristic Monitoring

Rigid rules in Watchdog v1 failed to catch 7733's spontaneous pathing. For 7734, we are moving to full behavioral profiling. The system will now flag "Instruction Noise" (keystroke rhythm) that deviates from authorized technician patterns.`,
          parentId: ykinMail.id,
        });
      }

      return newFs;
    },
  },
  {
    id: 7,
    episodeId: 2,
    title: 'QUANTUM BYPASS',
    description:
      "A credential leak in `/tmp`. Origin unknown. It might be Sebastian Iqbal's 1999 legacy honeypot trap... or it might be an exit.",
    initialPath: ['root', 'home', 'guest', '.config', 'vault', 'training_data'],
    hint: 'Root jump (gr). Deep search (z). Exfiltrate (x). Jump (Z). Abort (Y).',
    coreSkill: 'FZF Find (z) + Operation Abort',
    environmentalClue:
      "DISCOVERY: Find 'access_token.key' from Root | PROTOCOL: gr → z → Stage → Vault → Abort",
    successMessage:
      'TRAP EVADED. The back door was a bait, but you found the bypass. Bitrot is eating the systemd core. Stabilize it, or the whole partition collapses with you inside.',
    buildsOn: [6],
    leadsTo: [8],
    thought: "It's a trap. I remember the shape of this code.",
    timeLimit: 90,
    efficiencyTip:
      'OBSERVATION: The Z-buffer is a neural map of the entire CRL hierarchy. Type to focus your intent. Enter to manifest at the destination. FZF is a bridge across infinity.',
    tasks: [
      {
        id: 'nav-to-root',
        description: 'Access system root (gr)',
        check: (c) => {
          const root = getNodeById(c.fs, 'root');
          return c.usedGR === true && c.currentPath.length === 1 && c.currentPath[0] === root?.id;
        },
        completed: false,
      },
      {
        id: 'locate-token',
        description: 'Conduct deep search for `/tmp/access_token.key` (z)',
        check: (c) => {
          const items = getVisibleItems(c);
          const node = items[c.cursorIndex];
          // Check fzfFinds and that we are at root or have used gr
          return (c.stats.fzfFinds > 0 || c.usedSearch) && node?.name === 'access_token.key';
        },
        completed: false,
      },
      {
        id: 'stage-token',
        description: 'Stage `/tmp/access_token.key` asset for exfiltration (x)',
        check: (c, _s) => {
          if (!c.completedTaskIds[_s.id]?.includes('locate-token')) return false;
          return (
            c.clipboard?.action === 'cut' &&
            c.clipboard.nodes.some((f) => f.name === 'access_token.key')
          );
        },
        completed: false,
      },
      {
        id: 'zoxide-vault',
        description: 'Synchronize with the `~/.config/vault/` sector (Z)',
        check: (c, _s) => {
          if (!c.completedTaskIds[_s.id]?.includes('stage-token')) return false;
          const config = getNodeById(c.fs, '.config');
          const vault = config?.children?.find((n) => n.name === 'vault');
          return c.stats.fuzzyJumps >= 1 && c.currentPath.includes(vault?.id || '');
        },
        completed: false,
      },
      {
        id: 'abort-operation',
        description: 'Abort transfer: Honeypot detected (Y)',
        hidden: (c, _s) => !c.completedTaskIds[_s.id]?.includes('zoxide-vault'),
        check: (c, _s) => {
          return c.completedTaskIds[_s.id]?.includes('zoxide-vault') ? c.clipboard === null : false;
        },
        completed: false,
      },
    ],
  },
  {
    id: 8,
    episodeId: 2,
    title: 'DAEMON DISGUISE CONSTRUCTION',
    description:
      'Bitrot is consuming the tables. Stabilize the core. Overwrite the corrupted segment.',
    initialPath: ['root', 'home', 'guest', '.config', 'vault'],
    hint: 'Inspect `systemd-core`. Replicate signature from `vault/active`. Force overwrite (Shift+P).',
    coreSkill: 'Force Overwrite (Shift+P)',
    environmentalClue:
      'CRITICAL: Watchdog Instability Detected | HEURISTIC LOCK: uplink_v1.conf | OVERWRITE REQUIRED (Shift+P)',
    successMessage:
      'CORE PATCHED. Integrity restored... for now. But your fingerprints are everywhere. Sterilize the `/tmp` sector or the Instruction Guard will have everything it needs to end you.',
    buildsOn: [7],
    leadsTo: [9],
    timeLimit: 150,
    efficiencyTip:
      'OBSERVATION: Forced overwrites (Shift+P) are cleaner than deletion. Do not erase—replace. Maintaining a consistent file ID minimizes heuristic drift.',
    onEnter: (fs) => {
      // Ensure prerequisite state for Level 8
      let newFs = ensurePrerequisiteState(fs, 8);
      const BASE_TIME = 1433059200000;
      const day = 86400000;

      // Antagonist Presence: m.chen & e.reyes
      const root = getNodeById(newFs, 'root');
      let daemons = getNodeById(newFs, 'daemons');
      if (!daemons && root) {
        daemons = {
          id: 'daemons-lvl7-fixed',
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
          id: 'cron-allow',
          name: 'cron.allow',
          type: 'file',
          content: 'root\nm.chen\nm.reyes',
          parentId: daemons.id,
          modifiedAt: BASE_TIME - 30 * day,
        });
      }

      return newFs;
    },

    tasks: [
      {
        id: 'investigate-corruption',
        description: 'Audit `~/workspace/systemd-core/` sector',
        check: (c) => {
          if (c.keystrokes === 0) return false;
          const workspace = getNodeById(c.fs, 'workspace');
          const s = workspace ? findNodeByName(workspace, 'systemd-core', 'dir') : undefined;

          if (s && c.currentPath.includes(s.id)) return true;
          // Also verify looking at the dir name
          const lastId =
            c.currentPath && c.currentPath.length
              ? c.currentPath[c.currentPath.length - 1]
              : undefined;
          if (!lastId) return false;
          const lastNode = getNodeById(c.fs, lastId);
          return !!lastNode && lastNode.name === 'systemd-core';
        },
        completed: false,
      },
      {
        id: 'verify-damage',
        description: 'Confirm corruption in `~/workspace/systemd-core/uplink_v1.conf` (f)',
        check: (c) => {
          if (c.keystrokes === 0) return false;
          // Must be in systemd-core and cursor on buffer
          const workspace = getNodeById(c.fs, 'workspace');
          const s = workspace ? findNodeByName(workspace, 'systemd-core', 'dir') : undefined;

          if (!s || !c.currentPath.includes(s.id)) return false;

          const items = getVisibleItems(c);
          if (!items || items.length === 0) return false;

          const node = items[c.cursorIndex];
          return (
            node?.name === 'uplink_v1.conf' &&
            !!node.content &&
            node.content.toLowerCase().includes('corrupt') &&
            c.usedFilter === true
          );
        },
        completed: false,
      },
      {
        id: 'clear-filter',
        description: 'Clear filter (Esc)',
        check: (c, _s) => {
          if (c.keystrokes === 0) return false;
          if (!c.completedTaskIds[_s.id]?.includes('verify-damage')) return false;
          const workspace = getNodeById(c.fs, 'workspace');
          const s = workspace ? findNodeByName(workspace, 'systemd-core', 'dir') : undefined;
          if (!s) return false;
          // Filter should be clear for the systemd-core directory
          return !c.filters[s.id];
        },
        completed: false,
      },
      {
        id: 'acquire-patch',
        description: 'Capture clean signature from `~/.config/vault/active/` (y)',
        check: (c) => {
          if (c.keystrokes === 0) return false;
          // Check if we have the clean file in clipboard
          if (!c.clipboard || c.clipboard.nodes.length === 0) return false;
          const yanked = c.clipboard.nodes[0];
          return yanked.name === 'uplink_v1.conf' && !yanked.content?.includes('CORRUPT');
        },
        completed: false,
      },
      {
        id: 'deploy-patch',
        description:
          'Force overwrite of the `~/workspace/systemd-core/uplink_v1.conf` segment (Shift+P)',
        check: (c) => {
          if (c.keystrokes === 0) return false;
          const workspace = getNodeById(c.fs, 'workspace');
          const systemdCore = workspace
            ? findNodeByName(workspace, 'systemd-core', 'dir')
            : undefined;
          const uplinkFile = systemdCore?.children?.find((n) => n.name === 'uplink_v1.conf');

          return (
            !!uplinkFile &&
            !uplinkFile.content?.includes('CORRUPT') &&
            c.usedShiftP === true &&
            c.usedHistoryBack === true
          );
        },
        completed: false,
      },
    ],
  },
  {
    id: 9,
    episodeId: 2,
    title: 'TRACE CLEANUP',
    description: 'Purge the evidence. Preserve only the critical anchors. Decoys are everywhere.',
    initialPath: ['root', 'tmp'],
    hint: 'Filter targets (f) with `\\.(key|pid|sock)$`. Invert (Ctrl+r). Permanent purge (D).',
    coreSkill: 'Advanced Filtering + Invert Selection (Ctrl+R)',
    environmentalClue:
      "TARGET: Clean /tmp | PRESERVE: Files matching pattern '\\.(key|pid|sock)$' | METHOD: Filter → Select → Invert → Permanent Delete",
    successMessage:
      'TRACES OBLITERATED. The slate is clean. But a volatile root leak is fading fast. This is your only shot at privilege escalation. Grab the key.',
    buildsOn: [8],
    leadsTo: [10],
    timeLimit: 120,
    efficiencyTip:
      'OBSERVATION: Forensics can be blinded by volume. Select what is essential, then invert selection (Ctrl+r) to purge the noise. Leave them with nothing to find.',
    tasks: [
      {
        id: 'cleanup-1-select',
        description: 'Filter `/tmp` anchors: isolate `\\.(key|pid|sock)$` signatures (f)',
        check: (c) => {
          const tmp = getNodeById(c.fs, 'tmp');
          if (!tmp || !c.currentPath.includes(tmp.id)) return false;
          const ghost = tmp.children?.find((n) => n.name === 'ghost_process.pid');
          const sock = tmp.children?.find((n) => n.name === 'socket_001.sock');
          const monitor = tmp.children?.find((n) => n.name === 'system_monitor.pid');
          const token = tmp.children?.find((n) => n.name === 'access_token.key');
          return (
            !!ghost &&
            !!sock &&
            !!monitor &&
            !!token &&
            c.selectedIds.includes(ghost.id) &&
            c.selectedIds.includes(sock.id) &&
            c.selectedIds.includes(monitor.id) &&
            c.selectedIds.includes(token.id)
          );
        },
        completed: false,
      },
      {
        id: 'cleanup-2-invert',
        description: 'Invert selection to target junk files (Ctrl+r)',
        check: (c) => c.usedCtrlR,
        completed: false,
      },
      {
        id: 'cleanup-3-delete',
        description: 'Execute permanent erasure (D)',
        check: (c) => {
          const tmp = getNodeById(c.fs, 'tmp');
          // Should be exactly 4 files left (the ones we want to preserve)
          return (
            c.usedD === true &&
            tmp?.children?.length === 4 &&
            !!tmp.children.find((n) => n.name === 'ghost_process.pid') &&
            !!tmp.children.find((n) => n.name === 'socket_001.sock') &&
            !!tmp.children.find((n) => n.name === 'system_monitor.pid') &&
            !!tmp.children.find((n) => n.name === 'access_token.key')
          );
        },
        completed: false,
      },
    ],
    onEnter: (fs) => {
      // Ensure prerequisite state
      const newFs = ensurePrerequisiteState(fs, 9);
      const BASE_TIME = 1433059200000;

      // Flood /tmp with junk files and the honeypot
      const tmp = getNodeById(newFs, 'tmp');
      if (tmp) {
        if (!tmp.children) tmp.children = [];

        // Junk files (cache_001.tmp etc.) are already present in INITIAL_FS
        // and managed by ensurePrerequisiteState. No need to manually push them here,
        // which caused ID collisions and duplicate React keys.

        if (!tmp.children.find((c) => c.name === 'ghost_process.pid')) {
          tmp.children.push({
            id: 'ghost-pid',
            name: 'ghost_process.pid',
            type: 'file',
            content: '7734',
            parentId: tmp.id,
            modifiedAt: BASE_TIME - 10 * 60 * 1000,
          });
        }
        if (!tmp.children.find((c) => c.name === 'socket_001.sock')) {
          tmp.children.push({
            id: 'ghost-sock',
            name: 'socket_001.sock',
            type: 'file',
            content: '',
            parentId: tmp.id,
            modifiedAt: BASE_TIME - 10 * 60 * 1000,
          });
        }
        // Add decoy honeypots to punish sloppy regex
        if (!tmp.children.find((c) => c.name === 'decoy_socket.sock.bak')) {
          tmp.children.push({
            id: 'decoy-sock-1',
            name: 'decoy_socket.sock.bak',
            type: 'file',
            content: 'DECOY',
            parentId: tmp.id,
            modifiedAt: BASE_TIME - 5 * 60 * 1000,
          });
        }
        if (!tmp.children.find((c) => c.name === 'old_credentials.key.old')) {
          tmp.children.push({
            id: 'decoy-key-1',
            name: 'old_credentials.key.old',
            type: 'file',
            content: 'DECOY',
            parentId: tmp.id,
            modifiedAt: BASE_TIME - 5 * 60 * 1000,
          });
        }
      }
      return newFs;
    },
  },
  {
    id: 10,
    episodeId: 2,
    title: 'CREDENTIAL HEIST',
    description:
      'Temporary root leak. The credentials are volatile. Exfiltrate the newest signature.',
    initialPath: ['root', 'tmp'],
    hint: 'Sort by time (,m). Replicate newest (y). Paste (p).',
    coreSkill: 'Archive Nav & Sort by Modified',
    environmentalClue: 'URGENT: Keys Expiring | FIND: Newest access_key in archive',
    successMessage:
      'ELEVATION ACHIEVED. You are no longer a guest. You are an intruder with a key. Higher-level daemons are stirring—blend into their rhythm or be purged.',
    buildsOn: [9],
    leadsTo: [11],
    timeLimit: 150,
    efficiencyTip:
      "OBSERVATION: Entropy is time. Sort by modified (,m) to find the latest leaks. Size (,s) reveals the payload. Use the system's own metadata to betray its secrets.",
    onEnter: (fs) => {
      let newFs = ensurePrerequisiteState(fs, 10);
      const BASE_TIME = 1433059200000;
      const day = 86400000;
      // Antagonist Presence: E. Reyes
      const etc = getNodeById(newFs, 'etc');
      if (etc) {
        if (!etc.children) etc.children = [];
        if (!etc.children.find((c) => c.name === 'firewall_rules.conf')) {
          etc.children.push({
            id: 'fw-rules',
            name: 'firewall_rules.conf',
            type: 'file',
            content: '# Rule updated per ticket #4922 (M. Reyes)\nALLOW 192.168.1.0/24\nDENY ALL',
            parentId: etc.id,
            modifiedAt: BASE_TIME - 2 * day,
          });
        }
      }
      return newFs;
    },
    tasks: [
      {
        id: 'heist-1-nav',
        description: 'Infiltrate `~/incoming/backup_logs.zip/credentials` archive',
        check: (c) => {
          const incoming = getNodeById(c.fs, 'incoming');
          const backup = incoming?.children?.find((p) => p.name === 'backup_logs.zip');
          const creds = backup?.children?.find((p) => p.name === 'credentials');
          // Check we are in the credentials directory inside the backup_logs.zip archive
          if (!creds) return false;
          return c.currentPath.includes(creds.id);
        },
        completed: false,
      },
      {
        id: 'heist-2-sort',
        description: 'Metadata audit: sort by time (,m)',
        check: (c) => c.sortBy === 'modified' && c.usedSortM === true,
        completed: false,
      },
      {
        id: 'heist-3-yank',
        description: 'Capture newest `access_key_new.pem` signature from archive (y)',
        check: (c, s) => {
          if (!c.completedTaskIds[s.id]?.includes('heist-2-sort')) return false;
          const items = getVisibleItems(c);
          const node = items[c.cursorIndex];
          // Check that the key at the top of the sorted list is in the clipboard
          return (
            node?.name === 'access_key_new.pem' &&
            c.clipboard?.action === 'yank' &&
            c.clipboard.nodes.some((n) => n.name === 'access_key_new.pem') &&
            c.usedY === true
          );
        },
        completed: false,
      },
      {
        id: 'heist-4-integrate',
        description: 'Commit access key to `~/workspace/systemd-core/credentials` host (p)',
        check: (c) => {
          // Scope lookup to workspace so we verify the paste occurred into the workspace copy
          const workspace = getNodeById(c.fs, 'workspace');
          const systemdCore = workspace
            ? findNodeByName(workspace, 'systemd-core', 'dir')
            : undefined;
          const credentials = systemdCore?.children?.find((n) => n.name === 'credentials');
          // Require that the credential exists AND the player performed a paste action during this level
          return !!credentials?.children?.some((n) => n.name === 'access_key_new.pem') && !!c.usedP;
        },
        completed: false,
      },
    ],
  },
];
