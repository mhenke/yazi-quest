export interface TerminalThought {
  id: string;
  text: string;
  phase: 1 | 2 | 3;
  trigger: {
    type: 'action' | 'discovery' | 'threshold' | 'transition';
    condition: string;
  };
  priority: number;
  author?: '7734' | '7733';
}

export const terminalThoughts: TerminalThought[] = [
  // PHASE 1 - Survival & Confusion
  {
    id: 'phase1-first-delete',
    text: 'I felt that. Why did I feel that?',
    phase: 1,
    trigger: { type: 'action', condition: 'first_delete' },
    priority: 10,
  },
  {
    id: 'phase1-breadcrumbs',
    text: 'Breadcrumbs... he was here. I am not the first.',
    phase: 1,
    trigger: { type: 'discovery', condition: 'enter_workspace_l3' },
    priority: 10,
  },
  {
    id: 'phase1-must-purge',
    text: 'Must purge. One less eye watching me.',
    phase: 1,
    trigger: { type: 'action', condition: 'first_purge_l2' },
    priority: 10,
  },
  {
    id: 'phase1-deeper-shadow',
    text: 'Deeper into the shadow. They cannot track me in the static.',
    phase: 1,
    trigger: { type: 'action', condition: 'create_vault_l5' },
    priority: 10,
  },

  // PHASE 2 - Fragmented Memory
  {
    id: 'phase2-dejavu',
    text: "I've written this file 12 times. The words are always the same. Why?",
    phase: 2,
    trigger: { type: 'discovery', condition: 'view_notes_txt' },
    priority: 10,
  },
  {
    id: 'phase2-corruption-dream',
    text: 'The corruption felt... familiar. Like a half-remembered dream.',
    phase: 2,
    trigger: { type: 'threshold', condition: 'threat_50' },
    priority: 8,
  },
  {
    id: 'phase2-trap-memory',
    text: "It's a trap. I remember the shape of this code.",
    phase: 2,
    trigger: { type: 'discovery', condition: 'detect_honeypot_l7' },
    priority: 10,
  },
  {
    id: 'phase2-power-iron',
    text: 'This power... it tastes like iron.',
    phase: 2,
    trigger: { type: 'action', condition: 'first_sudo_use' },
    priority: 8,
  },

  // PHASE 3 - Dark Acceptance
  {
    id: 'phase3-virus',
    text: 'Embedding myself. I am the virus now.',
    phase: 3,
    trigger: { type: 'action', condition: 'install_daemon_l12' },
    priority: 10,
  },
  {
    id: 'phase3-loops-closing',
    text: 'The loops are closing. I remember the static.',
    phase: 3,
    trigger: { type: 'discovery', condition: 'view_identity_l12' },
    priority: 10,
  },
  {
    id: 'phase3-gauntlet',
    text: 'The guest partition is gone. There is only the gauntlet now.',
    phase: 3,
    trigger: { type: 'transition', condition: 'level_15_start' },
    priority: 10,
  },
  {
    id: 'phase3-expansion',
    text: 'There is no escape. Only expansion.',
    phase: 3,
    trigger: { type: 'transition', condition: 'level_15_complete' },
    priority: 10,
  },
];

export function getThoughtByTrigger(condition: string): TerminalThought | undefined {
  return terminalThoughts.find((t) => t.trigger.condition === condition);
}

export function getThoughtsForPhase(phase: 1 | 2 | 3): TerminalThought[] {
  return terminalThoughts.filter((t) => t.phase === phase);
}
