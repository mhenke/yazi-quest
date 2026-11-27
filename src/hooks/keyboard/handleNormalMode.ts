import { isProtocolWarningOpen } from './utils';
import { handleLevel13NodeSwitch } from './handleNarrativeTriggers';
import { handleNavigationKeyDown } from './handleNavigation';
import { handleClipboardKeyDown } from './handleClipboard';
import { handleSystemParamsKeyDown } from './handleSystemParams';
import type { KeyInput, NormalModeContext } from './types';

export const handleNormalModeKeyDown = (e: KeyInput, ctx: NormalModeContext): boolean => {
  // 1. Skip if any warning modals are active
  if (isProtocolWarningOpen(ctx.gameState)) {
    if (e.key === 'Escape' || (e.key === 'Enter' && e.shiftKey)) {
      // Allow these to fall through to handlers that can dismiss the modal
    } else {
      return true; // Block other input
    }
  }

  // 1b. Level 13: Async Distributed Node Switching
  if (handleLevel13NodeSwitch(e, ctx.gameState.levelIndex, ctx.dispatch)) {
    return true;
  }

  // 2. Delegate to themed sub-handlers
  if (handleNavigationKeyDown(e, ctx)) return true;
  if (handleClipboardKeyDown(e, ctx)) return true;
  if (handleSystemParamsKeyDown(e, ctx)) return true;

  return false;
};
