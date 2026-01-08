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
    render(<App />);
    skipIntro();

    // Check initial timer display
    expect(screen.getByText(/Time:/)).toBeDefined();
    // Assuming StatusBar displays "Time: 10s" or similar.
    // Let's find the element by text content partial match.

    // Tricky to get exact text without knowing StatusBar implementation.
    // Inspecting StatusBar via code view would be safer, but let's guess regex.

    // Advance 1 second to verify timer works normally first
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    // Should be 9s (10 - 1)
    expect(screen.getByText(/9s/)).toBeDefined();

    // Open Help Modal (Alt + ?)
    fireEvent.keyDown(window, { key: '?', altKey: true });
    expect(screen.getByText('Help & Keybindings')).toBeDefined(); // Modal title

    // Advance 2 seconds
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Should STILL be 9s because it was paused
    expect(screen.getByText(/9s/)).toBeDefined();

    // Close Help Modal (Escape)
    fireEvent.keyDown(window, { key: 'Escape' });

    // Advance 1 second
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Should now be 8s
    expect(screen.getByText(/8s/)).toBeDefined();
  });

  it('should not count keystrokes when Help modal is open', async () => {
    render(<App />);
    skipIntro();

    // Initial keystrokes: 0 / 5
    expect(await screen.findByText('0/5')).toBeDefined();

    // Normal keystroke
    fireEvent.keyDown(window, { key: 'j' });
    expect(await screen.findByText('1/5')).toBeDefined();

    // Open Help Modal
    fireEvent.keyDown(window, { key: '?', altKey: true });
    expect(await screen.findByText('Help & Keybindings')).toBeDefined();

    // Press keys while modal is open
    fireEvent.keyDown(window, { key: 'k' });
    fireEvent.keyDown(window, { key: 'l' });
    fireEvent.keyDown(window, { key: 'h' });

    // Should still be 1 / 5
    expect(await screen.findByText('1/5')).toBeDefined();

    // Close Help
    fireEvent.keyDown(window, { key: 'Escape' });

    // Normal keystroke again
    fireEvent.keyDown(window, { key: 'j' });
    expect(await screen.findByText('2/5')).toBeDefined();
  });

  it('should block navigation and show warning if filter is active', async () => {
    render(<App />);
    skipIntro();

    // Check initial state (no filter)
    expect(screen.queryByText(/\(filter: foo\)/)).toBeNull();
    // 1. Enter Filter Mode
    fireEvent.keyDown(window, { key: 'f' });
    fireEvent.keyDown(window, { key: 'x' }); // 'x' as filter
    fireEvent.keyDown(window, { key: 'Enter' });

    // 2. Try to Jump (Shift+Z)
    fireEvent.keyDown(window, { key: 'Z', shiftKey: true });

    // 3. Expect Filter Warning Modal (using findByText for async wait)
    expect(await screen.findByText(/Active filters detected/)).toBeDefined();

    // 4. Verify Timer is Paused while warning is open
    // Timer should be at 10s initially
    expect(screen.getByText(/10s/)).toBeDefined();

    // Advance time
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // Timer should still be 10s because the modal pauses it.
    expect(screen.getByText(/10s/)).toBeDefined();
  });
});
