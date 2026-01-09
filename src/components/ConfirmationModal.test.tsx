import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import { ConfirmationModal } from './ConfirmationModal';

describe('ConfirmationModal', () => {
  test('renders grid layout for multiple items', () => {
    const items = Array.from({ length: 10 }, (_, i) => `item-${i}`);
    render(
      <ConfirmationModal
        deleteType="permanent"
        itemsToDelete={items}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    // Check for the grid container
    const container = screen.getByText('item-0').closest('div.grid');
    expect(container).toBeTruthy();
    expect(container?.className).toContain('grid-cols-1');
    expect(container?.className).toContain('md:grid-cols-2');
    expect(container?.className).toContain('lg:grid-cols-3');

    // Check title
    expect(screen.getByText('Confirm Permanent Deletion')).toBeTruthy();
  });

  test('does not show list for single item', () => {
    const items = ['single-item'];
    render(
      <ConfirmationModal
        deleteType="permanent"
        itemsToDelete={items}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.queryByText('single-item', { selector: '.grid div' })).toBeNull();
    // The single item name is part of the description text, checking that the grid is absent
    const grid = document.querySelector('.grid');
    expect(grid).toBeNull();
  });
});
