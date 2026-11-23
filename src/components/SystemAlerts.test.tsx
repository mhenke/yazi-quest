import { render, screen, fireEvent } from '@testing-library/react';
import { SystemAlerts } from './SystemAlerts';
import '@testing-library/jest-dom';

const alert = {
  id: 'write-access-l6',
  title: 'WRITE ACCESS GRANTED',
  message: 'Security protocols lifted for workspace. Modification enabled.',
  severity: 'info' as const,
  timestamp: 1,
};

describe('SystemAlerts', () => {
  it('reports the dismissed alert id', () => {
    const onDismiss = vi.fn();
    render(<SystemAlerts alerts={[alert]} onDismiss={onDismiss} />);

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss WRITE ACCESS GRANTED' }));

    expect(onDismiss).toHaveBeenCalledWith('write-access-l6');
  });

  it('renders the alert copy', () => {
    render(<SystemAlerts alerts={[alert]} />);

    expect(screen.getByText('WRITE ACCESS GRANTED')).toBeInTheDocument();
    expect(screen.getByText(alert.message)).toBeInTheDocument();
  });
});
