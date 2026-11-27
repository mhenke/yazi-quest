import React from 'react';

/**
 * Product message, not in-fiction (GLOSSARY.md): names the real requirement so the
 * player can act on it. One component for both product notices (ADR-0001) — a device
 * without the required modifiers, or a window below the viewport floor. Styling
 * reuses the gate classes from index.html; the static `.touch-gate` markup there is
 * the no-JS special case of this component.
 */
type RequirementReason = 'keyboard' | 'width';

const COPY: Record<RequirementReason, { label: string; title: string; ariaLabel: string }> = {
  keyboard: {
    label: 'Unsupported device',
    title: 'Yazi Quest needs a keyboard with Ctrl and Alt',
    ariaLabel: 'Keyboard required',
  },
  width: {
    label: 'Window too narrow',
    title: 'The file manager needs 1024 px',
    ariaLabel: 'Window too narrow',
  },
};

export const RequirementNotice: React.FC<{ reason: RequirementReason }> = ({ reason }) => {
  const copy = COPY[reason];
  return (
    <div
      className={`touch-gate width-gate${reason === 'keyboard' ? ' keyboard-gate' : ''}`}
      role="region"
      aria-label={copy.ariaLabel}
    >
      <div className="touch-gate__panel">
        <h1 className="touch-gate__title" style={{ textWrap: 'balance' }}>
          {copy.title}
        </h1>
        {reason === 'keyboard' ? (
          <>
            <p className="touch-gate__body">
              This is a keyboard-driven game. Every mission is solved with keys like <code>j</code>,{' '}
              <code>k</code>, <code>Space</code>, <code>gc</code>, plus chords like{' '}
              <code>Ctrl+A</code> and <code>Alt+M</code> that a soft keyboard cannot send.
            </p>
            <p className="touch-gate__body">
              Open this page on a desktop or laptop with a hardware keyboard and it will start
              normally.
            </p>
            <p className="touch-gate__hint text-zinc-400" style={{ textWrap: 'pretty' }}>
              A window at least 1024 px wide is required
            </p>
          </>
        ) : (
          <>
            <p className="touch-gate__body">
              Yazi shows three panes at once — the parent directory, the current one, and the
              preview. Below 1024 CSS px the third pane does not fit, and a two-column layout would
              not be Yazi.
            </p>
            <p className="touch-gate__body">
              Widen the window or use a larger display. To enlarge the game while keeping all three
              panes, try your operating system&apos;s screen magnifier and pan across the screen.
            </p>
            <p className="touch-gate__hint text-zinc-400" style={{ textWrap: 'pretty' }}>
              A keyboard with Ctrl and Alt is also required
            </p>
          </>
        )}
      </div>
    </div>
  );
};
