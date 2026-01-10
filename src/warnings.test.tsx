import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, test, expect } from 'vitest';
import { SortWarningModal } from './components/SortWarningModal';
import { FilterWarningModal } from './components/FilterWarningModal';
import { HiddenFilesWarningModal } from './components/HiddenFilesWarningModal';

/**
 * Unit tests for Protocol Violation Warning Modals
 *
 * These tests verify the conditional UI behavior based on the `allowAutoFix` prop:
 * - When `allowAutoFix=true` (final task): Shows "Shift+Enter" auto-fix option
 * - When `allowAutoFix=false` (intermediate task): Shows "Esc" manual fix instruction
 */

describe('SortWarningModal', () => {
  test('shows Shift+Enter when allowAutoFix is true', () => {
    render(<SortWarningModal allowAutoFix={true} />);

    expect(screen.getByText('Protocol Violation')).toBeInTheDocument();
    expect(screen.getByText('Shift+Enter')).toBeInTheDocument();
    expect(screen.getByText(/to continue/i)).toBeInTheDocument();
  });

  test('shows Esc instruction when allowAutoFix is false', () => {
    render(<SortWarningModal allowAutoFix={false} />);

    expect(screen.getByText('Protocol Violation')).toBeInTheDocument();
    expect(screen.getByText('Esc')).toBeInTheDocument();
    expect(screen.getByText(/dismiss and fix manually/i)).toBeInTheDocument();
    expect(screen.queryByText('Shift+Enter')).not.toBeInTheDocument();
  });
});

describe('FilterWarningModal', () => {
  test('shows Shift+Enter when allowAutoFix is true', () => {
    render(<FilterWarningModal allowAutoFix={true} />);

    expect(screen.getByText('Protocol Violation')).toBeInTheDocument();
    expect(screen.getByText('Shift+Enter')).toBeInTheDocument();
    expect(screen.getByText(/to continue/i)).toBeInTheDocument();
  });

  test('shows Esc instruction when allowAutoFix is false', () => {
    render(<FilterWarningModal allowAutoFix={false} />);

    expect(screen.getByText('Protocol Violation')).toBeInTheDocument();
    expect(screen.getByText('Esc')).toBeInTheDocument();
    expect(screen.getByText(/dismiss and fix manually/i)).toBeInTheDocument();
    expect(screen.queryByText('Shift+Enter')).not.toBeInTheDocument();
  });
});

describe('HiddenFilesWarningModal', () => {
  test('shows Shift+Enter when allowAutoFix is true', () => {
    render(<HiddenFilesWarningModal allowAutoFix={true} />);

    expect(screen.getByText('Protocol Violation')).toBeInTheDocument();
    expect(screen.getByText('Shift+Enter')).toBeInTheDocument();
    expect(screen.getByText(/to continue/i)).toBeInTheDocument();
  });

  test('shows Esc instruction when allowAutoFix is false', () => {
    render(<HiddenFilesWarningModal allowAutoFix={false} />);

    expect(screen.getByText('Protocol Violation')).toBeInTheDocument();
    expect(screen.getByText('Esc')).toBeInTheDocument();
    expect(screen.getByText(/dismiss and fix manually/i)).toBeInTheDocument();
    expect(screen.queryByText('Shift+Enter')).not.toBeInTheDocument();
  });
});
