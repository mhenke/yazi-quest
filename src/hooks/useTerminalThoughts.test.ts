import { renderHook, act } from '@testing-library/react';
import { useTerminalThoughts } from './useTerminalThoughts';
import { GameState } from '../types';

describe('useTerminalThoughts', () => {
  it('should dispatch thought on trigger', () => {
    const dispatch = vi.fn();
    const mockGameState = {
      triggeredThoughts: [],
      lastThoughtId: null,
      levelIndex: 0,
    } as Partial<GameState>;

    const { result } = renderHook(() =>
      useTerminalThoughts({ gameState: mockGameState as GameState, dispatch })
    );

    act(() => {
      result.current.triggerThought('first_delete');
    });

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'SET_THOUGHT',
        payload: expect.objectContaining({
          text: 'I felt that. Why did I feel that?',
        }),
      })
    );
  });

  it('should not dispatch duplicate thoughts within same episode', () => {
    const dispatch = vi.fn();
    const mockGameState = {
      triggeredThoughts: ['phase1-first-delete'],
      lastThoughtId: 'phase1-first-delete',
      levelIndex: 0,
    } as Partial<GameState>;

    const { result } = renderHook(() =>
      useTerminalThoughts({ gameState: mockGameState as GameState, dispatch })
    );

    act(() => {
      result.current.triggerThought('first_delete');
    });

    expect(dispatch).not.toHaveBeenCalled();
  });
});
