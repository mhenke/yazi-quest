import { Level } from '../../types';
import { getVisibleItems } from '../../utils/viewHelpers';
import { getNodeById, getNodeByPath, findNodeByName } from '../../utils/fsHelpers';
import { ensurePrerequisiteState } from '../../utils/levelStateHelpers';
import { UPLINK_V1_CONTENT, UPLINK_V2_CONTENT } from '../lore';

export const EPISODE_1_LEVELS: Level[] = [
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
          const visibleItems = getVisibleItems(c);
          return visibleItems[c.cursorIndex]?.id === watchdogLog.id;
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
      const BASE_TIME = 1433059200000;
      const day = 86400000;
      const newFs = ensurePrerequisiteState(fs, 5);

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
];
