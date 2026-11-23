import { describe, it, expect } from 'vitest';
import { gameReducer } from './gameReducer';
import type { GameState } from '../types';

/**
 * Alerts are keyed by id. An effect can dispatch before state commits (StrictMode
 * double-invoke), so the reducer — not each call site — must keep ids unique.
 * Regression: Level 6 rendered two "WRITE ACCESS GRANTED" cards and React warned
 * about the duplicate `write-access-l6` key.
 */
describe('gameReducer ADD_ALERT', () => {
  const alert = {
    id: 'write-access-l6',
    title: 'WRITE ACCESS GRANTED',
    message: 'Security protocols lifted for workspace.',
    severity: 'info' as const,
    timestamp: 1,
  };

  const withAlerts = (alerts: GameState['alerts']): GameState => ({ alerts }) as GameState;

  it('appends an alert whose id is new', () => {
    const next = gameReducer(withAlerts([]), { type: 'ADD_ALERT', payload: alert });
    expect(next.alerts).toHaveLength(1);
    expect(next.alerts[0].id).toBe('write-access-l6');
  });

  it('ignores a repeat dispatch of the same id', () => {
    const first = gameReducer(withAlerts([]), { type: 'ADD_ALERT', payload: alert });
    const second = gameReducer(first, { type: 'ADD_ALERT', payload: alert });

    expect(second.alerts).toHaveLength(1);
    expect(second).toBe(first);
  });

  it('keeps distinct ids side by side', () => {
    const first = gameReducer(withAlerts([]), { type: 'ADD_ALERT', payload: alert });
    const next = gameReducer(first, {
      type: 'ADD_ALERT',
      payload: { ...alert, id: 'safety-fail-l14', title: 'SAFETY INTERLOCKS DISABLED' },
    });

    expect(next.alerts.map((a) => a.id)).toEqual(['write-access-l6', 'safety-fail-l14']);
  });
});
