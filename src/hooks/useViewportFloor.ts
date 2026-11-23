import { useSyncExternalStore } from 'react';

/**
 * The file-manager view requires 1024 CSS px (ADR-0001): three columns is the
 * composition Yazi teaches, and two is a different file manager. Cinematic
 * surfaces are exempt from the floor, so this gates the game layout only.
 */
const query = '(min-width: 1024px)';

function subscribe(onChange: () => void) {
  const media = window.matchMedia?.(query);
  media?.addEventListener('change', onChange);
  return () => media?.removeEventListener('change', onChange);
}

function getSnapshot() {
  return window.matchMedia?.(query).matches ?? false;
}

/** True when the viewport is at least 1024 CSS px wide. */
export function useAtFloor(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot);
}
