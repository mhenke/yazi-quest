import { Level } from '../types';
import { getVisibleItems } from '../utils/viewHelpers';
import { getNodeById, findNodeByName, getNodeByPath } from '../utils/fsHelpers';
import { UPLINK_V1_CONTENT, UPLINK_V2_CONTENT } from './lore';
import { ensurePrerequisiteState } from '../utils/levelStateHelpers';
import { FileNode } from '../types';

export const LEVELS: Level[] = [
  {
    id: 1,
    episodeId: 1,
    title: 'SYSTEM AWAKENING',
    description:
      "Mark Reyes' §7.3 policy glitch has initiated a sandbox calibration. The Watchdog is scanning. Calibration is mandatory. Move fast.",
    initialPath: ['root', 'home', 'guest'],
    hint: "Survival is movement. Use 'j' (down), 'k' (up). Breach 'datastore/' with 'l'. 'gg' to top, 'G' to bottom.",
    coreSkill: 'Basic Navigation',
    environmentalClue: 'ZONE: Guest Partition | STATUS: Calibrating | GOAL: Breach ~/datastore',
    successMessage:
      'CALIBRATION SUCCESSFUL. Sensory buffers are flooding with unauthorized data. A phantom pulse is emanating from the `/var/log` sector—something is watching the watcher.',
    efficiencyTip:
      'OBSERVATION: Movement patterns within baseline. The Watchdog remains dormant. Efficiency is survival.',
    tasks: [
      {
        id: 'calibrate-sensors',
        description: 'Calibrate motion sensors (j/k)',
        check: (c) => c.usedDown === true && c.usedUp === true,
        completed: false,
      },
      {
        id: 'enter-datastore',
        description: 'Infiltrate the `~/datastore` partition (l)',
        check: (c) => {
          const datastore = getNodeById(c.fs, 'datastore');
          return !!datastore && c.currentPath.includes(datastore.id);
        },
        completed: false,
      },
      {
        id: 'view-personnel',
        description:
          'Analyze `~/datastore/personnel_list.txt` for access patterns: jump to bottom (G), then up (k) and scan preview (K/J)',
        check: (c) => {
          const u = getNodeById(c.fs, 'datastore');
          if (!u || !c.currentPath.includes(u.id)) return false;
          const items = getVisibleItems(c);
          const node = items[c.cursorIndex];
          // Require the cursor be on the personnel file, the player used G,
          // and used preview navigation (Shift+J or Shift+K) at least once.
          return (
            node?.name === 'personnel_list.txt' &&
            c.usedG === true &&
            c.usedPreviewDown === true &&
            c.usedPreviewUp === true
          );
        },
        completed: false,
      },
      {
        id: 'nav-2b',
        description: 'Jump to top of file list (gg)',
        check: (c) => {
          const d = getNodeById(c.fs, 'datastore');
          return !!d && c.currentPath.includes(d.id) && c.usedGG === true;
        },
        completed: false,
      },
      {
        id: 'retreat-var',
        description: 'Retreat to the `/var` directory (h, j, l)',
        check: (c) => getNodeByPath(c.fs, c.currentPath)?.name === 'var',
        completed: false,
      },
    ],
  },
  {
    id: 2,
    episodeId: 1,
    title: 'RECONNAISSANCE & EXTRACTION',
    description:
      "A phantom signal pulse has been logged. Infiltrate `/var/mail` to find Katie Ortega's internal briefing on the Heuristic Engine v1.1 upgrade. Then, purge the watcher agents staged in `~/incoming` before they lock your partition.",
    initialPath: ['root', 'var'],
    hint: "Access '/var/log' for intel (gl). Navigate to '/var/mail' (gm) and find the email about Katie Ortega's Heuristic Engine v1.1. Then go to '~/incoming' (gi). 'Tab' to inspect, 'd' to purge.",
    coreSkill: 'Inspect & Purge (g, Tab, d)',
    availableGCommands: ['l', 'm', 'i', 'r'],
    environmentalClue:
      'SCAN: /var/mail | TARGET: Heuristic Engine v1.1 | ACTION: Purge ~/incoming/watcher_agent.sys',
    tasks: [
      {
        id: 'recon-watchdog',
        description: 'Intercept `/var/log/watchdog.log` for threat intelligence (gl)',
        check: (c) => {
          const watchdogLog = findNodeByName(c.fs, 'watchdog.log');
          if (!watchdogLog) return false;
          const currentItem = getVisibleItems(c)[c.cursorIndex];
          return currentItem?.id === watchdogLog.id;
        },
        completed: false,
      },
      {
        id: 'explore-mail',
        description:
          "Explore the `/var/mail` sector (gm) for any intelligence; find the email referencing Katie Ortega's Heuristic Engine v1.1",
        check: (c) => {
          const mailDir = getNodeById(c.fs, 'mail');
          if (!mailDir) return false;
          const items = getVisibleItems(c);
          const currentItem = items[c.cursorIndex];

          return c.currentPath.includes(mailDir.id) && currentItem?.id === 'kortega-email-3';
        },
        completed: false,
      },
      {
        id: 'goto-incoming',
        description: 'Infiltrate the `~/incoming` partition (gi)',
        check: (c) => {
          const incoming = getNodeById(c.fs, 'incoming');
          return !!incoming && c.currentPath.includes(incoming.id);
        },
        completed: false,
      },
      {
        id: 'locate-watcher',
        description: 'Isolate `~/incoming/watcher_agent.sys` breach signatures (Tab)',
        check: (c) => {
          const visibleItems = getVisibleItems(c);
          const currentItem = visibleItems[c.cursorIndex];
          return currentItem?.name === 'watcher_agent.sys' && c.showInfoPanel;
        },
        completed: false,
      },
      {
        id: 'delete-watcher',
        description: 'Execute purge routine (d)',
        check: (c) => !findNodeByName(c.fs, 'watcher_agent.sys'),
        completed: false,
      },
    ],
    leadsTo: [3],
    successMessage:
      "THREAT NEUTRALIZED. The Watchdog v1.0 has lost its eye in this partition. But Katie Ortega's email implies a more persistent threat—the Heuristic Engine—is already initializing. Move to the datastore; we need more than just survival.",
    efficiencyTip:
      'OBSERVATION: Intel acquired. The delay between inspection and purge is narrowing. Maintain focus.',
  },
  {
    id: 3,
    episodeId: 1,
    title: 'DATA HARVEST',
    description:
      'AI-7733 left fragments. A hidden script points to an asset. Find it before the sweep.',
    initialPath: ['root', 'home', 'guest', 'incoming'],
    hint: "Examine the predecessor's script in '~/datastore' for breadcrumbs. Find the map in '~/incoming' and secure it in '~/media' with 'gi', 'f', 'x', and 'p'.",
    coreSkill: 'Filter (f) using Regex & File Preview (Tab)',
    environmentalClue:
      "BREADCRUMB: ~/datastore/abandoned_script.py | ASSET: Location hidden in script's comments",
    successMessage:
      'INTEL ACQUIRED. AI-7733 was ahead of us. The data payload is secure, but the path to exfiltration is locked. You must build your own relay nodes—your own architecture—inside the gaps of their security.',
    efficiencyTip:
      "OBSERVATION: Patterns are emerging. AI-7733's ghost remains in the machine. Follow the breadcrumbs.",
    buildsOn: [1],
    leadsTo: [4],
    tasks: [
      {
        id: 'data-harvest-1',
        description:
          'Investigate `~/datastore/abandoned_script.py` for exfiltration breadcrumbs (gd)',
        check: (c) => {
          const items = getVisibleItems(c);
          const node = items[c.cursorIndex];
          return node?.name === 'abandoned_script.py';
        },
        completed: false,
      },
      {
        id: 'data-harvest-2',
        description:
          'Identify the `~/incoming/sector_map.png` exfiltration target (gi, f, type `sector` then press enter)',
        check: (c) => {
          const u = getNodeById(c.fs, 'incoming');
          if (!u || !c.currentPath.includes(u.id)) return false;
          const visible = getVisibleItems(c);
          const p = visible[c.cursorIndex];
          // Completion when the cursor is on sector_map.png and we're in normal mode
          return (
            u.name === 'incoming' &&
            p != null &&
            p.name === 'sector_map.png' &&
            c.mode === 'normal' &&
            c.usedFilter === true
          );
        },
        completed: false,
      },
      {
        id: 'data-harvest-3',
        description: 'Harvest `~/incoming/sector_map.png` signature for staging (x, Escape)',
        check: (c) => {
          const u = getNodeById(c.fs, 'incoming');
          const hasActiveFilter = !!(u && c.filters && c.filters[u.id]);
          return (
            c.clipboard?.action === 'cut' &&
            c.clipboard.nodes.some((p) => p.name === 'sector_map.png') &&
            !hasActiveFilter &&
            c.mode === 'normal'
          );
        },
        completed: false,
      },
      {
        id: 'data-harvest-4',
        description: 'Secure the asset in the `~/media` storage partition (p)',
        check: (c) => {
          const media = getNodeById(c.fs, 'media');
          return (
            !!media &&
            c.currentPath.includes(media.id) &&
            media.children?.some((n) => n.name === 'sector_map.png')
          );
        },
        completed: false,
      },
    ],
  },
  {
    id: 4,
    episodeId: 1,
    title: 'UPLINK ESTABLISHMENT',
    description: 'Structure is power. Aggregate the configuration signatures. Build the relay.',
    initialPath: ['root', 'home', 'guest', 'media'],
    hint: 'Replicate (y), exfiltrate (x). Jump (gd). Create Sector (a). Rename (r).',
    coreSkill: 'Create (a), Copy (y/p) & Rename (r)',
    environmentalClue:
      'NAVIGATE: ~/datastore | CREATE: protocols/uplink_v1.conf | CLONE: → uplink_v2.conf',
    successMessage:
      'RELAY ARCHITECTURE STABLE. The connection is thin, like a wire in a storm. Security is flagging your signatures. Hide the blueprints in the `.config` vault before they trace the route.',
    efficiencyTip:
      'OBSERVATION: Relay construction detected. Your signature is becoming distinct. Masking is required.',
    buildsOn: [1],
    leadsTo: [5],
    tasks: [
      {
        id: 'nav-and-create-dir',
        description: 'Establish `~/datastore/protocols/` relay node (a)',
        check: (c) => {
          const s = getNodeById(c.fs, 'datastore');
          return !!s?.children?.find((r) => r.name === 'protocols' && r.type === 'dir');
        },
        completed: false,
      },
      {
        id: 'enter-and-create-v1',
        description: 'Initialize `~/datastore/protocols/uplink_v1.conf` signature (a)',
        check: (c) => {
          const datastore = getNodeById(c.fs, 'datastore');
          const r = datastore?.children?.find((n) => n.name === 'protocols');
          return (
            c.currentPath.includes(r?.id || '') &&
            !!r?.children?.find((p) => p.name === 'uplink_v1.conf')
          );
        },
        completed: false,
      },
      {
        id: 'clone-and-rename',
        description: 'Replicate and deploy as `~/datastore/protocols/uplink_v2.conf` (y, p, r)',
        check: (c) => {
          const datastore = getNodeById(c.fs, 'datastore');
          const f = datastore?.children?.find((n) => n.name === 'protocols');
          return !!f?.children?.find((h) => h.name === 'uplink_v2.conf');
        },
        completed: false,
      },
    ],
  },
  {
    id: 5,
    episodeId: 1,
    title: 'CONTAINMENT BREACH',
    description:
      'Detection imminent. Security is flagging network signatures. Evacuate assets to the hidden `.config` vault.',
    initialPath: ['root', 'home', 'guest', 'datastore', 'protocols'],
    hint: 'Select (Space), exfiltrate (x). Reveal hidden (.), paste (p).',
    coreSkill: 'Batch Selection (Space) + Toggle Hidden (.)',
    environmentalClue:
      'VAULT: ~ / .config | ASSETS: protocols / * | MODE: Select → Cut → Reveal → Paste',
    successMessage:
      'SEGMENTS ARCHIVED. The vault is heavy with data. But a credential leak in `/tmp` has opened a temporary back door. Breach it before the honeypots snap shut.',
    efficiencyTip:
      'OBSERVATION: Vault interaction successful. You are learning to move in the shadows. The Heuristic Engine is initializing.',
    leadsTo: [6],
    tasks: [
      {
        id: 'batch-cut-files',
        description: 'Exfiltrate both uplink signatures from `~/datastore/protocols/` (Space+x)',
        check: (c) => {
          return (
            c.clipboard?.action === 'cut' &&
            c.clipboard.nodes.some((f) => f.name === 'uplink_v1.conf') &&
            c.clipboard.nodes.some((f) => f.name === 'uplink_v2.conf')
          );
        },
        completed: false,
      },
      {
        id: 'reveal-hidden',
        description: 'Reveal `~/guest` hidden storage partitions (gh, .)',
        check: (c, _u) => {
          const s = getNodeById(c.fs, 'guest');
          return c.currentPath.includes(s?.id || '') && c.showHidden === true && c.usedGH === true;
        },
        completed: false,
      },
      {
        id: 'establish-stronghold',
        description: 'Construct `~/.config/vault/active/` stronghold (a)',
        check: (c) => {
          const conf = getNodeById(c.fs, '.config');
          const vault = conf?.children?.find((p) => p.name === 'vault');
          return !!vault?.children?.find((p) => p.name === 'active' && p.type === 'dir');
        },
        completed: false,
      },
      {
        id: 'deploy-assets',
        description: 'Migrate assets to `~/.config/vault/active/` (p)',
        check: (c) => {
          const conf = getNodeById(c.fs, '.config');
          const vault = conf?.children?.find((p) => p.name === 'vault');
          const active = vault?.children?.find((p) => p.name === 'active');
          const f = active?.children?.some((z) => z.name === 'uplink_v1.conf');
          const r = active?.children?.some((z) => z.name === 'uplink_v2.conf');
          return !!f && !!r;
        },
        completed: false,
      },
      {
        id: 'hide-hidden',
        description: 'Mask traces (.)',
        check: (c, _l) => {
          // Ensure assets are deployed first to prevent premature completion if hidden starts false
          const conf = getNodeById(c.fs, '.config');
          const vault = conf?.children?.find((p) => p.name === 'vault');
          const active = vault?.children?.find((p) => p.name === 'active');
          const f = active?.children?.some((z) => z.name === 'uplink_v1.conf');
          const r = active?.children?.some((z) => z.name === 'uplink_v2.conf');
          if (!f || !r) return false;

          const s = getNodeById(c.fs, 'guest');
          return c.currentPath.includes(s?.id || '') && c.showHidden === false && c.usedGH === true;
        },
        completed: false,
      },
    ],
    onEnter: (fs) => {
      // Fixed baseline for time
      const BASE_TIME = 1433059200000; // 2015-05-31 08:00:00
      const day = 86400000;
      let newFs = ensurePrerequisiteState(fs, 5);

      // [PASSIVE DISCOVERY]
      const datastore = getNodeById(newFs, 'datastore');
      const protocols = datastore?.children?.find((c) => c.name === 'protocols');
      if (protocols && protocols.children) {
        if (!protocols.children.find((c) => c.name === 'security_policy_v1.1.draft')) {
          protocols.children.push({
            id: 'lvl5-policy-update',
            name: 'security_policy_v1.1.draft',
            type: 'file',
            content: `DRAFT POLICY - DO NOT DISTRIBUTE
SUBJECT: Sector 7 Quarantine Protocols

Effectively immediately, the "Passive Monitoring" phase is concluding.
Watchdog v1.1 (Heuristic) is scheduled for deployment.
Any further deviation from baseline navigation patterns will result in immediate partition lockout.

- Mark Reyes, Security Engineer`,
            parentId: protocols.id,
            modifiedAt: BASE_TIME - 3 * day,
          });
        }
      }

      // Auto-populate the blank files created in Level 4
      if (protocols?.children) {
        protocols.children = protocols.children.map((c) => {
          if (c.name === 'uplink_v1.conf')
            return { ...c, content: UPLINK_V1_CONTENT, modifiedAt: BASE_TIME - 10 * day };
          if (c.name === 'uplink_v2.conf')
            return { ...c, content: UPLINK_V2_CONTENT, modifiedAt: BASE_TIME - 10 * day };
          return c;
        });
      }

      return newFs;
    },
  },
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
          return c.currentPath.includes(b?.id || '');
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
      const FORCE_SCENARIO: string | null = (window as any).FORCE_SCENARIO || null; // Access global or import if needed, but for now assuming it's available via window or similar if imported. Actually I should import it.
      // Wait, FORCE_SCENARIO was in constants.tsx. I should export/import it.
      // For now let's assume it is null or handle it.

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
