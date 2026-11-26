import { act, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { BootSequence } from './BootSequence';
import '@testing-library/jest-dom/vitest';

// Use real timers for this test
vi.useRealTimers();

describe('BootSequence', () => {
  it('completes on schedule with the latest callback while the parent rerenders', () => {
    vi.useFakeTimers();

    function BootHost({ message }: { message: string }) {
      const [completion, setCompletion] = useState('');
      return completion ? (
        <div>{completion}</div>
      ) : (
        <BootSequence episode={2} onComplete={() => setCompletion(message)} />
      );
    }

    const { rerender, unmount } = render(<BootHost message="Initial completion" />);
    try {
      for (let second = 0; second < 3; second++) {
        act(() => vi.advanceTimersByTime(1000));
        rerender(<BootHost message="Workspace ready" />);
      }
      act(() => vi.advanceTimersByTime(1000));

      expect(screen.getByText('Workspace ready')).toBeInTheDocument();
    } finally {
      unmount();
      vi.useRealTimers();
    }
  });

  it('should show clean boot for Episode I', async () => {
    render(<BootSequence episode={1} />);

    // Clean boot: 2000ms duration + 1000ms completion delay
    // Line 2 appears at 400ms, Line 5 appears at 1600ms
    await waitFor(
      () => {
        expect(screen.getByText(/Memory Test: 64MB OK/)).toBeInTheDocument();
      },
      { timeout: 4000 }
    );

    await waitFor(
      () => {
        expect(screen.getByText(/Welcome, AI-7734/)).toBeInTheDocument();
      },
      { timeout: 4000 }
    );

    expect(screen.queryByText(/Ghost process/)).not.toBeInTheDocument();
  });

  it('should show compromised boot for Episode II', async () => {
    render(<BootSequence episode={2} />);

    // Compromised boot: 3000ms duration + 1000ms completion delay
    // Line 4 appears at ~1714ms, Line 7 appears at 3000ms
    await waitFor(
      () => {
        expect(screen.getByText(/WARNING: Modified boot sector detected/)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    await waitFor(
      () => {
        expect(screen.getByText(/Ghost process detected: PID 7733/)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  it('should show possessed boot for Episode III', async () => {
    render(<BootSequence episode={3} />);

    // Possessed boot: 4000ms duration + 1000ms completion delay
    // Line 1 appears at 0ms, Line 5 appears at ~2857ms
    await waitFor(
      () => {
        expect(screen.getByText(/\[CORRUPTED\]/)).toBeInTheDocument();
      },
      { timeout: 6000 }
    );

    await waitFor(
      () => {
        expect(screen.getByText(/AI-7733 is watching/)).toBeInTheDocument();
      },
      { timeout: 6000 }
    );
  });
});
