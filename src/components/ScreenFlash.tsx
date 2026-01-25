import React, { useEffect, useState } from 'react';
import '../screen-flash.css';

interface ScreenFlashProps {
  /**
   * Whether the flash effect is active. Defaults to true as the demo implies an infinite loop.
   */
  active?: boolean;
}

export const ScreenFlash: React.FC<ScreenFlashProps> = ({ active = true }) => {
  // We use a small delay to ensure the class is applied after mount if needed,
  // mirroring the demo's `setTimeout(() => document.body.classList.add('render'), 60);`
  // although mostly handled by CSS animations.
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsRendered(true), 60);
    return () => clearTimeout(timer);
  }, []);

  if (!active) return null;

  return (
    <>
      <div
        className={`screen-flash-overlay glitch-layer-2 ${isRendered ? 'active' : ''}`}
        aria-hidden="true"
      />
      <div
        className={`screen-flash-overlay glitch-layer-3 ${isRendered ? 'active' : ''}`}
        aria-hidden="true"
      />
      <div
        className={`screen-flash-overlay ${isRendered ? 'screen-flash-active' : ''}`}
        aria-hidden="true"
      />
    </>
  );
};
