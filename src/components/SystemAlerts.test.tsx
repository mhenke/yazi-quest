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

  it('dismisses the latest alert on Escape', () => {
    const onDismiss = vi.fn();
    render(
      <SystemAlerts
        alerts={[alert, { ...alert, id: 'next', title: 'NEXT ALERT' }]}
        onDismiss={onDismiss}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(onDismiss).toHaveBeenCalledWith('next');
  });
  it('renders the alert copy and semantic heading', () => {
    render(<SystemAlerts alerts={[alert]} />);

    expect(screen.getByText(alert.title)).toBeInTheDocument();
    expect(screen.getByText(alert.message)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: alert.title })).toBeInTheDocument();
  });
});
