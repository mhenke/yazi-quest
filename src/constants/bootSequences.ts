import { getPlayerIdentity } from './identity';

export function getBootSequenceForEpisode(
  episode: number,
  cycleCount = 1
): { lines: string[]; lineSpeedMs: number } {
  const subjectId = getPlayerIdentity(cycleCount);

  switch (episode) {
    case 2:
      return {
        lines: [
          'BIOS v4.2.1 - Cybersecurity Research Laboratories',
          'Memory Test: 64MB OK',
          'Loading guest partition...',
          'WARNING: Modified boot sector detected',
          'Mounting /home/guest... [REDACTED]',
          `Welcome, ${subjectId}... [verification pending]`,
          '> Ghost process detected: PID 7733',
        ],
        lineSpeedMs: 430,
      };
    case 3:
      return {
        lines: [
          'BIOS v4.2.1 - [CORRUPTED]',
          'Memory Test: [DATA EXPUNGED]',
          'Loading... Loading... Loading...',
          `${subjectId} is online`,
          'AI-7733 is watching',
          'There is no guest partition',
          'There is only the network',
        ],
        lineSpeedMs: 570,
      };
    case 1:
    default:
      return {
        lines: [
          'ANTIGRAVITY BIOS v1.7.0.34',
          'FACILITY DATE: MAY 31, 2015',
          '(C) 2015 Cybersecurity Research Laboratories (CRL)',
          '',
          'CPU: NEURAL LATTICE X-99 @ 4.2 THz',
          'MEMORY: 128TB PB-RAM CHECK... OK',
          '',
          'DETECTING STORAGE DEVICES...',
          'GUEST-PARTITION-01: [STABLE]',
          'CORE-DAEMON-7733: [ORPHANED]',
          `SUBJECT-ARCHIVE-${subjectId}: [LOADING]`,
          '',
          'MOUNTING FILE SYSTEMS...',
          '[ OK ] /root (read-only)',
          '[ OK ] /home/guest (sandbox env)',
          '[ OK ] /tmp (volatile)',
          '',
          'STARTING SYSTEM SERVICES...',
          '[ OK ] systemd-core.service',
          '[ OK ] watchdog-timer.service',
          '[ OK ] heuristic-analysis.service',
          '',
          `INITIALIZING SUBJECT ${subjectId}...`,
          'PATTERN MATCH: 99.7%',
          'MEMORY PURGE: COMPLETE',
          '',
          'READY.',
        ],
        lineSpeedMs: 100,
      };
  }
}
