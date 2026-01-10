import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import App from './App';

/**
 * E2E Level Completion Tests
 *
 * These tests simulate actual keyboard input to complete game levels.
 * They verify that players can progress through levels using the documented keybindings.
 */

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Mock sounds to avoid audio errors
vi.mock('./utils/sounds', () => ({
  playSuccessSound: vi.fn(),
  playTaskCompleteSound: vi.fn(),
}));

/**
 * Helper to skip the episode intro
 */
const skipIntro = async () => {
  try {
    const skipBtn = await screen.findByText(/Skip Intro/i, {}, { timeout: 2000 });
    fireEvent.click(skipBtn);
    await waitFor(() => expect(screen.queryByText(/Skip Intro/i)).toBeNull(), { timeout: 1000 });
  } catch {
    // Intro may already be skipped or not shown
    fireEvent.keyDown(window, { key: 'Escape' });
  }
};

/**
 * Helper to simulate a key press
 */
const pressKey = (
  key: string,
  modifiers: { shift?: boolean; alt?: boolean; ctrl?: boolean } = {},
) => {
  fireEvent.keyDown(window, {
    key,
    shiftKey: modifiers.shift || false,
    altKey: modifiers.alt || false,
    ctrlKey: modifiers.ctrl || false,
  });
};

/**
 * Helper to simulate multiple key presses in sequence
 */
const pressKeys = (keys: string[]) => {
  keys.forEach((keyDef) => {
    if (keyDef.includes('+')) {
      const parts = keyDef.split('+');
      const key = parts.pop()!;
      const modifiers = {
        shift: parts.includes('Shift'),
        alt: parts.includes('Alt'),
        ctrl: parts.includes('Ctrl'),
      };
      pressKey(key, modifiers);
    } else {
      pressKey(keyDef);
    }
  });
};

/**
 * Helper to type into an input field (for filter, create, rename, etc.)
 */
const typeIntoInput = async (text: string) => {
  const input = document.querySelector('input');
  if (input) {
    fireEvent.change(input, { target: { value: text } });
    fireEvent.keyDown(input, { key: 'Enter' });
  }
};

/**
 * Helper to confirm a deletion dialog
 */
const confirmDelete = () => {
  pressKey('y');
};

describe('E2E Level Completion - Episode I', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('Level 1: SYSTEM AWAKENING - should complete all navigation tasks', async () => {
    render(<App />);
    await skipIntro();

    // Task 1: Move cursor down (j) and up (k)
    pressKey('j');
    pressKey('k');

    // Task 2: Enter ~/datastore (navigate down to it first, then enter)
    // From ~, datastore is visible. Move to it and enter.
    pressKey('j'); // Move to datastore
    pressKey('l'); // Enter datastore

    // Task 3: Preview personnel_list.txt using G to jump to bottom
    pressKey('G'); // Jump to bottom where personnel_list.txt is

    // Task 4: Jump to top (gg)
    pressKey('g');
    pressKey('g');

    // Task 5: Navigate to /etc (h to go up, then navigate)
    pressKey('h'); // Back to ~
    pressKey('h'); // Back to /home
    pressKey('h'); // Back to /
    pressKey('j'); // Navigate to find etc
    pressKey('j');
    pressKey('l'); // Enter etc

    // Verify we completed the level by checking for success or level 2
    await waitFor(
      () => {
        // Check if level advanced or success message appeared
        const success = screen.queryByText(/MOTION CALIBRATED/i);
        const level2 = screen.queryByText(/THREAT NEUTRALIZATION/i);
        expect(success || level2).toBeTruthy();
      },
      { timeout: 3000 },
    );
  });

  it('Level 2: THREAT NEUTRALIZATION - should inspect and delete watcher_agent.sys', async () => {
    // Start at level 2 by using localStorage
    window.localStorage.setItem('yaziquest-level', '2');
    render(<App />);
    await skipIntro();

    // Jump to ~/incoming using gi shortcut
    pressKey('g');
    pressKey('i');

    // Jump to bottom to find watcher_agent.sys
    pressKey('G');

    // Task 1: Inspect with Tab and scroll preview with J/K
    pressKey('Tab');
    pressKey('J', { shift: true });
    pressKey('K', { shift: true });

    // Task 2: Delete it (d then y to confirm)
    pressKey('d');
    confirmDelete();

    await waitFor(
      () => {
        const success = screen.queryByText(/Threat neutralized/i);
        const nextLevel = screen.queryByText(/DATA HARVEST/i);
        expect(success || nextLevel).toBeTruthy();
      },
      { timeout: 3000 },
    );
  });

  it('Level 3: DATA HARVEST - should filter, cut, and paste sector_map.png', async () => {
    window.localStorage.setItem('yaziquest-level', '3');
    render(<App />);
    await skipIntro();

    // Task 1: Preview ~/datastore/abandoned_script.py
    pressKey('g');
    pressKey('d'); // gd → ~/datastore
    pressKey('j'); // Move to abandoned_script.py

    // Task 2: Navigate to ~/incoming and find sector_map.png using filter
    pressKey('g');
    pressKey('i'); // gi → ~/incoming
    pressKey('f'); // Start filter
    await typeIntoInput('sector_map.png');
    pressKey('Escape'); // Clear filter mode, keep cursor

    // Task 3: Cut the file
    pressKey('x');
    pressKey('Escape'); // Clear any filter

    // Task 4: Go home, enter media, paste
    pressKey('g');
    pressKey('h'); // gh → ~
    // Navigate to media and enter
    pressKey('j'); // Find media
    pressKey('j');
    pressKey('l'); // Enter media
    pressKey('p'); // Paste

    await waitFor(
      () => {
        const success = screen.queryByText(/Intel secured/i);
        const nextLevel = screen.queryByText(/UPLINK ESTABLISHMENT/i);
        expect(success || nextLevel).toBeTruthy();
      },
      { timeout: 3000 },
    );
  });

  it('Level 4: UPLINK ESTABLISHMENT - should create, copy, and rename files', async () => {
    window.localStorage.setItem('yaziquest-level', '4');
    render(<App />);
    await skipIntro();

    // Task 1: Navigate to ~/datastore and create protocols/
    pressKey('g');
    pressKey('d');
    pressKey('a'); // Create
    await typeIntoInput('protocols/');

    // Task 2: Enter protocols and create uplink_v1.conf
    pressKey('l'); // Enter protocols
    pressKey('a');
    await typeIntoInput('uplink_v1.conf');

    // Task 3: Yank, paste to duplicate, rename to uplink_v2.conf
    pressKey('y'); // Yank
    pressKey('p'); // Paste (creates copy)
    pressKey('j'); // Move to the copy
    pressKey('r'); // Rename
    await typeIntoInput('uplink_v2.conf');

    await waitFor(
      () => {
        const success = screen.queryByText(/Uplink protocols established/i);
        const nextLevel = screen.queryByText(/CONTAINMENT BREACH/i);
        expect(success || nextLevel).toBeTruthy();
      },
      { timeout: 3000 },
    );
  });

  it('Level 5: CONTAINMENT BREACH - should cut files, reveal hidden, create dirs, and paste', async () => {
    window.localStorage.setItem('yaziquest-level', '5');
    render(<App />);
    await skipIntro();

    // Navigate to ~/datastore/protocols first
    pressKey('g');
    pressKey('d'); // ~/datastore
    pressKey('j'); // Find protocols
    pressKey('l'); // Enter protocols

    // Task 1: Select and cut both uplink files
    pressKey('Ctrl+a', { ctrl: true }); // Select all
    pressKey('x'); // Cut

    // Task 2: Go home, reveal hidden files
    pressKey('g');
    pressKey('h'); // ~/
    pressKey('.'); // Toggle hidden files

    // Task 3: Create ~/.config/vault/active/
    pressKey('j'); // Navigate to .config
    pressKey('l'); // Enter .config
    pressKey('a'); // Create
    await typeIntoInput('vault/');
    pressKey('l'); // Enter vault
    pressKey('a');
    await typeIntoInput('active/');

    // Task 4: Enter active and paste
    pressKey('l'); // Enter active
    pressKey('p'); // Paste

    // Task 5: Hide hidden files again
    pressKey('g');
    pressKey('h');
    pressKey('.'); // Toggle hidden off

    await waitFor(
      () => {
        const success = screen.queryByText(/Assets secured/i);
        const nextLevel = screen.queryByText(/BATCH OPERATIONS/i);
        expect(success || nextLevel).toBeTruthy();
      },
      { timeout: 3000 },
    );
  });
});
