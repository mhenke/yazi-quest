import {
  assert,
  array,
  boolean,
  constantFrom,
  integer,
  oneof,
  property,
  record,
  stringMatching,
  type Arbitrary,
} from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { LoreLine, LoreRun, LoreSegment, LoreTone } from '../types';
import {
  loreLineToText,
  loreSectionToText,
  sliceLoreSection,
  splitLoreSections,
} from './loreHelpers';

const TONES = constantFrom<LoreTone>(
  'ai-7734',
  'ai-7733',
  'ai-7735',
  'danger',
  'warning',
  'signal',
  'caution'
);

const arbRun = record({
  text: stringMatching(/^[A-Za-z0-9 .:-]{1,12}$/),
  tone: TONES,
  glitch: boolean(),
});

const arbSegment: Arbitrary<LoreSegment> = oneof(stringMatching(/^[A-Za-z0-9 .:-]{1,12}$/), arbRun);
const arbNonEmptyLine: Arbitrary<LoreLine> = oneof(
  stringMatching(/^[A-Za-z0-9 .:-]{1,16}$/),
  array(arbSegment, { minLength: 1, maxLength: 5 })
);
const arbSection = array(arbNonEmptyLine, { maxLength: 6 });

describe('property: structured lore helpers', () => {
  it('sliceLoreSection matches plain-text slicing character-for-character and activates glitch only when complete', () => {
    assert(
      property(arbSection, integer({ min: 0, max: 120 }), (section, visibleChars) => {
        const expected = loreSectionToText(section).slice(0, visibleChars);
        const sliced = sliceLoreSection(section, visibleChars);
        const actual = sliced.map((runs) => runs.map((entry) => entry.text).join('')).join('\n');
        expect(actual).toBe(expected);

        sliced.forEach((runs, lineIdx) => {
          const sourceLine = section[lineIdx];
          if (!sourceLine || typeof sourceLine === 'string') {
            expect(runs.every((entry) => !entry.glitch && entry.tone === undefined)).toBe(true);
            return;
          }
          runs.forEach((entry, segIdx) => {
            const orig = sourceLine[segIdx];
            if (typeof orig === 'string') {
              expect(entry.glitch).toBe(false);
              expect(entry.tone).toBeUndefined();
            } else {
              const sourceRun: LoreRun = orig;
              expect(entry.tone).toBe(sourceRun.tone);
              expect(entry.glitch).toBe(
                Boolean(sourceRun.glitch) && entry.text.length === sourceRun.text.length
              );
            }
          });
        });
      }),
      { numRuns: 150 }
    );
  });

  it('splitLoreSections omits empty sections and preserves every non-empty line in order', () => {
    const arbLore = array(oneof(arbNonEmptyLine, constantFrom('')), { maxLength: 16 });
    assert(
      property(arbLore, (lore) => {
        const sections = splitLoreSections(lore);
        for (const section of sections) {
          expect(section.length).toBeGreaterThan(0);
          for (const line of section) {
            expect(loreLineToText(line)).not.toBe('');
          }
        }
        const flattened = sections.flat().map(loreLineToText);
        const expectedNonEmpty = lore.map(loreLineToText).filter((line) => line !== '');
        expect(flattened).toEqual(expectedNonEmpty);
      }),
      { numRuns: 100 }
    );
  });
});
