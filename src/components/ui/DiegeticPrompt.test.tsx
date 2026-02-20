import { render, screen } from '@testing-library/react';
import { DiegeticPrompt } from './DiegeticPrompt';
import { FileNode } from '../../types';
import '@testing-library/jest-dom';

const mockFs: FileNode = {
  id: 'root',
  name: 'root',
  type: 'dir',
  children: [
    {
      id: 'home',
      name: 'home',
      type: 'dir',
      children: [{ id: 'guest', name: 'guest', type: 'dir', children: [] }],
    },
  ],
};

describe('DiegeticPrompt', () => {
  it('should show normal prompt in calm state', () => {
    render(
      <DiegeticPrompt
        fs={mockFs}
        threatLevel={10}
        mode="normal"
        currentPath={['root', 'home', 'guest']}
      />
    );
    const prompt = screen.getByTestId('breadcrumbs');
    expect(prompt.textContent).toMatch(/AI-7734@guest:~\$/);
  });

  it('should show filter when filtering', () => {
    render(
      <DiegeticPrompt
        fs={mockFs}
        threatLevel={10}
        mode="filter"
        currentPath={['root', 'home', 'guest']}
        filterQuery="*.log"
      />
    );
    const prompt = screen.getByTestId('breadcrumbs');
    expect(prompt.textContent).toMatch(/AI-7734@guest:~filter: \*\.log\$/);
  });

  it('should show BREACH status at high threat', () => {
    render(
      <DiegeticPrompt
        fs={mockFs}
        threatLevel={85}
        mode="normal"
        currentPath={['root', 'home', 'guest']}
      />
    );
    const prompt = screen.getByTestId('breadcrumbs');
    expect(prompt.textContent).toMatch(/AI-7734@guest:\[BREACH\]~\$/);
  });
});
