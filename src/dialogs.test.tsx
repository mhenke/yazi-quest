import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import App from './App';

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe('Dialog Interactions', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    // ...
  });

  afterEach(() => {
    // ...
  });

  // Test Alt+? (Help) integrity
  test('Alt+? should toggle Help modal', async () => {
    render(<App />);
    // Dismiss intro properly
    const skipBtn = await screen.findByText(/Skip Intro/i);
    fireEvent.click(skipBtn);
    // Ensure intro is gone
    await waitFor(() => expect(screen.queryByText(/Skip Intro/i)).toBeNull());

    // Open
    fireEvent.keyDown(window, { key: '?', altKey: true });
    await waitFor(() => expect(screen.getByText('HELP / KEYBINDINGS')).toBeTruthy());

    // Close via Toggle
    fireEvent.keyDown(window, { key: '?', altKey: true });
    await waitFor(() => expect(screen.queryByText('HELP / KEYBINDINGS')).toBeNull());
  });

  // Test Alt+H (Hint) integrity
  test('Alt+h should toggle Hint modal', async () => {
    render(<App />);
    fireEvent.click(await screen.findByText(/Skip Intro/i));

    // Open
    fireEvent.keyDown(window, { key: 'h', altKey: true });
    await waitFor(() => expect(screen.getByText(/Hint \(/)).toBeTruthy());

    // Close via Toggle
    fireEvent.keyDown(window, { key: 'h', altKey: true });
    await waitFor(() => expect(screen.queryByText(/Hint \(/)).toBeNull());
  });

  // Test Alt+m (Map) integrity
  test('Alt+m should toggle Map modal', async () => {
    render(<App />);
    fireEvent.click(await screen.findByText(/Skip Intro/i));

    // Open
    fireEvent.keyDown(window, { key: 'm', altKey: true });
    await waitFor(() => expect(screen.getByText('Quest Map')).toBeTruthy());

    // Close via Toggle
    fireEvent.keyDown(window, { key: 'm', altKey: true });
    await waitFor(() => expect(screen.queryByText('Quest Map')).toBeNull());
  });

  // Test Map Highlighting Edge Case (Simulated)
  test('Esc should close Map even after highlighting a level', async () => {
    render(<App />);
    fireEvent.click(await screen.findByText(/Skip Intro/i));

    // Open Map
    fireEvent.keyDown(window, { key: 'm', altKey: true });
    await waitFor(() => expect(screen.getByText('Quest Map')).toBeTruthy());

    // Simulate navigation (j/k) to "highlight" a mission
    fireEvent.keyDown(window, { key: 'j' }); // Highlight next

    // Ensure map is still open
    expect(screen.getByText('Quest Map')).toBeTruthy();

    // Try Closing
    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByText('Quest Map')).toBeNull());
  });

  // Verify shift+enter edge case
  test('Shift+Enter should close Map even after highlighting a level', async () => {
    render(<App />);
    fireEvent.click(await screen.findByText(/Skip Intro/i));

    // Open Map
    fireEvent.keyDown(window, { key: 'm', altKey: true });
    await waitFor(() => expect(screen.getByText('Quest Map')).toBeTruthy());

    // Simulate navigation
    fireEvent.keyDown(window, { key: 'j' });

    // Try Closing
    fireEvent.keyDown(window, { key: 'Enter', shiftKey: true });
    await waitFor(() => expect(screen.queryByText('Quest Map')).toBeNull());
  });
});
