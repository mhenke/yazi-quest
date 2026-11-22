import { useLayoutEffect, useRef } from 'react';
import type { KeyboardEvent } from 'react';

export function useOverlayFocus(open = true, initialFocus?: string) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const panel = ref.current;
    if (!open || !panel) return;

    const opener = document.activeElement;
    const target = initialFocus ? panel.querySelector<HTMLElement>(initialFocus) : panel;
    (target ?? panel).focus({ preventScroll: true });

    return () => {
      const active = document.activeElement;
      if (
        opener instanceof HTMLElement &&
        opener.isConnected &&
        (active === document.body || panel.contains(active))
      ) {
        opener.focus({ preventScroll: true });
      }
    };
  }, [open, initialFocus]);
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
    'button:not(:disabled), input:not(:disabled), select:not(:disabled)'
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
