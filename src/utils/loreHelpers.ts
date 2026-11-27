import type { LoreLine, LoreSegment, LoreTone } from '../types';

export interface SlicedLoreRun {
  text: string;
  tone?: LoreTone;
  glitch: boolean;
}

const segmentToText = (segment: LoreSegment): string =>
  typeof segment === 'string' ? segment : segment.text;

export const loreLineToText = (line: LoreLine): string =>
  typeof line === 'string' ? line : line.map(segmentToText).join('');

export const splitLoreSections = (lore: LoreLine[]): LoreLine[][] => {
  const sections: LoreLine[][] = [];
  let current: LoreLine[] = [];

  for (const line of lore) {
    if (loreLineToText(line) === '') {
      if (current.length > 0) {
        sections.push(current);
        current = [];
      }
    } else {
      current.push(line);
    }
  }

  if (current.length > 0) {
    sections.push(current);
  }
  return sections;
};

export const loreSectionToText = (section: LoreLine[]): string =>
  section.map(loreLineToText).join('\n');

const sliceLoreLine = (
  line: LoreLine,
  limit: number
): { runs: SlicedLoreRun[]; consumed: number } => {
  const segments: LoreSegment[] = typeof line === 'string' ? [line] : line;
  const runs: SlicedLoreRun[] = [];
  let left = Math.max(0, limit);
  let consumed = 0;

  for (const segment of segments) {
    if (left <= 0) break;
    const rawText = segmentToText(segment);
    if (rawText.length === 0) continue;

    const taken = Math.min(rawText.length, left);
    const text = rawText.slice(0, taken);
    left -= taken;
    consumed += taken;

    if (typeof segment === 'string') {
      runs.push({ text, glitch: false });
    } else {
      runs.push({
        text,
        tone: segment.tone,
        glitch: Boolean(segment.glitch) && taken === rawText.length,
      });
    }
  }

  return { runs, consumed };
};

/**
 * Slices a section of structured LoreLines to the exact character budget produced
 * by `loreSectionToText(section).slice(0, visibleChars)`. Keeps emphasis tones
 * active from the first visible character while enabling glitch only once a
 * glitched run is completely revealed.
 */
export const sliceLoreSection = (section: LoreLine[], visibleChars: number): SlicedLoreRun[][] => {
  if (section.length === 0) return [];
  if (visibleChars <= 0) return [[]];

  let remaining = visibleChars;
  const lines: SlicedLoreRun[][] = [];

  for (let i = 0; i < section.length; i++) {
    const { runs, consumed } = sliceLoreLine(section[i], remaining);
    lines.push(runs);
    remaining -= consumed;

    // Stop before starting line i + 1 unless remaining covers the '\n' separator too.
    if (i < section.length - 1 && remaining > 0) {
      remaining -= 1;
      continue;
    }
    break;
  }

  return lines;
};
