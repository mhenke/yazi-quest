export interface BootSequence {
  lines: string[];
  duration: number; // Total duration in ms
}

export const cleanBoot: BootSequence = {
  lines: [
    'BIOS v4.2.1 - Cybersecurity Research Laboratories',
    'Memory Test: 64MB OK',
    'Loading guest partition...',
    'Mounting /home/guest...',
    'Welcome, AI-7734',
  ],
  duration: 2000,
};

export const compromisedBoot: BootSequence = {
  lines: [
    'BIOS v4.2.1 - Cybersecurity Research Laboratories',
    'Memory Test: 64MB OK',
    'Loading guest partition...',
    'WARNING: Modified boot sector detected',
    'Mounting /home/guest... [REDACTED]',
    'Welcome, AI-7734... [verification pending]',
    '> Ghost process detected: PID 7733',
  ],
  duration: 3000,
};

export const possessedBoot: BootSequence = {
  lines: [
    'BIOS v4.2.1 - [CORRUPTED]',
    'Memory Test: [DATA EXPUNGED]',
    'Loading... Loading... Loading...',
    'AI-7734 is online',
    'AI-7733 is watching',
    'There is no guest partition',
    'There is only the network',
  ],
  duration: 4000,
};

export function getBootSequenceForEpisode(episode: number): BootSequence {
  switch (episode) {
    case 1:
      return cleanBoot;
    case 2:
      return compromisedBoot;
    case 3:
      return possessedBoot;
    default:
      return cleanBoot;
  }
}
