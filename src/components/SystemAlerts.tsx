import React from 'react';
import { AlertTriangle, CheckCircle, Info, ShieldAlert } from 'lucide-react';
import { GameAlert } from '../types';

interface SystemAlertsProps {
  alerts: GameAlert[];
}

export const SystemAlerts: React.FC<SystemAlertsProps> = ({ alerts }) => {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="fixed top-24 right-8 z-[200] flex flex-col gap-4 w-96 font-mono pointer-events-none">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`
            relative overflow-hidden rounded-lg border backdrop-blur-md shadow-2xl p-4 animate-in slide-in-from-right fade-in duration-500
            ${
              alert.severity === 'error'
                ? 'bg-red-950/90 border-red-500/50 text-red-100'
                : alert.severity === 'warning'
                  ? 'bg-amber-950/90 border-amber-500/50 text-amber-100'
                  : alert.severity === 'success'
                    ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-100'
                    : 'bg-blue-950/90 border-blue-500/50 text-blue-100'
            }
          `}
        >
          <div className="flex items-start gap-3">
            <div className="mt-1 shrink-0">
              {alert.severity === 'error' && <ShieldAlert className="w-5 h-5 text-red-500" />}
              {alert.severity === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
              {alert.severity === 'success' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
              {alert.severity === 'info' && <Info className="w-5 h-5 text-blue-500" />}
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm tracking-wide uppercase opacity-90 mb-1">
                {alert.title}
              </h4>
              <p className="text-xs opacity-80 leading-relaxed whitespace-pre-wrap">
                {alert.message}
              </p>
            </div>
          </div>
          {/* Progress bar or timer could go here if auto-dismiss logic existed in UI */}
        </div>
      ))}
    </div>
  );
};
