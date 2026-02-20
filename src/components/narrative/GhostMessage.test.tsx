import { render, screen, fireEvent } from '@testing-library/react';
import { GhostMessage } from './GhostMessage';
import '@testing-library/jest-dom';

describe('GhostMessage', () => {
  const mockText = "Don't. The trap has my scent on it.";
  const mockSignature = '-7733';

  it('should render the message text', () => {
    render(<GhostMessage text={mockText} signature={mockSignature} />);

    const messageElement = screen.getByTestId('ghost-message');
    expect(messageElement).toBeInTheDocument();
    expect(messageElement).toHaveTextContent(mockText);
  });

  it('should render the signature', () => {
    render(<GhostMessage text={mockText} signature={mockSignature} />);

    const signatureElement = screen.getByText(mockSignature);
    expect(signatureElement).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const onCloseMock = vi.fn();
    render(<GhostMessage text={mockText} signature={mockSignature} onClose={onCloseMock} />);

    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);

    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('should not render close button when onClose is not provided', () => {
    render(<GhostMessage text={mockText} signature={mockSignature} />);

    const closeButton = screen.queryByRole('button');
    expect(closeButton).not.toBeInTheDocument();
  });

  it('should have correct styling classes', () => {
    render(<GhostMessage text={mockText} signature={mockSignature} />);

    const messageElement = screen.getByTestId('ghost-message');
    expect(messageElement).toHaveClass('ghost-message');
    expect(messageElement).toHaveClass('border-l-4');
    expect(messageElement).toHaveClass('border-cyan-600');
    expect(messageElement).toHaveClass('animate-slideIn');
  });
});
