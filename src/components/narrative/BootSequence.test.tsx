import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { GlobalInputProvider } from '../../GlobalInputContext';
import { resetSkipIntroRequested } from '../../utils/skipIntroFlag';
import { BootSequence } from './BootSequence';
import '@testing-library/jest-dom/vitest';

describe('BootSequence', () => {
  beforeEach(() => {
    resetSkipIntroRequested();
    vi.useFakeTimers();
  });

  afterEach(() => {
    resetSkipIntroRequested();
    vi.useRealTimers();
  });

  it('pauses after typing finishes instead of auto-advancing, and advances with the latest callback on Shift+Enter', () => {
    function BootHost({ message }: { message: string }) {
      const [completion, setCompletion] = useState('');
      return completion ? (
        <div>{completion}</div>
      ) : (
        <BootSequence episode={2} onComplete={() => setCompletion(message)} />
      );
    }

    const { rerender } = render(
      <GlobalInputProvider>
        <BootHost message="Initial completion" />
      </GlobalInputProvider>
    );

    // Advance past full compromised boot duration + extra idle time: must remain paused
    act(() => vi.advanceTimersByTime(15000));
    expect(screen.getByText(/Ghost process detected: PID 7733/)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Press Shift+Enter to continue...' })
    ).toBeInTheDocument();
    expect(screen.queryByText('Initial completion')).not.toBeInTheDocument();

    // Update parent state before continuing to confirm latest callback is used
    rerender(
      <GlobalInputProvider>
        <BootHost message="Workspace ready" />
      </GlobalInputProvider>
    );
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true }));
    });
    expect(screen.getByText('Workspace ready')).toBeInTheDocument();
  });

  it('pauses in reduceMotion mode and lets button click advance', () => {
    const onComplete = vi.fn();
    render(
      <GlobalInputProvider>
        <BootSequence episode={1} onComplete={onComplete} reduceMotion />
      </GlobalInputProvider>
    );

    act(() => vi.advanceTimersByTime(15000));
    expect(screen.getByText('READY.')).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Press Shift+Enter to continue...' }));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('reveals remaining lines on plain Enter while typing, then continues on second Enter', () => {
    const onComplete = vi.fn();
    render(
      <GlobalInputProvider>
        <BootSequence episode={1} onComplete={onComplete} />
      </GlobalInputProvider>
    );

    act(() => {
      vi.advanceTimersByTime(300);
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    });
    expect(screen.getByText('READY.')).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('supports Skip Intro button during boot sequence', () => {
    const onComplete = vi.fn();
    render(
      <GlobalInputProvider>
        <BootSequence episode={2} onComplete={onComplete} />
      </GlobalInputProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Skip Intro' }));
    expect(onComplete).toHaveBeenCalledWith({ isSkip: true });
  });

  it.each([
    [1, 'AI-7734'],
    [2, 'AI-7735'],
    [7, 'AI-7740'],
  ])('interpolates subject identity across episodes in cycle %i', (cycleCount, subject) => {
    const { rerender } = render(
      <GlobalInputProvider>
        <BootSequence episode={1} cycleCount={cycleCount} reduceMotion />
      </GlobalInputProvider>
    );
    expect(screen.getByText(`INITIALIZING SUBJECT ${subject}...`)).toBeInTheDocument();
    expect(screen.getByText('/root (read-only)', { exact: false })).toBeInTheDocument();
    expect(screen.getAllByText('OK')).toHaveLength(6);

    rerender(
      <GlobalInputProvider>
        <BootSequence episode={2} cycleCount={cycleCount} reduceMotion />
      </GlobalInputProvider>
    );
    expect(screen.getByText(/WARNING: Modified boot sector detected/)).toBeInTheDocument();
    expect(screen.getByText(`Welcome, ${subject}... [verification pending]`)).toBeInTheDocument();
    expect(screen.getByText(/Ghost process detected: PID 7733/)).toBeInTheDocument();

    rerender(
      <GlobalInputProvider>
        <BootSequence episode={3} cycleCount={cycleCount} reduceMotion />
      </GlobalInputProvider>
    );
    expect(screen.getByText(/\[CORRUPTED\]/)).toBeInTheDocument();
    expect(screen.getByText(`${subject} is online`)).toBeInTheDocument();
    expect(screen.getByText(/AI-7733 is watching/)).toBeInTheDocument();
  });
});
