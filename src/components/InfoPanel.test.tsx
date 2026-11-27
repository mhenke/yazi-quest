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
    expect(screen.getByText('Entry count:').parentElement).toHaveTextContent('Entry count: 2');

    rerender(<InfoPanel file={folder} showHidden onClose={() => {}} />);
    expect(screen.getByText('Entry count:').parentElement).toHaveTextContent('Entry count: 3');
  });

  it('displays mimetypes for archives, text files, and unknown extensions', () => {
    const cases: Array<[FileNode, string]> = [
      [{ id: 'z', name: 'bundle.zip', type: 'archive', size: 10 }, 'application/zip'],
      [{ id: 't', name: 'bundle.tar.gz', type: 'archive', size: 10 }, 'application/gzip'],
      [{ id: 'a', name: 'bundle.rar', type: 'archive', size: 10 }, 'application/x-archive'],
      [{ id: 'txt', name: 'notes.txt', type: 'file', size: 10 }, 'text/plain'],
      [{ id: 'unk', name: 'mystery.xyz', type: 'file', size: 10 }, 'application/octet-stream'],
    ];

    const { rerender } = render(
      <InfoPanel file={cases[0][0]} showHidden={false} onClose={() => {}} />
    );
    for (const [node, expectedMime] of cases) {
      rerender(<InfoPanel file={node} showHidden={false} onClose={() => {}} />);
      expect(screen.getByText('Mimetype:').parentElement).toHaveTextContent(expectedMime);
    }
  });
});
