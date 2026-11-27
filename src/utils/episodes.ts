import { EPISODE_LORE } from '../constants/narrative';
import { paletteFor } from '../constants/palette';
import type { Level } from '../types';

export type MissionStatus = 'active' | 'completed' | 'available' | 'locked';

export const missionStatus = (
  globalIdx: number,
  currentLevelIndex: number,
  unlockedLevelIndex: number
): MissionStatus => {
  if (globalIdx === currentLevelIndex) return 'active';
  if (globalIdx < unlockedLevelIndex) return 'completed';
  return globalIdx === unlockedLevelIndex ? 'available' : 'locked';
};

export const buildEpisodes = (levels: Level[]) =>
  EPISODE_LORE.map((lore) => {
    const palette = paletteFor(lore.color);
    return {
      ...lore,
      levels: levels.filter((l) => l.episodeId === lore.id),
      border: palette.border,
      bg: palette.bg,
      color: palette.text,
      palette,
    };
  });

export type EpisodeEntry = ReturnType<typeof buildEpisodes>[number];
