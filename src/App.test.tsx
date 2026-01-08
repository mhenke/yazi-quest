import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import App from './App';
import * as constants from './constants';
import * as sounds from './utils/sounds';

// Mock sounds to avoid audio errors
vi.mock('./utils/sounds', () => ({
  playSuccessSound: vi.fn(),
  playTaskCompleteSound: vi.fn(),
}));

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Mock constants to return our test level
vi.mock('./constants', async (importOriginal) => {
  const actual = await importOriginal<typeof constants>();
  return {
    ...actual,
    LEVELS: [
      {
        id: 999,
        episodeId: 1,
        title: 'TEST LEVEL',
        description: 'Test Description',
        initialPath: ['root', 'home', 'guest'],
        hint: 'Test Hint',
        coreSkill: 'Testing',
        environmentalClue: 'Test Clue',
        successMessage: 'Test Success',
        buildsOn: [],
        leadsTo: [],
        timeLimit: 10, // 10 seconds
        maxKeystrokes: 5, // 5 keystrokes
        tasks: [
          {
            id: 'dummy-task',
            description: 'Prevent auto completion',
            completed: false,
            check: () => false,
          },
        ],
        check: () => false, // Ensure check function exists usually
        onEnter: (fs: any) => fs,
      },
    ],
    // Ensure Episode Intro is NOT shown by default if possible, or mock EPISODE_LORE to be empty?
    // App.tsx uses `showEpisodeIntro: !state.ignoreEpisodeIntro` logic often.
    // Actually, App.tsx initializes state with `showEpisodeIntro: true` usually.
    // We will handle skipping in the test body.
  };
});

const skipIntro = () => {
  // If "Skip Intro" button is present, click it
  const skipBtn = screen.queryByText(/Skip Intro/i);
  if (skipBtn) {
    fireEvent.click(skipBtn);
  }
};

describe('App Integration - Constraint Pausing', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Reset window event listeners if necessary, but cleanup usually handled by React/Vitest
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should pause timer when Help modal is open', async () => {
    constants.LEVELS[0].maxKeystrokes = undefined as any; // Show timer, hide keystrokes
    render(<App />);
    skipIntro();

    // Check initial timer display
    expect(screen.getByText(/Time:/)).toBeDefined();

    // Advance 1 second
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    // Should be 9s (10 - 1)
    expect(screen.getByText(/9s/)).toBeDefined();

    // Open Help Modal (Alt + ?)
    fireEvent.keyDown(window, { key: '?', altKey: true });
    expect(await screen.findByText('Help & Keybindings')).toBeDefined();

    // Advance 2 seconds
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Should STILL be 9s because it was paused
    expect(screen.getByText(/9s/)).toBeDefined();

    // Close Help Modal (Shift+Enter - Testing New Feature)
    fireEvent.keyDown(window, { key: 'Enter', shiftKey: true });

    // Advance 1 second
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Should now be 8s
    expect(screen.getByText(/8s/)).toBeDefined();
  });

  it('should not count keystrokes when Help modal is open', async () => {
    constants.LEVELS[0].maxKeystrokes = 5; // Show keystrokes, hide timer
    render(<App />);
    skipIntro();

    // Initial keystrokes: 0/5
    expect(await screen.findByText('0/5')).toBeDefined();

    // Normal keystroke
    fireEvent.keyDown(window, { key: 'j' });
    expect(await screen.findByText('1/5')).toBeDefined();

    // Open Help Modal
    fireEvent.keyDown(window, { key: '?', altKey: true });
    expect(await screen.findByText('Help & Keybindings')).toBeDefined();

    // Press keys while modal is open
    fireEvent.keyDown(window, { key: 'k' });

    // Should still be 1/5
    expect(await screen.findByText('1/5')).toBeDefined();

    // Close Help
    fireEvent.keyDown(window, { key: 'Escape' });

    // Normal keystroke again
    fireEvent.keyDown(window, { key: 'j' });
    expect(await screen.findByText('2/5')).toBeDefined();
  });

  it('should block navigation and show warning if filter is active', async () => {
    constants.LEVELS[0].maxKeystrokes = undefined as any; // Show timer
    render(<App />);
    skipIntro();

    // 1. Enter Filter Mode
    fireEvent.keyDown(window, { key: 'f' });
    fireEvent.keyDown(window, { key: 'x' });
    fireEvent.keyDown(window, { key: 'Enter' });

    // Verify Filter is Active
    expect(await screen.findByText(/FILTER: "x"/)).toBeDefined();

    // 2. Try to Jump (Shift+Z)
    fireEvent.keyDown(window, { key: 'Z', shiftKey: true });

    // 3. Expect Filter Warning Modal (check for title)
    expect(await screen.findByText(/Protocol Violation/i)).toBeDefined();

    // 4. Verify Timer is Paused while warning is open
    expect(screen.getByText(/10s/)).toBeDefined();

    // Advance time
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // Timer should still be 10s because the modal pauses it.
    expect(screen.getByText(/10s/)).toBeDefined();

    // 5. Close Warning with keys
    fireEvent.keyDown(window, { key: 'Escape' });
    // Should clear warning? Warning says "Clear filter (Esc twice)".
    // Press Escape again?
    // FilterWarningModal: "Clear filter (Esc twice) to restore expected results."
    // BUT the modal itself doesn't close on Escape?
    // Wait, the modal is overlaid when filter is active and we try to navigate?
    // No, `filter-warning` MODE shows the modal.
    // Escape in `filter-warning` clears the mode?
    // I should check `App.tsx` or `useKeyboardHandlers` for `filter-warning` key handling.
    // If Escape clears mode, then timer resumes.
  });
});
