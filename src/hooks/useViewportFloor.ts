import { useSyncExternalStore } from 'react';

/**
 * The file-manager view requires 1024 CSS px (ADR-0001): three columns is the
 * composition Yazi teaches, and two is a different file manager. Cinematic
 * surfaces are exempt from the floor, so this gates the game layout only.
 *
 * This constant is the single source of truth for the width half of the
 * requirement. The other half is primary input: `(hover: none) and
 * (pointer: coarse)` is the best-effort proxy for "no hardware keyboard" and is
 * mirrored in the CSS gates of index.html. If either changes, update the ADR,
 * that stylesheet, and the mount guard in `src/index.tsx` together.
 */
const VIEWPORT_FLOOR_CSS_PX = 1024;

const WIDTH_QUERY = `(min-width: ${VIEWPORT_FLOOR_CSS_PX}px)`;
const TOUCH_ONLY_QUERY = '(hover: none) and (pointer: coarse)';

function subscribe(query: string) {
  return (onChange: () => void) => {
    const media = window.matchMedia?.(query);
    media?.addEventListener('change', onChange);
    return () => media?.removeEventListener('change', onChange);
  };
}

function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(subscribe(query), () => window.matchMedia?.(query).matches ?? false);
}

/** True when the viewport is at least the floor wide. */
function useAtFloor(): boolean {
  return useMediaQuery(WIDTH_QUERY);
}

/** Best-effort proxy for "no hardware keyboard attached" (ADR-0001). */
export function useTouchOnly(): boolean {
  return useMediaQuery(TOUCH_ONLY_QUERY);
}

/**
 * Whether the three-pane file-manager view renders: width at or above the floor
 * and primary input is not touch. Both halves of ADR-0001, in one predicate.
 */
export function useFileManagerView(): boolean {
  const atFloor = useAtFloor();
  const touchOnly = useTouchOnly();
  return atFloor && !touchOnly;
}
