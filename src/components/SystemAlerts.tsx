import React, { useEffect } from 'react';
import { AlertTriangle, CheckCircle, Info, ShieldAlert, X } from 'lucide-react';
import { GameAlert } from '../types';

interface SystemAlertsProps {
  alerts: GameAlert[];
  onDismiss?: (id: string) => void;
}

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
  return (
    <div
      className="fixed top-24 left-4 right-4 z-20 flex flex-col gap-4 font-mono pointer-events-none max-h-[calc(100dvh-8rem)] overflow-y-auto sm:left-auto sm:right-8 sm:w-96"
      aria-live="polite"
    >
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`
            pointer-events-auto relative overflow-hidden rounded-none border shadow-2xl p-4 animate-terminal-slide-right
            ${
              alert.severity === 'error'
                ? 'bg-red-950/90 border-red-500/50 text-red-100'
                : alert.severity === 'warning'
                  ? 'bg-yellow-950/90 border-yellow-500/50 text-yellow-100'
                  : alert.severity === 'success'
                    ? 'bg-green-950/90 border-green-500/50 text-green-100'
                    : 'bg-blue-950/90 border-blue-500/50 text-blue-100'
            }
          `}
        >
          <button
            type="button"
            onClick={() => onDismiss?.(alert.id)}
            aria-label={`Dismiss ${alert.title}`}
            className="absolute right-2 top-2 z-10 p-1 text-zinc-200 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-start gap-3">
            <div className="mt-1 shrink-0">
              {alert.severity === 'error' && (
                <ShieldAlert className="w-5 h-5 text-red-400" aria-hidden="true" />
              )}
              {alert.severity === 'warning' && (
                <AlertTriangle className="w-5 h-5 text-yellow-400" aria-hidden="true" />
              )}
              {alert.severity === 'success' && (
                <CheckCircle className="w-5 h-5 text-green-400" aria-hidden="true" />
              )}
              {alert.severity === 'info' && (
                <Info className="w-5 h-5 text-blue-400" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0 flex-1 break-words">
              <h3 className="font-bold text-xs tracking-wide uppercase mb-1">{alert.title}</h3>
              <p className="text-xs leading-relaxed whitespace-pre-wrap">{alert.message}</p>
            </div>
          </div>
          {/* Progress bar or timer could go here if auto-dismiss logic existed in UI */}
        </div>
      ))}
    </div>
  );
};
