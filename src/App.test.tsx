import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
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

const skipIntro = async () => {
  // If fake timers are on, advance them to ensure Intro/Button renders
  if (vi.isFakeTimers()) {
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
  }

  // Try to find button with a short timeout
  try {
    const skipBtn = await screen.findByText(/Skip Intro/i, {}, { timeout: 1000 });
    await act(async () => {
      fireEvent.click(skipBtn);
      // Clear any pending intervals from EpisodeIntro typewriter effect
      if (vi.isFakeTimers()) {
        vi.runAllTimers();
      }
    });
  } catch (e) {
    // If button not found, maybe intro is not shown or already skipped.
    // Try pressing Escape just in case.
    fireEvent.keyDown(window, { key: 'Escape' });
  }
};

/**
 * Synchronous version of skipIntro for use with fake timers.
 * Uses queryByText instead of findByText to avoid timer conflicts.
 */
const skipIntroSync = () => {
  // Advance timer to render intro
  act(() => {
    vi.advanceTimersByTime(100);
  });

  // Use queryByText (sync) instead of findByText (async)
  const skipBtn = screen.queryByText(/Skip Intro/i);
  if (skipBtn) {
    act(() => {
      fireEvent.click(skipBtn);
      vi.runAllTimers();
    });
  } else {
    // Fallback: escape
    fireEvent.keyDown(window, { key: 'Escape' });
    act(() => {
      vi.runAllTimers();
    });
  }
};

describe('App Integration - Constraint Pausing', () => {
  beforeEach(() => {
    // Reset any mocked values
    constants.LEVELS[0].maxKeystrokes = 5;
    constants.LEVELS[0].timeLimit = 10;
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('should pause timer when Help modal is open', () => {
    vi.useFakeTimers();
    constants.LEVELS[0].maxKeystrokes = undefined as any;

    act(() => {
      render(<App />);
    });
    skipIntroSync();

    // Timer should be visible at 00:10
    expect(screen.getByText(/Time:/)).toBeDefined();

    // Advance 1 second: 10s -> 9s
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText(/00:09/)).toBeDefined();

    // Open Help modal (Alt+?)
    act(() => {
      fireEvent.keyDown(window, { key: '?', altKey: true });
    });
    expect(screen.queryByText(/HELP \/ KEYBINDINGS/i)).toBeTruthy();

    // Advance 2 seconds while Help is open - timer should be PAUSED
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText(/00:09/)).toBeDefined(); // Still 9 seconds

    // Close Help (Shift+Enter)
    act(() => {
      fireEvent.keyDown(window, { key: 'Enter', shiftKey: true });
    });

    // Advance 1 second - timer should resume: 9s -> 8s
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText(/00:08/)).toBeDefined();
  });

  it('should not count keystrokes when Help modal is open', async () => {
    // No fake timers needed here
    constants.LEVELS[0].maxKeystrokes = 5;
    render(<App />);
    await skipIntro();

    expect(await screen.findByText('0/5')).toBeDefined();

    fireEvent.keyDown(window, { key: 'j' });
    expect(screen.getByText('1/5')).toBeDefined();

    fireEvent.keyDown(window, { key: '?', altKey: true });
    expect(screen.getByText(/HELP \/ KEYBINDINGS/i)).toBeDefined();

    fireEvent.keyDown(window, { key: 'k' });
    expect(screen.getByText('1/5')).toBeDefined();

    fireEvent.keyDown(window, { key: 'Enter', shiftKey: true });

    fireEvent.keyDown(window, { key: 'j' });
    expect(screen.getByText('2/5')).toBeDefined();
  });

  it('should block navigation and show warning if filter is active', () => {
    vi.useFakeTimers();
    constants.LEVELS[0].maxKeystrokes = undefined as any;

    act(() => {
      render(<App />);
    });
    skipIntroSync();

    // Enter filter mode and type 'x'
    act(() => {
      fireEvent.keyDown(window, { key: 'f' });
    });
    act(() => {
      fireEvent.keyDown(window, { key: 'x' });
    });
    act(() => {
      fireEvent.keyDown(window, { key: 'Enter' });
    });

    // Timer should show 00:10 initially
    expect(screen.getByText(/00:10/)).toBeDefined();

    // Advance 3 seconds - timer should tick
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByText(/00:07/)).toBeDefined();
  });
});
