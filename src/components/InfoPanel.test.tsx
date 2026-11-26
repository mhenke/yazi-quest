import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import type { FileNode } from '../types';
import { InfoPanel } from './InfoPanel';

const folder: FileNode = {
  id: 'vault',
  name: 'vault',
  type: 'dir',
  children: [
    { id: 'one', name: 'one.conf', type: 'file', size: 1 },
    { id: 'two', name: 'two.conf', type: 'file', size: 1 },
    { id: 'hidden', name: '.hidden', type: 'file', size: 5120 },
  ],
};

describe('InfoPanel', () => {
  it('shows visible child count for folders and includes hidden children when enabled', () => {
    const { rerender } = render(<InfoPanel file={folder} showHidden={false} onClose={() => {}} />);
    expect(screen.getByText('Items:').parentElement).toHaveTextContent('Items: 2');

    rerender(<InfoPanel file={folder} showHidden onClose={() => {}} />);
    expect(screen.getByText('Items:').parentElement).toHaveTextContent('Items: 3');
  });
});
