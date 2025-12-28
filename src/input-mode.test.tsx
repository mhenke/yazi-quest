import { render, fireEvent, screen, cleanup, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import App from '../App';
import React from 'react';

vi.mock('../utils/sounds', () => ({
  playSuccessSound: vi.fn(),
  playTaskCompleteSound: vi.fn(),
}));

vi.mock('../utils/seedLevels', () => ({
  simulateCompletionOfLevel: (fs: any) => fs,
}));

beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
});

describe('Create & Rename input behavior', () => {
  it('Create input should focus, accept typing, and submit on Enter', async () => {
    window.history.pushState({}, 'Test page', '/?intro=false');
    render(<App />);
    const appRoot = screen.getByTestId('app-root');
    appRoot.focus();

    // Press 'a' to open create dialog
    fireEvent.keyDown(appRoot, { key: 'a', code: 'KeyA' });

    // Find the Create label and its input
    const createLabel = await screen.findByText('Create:');
    const input = createLabel.parentElement?.querySelector('input') as HTMLInputElement | null;
    expect(input).toBeTruthy();
    expect(document.activeElement).toBe(input);

    // Type into input
    fireEvent.change(input!, { target: { value: 'new_file.txt' } });
    expect(input!.value).toBe('new_file.txt');

    // Press Enter to submit
    fireEvent.keyDown(input!, { key: 'Enter', code: 'Enter' });

    // Input should be removed (mode exited)
    await waitFor(() => {
      expect(screen.queryByText('Create:')).toBeNull();
    });
  });

  it('Rename input should focus, accept typing, and submit on Enter', async () => {
    // Start without intro to accept keys
    window.history.pushState({}, 'Test page', '/?intro=false');
    render(<App />);
    const appRoot = screen.getByTestId('app-root');
    appRoot.focus();

    // Trigger rename on current item
    fireEvent.keyDown(appRoot, { key: 'r', code: 'KeyR' });

    // After triggering rename, a rename input should appear inside the file list
    // Find any input whose value is non-empty (initial name)
    let renameInput: HTMLInputElement | null = null;

    await waitFor(() => {
      renameInput = document.querySelector('input') as HTMLInputElement | null;
      if (!renameInput) throw new Error('rename input not found yet');
      // ensure it's focused
      if (document.activeElement !== renameInput) throw new Error('rename input not focused yet');
    });

    expect(renameInput).toBeTruthy();

    const original = renameInput!.value;
    // Type new name
    fireEvent.change(renameInput!, { target: { value: 'renamed_asset.png' } });
    expect(renameInput!.value).toBe('renamed_asset.png');

    // Submit with Enter
    fireEvent.keyDown(renameInput!, { key: 'Enter', code: 'Enter' });

    // After submit, the rename input should no longer be present
    await waitFor(() => {
      const anyInput = document.querySelector('input');
      if (anyInput) throw new Error('rename input still present');
    });
  });
});
