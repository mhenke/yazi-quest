import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { HintModal } from './HintModal';

const hint = {
  nudge: 'Start with the path.',
  command: 'Move down with `j`.',
  walkthrough: 'Move down with `j`, then enter the folder with `l`.',
};

describe('HintModal', () => {
  it('shows explicit nudge, command, and walkthrough stages without cycling', () => {
    const onNextStage = vi.fn();
    const view = render(
      <HintModal hint={hint} stage={0} onClose={() => {}} onNextStage={onNextStage} />
    );
    expect(screen.getByText(hint.nudge)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'More detail (Alt+H)' }));
    expect(onNextStage).toHaveBeenCalledTimes(1);
    view.rerender(<HintModal hint={hint} stage={1} onClose={() => {}} onNextStage={onNextStage} />);
    expect(screen.getByText('j')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'More detail (Alt+H)' }));
    view.rerender(<HintModal hint={hint} stage={2} onClose={() => {}} onNextStage={onNextStage} />);
    expect(screen.getByText(/then enter the folder with/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'More detail (Alt+H)' })).not.toBeInTheDocument();
  });
});
