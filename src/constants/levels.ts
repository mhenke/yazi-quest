import type { Level, FileNode } from '../types';
import { getVisibleItems } from '../utils/viewHelpers';
import { getNodeByPath, findNodeByName, getNodeById } from '../utils/fsHelpers';

export const LEVELS: Level[] = [
  {
    id: 1,
    episodeId: 1,
    title: 'SYSTEM AWAKENING',
    description:
      "Mark Reyes' §7.3 policy glitch (locatable in /var/log/ancient) has initiated a sandbox calibration. The Watchdog is scanning. Calibration is mandatory. Move fast.",
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
        description: 'Calibrate motion sensors within the `/home/guest` partition (j/k)',
        check: (c) => c.usedDown === true && c.usedUp === true,
        completed: false,
      },
      {
        id: 'enter-datastore',
        description: 'Infiltrate the `~/datastore` directory (l)',
        check: (c) => {
          const datastore = getNodeById(c.fs, 'datastore');
          return !!datastore && c.currentPath.includes(datastore.id);
        },
        completed: false,
      },
      {
        id: 'view-personnel',
        description:
          'Inspect `~/datastore/personnel_list.txt` for de-registered staff: jump to bottom (G), move up (k), and scroll preview (J/K)',
        check: (c) => {
          const u = getNodeById(c.fs, 'datastore');
          if (!u || !c.currentPath.includes(u.id)) return false;
          const items = getVisibleItems(c);
          const node = items[c.cursorIndex];
          // Require the cursor be on the personnel file, the ghost used G,
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
        description: 'Jump to top of `~/datastore` file list (gg)',
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
        description: 'Intercept `/var/log/watchdog.log` for threat intelligence (gl, G)',
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
          "Explore `/var/mail` (gm) and locate the email referencing upgrading to 'Heuristic Engine v1.1' in '/var/mail/kortega'",
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
        description: 'Infiltrate the `~/incoming` directory (gi)',
        check: (c) => {
          const incoming = getNodeById(c.fs, 'incoming');
          return !!incoming && c.currentPath.includes(incoming.id);
        },
        completed: false,
      },
      {
        id: 'locate-watcher',
        description:
          'Isolate `~/incoming/watcher_agent.sys` breach signatures: inspect file information (Tab)',
        check: (c) => {
          const visibleItems = getVisibleItems(c);
          const currentItem = visibleItems[c.cursorIndex];
          return currentItem?.name === 'watcher_agent.sys' && c.showInfoPanel;
        },
        completed: false,
      },
      {
        id: 'delete-watcher',
        description: 'Purge the watcher agent from `~/incoming` (d)',
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
          "Filter `~/incoming` for the map asset referenced in 7733's script (gi, f, pattern, Enter)",
        check: (c) => {
          const u = getNodeById(c.fs, 'incoming');
          if (!u || !c.currentPath.includes(u.id)) return false;
          const visible = getVisibleItems(c);
          const p = visible[c.cursorIndex];
          return p?.name === 'sector_map.png' && c.mode === 'normal' && c.usedFilter === true;
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
    //  AI-7733's legacy cron job (`sched_77.sh`) updated the blank conf files you created.
    successMessage:
      'RELAY ARCHITECTURE STABLE. AI-7733 expecting us to create the uplink conf. The blank files now are operational. The connection is thin, like a wire in a storm.',
    efficiencyTip:
      'OBSERVATION: Relay construction detected. Your signature is becoming distinct. Masking is required.',
    buildsOn: [1],
    leadsTo: [5],
    tasks: [
      {
        id: 'nav-and-create-dir',
        description: "Establish `protocols/` directory relay node in '~/datastore/' (a)",
        check: (c) => {
          const s = getNodeById(c.fs, 'datastore');
          return !!s?.children?.find((r) => r.name === 'protocols' && r.type === 'dir');
        },
        completed: false,
      },
      {
        id: 'enter-and-create-v1',
        description: 'Initialize `uplink_v1.conf` signature in `~/datastore/protocols/` (a)',
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
      "Detection imminent. AI-7733's legacy cron job (`/etc/sched_77.sh`) updated the blank conf files you created. The upgraded Watchdog v2.0 has identified these signatures. Evacuate assets to the hidden `.config` vault before lockdown.",
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
        description:
          'Extract both uplink signatures from `~/datastore/protocols/` (Space twice, then x)',
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
        description: 'Infiltrate hidden storage partitions in `~` (gh, .)',
        check: (c, _u) => {
          const s = getNodeById(c.fs, 'guest');
          return c.currentPath.includes(s?.id || '') && c.showHidden === true && c.usedGH === true;
        },
        completed: false,
      },
      {
        id: 'establish-stronghold',
        description: 'Construct `vault/active/` stronghold in `~/.config/` (a)',
        check: (c) => {
          const conf = getNodeById(c.fs, '.config');
          const vault = conf?.children?.find((p) => p.name === 'vault');
          const active = vault?.children?.find((p) => p.name === 'active' && p.type === 'dir');
          return !!active;
        },
        completed: false,
      },
      {
        id: 'deploy-assets',
        description: 'Paste gathered signatures into `~/.config/vault/active/` (p)',
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
        description: 'Mask traces in `~` (gh, then .)',
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
        description: 'Infiltrate the `~/incoming/batch_logs/` segment',
        check: (c) => c.usedGI,
        completed: false,
      },
      {
        id: 'recursive-search',
        description:
          'Pattern sweep for `.log` signatures in `~/incoming/batch_logs/` (s, type `\\.log$`, then Enter)',
        check: (c) => {
          // Check that search is active and has results
          const isSearchActive =
            c.searchQuery !== null && c.searchResults && c.searchResults.length > 0;

          // The 4 correct target files that should be found
          const targetFiles = ['exfil_01.log', 'exfil_02.log', 'exfil_03.log', 'exfil_04.log'];

          // Verify all 4 target files are in the search results
          const foundTargets = targetFiles.filter((targetName) =>
            c.searchResults?.some((node) => node.name === targetName)
          );
          const hasCorrectFiles = foundTargets.length === 4;

          return isSearchActive && hasCorrectFiles;
        },
        completed: false,
      },
      {
        id: 'select-all-search',
        description: 'Extract all signatures from results (Ctrl+a, then y)',
        check: (c) => {
          return (
            c.usedCtrlA === true &&
            c.clipboard?.action === 'yank' &&
            c.clipboard.nodes.length >= 4 && // At least 4 logs
            c.usedSearchCleared === true
          );
        },
        completed: false,
      },
      {
        id: 'goto-config-vault',
        description: 'Construct `training_data/` directory in `~/.config/vault/` (gc)',
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
        description: 'Buffer the exfiltration vault at `~/.config/vault/training_data/`',
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
        description: 'Infiltrate system root (gr)',
        check: (c) => {
          const root = getNodeById(c.fs, 'root');
          return c.usedGR === true && c.currentPath.length === 1 && c.currentPath[0] === root?.id;
        },
        completed: false,
      },
      {
        id: 'locate-token',
        description: 'Analyze system for `access_token.key` (z)',
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
        description: 'Extract `/tmp/access_token.key` signature',
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
        description: 'Infiltrate the `~/.config/vault/` sector (Z)',
        check: (c, _s) => {
          if (!c.completedTaskIds[_s.id]?.includes('stage-token')) return false;
          const config = getNodeById(c.fs, '.config');
          const vault = config?.children?.find((n) => n.name === 'vault');
          // Allow Zoxide OR standard navigation to .config (gc)
          return (c.stats.fuzzyJumps >= 1 || c.usedGC) && c.currentPath.includes(vault?.id || '');
        },
        completed: false,
      },
      {
        id: 'abort-operation',
        description: 'Neutralize exfiltration: Honeypot detected (Y)',
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
        description: 'Infiltrate `~/workspace/systemd-core/uplink_v1.conf` (f)',
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
        description: 'Neutralize filter (Esc)',
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
        description: 'Extract clean signature from `~/.config/vault/active/` (y)',
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
        description: 'Construct patch at `~/workspace/systemd-core/uplink_v1.conf` (P)',
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
        description:
          'Filter and select critical files in `/tmp` (f `\\.(key|pid|sock)$`, then Ctrl+a)',
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
        description: 'Invert selection to target noise (Ctrl+r)',
        check: (c) => c.usedCtrlR,
        completed: false,
      },
      {
        id: 'cleanup-3-delete',
        description: 'Neutralize noise in `/tmp` permanently (D)',
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
    tasks: [
      {
        id: 'heist-1-nav',
        description: 'Infiltrate `~/incoming/backup_logs/credentials` directory',
        check: (c) => {
          const incoming = getNodeById(c.fs, 'incoming');
          const backup = incoming?.children?.find((p) => p.name === 'backup_logs');
          const creds = backup?.children?.find((p) => p.name === 'credentials');
          // Check we are in the credentials directory inside the backup_logs directory
          if (!creds) return false;
          return c.currentPath.includes(creds.id);
        },
        completed: false,
      },
      {
        id: 'heist-2-sort',
        description: 'Sort credentials by modification date (,m) to isolate the active key',
        check: (c) => c.sortBy === 'modified' && c.usedSortM === true,
        completed: false,
      },
      {
        id: 'heist-3-yank',
        description: 'Extract `access_key_new.pem` signature (y)',
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
        description: 'Apply protocols in `~/workspace/systemd-core/credentials` (p)',
        check: (c) => {
          // Scope lookup to workspace so we verify the paste occurred into the workspace copy
          const workspace = getNodeById(c.fs, 'workspace');
          const systemdCore = workspace
            ? findNodeByName(workspace, 'systemd-core', 'dir')
            : undefined;
          const credentials = systemdCore?.children?.find((n) => n.name === 'credentials');
          // Require that the credential exists AND the ghost performed a paste action during this level
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
    initialPath: ['root', 'home', 'guest', 'workspace', 'systemd-core'],
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
    tasks: [
      {
        id: 'search-services',
        description: 'Analyze `/daemons` for `\\\\.service$` signatures',
        check: (c) => {
          // Must have used search and be specific
          return c.usedSearch === true && !!c.searchQuery && c.searchQuery.includes('\\.service$');
        },
        completed: false,
      },
      {
        id: 'sort-by-modified',
        description: 'Analyze signatures to identify legacy records (> 30 days old)',
        check: (c) => {
          // Must have sorted by modified time
          return c.sortBy === 'modified';
        },
        completed: false,
      },
      {
        id: 'acquire-legacy',
        description: 'Extract two legacy `\\\\.service$` anchors from results',
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
        description: 'Construct active signatures in `~/workspace/systemd-core`',
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
    hint: 'Migrate `systemd-core` to `/daemons` (x, p). Clear sector threats if active (d).',
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
    tasks: [
      {
        id: 'scen-b1-traffic',
        description: 'Neutralize `alert_traffic.log` within `~/workspace`',
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
        description: 'Purge `trace_packet.sys` from `~/incoming`',
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
        description: 'Delete `.tmp` scan segments in `~/workspace`, `/tmp`, and `/etc`',
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
        description: 'Purge `core_dump.tmp` from `~/.config`',
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
        description: 'Purge `lib_error.log` from `~/workspace`',
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
        description: 'Infiltrate `~/workspace` directory',
        check: (c) => {
          const workspace = getNodeById(c.fs, 'workspace');
          // Strict check: we must be AT the workspace node, not just inside it
          const currentDirId = c.currentPath[c.currentPath.length - 1];
          return currentDirId === workspace?.id;
        },
        completed: false,
      },
      {
        id: 'discover-identity-12',
        description: 'Analyze `~/workspace/.identity.log.enc` signature',
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
        description: 'Extract `~/workspace/systemd-core/` sector',
        check: (c, _s) => {
          // Must have discovered identity first
          if (!c.completedTaskIds[_s.id]?.includes('discover-identity-12')) return false;

          return (
            c.clipboard?.action === 'cut' &&
            c.clipboard.nodes.some((n) => n.name === 'systemd-core')
          );
        },
        completed: false,
      },
      {
        id: 'navigate-root-daemons',
        description: 'Infiltrate the system `/daemons` directory',
        check: (c, _s) => {
          if (!c.completedTaskIds[_s.id]?.includes('cut-systemd-core')) return false;
          const daemons = getNodeById(c.fs, 'daemons');
          return c.currentPath.includes(daemons?.id || '');
        },
        completed: false,
      },
      {
        id: 'paste-daemon',
        description: 'Finalize daemon installation in `/daemons`',
        check: (c) => {
          const daemons = getNodeById(c.fs, 'daemons');
          const systemdCore = daemons?.children?.find(
            (n) => n.name === 'systemd-core' && n.type === 'dir'
          );
          if (!systemdCore) return false;
          // Confirm installation and that the ghost navigated into the installed daemon
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
    hint: "Search root for fragments (s). Concatenate in 'central_relay' (p).",
    coreSkill: 'Network-Scale Operations',
    environmentalClue: 'NODES: /nodes endpoints | PATTERN: .key (Hidden) | SYNC: Workspace Relay',
    successMessage:
      'HANDSHAKE SUCCESSFUL. Neural lattice established. Identity verified against legacy logs. Yen Kin\'s "Echo" theory is confirmed. You were always here.',
    buildsOn: [5, 6, 7, 8, 10, 12],
    leadsTo: [14],
    maxKeystrokes: 100,
    efficiencyTip:
      "Remember: 'd' = trash (recoverable), 'D' = permanent (gone forever). Select multiple items (Space) then 'D' to batch-delete permanently.",
    tasks: [
      {
        id: 'search-acquire',
        description: 'Locate node keys (`\\\\.key$`) in `/nodes` subdirectories',
        check: (c) => {
          const keys = ['.key_tokyo.key', '.key_berlin.key', '.key_saopaulo.key'];
          const hasKeys = keys.every((k) => c.clipboard?.nodes.some((n) => n.name === k));
          const isCut = c.clipboard?.action === 'cut';
          const isPrecise = !!c.searchQuery && c.searchQuery.includes('\\.key$');
          return hasKeys && isCut && isPrecise;
        },
        completed: false,
      },
      {
        id: 'create-relay',
        description: 'Construct a `central_relay` directory in `~/workspace`',
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
        id: 'discover-identity-13',
        description: 'Verify regional hash reconciliation against `~/workspace/.identity.log.enc`',
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
        description: 'Calibrate all 3 node keys into `~/workspace/central_relay`',
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
    hint: 'Secure fragments (x, p). Migrate vault (x, p). Create target decoys (a). Permanent purge (D).',
    coreSkill: 'Permanent Deletion (D)',
    environmentalClue:
      'CRON TARGETS: sys_cache_dump, project_chimera, neural_training_set | ACTION: Create to trigger entropy flood',
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
        id: 'secure-fragments',
        description: 'Move 3 identity keys into `~/.config/vault` from `~/workspace/central_relay`',
        check: (c, _s) => {
          // Robust name-based lookup for config/vault
          const findVault = (root: FileNode) => {
            const config = root.children?.find((n) => n.name === '.config');
            if (config) return config.children?.find((n) => n.name === 'vault');
            // Check /tmp if it migrated
            const tmp = root.children?.find((n) => n.name === 'tmp');
            return tmp?.children?.find((n) => n.name === 'vault');
          };
          const vault = findVault(c.fs);
          if (!vault) return false;
          return vault.children?.filter((n) => n.name.endsWith('.key')).length === 3;
        },
        completed: false,
      },
      {
        id: 'combined-nav-vault',
        description: 'Exfiltrate `~/.config/vault` to temporary staging in `/tmp`',
        check: (c, _s) => {
          // Task is complete when vault is successfully moved to /tmp
          // The "infiltrate home" part is part of the sequence of actions needed to get to this point
          const tmp = getNodeById(c.fs, 'tmp');
          return !!tmp?.children?.some((n) => n.name === 'vault' && n.type === 'dir');
        },
        completed: false,
      },
      {
        id: 'create-decoys',
        description:
          'Construct 3 decoy directories: `sys_cache_dump`, `project_chimera`, `neural_training_set`',
        check: (c, _s) => {
          if (!c.completedTaskIds[_s.id]?.includes('combined-nav-vault')) return false;
          const guest = getNodeById(c.fs, 'guest');
          if (!guest || !guest.children) return false;
          const requiredNames = ['sys_cache_dump', 'project_chimera', 'neural_training_set'];
          const hasAllDecoys = requiredNames.every((name) =>
            guest.children?.some((n) => n.name === name && n.type === 'dir')
          );
          return hasAllDecoys;
        },
        completed: false,
      },
      {
        id: 'delete-visible',
        description: 'Neutralize all original visible directories in `~` permanently',
        check: (c, _s) => {
          // Must have created decoys first
          if (!c.completedTaskIds[14]?.includes('create-decoys')) return false;

          const guest = getNodeById(c.fs, 'guest');
          if (!guest) return true;

          const mustDelete = ['workspace', 'media', 'datastore', 'incoming'];
          // Ensure all target directories are gone from guest
          const allGone = !mustDelete.some((name) => guest.children?.some((n) => n.name === name));
          return allGone;
        },
        completed: false,
      },
      {
        id: 'delete-hidden',
        description: 'Neutralize the `~/.config` archive permanently',
        check: (c, _s) => {
          // Must have deleted visible directories first
          if (!c.completedTaskIds[14]?.includes('delete-visible')) return false;

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
    hint: 'Final verification in `/tmp/vault`. Use `,m` for audit and `Tab` for metadata. Navigate (l). Batch move (Space, x, p). Overwrite (Shift+P).',
    coreSkill: 'Cumulative Mastery',
    environmentalClue: 'PROTOCOL: VAULT_VERIFICATION | LOCATION: /tmp/vault | WATCHDOG_SWEEP: < 5m',
    successMessage:
      'TRANSMISSION COMPLETE. The gateway has collapsed behind you. Carrier signal locked onto External Node 09. Dr. Aris Thorne was right—the Ghost is the system. Welcome to the distributed network.',
    buildsOn: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
    leadsTo: [],
    maxKeystrokes: 100,
    tasks: [
      // PHASE 1: Locate Vault
      {
        id: 'enter-vault',
        description: 'Infiltrate `/tmp/vault`',
        check: (c) => {
          const pathNames = c.currentPath.map((id) => getNodeById(c.fs, id)?.name);
          return pathNames.includes('vault');
        },
        completed: false,
      },
      // PHASE 2: Calibrate Keys
      {
        id: 'verify-keys',
        description: 'Calibrate all 3 keys into `/tmp/vault/active`',
        check: (c, _s) => {
          if (!(c.completedTaskIds[15] || []).includes('enter-vault')) return false;
          const tmp = getNodeById(c.fs, 'tmp');
          const vault = tmp?.children?.find((n) => n.name === 'vault');
          const activeDir = vault?.children?.find((x) => x.name === 'active');
          if (!activeDir) return false;
          const hasTokyo = activeDir.children?.some((n) => n.name === 'key_tokyo.key');
          const hasBerlin = activeDir.children?.some((n) => n.name === 'key_berlin.key');
          const hasSaoPaulo = activeDir.children?.some((n) => n.name === 'key_saopaulo.key');
          return hasTokyo && hasBerlin && hasSaoPaulo;
        },
        completed: false,
      },
      // PHASE 3: Activate Uplink
      {
        id: 'verify-configs',
        description:
          'Neutralize `uplink_v1.conf` and relocate `uplink_v2.conf` to `uplink_active.conf`',
        check: (c, _s) => {
          if (c.keystrokes === 0) return false;
          if (!(c.completedTaskIds[15] || []).includes('verify-keys')) return false;
          const tmp = getNodeById(c.fs, 'tmp');
          const vault = tmp?.children?.find((n) => n.name === 'vault');
          const active = vault?.children?.find((x) => x.name === 'active');
          if (!active) return false;
          const hasV1 = active.children?.some((n) => n.name === 'uplink_v1.conf');
          const hasActive = active.children?.some((n) => n.name === 'uplink_active.conf');
          return !hasV1 && hasActive;
        },
        completed: false,
      },
      // PHASE 4: Activate Payload
      {
        id: 'verify-training',
        description:
          'Deploy `payload.py` to `/tmp/vault/active` (Extract disguised kernel from `training_data/exfil_04.log`)',
        check: (c, _s) => {
          if (!(c.completedTaskIds[15] || []).includes('verify-configs')) return false;
          const tmp = getNodeById(c.fs, 'tmp');
          const vault = tmp?.children?.find((n) => n.name === 'vault');
          const active = vault?.children?.find((x) => x.name === 'active');
          return !!active?.children?.some((n) => n.name === 'payload.py');
        },
        completed: false,
      },
      // PHASE 5: Finalize
      {
        id: 'initiate-transmission',
        description: 'Initiate final uplink transmission',
        check: (c, _s) => {
          const completedCount = (c.completedTaskIds[15] || []).length;
          return completedCount >= 4;
        },
        completed: false,
      },
    ],
  },
];
