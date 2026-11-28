import React, { useEffect } from 'react';
import { AlertTriangle, CheckCircle, Info, ShieldAlert, X } from 'lucide-react';
import { GameAlert } from '../types';

export interface SystemAlertsProps {
  alerts: GameAlert[];
  onDismiss?: (id: string) => void;
}

const SEVERITY_STYLES: Record<GameAlert['severity'], string> = {
  error: 'bg-red-950/90 border-l-red-500 border-b-zinc-800 text-red-100',
  warning: 'bg-yellow-950/90 border-l-yellow-500 border-b-zinc-800 text-yellow-100',
  success: 'bg-green-950/90 border-l-green-500 border-b-zinc-800 text-green-100',
  info: 'bg-blue-950/90 border-l-blue-500 border-b-zinc-800 text-blue-100',
};

export const SystemAlerts: React.FC<SystemAlertsProps> = ({ alerts, onDismiss }) => {
  useEffect(() => {
    if (!onDismiss || alerts.length === 0) return;
    const dismissLatestAlert = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target instanceof Element &&
          event.target.closest('[role="dialog"], [role="alertdialog"]'))
      )
        return;
      onDismiss(alerts[alerts.length - 1].id);
    };
    window.addEventListener('keydown', dismissLatestAlert);
    return () => window.removeEventListener('keydown', dismissLatestAlert);
  }, [alerts, onDismiss]);

  if (alerts.length === 0) return null;

  return (
    <div
      className="shrink-0 flex flex-col divide-y divide-zinc-800 border-b border-zinc-800 bg-zinc-950 font-mono"
      aria-live="polite"
    >
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`flex items-center justify-between gap-3 border-l-2 px-3 py-1.5 animate-terminal-slide-right ${SEVERITY_STYLES[alert.severity]}`}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="shrink-0">
              {alert.severity === 'error' && (
                <ShieldAlert className="w-4 h-4 text-red-400" aria-hidden="true" />
              )}
              {alert.severity === 'warning' && (
                <AlertTriangle className="w-4 h-4 text-yellow-400" aria-hidden="true" />
              )}
              {alert.severity === 'success' && (
                <CheckCircle className="w-4 h-4 text-green-400" aria-hidden="true" />
              )}
              {alert.severity === 'info' && (
                <Info className="w-4 h-4 text-blue-400" aria-hidden="true" />
              )}
            </div>
            <h3 className="font-bold text-xs tracking-wide uppercase shrink-0">{alert.title}</h3>
            <p className="text-xs leading-snug min-w-0 flex-1 break-words">{alert.message}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <kbd
              className="hidden sm:inline-block rounded-xs border border-current/30 px-1.5 py-0.5 text-xs"
              aria-hidden="true"
            >
              Esc
            </kbd>
            <button
              type="button"
              onClick={() => onDismiss?.(alert.id)}
              aria-label={`Dismiss ${alert.title}`}
              className="min-h-9 min-w-9 flex items-center justify-center rounded-xs text-zinc-200 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
