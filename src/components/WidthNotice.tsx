import React from 'react';

/**
 * Product message, not in-fiction (GLOSSARY.md): names the real requirement in
 * CSS pixels so a player on a scaled 1366x768 laptop can act on it (ADR-0001).
 * Styling reuses the touch-gate classes from index.html.
 */
export const WidthNotice: React.FC = () => (
  <div className="touch-gate width-gate" role="region" aria-label="Window too narrow">
    <div className="touch-gate__panel">
      <p className="touch-gate__eyebrow">Window too narrow</p>
      <h1 className="touch-gate__title">The file manager needs 1024 px</h1>
      <p className="touch-gate__body">
        Yazi shows three panes at once — the parent directory, the current one, and the preview.
        Below 1024 CSS px the third pane does not fit, and a two-column layout would not be Yazi.
      </p>
      <p className="touch-gate__body">
        Widen the window, or reduce browser zoom to 100% or lower, and the mission will start
        normally.
      </p>
      <p className="touch-gate__hint">Keyboard: Ctrl and Alt required</p>
    </div>
  </div>
);
