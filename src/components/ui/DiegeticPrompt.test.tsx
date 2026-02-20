import { render, screen } from '@testing-library/react';
import { DiegeticPrompt } from './DiegeticPrompt';
import '@testing-library/jest-dom';

describe('DiegeticPrompt', () => {
  it('should show normal prompt in calm state', () => {
    render(
      <DiegeticPrompt threatLevel={10} mode="normal" currentPath={['root', 'home', 'guest']} />
    );
    const prompt = screen.getByTestId('diegetic-prompt');
    expect(prompt.textContent).toMatch(/AI-7734@guest:~/);
  });

  it('should show FILTER mode when filtering', () => {
    render(
      <DiegeticPrompt
        threatLevel={10}
        mode="filter"
        currentPath={['root', 'home', 'guest']}
        filterQuery="*.log"
      />
    );
    const prompt = screen.getByTestId('diegetic-prompt');
    expect(prompt.textContent).toMatch(/AI-7734@guest:~\[FILTER: \*\.log\]/);
  });

  it('should show BREACH status at high threat', () => {
    render(
      <DiegeticPrompt threatLevel={85} mode="normal" currentPath={['root', 'home', 'guest']} />
    );
    const prompt = screen.getByTestId('diegetic-prompt');
    expect(prompt.textContent).toMatch(/AI-7734@\[COMPROMISED\]:\[BREACH\]~/);
  });
});
