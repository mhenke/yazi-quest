import { useEffect } from 'react';
import { getSkipIntroRequested } from '../../utils/skipIntroFlag';

/**
 * Hook to handle intro skip events across narrative intro screens.
 * Listens for global 'yazi-quest-skip-intro' events and checks the skip flag.
 */
export function useSkipIntro(onComplete: (options?: { isSkip?: boolean }) => void): void {
  useEffect(() => {
    const handleSkipEvent = () => onComplete({ isSkip: true });

    // If tests pre-requested a skip before this listener was attached, honor it now.
    if (getSkipIntroRequested()) {
      onComplete({ isSkip: true });
      return;
    }

    window.addEventListener('yazi-quest-skip-intro', handleSkipEvent as EventListener);
    return () => {
      window.removeEventListener('yazi-quest-skip-intro', handleSkipEvent as EventListener);
    };
  }, [onComplete]);
}
