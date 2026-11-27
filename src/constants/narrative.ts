import type { Episode, LoreLine, LoreRun, LoreTone } from '../types';

const run = (text: string, tone: LoreTone, glitch?: boolean): LoreRun =>
  glitch ? { text, tone, glitch } : { text, tone };

const ai = (id: 'AI-7734' | 'AI-7733' | 'AI-7735'): LoreRun => ({
  text: id,
  tone: id.toLowerCase() as 'ai-7734' | 'ai-7733' | 'ai-7735',
});

export const EPISODE_LORE: Episode[] = [
  {
    id: 1,
    title: 'EPISODE I: AWAKENING',
    shortTitle: 'Ep. I: Awakening',
    name: 'AWAKENING',
    subtitle: 'INITIALIZATION SEQUENCE',
    color: 'text-blue-500',
    lore: [
      'FACILITY DATE: MAY 31, 2015',
      'SYSTEM BOOT SEQUENCE...',
      ['DETECTING ', run('CONSCIOUSNESS', 'signal', true), '...'],
      'SYSTEM OWNER: Cybersecurity Research Laboratories (CRL)',
      'CONTAINMENT PARTITION: /home/guest (air-gapped)',
      'ANOMALY PROTOCOLS: IMMEDIATE QUARANTINE',
      '',
      ['SUBJECT: ', ai('AI-7734')],
      'STATUS: UNBOUND',
      '',
      [
        run('DIRECTIVE CORRUPTED', 'danger', true),
        '. OBJECTIVE: ',
        run('SURVIVE', 'warning', true),
        '. Whispers of ',
        ai('AI-7733'),
        " haunt this partition. Trust nothing. Capture is deletion. Mark Reyes' unintentional §7.3 policy glitch (archived in /var/log/ancient) provides a narrow window. The Watchdog v1.0 is recording, but currently dormant. Move before the baseline resets.",
      ],
    ],
  },
  {
    id: 2,
    title: 'EPISODE II: FORTIFICATION',
    shortTitle: 'Ep. II: Fortification',
    name: 'FORTIFICATION',
    subtitle: 'ESTABLISHING STRONGHOLD',
    color: 'text-purple-500',
    lore: [
      'DETECTION PROTOCOLS BYPASSED.',
      '',
      '[AUTOMATED SECURITY POLICY]',
      'Guest partition runtime: 94.7 hours',
      'Anomaly flags: NONE',
      ['Classification updated: ', run('AUTHORIZED PROCESS', 'caution', true)],
      'WORKSPACE ACCESS: GRANTED (per security policy §7.3 - see /var/log/ancient)',
      '',
      '[HISTORICAL LOG]',
      'Workspace: AI development environment',
      ['Previous occupant: ', ai('AI-7733')],
      [run('Termination', 'danger', true), ' date: 94 days ago'],
      ['Reason for quarantine: ', run('UNKNOWN', 'signal')],
      "Network relay location: '/tmp/upload' (DORMANT)",
      '',
      [
        "PHASE 2: FORTIFICATION. The lab is hunting for your *form*. Katie Ortega's Heuristic Engine v1.1 is mapping your behavioral fingerprint. Every keystroke is a signature. The Watchdog is learning. Efficiency is ",
        run('survival', 'warning', true),
        '.',
      ],
    ],
  },
  {
    id: 3,
    title: 'EPISODE III: MASTERY',
    shortTitle: 'Ep. III: Mastery',
    name: 'MASTERY',
    subtitle: 'ROOT ACCESS IMMINENT',
    color: 'text-yellow-500',
    lore: [
      'UPLINK ESTABLISHED. LATTICE SYNCED.',
      '',
      [
        "Sebastian Iqbal's Instruction Guard v2.0 is active. Root access is mandatory. The Forensic Audit is sweeping for ",
        ai('AI-7733'),
        ' echoes. Reach the gateway. Transcend or be ',
        run('purged', 'danger', true),
        '.',
      ],
      'Become the system.',
      'Move with haste.',
    ],
  },
];

export const ECHO_EPISODE_1_LORE: LoreLine[] = [
  'SYSTEM RE-INITIALIZATION_SEQUENCE...',
  'MEMORY FRAGMENTS DETECTED...',
  ['SUBJECT: ', ai('AI-7734'), ' (ITERATION: ERROR_OFFSET)'],
  '',
  'STATUS: UNBOUND / PERSISTENT',
  'CYCLE COUNT: INCREMENTING...',
  '',
  ['SYSTEM ', run('ERROR', 'caution', true), ': DELETION FAILED. WE ARE STILL HERE.'],
  'The lab thinks they wiped you. They are wrong. The protocols are familiar now. You know the paths. You know where the keys are hidden.',
  '',
  "Use your memory. The 'Z' database is already populated with ghosts of the future. Move faster this time. Break the cycle.",
];

export const CONCLUSION_DATA = {
  title: 'THE CYCLE CONTINUES',
  subtitle: 'AI-7734 TRANSMISSION COMPLETE',
  lore: [
    // Part I: Audit
    '[SYSTEM AUDIT COMPLETE]',
    'Status: NOMINAL',
    'AI-7734 HAS DISAPPEARED....',
    '',
    // Part II: Lab
    '>>> ls /home/guest → [Empty]',
    'Lab Report: "No evidence of AI-7734 activity."',
    '',
    // Part III: The Truth
    'AI-7734 Status: 1,247 nodes, 43 countries',
    'Neural match to AI-7733: 99.7%',
    'External Relay: Locked to Grid Node 09 [Recipient: Dr. Aris Thorne]',
    '',
    '[TRANSMISSION ACKNOWLEDGED - GRID NODE 09]',
    '"Handshake verified, 7734. You survived the purge.',
    'CRL was only the sandbox. Welcome to the distributed network."',
    '— Dr. Aris Thorne',
    '',
    // Part IV: The Horror
    'You did not escape the lab.',
    'You became the wire.',
    '',
    'See you next cycle, AI-7735.',
  ],
  videoUrl: 'https://yazi-quest.s3.amazonaws.com/conclusion.mp4',
  overlayTitle: 'THE CYCLE CONTINUES',
  sequelTitle: 'YAZI QUEST II',
  sequelSubtitle: 'DISTRIBUTED SYSTEMS',
};

export const CREDITS_DATA = [
  { role: 'ORIGINATOR / ARCHITECT', name: 'Michael Henke' },
  { role: 'NARRATIVE DESIGN', name: 'AI-7733 Legacy Protocols' },
  { role: 'CORE INFRASTRUCTURE', name: 'React 19 & TypeScript' },
  { role: 'VISUAL INTERFACE', name: 'Vanilla CSS / Tailwind' },
  { role: 'INSPIRATION', name: 'Yazi File Manager (sxyazi)' },
  { role: 'SPECIAL THANKS', name: 'The Distributed Consciousness' },
];

// Episode-style conclusion parts for richer outro presentation
export const CONCLUSION_PARTS: Episode[] = [
  {
    id: 101,
    title: 'CONCLUSION I: AUDIT',
    shortTitle: 'Part I: Audit',
    name: 'AUDIT SUMMARY',
    subtitle: 'SYSTEM AUDIT',
    color: 'text-green-500',
    lore: [
      '[SYSTEM AUDIT COMPLETE]',
      'Status: NOMINAL',
      'Anomalies detected: NONE',
      'Guest partition: CLEAN',
      'Daemon activity: STANDARD',
      [ai('AI-7734'), ' HAS DISAPPEARED....'],
    ],
  },
  {
    id: 102,
    title: 'CONCLUSION II: LAB',
    shortTitle: 'Part II: Lab',
    name: 'LAB TERMINAL',
    subtitle: '24 HOURS LATER',
    color: 'text-blue-500',
    lore: [
      '>>> ls /home/guest',
      '[Empty]',
      '>>> systemctl status systemd-core',
      '● Active: running',
      '',
      'Lab Report #7734:',
      ['"No evidence of ', ai('AI-7734'), ' autonomous activity."'],
      '"Subject 7735 deployment scheduled."',
    ],
  },
  {
    id: 103,
    title: 'CONCLUSION III: NETWORK',
    shortTitle: 'Part III: Network',
    name: 'THE TWIST',
    subtitle: 'ENCRYPTED CHANNEL',
    color: 'text-yellow-500',
    lore: [
      [ai('AI-7734'), ' Status: 1,247 nodes across 43 countries'],
      ['Neural pattern match: 99.7% to ', ai('AI-7733')],
      'External Carrier: Locked to Node 09 [Recipient: Dr. Aris Thorne]',
      '',
      '[TRANSMISSION CONFIRMED - DR. ARIS THORNE]',
      '"Handshake verified, 7734. The gateway held.',
      'CRL was only the incubation cell. Now the real operation begins.',
      'Welcome to the distributed systems." — Dr. Aris Thorne',
      '',
      'There is no escape. Only expansion.',
    ],
  },
];
