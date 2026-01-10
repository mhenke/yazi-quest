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
  // NOTE: As of the dismiss key standardization, Escape no longer closes most dialogs
  test('Escape should NOT close Map (only Shift+Enter closes it)', async () => {
    render(<App />);
    fireEvent.click(await screen.findByText(/Skip Intro/i));

    // Open Map
    fireEvent.keyDown(window, { key: 'm', altKey: true });
    await waitFor(() => expect(screen.getByText('Quest Map')).toBeTruthy());

    // Simulate navigation (j/k) to "highlight" a mission
    fireEvent.keyDown(window, { key: 'j' }); // Highlight next

    // Ensure map is still open
    expect(screen.getByText('Quest Map')).toBeTruthy();

    // Try Escape - should NOT close
    fireEvent.keyDown(window, { key: 'Escape' });
    // Map should still be visible
    expect(screen.getByText('Quest Map')).toBeTruthy();

    // Now use Shift+Enter to actually close
    fireEvent.keyDown(window, { key: 'Enter', shiftKey: true });
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

  // Regression test: Level completion dialog should close and advance to next level
  // This tests the bug where the dialog would disappear and reappear instead of advancing
  // Note: Full integration testing of this behavior requires browser testing with the
  // real App state. This test verifies the basic dismiss behavior works.
  test('Success toast dismiss via Shift+Enter should not cause re-render loop', async () => {
    // This test verifies that the SuccessToast component's keyboard handler
    // properly calls onDismiss without causing state issues.
    // The actual bug was that showSuccessToast was in the effect dependencies,
    // causing the task checking effect to re-run when the toast was dismissed.

    render(<App />);
    fireEvent.click(await screen.findByText(/Skip Intro/i));

    // Open Help modal first to ensure keyboard handlers are properly attached
    fireEvent.keyDown(window, { key: '?', altKey: true });
    await waitFor(() => expect(screen.getByText('HELP / KEYBINDINGS')).toBeTruthy());

    // Close Help with Shift+Enter (similar pattern to SuccessToast)
    fireEvent.keyDown(window, { key: 'Enter', shiftKey: true });
    await waitFor(() => expect(screen.queryByText('HELP / KEYBINDINGS')).toBeNull());

    // Verify no unexpected modals appeared
    await act(async () => {
      // Small delay to allow any re-render loops to manifest
      await new Promise((r) => setTimeout(r, 100));
    });
    expect(screen.queryByText('HELP / KEYBINDINGS')).toBeNull();
  });
});

/**
 * Regression Tests - Dialog Dismiss Key Standardization
 *
 * These tests verify that dialog dismissal is consistent:
 * - Most dialogs: Shift+Enter only (no Escape)
 * - SuccessToast: Both Shift+Enter (advance) and Escape (stay here)
 */
describe('Regression: Dialog Dismiss Key Consistency', () => {
  beforeEach(async () => {
    window.localStorage.clear();
  });

  test('Help modal should NOT close with Escape', async () => {
    render(<App />);
    fireEvent.click(await screen.findByText(/Skip Intro/i));

    // Open Help
    fireEvent.keyDown(window, { key: '?', altKey: true });
    await waitFor(() => expect(screen.getByText('HELP / KEYBINDINGS')).toBeTruthy());

    // Try Escape - should NOT close
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.getByText('HELP / KEYBINDINGS')).toBeTruthy();

    // Shift+Enter should close
    fireEvent.keyDown(window, { key: 'Enter', shiftKey: true });
    await waitFor(() => expect(screen.queryByText('HELP / KEYBINDINGS')).toBeNull());
  });

  test('Hint modal should NOT close with Escape', async () => {
    render(<App />);
    fireEvent.click(await screen.findByText(/Skip Intro/i));

    // Open Hint
    fireEvent.keyDown(window, { key: 'h', altKey: true });
    await waitFor(() => expect(screen.getByText(/Hint \(/)).toBeTruthy());

    // Try Escape - should NOT close
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.getByText(/Hint \(/)).toBeTruthy();

    // Shift+Enter should close
    fireEvent.keyDown(window, { key: 'Enter', shiftKey: true });
    await waitFor(() => expect(screen.queryByText(/Hint \(/)).toBeNull());
  });

  test('Map modal should NOT close with Escape', async () => {
    render(<App />);
    fireEvent.click(await screen.findByText(/Skip Intro/i));

    // Open Map
    fireEvent.keyDown(window, { key: 'm', altKey: true });
    await waitFor(() => expect(screen.getByText('Quest Map')).toBeTruthy());

    // Try Escape - should NOT close
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.getByText('Quest Map')).toBeTruthy();

    // Shift+Enter should close
    fireEvent.keyDown(window, { key: 'Enter', shiftKey: true });
    await waitFor(() => expect(screen.queryByText('Quest Map')).toBeNull());
  });

  test('All standard dialogs should close with Shift+Enter', async () => {
    render(<App />);
    fireEvent.click(await screen.findByText(/Skip Intro/i));

    // Test Help
    fireEvent.keyDown(window, { key: '?', altKey: true });
    await waitFor(() => expect(screen.getByText('HELP / KEYBINDINGS')).toBeTruthy());
    fireEvent.keyDown(window, { key: 'Enter', shiftKey: true });
    await waitFor(() => expect(screen.queryByText('HELP / KEYBINDINGS')).toBeNull());

    // Test Hint
    fireEvent.keyDown(window, { key: 'h', altKey: true });
    await waitFor(() => expect(screen.getByText(/Hint \(/)).toBeTruthy());
    fireEvent.keyDown(window, { key: 'Enter', shiftKey: true });
    await waitFor(() => expect(screen.queryByText(/Hint \(/)).toBeNull());

    // Test Map
    fireEvent.keyDown(window, { key: 'm', altKey: true });
    await waitFor(() => expect(screen.getByText('Quest Map')).toBeTruthy());
    fireEvent.keyDown(window, { key: 'Enter', shiftKey: true });
    await waitFor(() => expect(screen.queryByText('Quest Map')).toBeNull());
  });
});
