import { useLayoutEffect, useSyncExternalStore } from 'react';
import type { GameState } from '../types';

const preference = '(prefers-reduced-motion: reduce)';

function subscribe(onChange: () => void) {
  const media = window.matchMedia?.(preference);
  media?.addEventListener('change', onChange);
  return () => media?.removeEventListener('change', onChange);
}

function getSnapshot() {
  return window.matchMedia?.(preference).matches ?? false;
}

export function useReduceMotion(effects: GameState['settings']['narrativeEffects']) {
  const reduceMotion = useSyncExternalStore(subscribe, getSnapshot) || effects === 'minimal';
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.narrativeEffects = effects;
    root.toggleAttribute('data-reduce-motion', reduceMotion);
    return () => {
      delete root.dataset.narrativeEffects;
      root.removeAttribute('data-reduce-motion');
    };
  }, [effects, reduceMotion]);

  return reduceMotion;
}
