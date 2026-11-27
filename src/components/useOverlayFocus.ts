import { useLayoutEffect, useRef } from 'react';
import type { KeyboardEvent } from 'react';

export function useOverlayFocus(
  open = true,
  initialFocus?: string,
  returnFocusTo?: React.RefObject<HTMLElement | null>
) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const panel = ref.current;
    if (!open || !panel) return;

    const opener = document.activeElement;
    const returnTarget = returnFocusTo?.current;
    const target = initialFocus ? panel.querySelector<HTMLElement>(initialFocus) : panel;
    (target ?? panel).focus({ preventScroll: true });

    return () => {
      const active = document.activeElement;
      const shouldRestore = active === document.body || panel.contains(active);
      if (!shouldRestore) return;
      if (returnTarget?.isConnected) {
        returnTarget.focus({ preventScroll: true });
      } else if (opener instanceof HTMLElement && opener.isConnected) {
        opener.focus({ preventScroll: true });
      }
    };
  }, [open, initialFocus, returnFocusTo]);
  return ref;
}

export function containOverlayTab(event: KeyboardEvent<HTMLDivElement>) {
  if (
    event.key !== 'Tab' ||
    event.defaultPrevented ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey
  )
    return;
  const panel = (event.target as HTMLElement).closest('[role="dialog"], [role="alertdialog"]');
  if (!panel) return;
  const controls = panel.querySelectorAll<HTMLElement>(
    'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]'
  );
  const first = controls[0];
  const last = controls[controls.length - 1];
  const active = document.activeElement;
  if (active !== panel && active !== (event.shiftKey ? first : last)) return;

  const next = event.shiftKey ? last : first;
  if (!next) return;
  event.preventDefault();
  next.focus();
}
