import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, act, within } from '@testing-library/react';

import App from './App';
import { LEVELS, INITIAL_FS, ensurePrerequisiteState } from './constants';
import { FileNode } from './types';
import { findNodeByName, resolvePath } from './utils/fsHelpers';

// Mock the entire sounds module
vi.mock('./utils/sounds', () => ({
  playSuccessSound: vi.fn(),
  playTaskCompleteSound: vi.fn(),
}));

// Mock the reportError utility
vi.mock('./utils/error', () => ({
  reportError: vi.fn(),
}));

// Mock scrollIntoView
beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
});

const getChildNames = (fs: FileNode, dirName: string): string[] => {
  const dir = findNodeByName(fs, dirName, 'dir');
  return (dir?.children || []).map((c) => c.name).sort();
};

describe('App Initialization with URL Parameters', () => {
  it('should correctly apply prerequisite state when jumping to a level', async () => {
    // Set the URL to jump to level 4
    window.history.pushState({}, 'Test page', '/?lvl=4');

    // Render the App component
    await act(async () => {
      render(<App />);
    });

    // Check that we are on level 4
    const levelTitle = await screen.findByText(/MISSION LOG: LVL 4/i);
    expect(levelTitle).toBeDefined();

    // Check that the current path is correct for the start of level 4
    const pathDisplay = await screen.findByText('~/media');
    expect(pathDisplay).toBeDefined();

    // Check that 'sector_map.png' is in the file list
    const fileSystemPane = await screen.findByTestId('filesystem-pane-active');
    const fileName = await within(fileSystemPane).findByText('sector_map.png');
    expect(fileName).toBeDefined();
  });

  it('should not have sector_map.png in incoming when jumping to level 4', () => {
    // This test will check the filesystem state directly.
    // It complements the component rendering test.
    const fs = ensurePrerequisiteState(INITIAL_FS, 4);
    const incomingChildren = getChildNames(fs, 'incoming');
    expect(incomingChildren).not.toContain('sector_map.png');
  });
});
