import { EPISODE_1_LEVELS } from './episode1';
import { EPISODE_2_LEVELS } from './episode2';
import { EPISODE_3_LEVELS } from './episode3';
import { Level } from '../../types';

export const LEVELS: Level[] = [
  ...EPISODE_1_LEVELS,
  ...EPISODE_2_LEVELS,
  ...EPISODE_3_LEVELS,
];
