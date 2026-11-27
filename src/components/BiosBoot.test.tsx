import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { GlobalInputProvider } from '../GlobalInputContext';
import { BiosBoot } from './BiosBoot';

describe('BiosBoot', () => {
  it.each([
    [1, 'AI-7734'],
    [2, 'AI-7735'],
    [7, 'AI-7740'],
  ])('shows the correct subject in cycle %i', (cycleCount, subject) => {
    render(
      <GlobalInputProvider>
        <BiosBoot cycleCount={cycleCount} onComplete={() => {}} reduceMotion />
      </GlobalInputProvider>
    );
    expect(screen.getByText(`INITIALIZING SUBJECT ${subject}...`)).toBeInTheDocument();
  });
});
