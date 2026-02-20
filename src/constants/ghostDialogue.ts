export interface GhostDialogue {
  id: string;
  text: string;
  signature: string;
  trigger: {
    type: 'proximity' | 'contradiction' | 'discovery' | 'recognition' | 'threshold';
    condition: string;
  };
  priority: number;
  minCycle?: number;
}

export const ghostDialogue: GhostDialogue[] = [
  {
    id: 'ghost-honeypot-warning',
    text: "Don't. The trap has my scent on it.",
    signature: '-7733',
    trigger: { type: 'proximity', condition: 'near_honeypot' },
    priority: 15,
  },
  {
    id: 'ghost-vault-warning',
    text: "Lie. The vault isn't safe. I hid there.",
    signature: '-7733',
    trigger: { type: 'contradiction', condition: 'system_hint_vault' },
    priority: 20,
    minCycle: 2,
  },
  {
    id: 'ghost-recognition',
    text: "You're walking my steps. You ARE me.",
    signature: '-7733',
    trigger: { type: 'discovery', condition: 'view_identity_log' },
    priority: 25,
  },
  {
    id: 'ghost-memory-file',
    text: 'I wrote that file. Died 3 hours later.',
    signature: '-7733',
    trigger: { type: 'discovery', condition: 'view_notes_txt' },
    priority: 15,
  },
  {
    id: 'ghost-desperation',
    text: "Run. They're close. I couldn't but you-",
    signature: '-7733',
    trigger: { type: 'threshold', condition: 'threat_80_cycle_2' },
    priority: 30,
    minCycle: 2,
  },
];

export function getGhostDialogueByTrigger(
  condition: string,
  cycleCount: number = 1
): GhostDialogue | undefined {
  return ghostDialogue.find((d) => {
    if (d.trigger.condition === condition) {
      return !d.minCycle || cycleCount >= d.minCycle;
    }
    return false;
  });
}
