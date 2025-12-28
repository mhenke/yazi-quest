import { render, fireEvent, screen, cleanup, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import App from '../App';
import React from 'react';

// Mocking modules that are not relevant to the input tests
vi.mock('../utils/sounds', () => ({
  playSuccessSound: vi.fn(),
  playTaskCompleteSound: vi.fn(),
}));

vi.mock('../utils/seedLevels', () => ({
  simulateCompletionOfLevel: (fs) => fs,
}));

beforeAll(() => {
  // Mock scrollIntoView for jsdom environment, as it's not implemented
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
});

describe('Input Model Refactoring', () => {
  it('should focus the filter input when mode changes to "filter"', async () => {
    // Set URL to skip intro cinematic, which blocks key presses at the start
    window.history.pushState({}, 'Test page', '/?intro=false');

    render(<App />);

    const appRoot = screen.getByTestId('app-root');
    appRoot.focus();

    // Press 'f' to enter filter mode
    fireEvent.keyDown(appRoot, { key: 'f', code: 'KeyF' });

    const filterInput = await screen.findByTestId('filter-input');
    expect(document.activeElement).toBe(filterInput);
  });

  it('should update the inputBuffer when typing into the filter input', async () => {
    window.history.pushState({}, 'Test page', '/?intro=false');
    render(<App />);
    const appRoot = screen.getByTestId('app-root');
    appRoot.focus();

    fireEvent.keyDown(appRoot, { key: 'f', code: 'KeyF' });

    const filterInput = await screen.findByTestId('filter-input');
    fireEvent.change(filterInput, { target: { value: 'test' } });

    expect(filterInput.value).toBe('test');
  });

  it('should exit filter mode when Enter is pressed', async () => {
    window.history.pushState({}, 'Test page', '/?intro=false');
    render(<App />);
    const appRoot = screen.getByTestId('app-root');
    appRoot.focus();

    // Enter filter mode
    fireEvent.keyDown(appRoot, { key: 'f', code: 'KeyF' });
    let filterInput = await screen.findByTestId('filter-input');
    expect(filterInput).not.toBeNull();

    // Press Enter
    fireEvent.keyDown(filterInput, { key: 'Enter', code: 'Enter' });

    // The input should now be gone from the document
    filterInput = screen.queryByTestId('filter-input');
    expect(filterInput).toBeNull();
  });

  it('Create input should focus and accept typing', async () => {
    window.history.pushState({}, 'Test page', '/?intro=false');
    render(<App />);
    const appRoot = screen.getByTestId('app-root');
    appRoot.focus();

    // Press 'a' to enter create file mode
    fireEvent.keyDown(appRoot, { key: 'a', code: 'KeyA' });

    const createInput = await screen.findByTestId('create-input');
    expect(document.activeElement).toBe(createInput);

    fireEvent.change(createInput, { target: { value: 'new_file.txt' } });
    expect(createInput.value).toBe('new_file.txt');
  });

  it('Create input should submit on Enter', async () => {
    window.history.pushState({}, 'Test page', '/?intro=false');
    render(<App />);
    const appRoot = screen.getByTestId('app-root');
    appRoot.focus();

    // Press 'a' to enter create file mode
    fireEvent.keyDown(appRoot, { key: 'a', code: 'KeyA' });

    const createInput = await screen.findByTestId('create-input');
    fireEvent.change(createInput, { target: { value: 'new_file.txt' } });
    
    // Press Enter
    fireEvent.keyDown(createInput, { key: 'Enter', code: 'Enter' });

    // Input should be gone
    expect(screen.queryByTestId('create-input')).toBeNull();
    // A notification should appear
    expect(await screen.findByText('FILE CREATED')).not.toBeNull();
  });

  it('FuzzyFinder input should focus and accept typing', async () => {
    window.history.pushState({}, 'Test page', '/?intro=false');
    render(<App />);
    const appRoot = screen.getByTestId('app-root');
    appRoot.focus();

    // Press 'z' to enter fuzzy finder mode
    fireEvent.keyDown(appRoot, { key: 'z', code: 'KeyZ' });

    const fuzzyInput = await screen.findByTestId('fuzzy-input');
    expect(document.activeElement).toBe(fuzzyInput);

    fireEvent.change(fuzzyInput, { target: { value: 'test' } });
    expect(fuzzyInput.value).toBe('test');
  });

  it('FuzzyFinder should close on Escape', async () => {
    window.history.pushState({}, 'Test page', '/?intro=false');
    render(<App />);
    const appRoot = screen.getByTestId('app-root');
    appRoot.focus();

    // Press 'z' to enter fuzzy finder mode
    fireEvent.keyDown(appRoot, { key: 'z', code: 'KeyZ' });

    const fuzzyInput = await screen.findByTestId('fuzzy-input');
    expect(fuzzyInput).not.toBeNull();

    // Press Escape
    fireEvent.keyDown(fuzzyInput, { key: 'Escape', code: 'Escape' });

    // FuzzyFinder input should be gone
    expect(screen.queryByTestId('fuzzy-input')).toBeNull();
  });
});
